const { dbConnect } = require('../../database.js');

class Tarefa {
    static async create(tarefaData) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'INSERT INTO tarefas (description, due_date, type, status, assigned_to, related_to_kind, related_to_item_id, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [tarefaData.description, tarefaData.dueDate, tarefaData.type, tarefaData.status, tarefaData.assignedTo, tarefaData.relatedTo?.kind, tarefaData.relatedTo?.item, tarefaData.priority, tarefaData.notes]
            );
            return result.insertId;
        } finally {
            await conn.end();
        }
    }

    static async findById(id) {
        const conn = await dbConnect();
        try {
            const [tarefas] = await conn.execute('SELECT * FROM tarefas WHERE id = ?', [id]);
            return tarefas.length ? tarefas[0] : null;
        } finally {
            await conn.end();
        }
    }

    static async update(id, tarefaData) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'UPDATE tarefas SET description = ?, due_date = ?, type = ?, status = ?, assigned_to = ?, related_to_kind = ?, related_to_item_id = ?, priority = ?, notes = ? WHERE id = ?',
                [tarefaData.description, tarefaData.dueDate, tarefaData.type, tarefaData.status, tarefaData.assignedTo, tarefaData.relatedTo?.kind, tarefaData.relatedTo?.item, tarefaData.priority, tarefaData.notes, id]
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    static async delete(id) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute('DELETE FROM tarefas WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    static async findAll(filter = {}) {
        const conn = await dbConnect();
        try {
            let query = 'SELECT * FROM tarefas';
            const params = [];
            const conditions = [];

            if (filter.status) {
                conditions.push('status = ?');
                params.push(filter.status);
            }
            if (filter.type) {
                conditions.push('type = ?');
                params.push(filter.type);
            }
            if (filter.dueDate) {
                conditions.push('DATE(due_date) = DATE(?)');
                params.push(filter.dueDate);
            }

            if (conditions.length) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY due_date ASC';

            const [tarefas] = await conn.execute(query, params);
            return tarefas;
        } finally {
            await conn.end();
        }
    }

    static async findPendentes(date = new Date()) {
        const conn = await dbConnect();
        try {
            const [tarefas] = await conn.execute(
                'SELECT * FROM tarefas WHERE status = "Pendente" AND DATE(due_date) = DATE(?) ORDER BY priority ASC',
                [date.toISOString().split('T')[0]]
            );
            return tarefas;
        } finally {
            await conn.end();
        }
    }
}

module.exports = Tarefa;