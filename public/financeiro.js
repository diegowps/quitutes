document.addEventListener('DOMContentLoaded', async () => {
    const servidorOnline = await testarConexaoServidor();
    if (servidorOnline) {
        carregarMovimentos();
        configurarEventos();
    } else {
        mostrarErro('Não foi possível conectar ao servidor. Verifique se ele está rodando.');
    }
});

async function testarConexaoServidor() {
    const urlTeste = 'http://localhost:5500/api/financeiro/movimentos'; // Alterado para um endpoint existente
    try {
        const response = await fetch(urlTeste, { method: 'GET', cache: 'no-store' });
        if (response.ok) {
            console.log('Servidor está online.');
            return true;
        } else {
            console.error(`Erro ao testar conexão com o servidor: ${response.status} ${response.statusText}`);
            mostrarErro(`Erro ao conectar ao servidor: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (err) {
        if (err.name === 'TypeError') {
            console.error('Erro de rede ou CORS:', err);
            mostrarErro('Erro de rede ou CORS. Verifique se o servidor está acessível e se as permissões estão configuradas corretamente.');
        } else {
            console.error('Erro ao conectar ao servidor:', err);
            mostrarErro('Erro ao conectar ao servidor. Verifique se ele está rodando e acessível.');
        }
        return false;
    }
}

async function carregarMovimentos(filtros = {}) {
    const query = new URLSearchParams(filtros).toString();
    const endpoint = `http://localhost:5500/api/financeiro/movimentos`;
    const urlComFiltros = query ? `${endpoint}?${query}` : endpoint;

    try {
        const response = await fetch(urlComFiltros);

        if (!response.ok) {
            console.error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
            mostrarErro(`Erro ao buscar movimentos: ${response.status} ${response.statusText}`);
            return;
        }

        const movimentos = await response.json();
        console.log('Movimentos recebidos:', movimentos);

        // Atualizar tabela
        const tabela = document.getElementById('tabelaMovimentos');
        tabela.innerHTML = ''; // Limpa a tabela antes de preencher

        movimentos.forEach(movimento => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(movimento.data).toLocaleDateString('pt-BR')}</td>
                <td>${movimento.descricao}</td>
                <td>${movimento.tipo}</td>
                <td>${movimento.categoria}</td>
                <td>${formatarValor(movimento.valor)}</td>
            `;
            tabela.appendChild(row);
        });

        // Atualizar os valores dos cards apenas se não houver filtros
        if (!query) {
            let totalEntradas = 0;
            let totalSaidas = 0;
            let totalFaturamento = 0;

            movimentos.forEach(movimento => {
                if (movimento.tipo === 'entrada') {
                    totalEntradas += Number(movimento.valor);
                    if (movimento.categoria === 'venda') {
                        totalFaturamento += Number(movimento.valor);
                    }
                } else if (movimento.tipo === 'saida') {
                    totalSaidas += Number(movimento.valor);
                }
            });

            document.getElementById('totalEntradas').textContent = formatarValor(totalEntradas);
            document.getElementById('totalSaidas').textContent = formatarValor(totalSaidas);
            document.getElementById('saldo').textContent = formatarValor(totalEntradas - totalSaidas);
            document.getElementById('faturamento').textContent = formatarValor(totalFaturamento);
        }
    } catch (err) {
        console.error('Erro ao carregar movimentos:', err);
        mostrarErro('Erro ao carregar movimentos. Verifique a conexão com o servidor.');
    }
}

function configurarEventos() {
    document.getElementById('btnFiltrar').addEventListener('click', () => {
        const filtros = {
            inicio: document.getElementById('inicio').value,
            fim: document.getElementById('fim').value,
            tipo: document.getElementById('filtroTipo').value,
            categoria: document.getElementById('filtroCategoria').value
        };
        carregarMovimentos(filtros);
    });

    document.getElementById('btnLimpar').addEventListener('click', () => {
        document.getElementById('inicio').value = '';
        document.getElementById('fim').value = '';
        document.getElementById('filtroTipo').value = '';
        document.getElementById('filtroCategoria').value = '';
        carregarMovimentos();
    });

    document.getElementById('formFinanceiro').addEventListener('submit', async (e) => {
        e.preventDefault();

        const dados = {
            descricao: document.getElementById('descricao').value,
            valor: parseFloat(document.getElementById('valor').value),
            data: document.getElementById('data').value,
            tipo: document.getElementById('tipo').value,
            categoria: document.getElementById('categoria').value
        };

        try {
            const response = await fetch('http://localhost:5500/api/financeiro/movimentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (!response.ok) throw new Error('Erro ao salvar movimento.');

            carregarMovimentos();
            bootstrap.Modal.getInstance(document.getElementById('modalFinanceiro')).hide();
        } catch (err) {
            console.error('Erro ao salvar movimento:', err);
            mostrarErro('Erro ao salvar movimento.');
        }
    });

    document.getElementById('btnNovaEntrada').addEventListener('click', () => {
        abrirModal('Nova Entrada', 'entrada');
    });

    document.getElementById('btnNovaSaida').addEventListener('click', () => {
        abrirModal('Nova Saída', 'saida');
    });
}

function abrirModal(titulo, tipo) {
    document.getElementById('modalFinanceiroLabel').textContent = titulo;
    document.getElementById('tipo').value = tipo;
    document.getElementById('formFinanceiro').reset();
    const modal = new bootstrap.Modal(document.getElementById('modalFinanceiro'));
    modal.show();
}

function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarErro(msg) {
    const alerta = document.getElementById('mensagemErro');
    alerta.textContent = msg;
    alerta.classList.remove('d-none');
    setTimeout(() => alerta.classList.add('d-none'), 5000);
}