const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const dashboardRoutes = require('./routes/dashboard');
const vendasRoutes = require('./routes/vendas'); // Importa as rotas de vendas


const app = express();
const port = 5500;

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Configuração do banco de dados
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

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});