const { dbConnect } = require('../../database.js');

class Despesa {
    static async create(despesaData) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'INSERT INTO despesas (descricao, valor, data_vencimento, data_pagamento, status, categoria, tipo, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [despesaData.descricao, despesaData.valor, despesaData.dataVencimento, despesaData.dataPagamento, despesaData.status, despesaData.categoria, despesaData.tipo, despesaData.observacoes]
            );
            return result.insertId;
        } finally {
            await conn.end();
        }
    }

    static async findById(id) {
        const conn = await dbConnect();
        try {
            const [despesas] = await conn.execute('SELECT * FROM despesas WHERE id = ?', [id]);
            return despesas.length ? despesas[0] : null;
        } finally {
            await conn.end();
        }
    }

    static async update(id, despesaData) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'UPDATE despesas SET descricao = ?, valor = ?, data_vencimento = ?, data_pagamento = ?, status = ?, categoria = ?, tipo = ?, observacoes = ? WHERE id = ?',
                [despesaData.descricao, despesaData.valor, despesaData.dataVencimento, despesaData.dataPagamento, despesaData.status, despesaData.categoria, despesaData.tipo, despesaData.observacoes, id]
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    static async delete(id) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute('DELETE FROM despesas WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    static async findAll(filter = {}) {
        const conn = await dbConnect();
        try {
            let query = 'SELECT * FROM despesas';
            const params = [];
            const conditions = [];

            if (filter.status) {
                conditions.push('status = ?');
                params.push(filter.status);
            }
            if (filter.tipo) {
                conditions.push('tipo = ?');
                params.push(filter.tipo);
            }
            if (filter.dataInicial) {
                conditions.push('data_vencimento >= ?');
                params.push(filter.dataInicial);
            }
            if (filter.dataFinal) {
                conditions.push('data_vencimento <= ?');
                params.push(filter.dataFinal);
            }

            if (conditions.length) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            const [despesas] = await conn.execute(query, params);
            return despesas;
        } finally {
            await conn.end();
        }
    }

    static async findPendentes(date = new Date()) {
        const conn = await dbConnect();
        try {
            const [despesas] = await conn.execute(
                'SELECT * FROM despesas WHERE status = "Pendente" AND data_vencimento = DATE(?)',
                [date.toISOString().split('T')[0]]
            );
            return despesas;
        } finally {
            await conn.end();
        }
    }
}

module.exports = Despesa;