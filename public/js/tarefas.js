document.addEventListener('DOMContentLoaded', () => {
    const urgentes = document.getElementById('urgentes');
    const fazendo = document.getElementById('fazendo');
    const concluidas = document.getElementById('concluidas');

    function carregarTarefas() {
        fetch('/api/tarefas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar tarefas.');
                }
                return response.json();
            })
            .then(tarefas => {
                urgentes.innerHTML = '<div class="column-title text-danger">Novas / Urgentes</div>';
                fazendo.innerHTML = '<div class="column-title text-warning">Fazendo</div>';
                concluidas.innerHTML = '<div class="column-title text-success">Concluídas</div>';

                tarefas.forEach(tarefa => {
                    const task = document.createElement('div');
                    task.classList.add('post-it', 'p-3', 'rounded', 'shadow', 'mb-2');
                    task.dataset.id = tarefa.id;
                    task.innerHTML = `
                        <strong>${tarefa.titulo}</strong><br>
                        <small>Entrega: ${new Date(tarefa.data_entrega).toLocaleDateString()}</small>
                    `;

                    if (tarefa.status === 'novas') {
                        task.classList.add('bg-danger', 'text-white');
                        urgentes.appendChild(task);
                    } else if (tarefa.status === 'fazendo') {
                        task.classList.add('bg-warning', 'text-dark');
                        fazendo.appendChild(task);
                    } else if (tarefa.status === 'concluidas') {
                        task.classList.add('bg-success', 'text-white');
                        concluidas.appendChild(task);
                    }
                });
            })
            .catch(err => console.error('Erro ao carregar tarefas:', err));
    }

    carregarTarefas();

    const drake = dragula([
        document.getElementById('urgentes'),
        document.getElementById('fazendo'),
        document.getElementById('concluidas')
    ]);

    drake.on('drop', (el, target) => {
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