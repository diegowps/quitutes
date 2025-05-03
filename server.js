const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const port = 5500
app.use(cors())

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')))

// Middleware para processar JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// Create a connection to the MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
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

// Rota para atualizar um item do estoque
app.put('/api/estoque/:id', (req, res) => {
    const { id } = req.params;
    const { produto, quantidade } = req.body;

    const query = 'UPDATE estoque SET produto = ?, quantidade = ? WHERE id = ?';
    db.query(query, [produto, quantidade, id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar item do estoque:', err);
            res.status(500).send('Erro ao atualizar item do estoque');
        } else if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Item não encontrado.' });
        } else {
            res.json({ message: 'Item atualizado com sucesso!' });
        }
    });
});

// Adicionar rotas para CRUD de receitas

// Verificar se a rota /api/receitas está configurada corretamente
app.get('/api/receitas', (req, res) => {
    const query = 'SELECT * FROM receitas';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar receitas:', err);
            res.status(500).send('Erro ao buscar receitas');
        } else {
            res.json(results);
        }
    });
});

// Rota para criar uma nova receita
app.post('/api/receitas', (req, res) => {
    const { titulo, imagem, categoria } = req.body;
    const query = 'INSERT INTO receitas (titulo, imagem, categoria) VALUES (?, ?, ?)';
    db.query(query, [titulo, imagem, categoria], (err) => {
        if (err) {
            console.error('Erro ao adicionar receita:', err);
            res.status(500).send('Erro ao adicionar receita');
        } else {
            res.json({ message: 'Receita adicionada com sucesso!' });
        }
    });
});

// Rota para atualizar uma receita
app.put('/api/receitas/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, imagem, categoria } = req.body;
    const query = 'UPDATE receitas SET titulo = ?, imagem = ?, categoria = ? WHERE id = ?';
    db.query(query, [titulo, imagem, categoria, id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar receita:', err);
            res.status(500).send('Erro ao atualizar receita');
        } else if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Receita não encontrada.' });
        } else {
            res.json({ message: 'Receita atualizada com sucesso!' });
        }
    });
});

// Rota para deletar uma receita
app.delete('/api/receitas/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM receitas WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            console.error('Erro ao remover receita:', err);
            res.status(500).send('Erro ao remover receita');
        } else {
            res.json({ message: 'Receita removida com sucesso!' });
        }
    });
});

//Vendas
// GET - Listar todas as vendas
app.get('/api/vendas', (req, res) => {
    db.query('SELECT * FROM vendas', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// POST - Criar nova venda
app.post('/api/vendas', (req, res) => {
    const { canal, valor } = req.body;
    db.query('INSERT INTO vendas (canal, valor) VALUES (?, ?)', [canal, valor], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Venda registrada com sucesso!', id: result.insertId });
    });
});

// DELETE - Deletar venda
app.delete('/api/vendas/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM vendas WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Venda excluída com sucesso!' });
    });
});


// === CRUD de FINANCEIRO ===

// Buscar todos os lançamentos (com filtros opcionais)
app.get('/api/financeiro', (req, res) => {
    const { inicio, fim, forma_pagamento, categoria } = req.query;
    let sql = 'SELECT * FROM financeiro WHERE 1=1';
    const params = [];

    if (inicio) {
        sql += ' AND data >= ?';
        params.push(inicio);
    }
    if (fim) {
        sql += ' AND data <= ?';
        params.push(fim);
    }
    if (forma_pagamento) {
        sql += ' AND forma_pagamento = ?';
        params.push(forma_pagamento);
    }
    if (categoria) {
        sql += ' AND categoria = ?';
        params.push(categoria);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar financeiro:', err);
            res.status(500).send('Erro ao buscar financeiro');
        } else {
            res.json(results);
        }
    });
});

// Rota para listar os movimentos
app.get('/api/financeiro/movimentos', (req, res) => {
    const { inicio, fim, tipo } = req.query;
    let sql = 'SELECT * FROM movimentos WHERE 1=1';
    const params = [];

    if (inicio) {
        sql += ' AND data >= ?';
        params.push(inicio);
    }
    if (fim) {
        sql += ' AND data <= ?';
        params.push(fim);
    }
    if (tipo) {
        sql += ' AND tipo = ?';
        params.push(tipo);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar movimentos:', err);
            res.status(500).send('Erro ao buscar movimentos');
        } else {
            res.json(results);
        }
    });
});

