const { dbConnect } = require('../../database.js');

class Receita {
    static async create(receitaData) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'INSERT INTO receitas (nome_receita, descricao, instrucoes, rendimento, unidade_rendimento, tempo_preparo, custo_calculado, produto_final_estoque_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [receitaData.nomeReceita, receitaData.descricao, receitaData.instrucoes, receitaData.rendimento, receitaData.unidadeRendimento, receitaData.tempoPreparo, receitaData.custoCalculado, receitaData.produtoFinalEstoqueId]
            );
            
            if (receitaData.ingredientes && receitaData.ingredientes.length > 0) {
                for (const ing of receitaData.ingredientes) {
                    await conn.execute(
                        'INSERT INTO receitas_ingredientes (receita_id, item_estoque_id, quantidade, unidade_receita) VALUES (?, ?, ?, ?)',
                        [result.insertId, ing.itemEstoque, ing.quantidade, ing.unidadeReceita]
                    );
                }
            }
            return result.insertId;
        } finally {
            await conn.end();
        }
    }

    static async findById(id) {
        const conn = await dbConnect();
        try {
            const [receita] = await conn.execute('SELECT * FROM receitas WHERE id = ?', [id]);
            if (receita.length === 0) return null;
            
            const [ingredientes] = await conn.execute(
                'SELECT * FROM receitas_ingredientes WHERE receita_id = ?',
                [id]
            );
            
            return { ...receita[0], ingredientes };
        } finally {
            await conn.end();
        }
    }

    static async update(id, receitaData) {
        const conn = await dbConnect();
        try {
            await conn.execute(
                'UPDATE receitas SET nome_receita = ?, descricao = ?, instrucoes = ?, rendimento = ?, unidade_rendimento = ?, tempo_preparo = ?, custo_calculado = ?, produto_final_estoque_id = ? WHERE id = ?',
                [receitaData.nomeReceita, receitaData.descricao, receitaData.instrucoes, receitaData.rendimento, receitaData.unidadeRendimento, receitaData.tempoPreparo, receitaData.custoCalculado, receitaData.produtoFinalEstoqueId, id]
            );

            if (receitaData.ingredientes) {
                await conn.execute('DELETE FROM receitas_ingredientes WHERE receita_id = ?', [id]);
                for (const ing of receitaData.ingredientes) {
                    await conn.execute(
                        'INSERT INTO receitas_ingredientes (receita_id, item_estoque_id, quantidade, unidade_receita) VALUES (?, ?, ?, ?)',
                        [id, ing.itemEstoque, ing.quantidade, ing.unidadeReceita]
                    );
                }
            }
            return true;
        } finally {
            await conn.end();
        }
    }

    static async delete(id) {
        const conn = await dbConnect();
        try {
            await conn.execute('DELETE FROM receitas_ingredientes WHERE receita_id = ?', [id]);
            await conn.execute('DELETE FROM receitas WHERE id = ?', [id]);
            return true;
        } finally {
            await conn.end();
        }
    }

    static async findAll() {
        const conn = await dbConnect();
        try {
            const [receitas] = await conn.execute('SELECT * FROM receitas');
            for (const receita of receitas) {
                const [ingredientes] = await conn.execute(
                    'SELECT * FROM receitas_ingredientes WHERE receita_id = ?',
                    [receita.id]
                );
                receita.ingredientes = ingredientes;
            }
            return receitas;
        } finally {
            await conn.end();
        }
    }
}

module.exports = Receita;