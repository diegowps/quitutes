let estoque = [];
let carrinho = [];
let pagamentos = [];
let total = 0;

// Carrega os itens do estoque
function carregarEstoque() {
    fetch('/api/vendas/estoque')
        .then((response) => response.json())
        .then((data) => {
            estoque = data;
            const tabelaEstoque = document.querySelector('#estoque-table tbody');
            tabelaEstoque.innerHTML = '';
            estoque.forEach((produto) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${produto.nome}</td>
                    <td>${produto.quantidade}</td>
                    <td>${produto.preco}</td>
                    <td><button onclick="adicionarAoCarrinho(${produto.id})">Adicionar</button></td>
                `;
                tabelaEstoque.appendChild(row);
            });
        });
}

// Adiciona um item ao carrinho
function adicionarAoCarrinho(produtoId) {
    const produto = estoque.find((p) => p.id === produtoId);
    if (!produto) return;

    const itemCarrinho = carrinho.find((item) => item.id === produtoId);
    if (itemCarrinho) {
        itemCarrinho.quantidade++;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }
    atualizarCarrinho();
}

// Atualiza o carrinho e calcula o total
function atualizarCarrinho() {
    const tabelaCarrinho = document.querySelector('#carrinho-table tbody');
    tabelaCarrinho.innerHTML = '';
    total = 0;

    carrinho.forEach((item) => {
        const subtotal = item.quantidade * item.preco;
        total += subtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
            <td>${item.preco.toFixed(2)}</td>
            <td>${subtotal.toFixed(2)}</td>
            <td><button class="btn btn-danger btn-sm" onclick="removerDoCarrinho(${item.id})">Remover</button></td>
        `;
        tabelaCarrinho.appendChild(row);
    });

    document.getElementById('total').textContent = total.toFixed(2);
}

// Remove um item do carrinho
function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter((item) => item.id !== produtoId);
    atualizarCarrinho();
}

// Adiciona uma forma de pagamento
document.getElementById('adicionar-pagamento').addEventListener('click', () => {
    const forma = document.getElementById('forma').value;
    const valor = parseFloat(document.getElementById('valor').value);

    if (valor > 0) {
        pagamentos.push({ forma, valor });
        const listaPagamentos = document.getElementById('pagamentos-list');
        const item = document.createElement('li');
        item.textContent = `${forma}: R$ ${valor.toFixed(2)}`;
        listaPagamentos.appendChild(item);
    }
});

// Finaliza a venda
document.getElementById('finalizar-venda').addEventListener('click', () => {
    const cliente = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        endereco: document.getElementById('endereco').value,
    };

    fetch('/api/vendas/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: carrinho, cliente, pagamento: pagamentos, total }),
    })
        .then((response) => response.json())
        .then((data) => {
            alert('Venda registrada com sucesso!');
            location.reload();
        })
        .catch((error) => {
            console.error('Erro ao registrar venda:', error);
        });
});

// Inicializa a página
carregarEstoque();