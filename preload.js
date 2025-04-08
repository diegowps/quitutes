const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- Funções de Envio/Invocação (Renderer -> Main) ---
    // Exemplo para adicionar item (usando invoke/handle)
    addStockItem: (itemData) => ipcRenderer.invoke('add-stock-item', itemData),
    // Exemplo para buscar itens (usando invoke/handle)
    getStockItems: (filter) => ipcRenderer.invoke('get-stock-items', filter),

    // Exemplo para navegação (usando send/on)
    navigateTo: (viewName) => ipcRenderer.send('navigate', viewName),

    // Exemplo para fechar "Sobre" (usando send/on)
    closeAboutWindow: () => ipcRenderer.send('close-about'),

    // Exemplo para abrir diálogo de arquivo (usando invoke/handle)
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

    // Adicione aqui chamadas para TODAS as interações que o renderer precisa fazer com o main process
    // Ex: addReceita, getVendas, addDespesa, getTarefas, etc.


    // --- Funções de Recebimento (Main -> Renderer) ---
    // Para receber a navegação
    onNavigate: (callback) => ipcRenderer.on('navigate', (event, viewName) => callback(viewName)),

    // Para receber a notificação inicial
    onShowStartupNotification: (callback) => ipcRenderer.on('show-startup-notification', (event, data) => callback(data)),

    // Adicione aqui listeners para TODAS as mensagens que o main process pode enviar para o renderer
    // Ex: onStockUpdate, onNewSaleNotification, etc.


    // --- Remover Listeners (Boa prática) ---
    removeListener: (channel) => ipcRenderer.removeAllListeners(channel),
});

console.log("Preload script loaded.");