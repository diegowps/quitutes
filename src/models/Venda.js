const { dbConnect } = require('../../database.js');

class Venda {
    static async create(vendaData) {
        const conn = await dbConnect();
        try {
            await conn.beginTransaction();

            const [result] = await conn.execute(
                'INSERT INTO vendas (valor_total, canal_venda, cliente_nome, status, observacoes) VALUES (?, ?, ?, ?, ?)',
                [vendaData.valorTotal, vendaData.canalVenda, vendaData.clienteNome, vendaData.status, vendaData.observacoes]
            );

            const vendaId = result.insertId;

            for (const item of vendaData.itens) {
                await conn.execute(
                    'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, total_item) VALUES (?, ?, ?, ?, ?)',
                    [vendaId, item.produtoId, item.quantidade, item.precoUnitario, item.quantidade * item.precoUnitario]
                );

                await conn.execute(
                    'UPDATE estoque_items SET quantidade = quantidade - ? WHERE id = ?',
                    [item.quantidade, item.produtoId]
                );
            }

            await conn.commit();
            return vendaId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            await conn.end();
        }
    }

    static async findById(id) {
        const conn = await dbConnect();
        try {
            const [vendas] = await conn.execute('SELECT * FROM vendas WHERE id = ?', [id]);
            if (vendas.length === 0) return null;

            const [itens] = await conn.execute(
                'SELECT iv.*, ei.nome_produto FROM itens_venda iv INNER JOIN estoque_items ei ON iv.produto_id = ei.id WHERE iv.venda_id = ?',
                [id]
            );

            return { ...vendas[0], itens };
        } finally {
            await conn.end();
        }
    }

    static async update(id, vendaData) {
        const conn = await dbConnect();
        try {
            await conn.beginTransaction();

            const [result] = await conn.execute(
                'UPDATE vendas SET valor_total = ?, canal_venda = ?, cliente_nome = ?, status = ?, observacoes = ? WHERE id = ?',
                [vendaData.valorTotal, vendaData.canalVenda, vendaData.clienteNome, vendaData.status, vendaData.observacoes, id]
            );

            if (vendaData.itens) {
                const [oldItens] = await conn.execute('SELECT * FROM itens_venda WHERE venda_id = ?', [id]);
                
                // Restore old quantities
                for (const item of oldItens) {
                    await conn.execute(
                        'UPDATE estoque_items SET quantidade = quantidade + ? WHERE id = ?',
                        [item.quantidade, item.produto_id]
                    );
                }

                // Delete old items
                await conn.execute('DELETE FROM itens_venda WHERE venda_id = ?', [id]);

                // Insert new items
                for (const item of vendaData.itens) {
                    await conn.execute(
                        'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, total_item) VALUES (?, ?, ?, ?, ?)',
                        [id, item.produtoId, item.quantidade, item.precoUnitario, item.quantidade * item.precoUnitario]
                    );

                    await conn.execute(
                        'UPDATE estoque_items SET quantidade = quantidade - ? WHERE id = ?',
                        [item.quantidade, item.produtoId]
                    );
                }
            }

            await conn.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            await conn.end();
        }
    }

    static async delete(id) {
        const conn = await dbConnect();
        try {
            await conn.beginTransaction();

            const [itens] = await conn.execute('SELECT * FROM itens_venda WHERE venda_id = ?', [id]);
            
            // Restore quantities
            for (const item of itens) {
                await conn.execute(
                    'UPDATE estoque_items SET quantidade = quantidade + ? WHERE id = ?',
                    [item.quantidade, item.produto_id]
                );
            }

            await conn.execute('DELETE FROM itens_venda WHERE venda_id = ?', [id]);
            await conn.execute('DELETE FROM vendas WHERE id = ?', [id]);

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            await conn.end();
        }
    }

    static async findAll(filter = {}) {
        const conn = await dbConnect();
        try {
            let query = 'SELECT v.*, COUNT(iv.id) as total_itens FROM vendas v LEFT JOIN itens_venda iv ON v.id = iv.venda_id';
            const params = [];
            const conditions = [];

            if (filter.status) {
                conditions.push('v.status = ?');
                params.push(filter.status);
            }
            if (filter.canalVenda) {
                conditions.push('v.canal_venda = ?');
                params.push(filter.canalVenda);
            }
            if (filter.dataInicial) {
                conditions.push('DATE(v.data_venda) >= DATE(?)');
                params.push(filter.dataInicial);
            }
            if (filter.dataFinal) {
                conditions.push('DATE(v.data_venda) <= DATE(?)');
                params.push(filter.dataFinal);
            }

            if (conditions.length) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' GROUP BY v.id ORDER BY v.data_venda DESC';

            const [vendas] = await conn.execute(query, params);
            return vendas;
        } finally {
            await conn.end();
        }
    }
}

module.exports = Venda;