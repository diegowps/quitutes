let chart // variável global do gráfico

function buscarResumo() {
    const inicio = document.getElementById('inicio').value
    const fim = document.getElementById('fim').value

    if (!inicio || !fim) {
        alert('Informe o período corretamente!')
        return
    }

    fetch(`http://localhost:3000/financeiro/resumo?inicio=${inicio}&fim=${fim}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('saldo').innerText = formatarValor(data.saldo)
            document.getElementById('faturamento').innerText = formatarValor(data.faturamento)
            document.getElementById('entradas').innerText = formatarValor(data.entradas)
            document.getElementById('saidas').innerText = formatarValor(data.saidas)

            atualizarGrafico(data.entradas, data.saidas)
        })
        .catch(error => {
            console.error('Erro:', error)
            alert('Erro ao buscar dados.')
        })
}

function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function atualizarGrafico(entradas, saidas) {
    const ctx = document.getElementById('graficoFinanceiro').getContext('2d')

    if (chart) {
        chart.destroy() // destruir o gráfico anterior para atualizar
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                label: 'R$',
                data: [entradas, saidas],
                backgroundColor: ['#4caf50', '#f44336'], // verde para entradas, vermelho para saídas
                borderColor: ['#388e3c', '#d32f2f'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    })
}
// Função para abrir o modal e configurar o tipo
function mostrarModal(tipo) {
    document.getElementById('tipo').value = tipo === 'entrada' ? 'entrada' : 'saida'
    const modal = new bootstrap.Modal(document.getElementById('modalFinanceiro'))
    modal.show()
}

// Função para cadastrar a movimentação (salvar no banco)
document.getElementById('formFinanceiro').addEventListener('submit', function(event) {
    event.preventDefault()

    const descricao = document.getElementById('descricao').value
    const valor = parseFloat(document.getElementById('valor').value)
    const data = document.getElementById('data').value
    const tipo = document.getElementById('tipo').value

    if (!descricao || !valor || !data || !tipo) {
        alert('Preencha todos os campos!')
        return
    }

    const dados = { descricao, valor, data, tipo }

    // Envia os dados para o backend
    fetch('http://localhost:3000/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
        alert('Movimentação registrada com sucesso!')
        // Atualizar os valores do financeiro (opcional)
        buscarResumo()
        // Fechar o modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalFinanceiro'))
        modal.hide()
    })
    .catch(error => {
        console.error('Erro ao registrar movimentação:', error)
        alert('Erro ao registrar movimentação!')
    })
})