// Rota para adicionar um movimento
app.post('/api/financeiro/movimentos', (req, res) => {
    const { tipo, categoria, valor, data, descricao } = req.body;

    if (!tipo || !valor || !data) {
        return res.status(400).json({ message: 'Campos obrigatórios: tipo, valor e data.' });
    }

    const query = 'INSERT INTO movimentos (tipo, categoria, valor, data, descricao) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [tipo, categoria, valor, data, descricao], (err) => {
        if (err) {
            console.error('Erro ao adicionar movimento:', err);
            res.status(500).send('Erro ao adicionar movimento');
        } else {
            res.json({ message: 'Movimento adicionado com sucesso!' });
        }
    });
});

app.post('/api/financeiro/movimentos', (req, res) => {
    const { descricao, valor, data, tipo } = req.body;

    if (!descricao || !valor || !data || !tipo) {
        return res.status(400).json({ message: 'Campos obrigatórios: descricao, valor, data e tipo.' });
    }

    const sql = 'INSERT INTO movimentos (descricao, valor, data, tipo) VALUES (?, ?, ?, ?)';
    db.query(sql, [descricao, valor, data, tipo], (err) => {
        if (err) {
            console.error('Erro ao adicionar movimento:', err);
            res.status(500).send('Erro ao adicionar movimento');
        } else {
            res.json({ message: 'Movimento adicionado com sucesso!' });
        }
    });
});

// Criar um novo lançamento
app.post('/api/financeiro', (req, res) => {
    const { descricao, valor, tipo, forma_pagamento, categoria, data } = req.body;

    if (!descricao || !valor || !tipo || !data) {
        return res.status(400).json({ message: 'Campos obrigatórios: descricao, valor, tipo e data.' });
    }

    const query = 'INSERT INTO financeiro (descricao, valor, tipo, forma_pagamento, categoria, data) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [descricao, valor, tipo, forma_pagamento, categoria, data], (err) => {
        if (err) {
            console.error('Erro ao criar lançamento financeiro:', err);
            res.status(500).send('Erro ao criar lançamento financeiro');
        } else {
            res.json({ message: 'Lançamento financeiro criado com sucesso!' });
        }
    });
});

// Atualizar um lançamento
app.put('/api/financeiro/:id', (req, res) => {
    const { id } = req.params;
    const { descricao, valor, tipo, forma_pagamento, categoria, data } = req.body;
    const sql = 'UPDATE financeiro SET descricao = ?, valor = ?, tipo = ?, forma_pagamento = ?, categoria = ?, data = ? WHERE id = ?';
    db.query(sql, [descricao, valor, tipo, forma_pagamento, categoria, data, id], (err) => {
        if (err) {
            console.error('Erro ao atualizar lançamento:', err);
            res.status(500).send('Erro ao atualizar lançamento');
        } else {
            res.json({ message: 'Lançamento atualizado com sucesso' });
        }
    });
});

// Deletar um lançamento
app.delete('/api/financeiro/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM financeiro WHERE id = ?';
    db.query(sql, [id], (err) => {
        if (err) {
            console.error('Erro ao deletar lançamento:', err);
            res.status(500).send('Erro ao deletar lançamento');
        } else {
            res.json({ message: 'Lançamento deletado com sucesso' });
        }
    });
});

// Endpoint para verificar o status do servidor
app.get('/api/financeiro/status', (req, res) => {
    res.status(200).send({ message: 'Servidor está online.' });
});

// === CRUD de TAREFAS ===
// Rota para listar todas as tarefas
app.get('/api/tarefas', (req, res) => {
    const sql = 'SELECT id, descricao, status, entrega FROM tarefas';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar tarefas:', err);
            res.status(500).send('Erro ao buscar tarefas');
        } else {
            res.json(results);
        }
    });
});

app.post('/api/tarefas', (req, res) => {
    const { descricao, status, entrega } = req.body;
    const sql = 'INSERT INTO tarefas (descricao, status, entrega) VALUES (?, ?, ?)';
    db.query(sql, [descricao, status, entrega], (err, result) => {
        if (err) {
            console.error('Erro ao criar tarefa:', err);
            res.status(500).send('Erro ao criar tarefa');
        } else {
            res.json({ id: result.insertId });
        }
    });
});

app.put('/api/tarefas/:id', (req, res) => {
    const { id } = req.params;
    const { descricao, status, entrega } = req.body;
    const sql = 'UPDATE tarefas SET descricao = ?, status = ?, entrega = ? WHERE id = ?';
    db.query(sql, [descricao, status, entrega, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar tarefa:', err);
            res.status(500).send('Erro ao atualizar tarefa');
        } else {
            res.json({ message: 'Tarefa atualizada com sucesso' });
        }
    });
});

app.delete('/api/tarefas/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tarefas WHERE id = ?';
    db.query(sql, [id], (err) => {
        if (err) {
            console.error('Erro ao deletar tarefa:', err);
            res.status(500).send('Erro ao deletar tarefa');
        } else {
            res.json({ message: 'Tarefa deletada com sucesso' });
        }
    });
});


// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});