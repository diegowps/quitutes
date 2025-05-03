const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Rota para buscar itens do estoque
    router.get('/estoque', (req, res) => {
        const query = 'SELECT * FROM estoque WHERE quantidade > 0';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Erro ao buscar itens do estoque:', err);
                res.status(500).json({ error: 'Erro ao buscar itens do estoque' });
            } else {
                res.json(results);
            }
        });
    });

    // Rota para registrar uma venda
    router.post('/registrar', (req, res) => {
        const { itens, cliente, pagamento, total } = req.body;
    
        if (!total || total <= 0) {
            return res.status(400).json({ error: 'O valor total da venda é inválido.' });
        }
    
        db.beginTransaction((err) => {
            if (err) {
                console.error('Erro ao iniciar transação:', err);
                return res.status(500).json({ error: 'Erro ao registrar venda' });
            }
    
            const vendaQuery = 'INSERT INTO vendas (cliente_id, total, data_venda) VALUES (?, ?, NOW())';
            db.query(vendaQuery, [cliente?.id || null, total], (err, vendaResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Erro ao registrar venda:', err);
                        res.status(500).json({ error: 'Erro ao registrar venda' });
                    });
                }
    
                const vendaId = vendaResult.insertId;
    

                // Atualiza o estoque e registra os itens vendidos
                const itemQueries = itens.map((item) => {
                    return new Promise((resolve, reject) => {
                        const updateEstoqueQuery = 'UPDATE estoque SET quantidade = quantidade - ? WHERE id = ?';
                        db.query(updateEstoqueQuery, [item.quantidade, item.id], (err) => {
                            if (err) return reject(err);

                            const itemVendaQuery = 'INSERT INTO itens_venda (venda_id, produto_id, quantidade, valor) VALUES (?, ?, ?, ?)';
                            db.query(itemVendaQuery, [vendaId, item.id, item.quantidade, item.valor], (err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                    });
                });

                Promise.all(itemQueries)
                    .then(() => {
                        // Registra as formas de pagamento
                        const pagamentoQueries = pagamento.map((p) => {
                            return new Promise((resolve, reject) => {
                                const pagamentoQuery = 'INSERT INTO pagamentos (venda_id, forma, valor) VALUES (?, ?, ?)';
                                db.query(pagamentoQuery, [vendaId, p.forma, p.valor], (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            });
                        });

                        return Promise.all(pagamentoQueries);
                    })
                    .then(() => {
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Erro ao finalizar transação:', err);
                                    res.status(500).json({ error: 'Erro ao registrar venda' });
                                });
                            }
                            res.json({ message: 'Venda registrada com sucesso', vendaId });
                        });
                    })
                    .catch((err) => {
                        db.rollback(() => {
                            console.error('Erro ao registrar itens ou pagamentos:', err);
                            res.status(500).json({ error: 'Erro ao registrar venda' });
                        });
                    });
            });
        });
    });

    return router;
};