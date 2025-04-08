const { dbConnect } = require('../../database.js');

class EstoqueItem {
    static async create(itemData) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'INSERT INTO estoque_items (nome_produto, descricao, codigo_barras, quantidade, unidade, preco_custo, preco_venda, fornecedor, data_validade, estoque_minimo, localizacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [itemData.nomeProduto, itemData.descricao, itemData.codigoBarras, itemData.quantidade, itemData.unidade, itemData.precoCusto, itemData.precoVenda, itemData.fornecedor, itemData.dataValidade, itemData.estoqueMinimo, itemData.localizacao]
            );
            return result.insertId;
        } finally {
            await conn.end();
        }
    }

    static async findById(id) {
        const conn = await dbConnect();
        try {
            const [items] = await conn.execute('SELECT * FROM estoque_items WHERE id = ?', [id]);
            return items.length ? items[0] : null;
        } finally {
            await conn.end();
        }
    }

    static async update(id, itemData) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'UPDATE estoque_items SET nome_produto = ?, descricao = ?, codigo_barras = ?, quantidade = ?, unidade = ?, preco_custo = ?, preco_venda = ?, fornecedor = ?, data_validade = ?, estoque_minimo = ?, localizacao = ? WHERE id = ?',
                [itemData.nomeProduto, itemData.descricao, itemData.codigoBarras, itemData.quantidade, itemData.unidade, itemData.precoCusto, itemData.precoVenda, itemData.fornecedor, itemData.dataValidade, itemData.estoqueMinimo, itemData.localizacao, id]
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    static async updateQuantidade(id, quantidade) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute(
                'UPDATE estoque_items SET quantidade = quantidade + ? WHERE id = ?',
                [quantidade, id]
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    static async delete(id) {
        const conn = await dbConnect();
        try {
            const [result] = await conn.execute('DELETE FROM estoque_items WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    static async findAll(filter = {}) {
        const conn = await dbConnect();
        try {
            let query = 'SELECT * FROM estoque_items';
            const params = [];
            const conditions = [];

            if (filter.fornecedor) {
                conditions.push('fornecedor = ?');
                params.push(filter.fornecedor);
            }
            if (filter.estoqueMinimo) {
                conditions.push('quantidade <= estoque_minimo');
            }
            if (filter.search) {
                conditions.push('(nome_produto LIKE ? OR codigo_barras LIKE ?)');
                params.push(`%${filter.search}%`, `%${filter.search}%`);
            }

            if (conditions.length) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            const [items] = await conn.execute(query, params);
            return items;
        } finally {
            await conn.end();
        }
    }

    static async findBaixoEstoque() {
        const conn = await dbConnect();
        try {
            const [items] = await conn.execute(
                'SELECT * FROM estoque_items WHERE quantidade <= estoque_minimo'
            );
            return items;
        } finally {
            await conn.end();
        }
    }
}

module.exports = EstoqueItem;