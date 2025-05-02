const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/stats', (req, res) => {
        const currentMonth = new Date().getMonth() + 1;
        
        const queries = {
            vendas: `SELECT SUM(valor) as total FROM pedidos WHERE MONTH(data_pedido) = ${currentMonth}`,
            clientes: 'SELECT COUNT(*) as total FROM clientes',
            pedidosPendentes: 'SELECT COUNT(*) as total FROM pedidos WHERE status = "pendente"',
            estoqueBaixo: 'SELECT COUNT(*) as total FROM estoque WHERE quantidade < 10'
        };

        Promise.all([
            new Promise((resolve, reject) => {
                db.query(queries.vendas, (err, results) => {
                    if (err) reject(err);
                    resolve(results[0].total || 0);
                });
            }),
            new Promise((resolve, reject) => {
                db.query(queries.clientes, (err, results) => {
                    if (err) reject(err);
                    resolve(results[0].total || 0);
                });
            }),
            new Promise((resolve, reject) => {
                db.query(queries.pedidosPendentes, (err, results) => {
                    if (err) reject(err);
                    resolve(results[0].total || 0);
                });
            }),
            new Promise((resolve, reject) => {
                db.query(queries.estoqueBaixo, (err, results) => {
                    if (err) reject(err);
                    resolve(results[0].total || 0);
                });
            })
        ])
        .then(([vendas, clientes, pedidosPendentes, estoqueBaixo]) => {
            res.json({ vendas, clientes, pedidosPendentes, estoqueBaixo });
        })
        .catch(err => {
            console.error('Erro ao buscar estatísticas:', err);
            res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        });
    });

    router.get('/chart-data', (req, res) => {
        const query = `
            SELECT 
                DATE_FORMAT(data_pedido, '%Y-%m') as mes,
                SUM(valor) as total
            FROM pedidos
            WHERE status != 'cancelado'
            GROUP BY DATE_FORMAT(data_pedido, '%Y-%m')
            ORDER BY mes DESC
            LIMIT 6
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Erro ao buscar dados do gráfico:', err);
                res.status(500).json({ error: 'Erro ao buscar dados do gráfico' });
            } else {
                res.json(results.reverse());
            }
        });
    });

    return router;
};