const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const cors = require('cors')

const app = express()
const port = 5500
app.use(cors())

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
/** Financeiro */
//Criar nova movimentação financeira
app.post('/financeiro', (req, res) => {
    const { data, descricao, tipo, valor, forma_pagamento, categoria, observacao } = req.body;

    const sql = 'INSERT INTO financeiro (data, descricao, tipo, valor, forma_pagamento, categoria, observacao) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [data, descricao, tipo, valor, forma_pagamento, categoria, observacao];

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao inserir movimentação financeira:', err);
            return res.status(500).json({ error: 'Erro ao inserir movimentação financeira.' });
        }
        res.status(201).json({ message: 'Movimentação financeira adicionada com sucesso!' });
    });
});

//Consulta de movimentações financeiras
app.get('/financeiro', (req, res) => {
    const sql = 'SELECT * FROM financeiro ORDER BY data DESC'
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar dados financeiros:', err)
            return res.status(500).json({ error: 'Erro ao buscar dados financeiros.' })
        }
        res.json(results)
    })
})

//Editar uma movimentação
app.put('/financeiro/:id', (req, res) => {
    const { id } = req.params
    const { data, descricao, tipo, valor, forma_pagamento, categoria, observacao } = req.body
  
    const sql = `
      UPDATE financeiro
      SET data = ?, descricao = ?, tipo = ?, valor = ?, forma_pagamento = ?, categoria = ?, observacao = ?
      WHERE id = ?
    `
    const values = [data, descricao, tipo, valor, forma_pagamento, categoria, observacao, id]
  
    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error('Erro ao atualizar movimentação financeira:', err)
        return res.status(500).json({ error: 'Erro ao atualizar movimentação financeira.' })
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Movimentação não encontrada.' })
      }
      res.json({ message: 'Movimentação financeira atualizada com sucesso!' })
    })
  })
  
  //Deletar uma movimentação
  app.delete('/financeiro/:id', (req, res) => {
    const { id } = req.params;
  
    const sql = 'DELETE FROM financeiro WHERE id = ?'
    connection.query(sql, [id], (err, results) => {
      if (err) {
        console.error('Erro ao deletar movimentação financeira:', err)
        return res.status(500).json({ error: 'Erro ao deletar movimentação financeira.' })
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Movimentação não encontrada.' })
      }
      res.json({ message: 'Movimentação financeira deletada com sucesso!' })
    })
  })

/** Tarefas */
// Criar nova tarefa
app.post('/tasks', (req, res) => {
    const { tarefa, statusTarefa, dataEntrega } = req.body
    const sql = 'INSERT INTO tarefas (tarefa, statusTarefa, dataEntrega) VALUES (?, ?, ?)'
    db.query(sql, [tarefa, statusTarefa, dataEntrega], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json({ id: result.insertId, message: 'Tarefa criada com sucesso!' })
    })
})

// Listar todas as tarefas
app.get('/tasks', (req, res) => {
    const sql = 'SELECT * FROM tarefas'
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json(results)
    })
})

// Atualizar tarefa (editar texto ou status)
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params
    const { tarefa, statusTarefa } = req.body

    let fields = []
    let values = []

    if (tarefa !== undefined) {
        fields.push('tarefa = ?')
        values.push(tarefa)
    }
    if (statusTarefa !== undefined) {
        fields.push('statusTarefa = ?')
        values.push(statusTarefa)
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhuma alteração informada.' })
    }

    values.push(id)

    const sql = `UPDATE tarefas SET ${fields.join(', ')} WHERE id = ?`
    db.query(sql, values, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json({ message: 'Tarefa atualizada com sucesso!' })
    })
})

// Deletar tarefa
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tarefas WHERE id = ?'
    db.query(sql, [id], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json({ message: 'Tarefa deletada com sucesso!' })
    })
})


// Iniciar servidor
app.listen(3000, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})