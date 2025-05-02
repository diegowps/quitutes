<<<<<<< HEAD
=======
// Inicio do código de tarefas
// Atualizar evento de submit para validar os campos antes de enviar
const form = document.getElementById('task-form');
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const date = document.getElementById('task-date').value;
    const submitButton = form.querySelector('button[type="submit"]');

    if (!title) {
        alert('O título da tarefa é obrigatório.');
        return;
    }

    if (!date) {
        alert('A data de entrega é obrigatória.');
        return;
    }

    console.log('Enviando tarefa:', { titulo: title, data_entrega: date }); // Log para depuração

    submitButton.disabled = true; // Desabilitar o botão para evitar múltiplas submissões

    const task = { titulo: title, data_entrega: date };

    fetch('/api/tarefas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao adicionar tarefa. Verifique os dados enviados.');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        carregarTarefas(); // Atualizar tarefas visualmente após adicionar
    })
    .catch(err => {
        console.error('Erro na requisição:', err); // Log para depuração
        alert(err.message);
    })
    .finally(() => {
        submitButton.disabled = false; // Reabilitar o botão após a resposta
    });
});

// Atualizar estilos das tarefas conforme a coluna
function carregarTarefas() {
    fetch('/api/tarefas')
        .then(response => response.json())
        .then(tarefas => {
            const urgentes = document.getElementById('urgentes');
            const fazendo = document.getElementById('fazendo');
            const concluidas = document.getElementById('concluidas');

            urgentes.innerHTML = '';
            fazendo.innerHTML = '';
            concluidas.innerHTML = '';

            tarefas.forEach(tarefa => {
                const task = document.createElement('div');
                task.classList.add('post-it', 'p-3', 'rounded', 'shadow', 'mb-2');
                task.dataset.id = tarefa.id;
                task.innerHTML = `
                    <strong>${tarefa.titulo}</strong><br>
                    <small>Entrega: ${new Date(tarefa.data_entrega).toLocaleDateString()}</small>
                `;

                if (tarefa.status === 'novas') {
                    task.classList.add('bg-danger', 'text-white'); // Vermelho para "novas"
                    urgentes.appendChild(task);
                } else if (tarefa.status === 'fazendo') {
                    task.classList.add('bg-warning', 'text-dark'); // Amarelo para "fazendo"
                    fazendo.appendChild(task);
                } else if (tarefa.status === 'concluidas') {
                    task.classList.add('bg-success', 'text-white'); // Verde para "concluidas"
                    concluidas.appendChild(task);
                }
            });
        })
        .catch(err => console.error('Erro ao carregar tarefas:', err));
}

// Carregar tarefas ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarTarefas();

    const drake = dragula([
        document.getElementById('urgentes'),
        document.getElementById('fazendo'),
        document.getElementById('concluidas')
    ], {
        moves: (el, source, handle) => true,
        invalid: (el, handle) => false,
        direction: 'vertical',
        ignoreInputTextSelection: true
    });

    // Adicionar listener para corrigir o problema de eventos passivos
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    drake.on('drop', function (el, target) {
        const taskId = el.dataset.id;
        let newStatus;

        if (target.id === 'urgentes') {
            newStatus = 'novas';
            el.classList.remove('bg-warning', 'bg-success');
            el.classList.add('bg-danger', 'text-white');
        } else if (target.id === 'fazendo') {
            newStatus = 'fazendo';
            el.classList.remove('bg-danger', 'bg-success');
            el.classList.add('bg-warning', 'text-dark');
        } else if (target.id === 'concluidas') {
            newStatus = 'concluidas';
            el.classList.remove('bg-danger', 'bg-warning');
            el.classList.add('bg-success', 'text-white');
        }

        fetch(`/api/tarefas/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao atualizar status da tarefa.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Status atualizado:', data);
        })
        .catch(err => console.error('Erro ao atualizar status:', err));
    });
});
// Fim do código de tarefas
>>>>>>> VERSAO-AMANDA
