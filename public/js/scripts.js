// Inicio do código de tarefas
const form = document.getElementById('form-tarefa')
const titleInput = document.getElementById('title')
const dateInput = document.getElementById('date')
const newTasksColumn = document.getElementById('urgentes')

form.addEventListener('submit', function (e) {
    e.preventDefault()

    const tarefa = titleInput.value.trim()
    const statusTarefa = 'urgentes'
    const dataEntrega = dateInput.value.trim()
    const dataCriacao = new Date().toISOString().split('T')[0]

    if (tarefa && dataEntrega) {
        fetch('/tarefas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tarefa: tarefa,
                status: statusTarefa,
                dataEntrega: dataEntrega,
                dataCriacao: dataCriacao
            })
        })
        .then(res => res.json())
        .then(data => {
            const task = document.createElement('div')
            task.classList.add('post-it', 'urgentes', 'p-3', 'rounded', 'shadow', 'mb-2')
            task.setAttribute('data-id', data.id)

            task.innerHTML = `
                <strong class="task-title">${tarefa}</strong><br>
                <small class="task-date">Entrega: ${new Date(dataEntrega).toLocaleDateString()}</small>
                <button class="btn btn-warning btn-sm edit-btn">Editar</button>
                <button class="btn btn-danger btn-sm delete-btn">Excluir</button>
            `
            newTasksColumn.appendChild(task)

            // Eventos de editar e excluir
            task.querySelector('.edit-btn').addEventListener('click', () => {
                const newTitle = prompt("Novo título:", task.querySelector('.task-title').textContent)
                const newDate = prompt("Nova data de entrega (AAAA-MM-DD):", dataEntrega)

                if (newTitle && newDate) {
                    task.querySelector('.task-title').textContent = newTitle
                    task.querySelector('.task-date').textContent = `Entrega: ${new Date(newDate).toLocaleDateString()}`
                }
            })

            task.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm('Deseja excluir esta tarefa?')) {
                    task.remove()
                }
            })

            titleInput.value = ''
            dateInput.value = ''
        })
        .catch(err => console.error('Erro ao adicionar tarefa:', err))
    }
})

// Dragula - arrastar tarefas
const drake = dragula([
    document.getElementById('urgentes'),
    document.getElementById('fazendo'),
    document.getElementById('concluido')
])

drake.on('drop', function (el, target) {
    el.classList.remove('urgentes', 'fazendo', 'concluido')

    let status = ''
    if (target.id === 'urgentes') {
        status = 'urgentes'
        el.classList.add('urgentes')
    } else if (target.id === 'fazendo') {
        status = 'fazendo'
        el.classList.add('fazendo')
    } else if (target.id === 'concluido') {
        status = 'concluido'
        el.classList.add('concluido')
    }

    const id = el.getAttribute('data-id')
    if (id) {
        fetch(`/tarefas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
        .then(res => res.json())
        .then(data => console.log('Status atualizado:', data))
        .catch(err => console.error('Erro ao atualizar status:', err))
    }
})
// Fim do código de tarefas