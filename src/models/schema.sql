CREATE TABLE estoque_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome_produto VARCHAR(255) NOT NULL,
    descricao TEXT,
    codigo_barras VARCHAR(50) UNIQUE,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
    unidade ENUM('un', 'kg', 'g', 'L', 'ml', 'caixa', 'pacote', 'lata') NOT NULL,
    preco_custo DECIMAL(10,2) NOT NULL,
    preco_venda DECIMAL(10,2),
    fornecedor VARCHAR(255),
    data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_validade DATE,
    estoque_minimo DECIMAL(10,2) DEFAULT 0,
    localizacao VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE receitas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome_receita VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    instrucoes TEXT,
    rendimento DECIMAL(10,2),
    unidade_rendimento VARCHAR(50),
    tempo_preparo INT,
    custo_calculado DECIMAL(10,2),
    produto_final_estoque_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_final_estoque_id) REFERENCES estoque_items(id)
);

CREATE TABLE receitas_ingredientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    receita_id INT NOT NULL,
    item_estoque_id INT NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    unidade_receita VARCHAR(50) NOT NULL,
    FOREIGN KEY (receita_id) REFERENCES receitas(id),
    FOREIGN KEY (item_estoque_id) REFERENCES estoque_items(id)
);

CREATE TABLE despesas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE,
    data_pagamento DATE,
    status ENUM('Pendente', 'Paga', 'Atrasada') NOT NULL DEFAULT 'Pendente',
    categoria ENUM('Matéria Prima', 'Aluguel', 'Salário', 'Imposto', 'Marketing', 'Outros'),
    tipo ENUM('Conta a Pagar', 'Compra Avulsa', 'Salário') NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tarefas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    description VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    type ENUM('Entrega', 'Pagamento', 'Produção', 'Limpeza', 'Outro') NOT NULL,
    status ENUM('Pendente', 'Em Andamento', 'Concluída', 'Cancelada') NOT NULL DEFAULT 'Pendente',
    assigned_to VARCHAR(100),
    related_to_kind VARCHAR(50),
    related_to_item_id INT,
    priority INT CHECK (priority BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE vendas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2) NOT NULL,
    canal_venda ENUM('Balcão', 'WhatsApp', 'Ifood', 'Outro') NOT NULL,
    cliente_nome VARCHAR(255),
    status ENUM('Pendente', 'Concluída', 'Cancelada') DEFAULT 'Concluída',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE itens_venda (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venda_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    total_item DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venda_id) REFERENCES vendas(id),
    FOREIGN KEY (produto_id) REFERENCES estoque_items(id)
);