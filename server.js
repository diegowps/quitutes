const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const cors = require('cors')
const multer = require('multer');
const fs = require('fs');
const dashboardRoutes = require('./routes/dashboard');
const vendasRoutes = require('./routes/vendas'); // Importa as rotas de vendas
const bodyParser = require('body-parser')

const app = express()
const port = 5500
app.use(cors())
app.use(express.json())
app.use(express.static('public'))


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
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL.');
});

// Rotas da dashboard
app.use('/api/dashboard', dashboardRoutes(db));
app.use('/api/vendas', vendasRoutes(db)); // Registra as rotas de vendas


// Configuração do multer para upload de imagens
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `receita-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Rotas principais
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

// Rota para buscar uma receita específica por ID
app.get('/api/receitas/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM receitas WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar receita:', err);
            res.status(500).send('Erro ao buscar receita');
        } else if (results.length === 0) {
            res.status(404).json({ message: 'Receita não encontrada.' });
        } else {
            res.json(results[0]);
        }
    });
});

app.post('/api/receitas', upload.single('imagem'), (req, res) => {
    const { titulo, categoria, descricao, ingredientes } = req.body;
    const imagem = req.file ? `/uploads/${req.file.filename}` : '/images/default-recipe.jpg';
  
    const query = 'INSERT INTO receitas (titulo, categoria, imagem, descricao, ingredientes) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [titulo, categoria, imagem, descricao || '', ingredientes || ''], (err) => {
      if (err) {
        console.error('Erro ao adicionar receita:', err);
        res.status(500).json({ message: 'Erro ao adicionar receita: ' + err.message });
      } else {
        res.json({ message: 'Receita adicionada com sucesso!' });
      }
    });
  });

  app.put('/api/receitas/:id', upload.single('imagem'), (req, res) => {
    const { id } = req.params;
    const { titulo, categoria, descricao, ingredientes } = req.body;
    const imagem = req.file ? `/uploads/${req.file.filename}` : null;
  
    const query = imagem
      ? 'UPDATE receitas SET titulo = ?, categoria = ?, descricao = ?, ingredientes = ?, imagem = ? WHERE id = ?'
      : 'UPDATE receitas SET titulo = ?, categoria = ?, descricao = ?, ingredientes = ? WHERE id = ?';
  
    const params = imagem
      ? [titulo, categoria, descricao, ingredientes, imagem, id]
      : [titulo, categoria, descricao, ingredientes, id];
  
    db.query(query, params, (err, results) => {
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

// Rota para obter todos os itens do estoque
app.get('/api/estoque', (req, res) => {
    const query = 'SELECT * FROM estoque';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar itens do estoque:', err);
            res.status(500).send('Erro ao buscar itens do estoque');
        } else {
            res.json(results);
        }
    });
});

// Rota para adicionar um item ao estoque
app.post('/api/estoque', (req, res) => {
    const { produto, quantidade, tipo } = req.body;

    if (!produto || !quantidade || !tipo) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const query = tipo === 'entrada'
        ? 'INSERT INTO estoque (produto, quantidade) VALUES (?, ?)'
        : 'UPDATE estoque SET quantidade = quantidade - ? WHERE produto = ?';

    const params = tipo === 'entrada'
        ? [produto, quantidade]
        : [quantidade, produto];

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao registrar item no estoque:', err);
            res.status(500).send('Erro ao registrar item no estoque');
        } else {
            res.json({ message: 'Item registrado com sucesso!' });
        }
    });
});

// Rota para editar um item do estoque
app.put('/api/estoque/:id', (req, res) => {
    const { id } = req.params;
    const { produto, quantidade } = req.body;

    if (!produto || !quantidade) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

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

// Rota para remover um item do estoque
app.delete('/api/estoque/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM estoque WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao remover item do estoque:', err);
            res.status(500).send('Erro ao remover item do estoque');
        } else if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Item não encontrado.' });
        } else {
            res.json({ message: 'Item removido com sucesso!' });
        }
    });
});

// Rota para obter todas as tarefas
app.get('/api/tarefas', (req, res) => {
    const query = 'SELECT * FROM tarefas';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar tarefas:', err);
            res.status(500).send('Erro ao buscar tarefas');
        } else {
            res.json(results);
        }
    });
});

// Rota para adicionar uma nova tarefa
app.post('/api/tarefas', (req, res) => {
    const { titulo, data_entrega } = req.body;

    if (!titulo || !data_entrega) {
        return res.status(400).json({ message: 'Título e data de entrega são obrigatórios.' });
    }

    const query = 'INSERT INTO tarefas (titulo, data_entrega, status) VALUES (?, ?, ?)';
    db.query(query, [titulo, data_entrega, 'novas'], (err) => {
        if (err) {
            console.error('Erro ao adicionar tarefa:', err);
            res.status(500).send('Erro ao adicionar tarefa');
        } else {
            res.json({ message: 'Tarefa adicionada com sucesso!' });
        }
    });
});

// Rota para atualizar o status de uma tarefa
app.put('/api/tarefas/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'O status é obrigatório.' });
    }

    const query = 'UPDATE tarefas SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar status da tarefa:', err);
            res.status(500).send('Erro ao atualizar status da tarefa');
        } else if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Tarefa não encontrada.' });
        } else {
            res.json({ message: 'Status da tarefa atualizado com sucesso!' });
        }
    });
});

// Rota para remover uma tarefa
app.delete('/api/tarefas/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM tarefas WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao remover tarefa:', err);
            res.status(500).send('Erro ao remover tarefa');
        } else if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Tarefa não encontrada.' });
        } else {
            res.json({ message: 'Tarefa removida com sucesso!' });
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
app.post('/tarefas', (req, res) => {
    const { tarefa, descricao, status, dataEntrega, dataCriacao } = req.body
    const sql = 'INSERT INTO tarefas (tarefa, descricao, status, dataEntrega, dataCriacao) VALUES (?, ?, ?, ?, ?)'
    db.query(sql, [tarefa, descricao, status, dataEntrega, dataCriacao], (err, result) => {
        if (err) return res.status(500).json({ erro: err })
        res.json({ id: result.insertId })
    })
})

// Atualizar status da tarefa
app.put('/tarefas/:id', (req, res) => {
    const { status } = req.body;
    const id = req.params.id;
    const sql = 'UPDATE tarefas SET status = ? WHERE id = ?';
    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json({ erro: err });
        res.json({ mensagem: 'Status atualizado com sucesso!' });
    });
});


// Verificar tabelas
function verificarTabelas() {
    const tabelas = [
        {
            nome: 'estoque',
            colunas: `
                id INT AUTO_INCREMENT PRIMARY KEY,
                produto VARCHAR(100) NOT NULL,
                codigo_barras VARCHAR(13),
                preco_venda DECIMAL(10, 2),
                preco_compra DECIMAL(10, 2),
                quantidade INT NOT NULL
            `
        },
        {
            nome: 'receitas',
            colunas: `
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                categoria VARCHAR(100),
                imagem VARCHAR(255),
                descricao TEXT,
                ingredientes TEXT
            `
        },
        {
            nome: 'tarefas',
            colunas: `
                id INT AUTO_INCREMENT PRIMARY KEY,
                tarefa VARCHAR(255) NOT NULL,
                descricao TEXT,
                status VARCHAR(50),
                dataEntrega DATE,
                dataCriacao DATE
            `
        },
        {
            nome: 'financeiro',
            colunas: `
                id INT AUTO_INCREMENT PRIMARY KEY,
                descricao VARCHAR(255) NOT NULL,
                valor DECIMAL(10, 2) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                forma_pagamento VARCHAR(50),
                categoria VARCHAR(100),
                data DATE NOT NULL
            `
        }
    ];

    tabelas.forEach((tabela) => {
        const query = `CREATE TABLE IF NOT EXISTS ${tabela.nome} (${tabela.colunas})`;
        db.query(query, (err) => {
            if (err) {
                console.error(`Erro ao verificar/criar a tabela ${tabela.nome}:`, err);
            } else {
                console.log(`Tabela ${tabela.nome} verificada/criada com sucesso.`);
            }
        });
    });
}
function verificarColunas(tabela, colunas) {
    colunas.forEach((coluna) => {
        const query = `
            ALTER TABLE ${tabela}
            ADD COLUMN IF NOT EXISTS ${coluna.nome} ${coluna.tipo}
        `;
        db.query(query, (err) => {
            if (err) {
                console.error(`Erro ao verificar/adicionar a coluna ${coluna.nome} na tabela ${tabela}:`, err);
            } else {
                console.log(`Coluna ${coluna.nome} verificada/adicionada na tabela ${tabela}.`);
            }
        });
    });
}

// Exemplo de uso
verificarColunas('estoque', [
    { nome: 'imagem', tipo: 'VARCHAR(255)' },
    { nome: 'quantidade', tipo: 'INT' },
    { nome: 'descricao', tipo: 'TEXT' },
    { nome: 'tipo', tipo: 'VARCHAR(50)' },
    { nome: 'data_validade', tipo: 'DATE' },
    { nome: 'unidade', tipo: 'VARCHAR(50)' },
    { nome: 'codigo_barras', tipo: 'VARCHAR(13)' },
    { nome: 'preco_venda', tipo: 'DECIMAL(10, 2)' },
    { nome: 'preco_compra', tipo: 'DECIMAL(10, 2)' }
]);
verificarColunas('receitas', [
    { nome: 'imagem', tipo: 'VARCHAR(255)' },
    { nome: 'descricao', tipo: 'TEXT' },
    { nome: 'ingredientes', tipo: 'TEXT' }
]);
// Verificar e criar tabelas no banco de dados
verificarTabelas();

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});