const express = require('express')
const mysql = require('mysql2')
const path = require('path')

const app = express()
const port = 5500

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')))

// Middleware para processar JSON
app.use(express.json())

// Create a connection to the MySQL database
const db = mysql.createConnection({
    host: '10.26.46.42',
    user: 'usuario',
    password: 'senha',
    database: 'quitutes_db'
})

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err)
        return
    }
    console.log('Connected to the MySQL database.')
})

// Example route to fetch data from the database
app.get('/api/data', (req, res) => {
    const query = 'SELECT * FROM example_table'
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err)
            res.status(500).send('Error fetching data')
        } else {
            res.json(results);
        }
    });
});

// Rota para listar os itens do estoque
app.get('/api/estoque', (req, res) => {
    const query = 'SELECT * FROM estoque'
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar itens do estoque:', err)
            res.status(500).send('Erro ao buscar itens do estoque')
        } else {
            res.json(results)
        }
    })
})

// Rota para adicionar ou atualizar itens no estoque
app.post('/api/estoque', (req, res) => {
    const { produto, quantidade, tipo } = req.body

    if (tipo === 'entrada') {
        const query = 'INSERT INTO estoque (produto, quantidade) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + ?'
        db.query(query, [produto, quantidade, quantidade], (err) => {
            if (err) {
                console.error('Erro ao adicionar item ao estoque:', err)
                res.status(500).send('Erro ao adicionar item ao estoque')
            } else {
                res.json({ message: 'Item adicionado ao estoque com sucesso!' })
            }
        })
    } else if (tipo === 'saida') {
        const query = 'UPDATE estoque SET quantidade = quantidade - ? WHERE produto = ? AND quantidade >= ?'
        db.query(query, [quantidade, produto, quantidade], (err, results) => {
            if (err) {
                console.error('Erro ao remover item do estoque:', err)
                res.status(500).send('Erro ao remover item do estoque')
            } else if (results.affectedRows === 0) {
                res.status(400).json({ message: 'Quantidade insuficiente no estoque ou produto não encontrado.' })
            } else {
                res.json({ message: 'Item removido do estoque com sucesso!' })
            }
        })
    } else {
        res.status(400).send('Tipo inválido. Use "entrada" ou "saida".')
    }
})

// Rota para remover um item do estoque
app.delete('/api/estoque/:id', (req, res) => {
    const { id } = req.params
    const query = 'DELETE FROM estoque WHERE id = ?'
    db.query(query, [id], (err) => {
        if (err) {
            console.error('Erro ao remover item do estoque:', err)
            res.status(500).send('Erro ao remover item do estoque')
        } else {
            res.json({ message: 'Item removido do estoque com sucesso!' })
        }
    })
})

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})