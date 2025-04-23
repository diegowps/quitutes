// Inicio do código de tarefas
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-date');
const newTasksColumn = document.getElementById('new-tasks'); // ou o ID da sua coluna de "Novas/Urgentes"

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = titleInput.value.trim();
    const date = dateInput.value;

    if (title && date) {
        const task = document.createElement('div');
        task.classList.add('task', 'bg-red-100', 'p-3', 'rounded', 'shadow', 'mb-2');
        task.innerHTML = `
            <strong>${title}</strong><br>
            <small>Entrega: ${new Date(date).toLocaleDateString()}</small>
        `;

        newTasksColumn.appendChild(task);
        titleInput.value = '';
        dateInput.value = '';
    }
    // Adiciona eventos aos botões
    task.querySelector('.btn-delete').addEventListener('click', () => {
        task.remove();
    });

    task.querySelector('.btn-edit').addEventListener('click', () => {
        const newTitle = prompt("Novo título:", task.querySelector('.task-title').textContent);
        const newDate = prompt("Nova data de entrega (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);

        if (newTitle && newDate) {
            task.querySelector('.task-title').textContent = newTitle;
            task.querySelector('.task-date').textContent = `Entrega: ${new Date(newDate).toLocaleDateString()}`;
        }
    })
})
// Fim do código de tarefas