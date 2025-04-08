const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- Funções de Envio/Invocação (Renderer -> Main) ---
    addStockItem: (itemData) => ipcRenderer.invoke('add-stock-item', itemData),
    getStockItems: (filter) => ipcRenderer.invoke('get-stock-items', filter),
    navigateTo: (viewName) => ipcRenderer.send('navigate', viewName),
    closeAboutWindow: () => ipcRenderer.send('close-about'),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

    // --- Funções de Recebimento (Main -> Renderer) ---
    onNavigate: (callback) => ipcRenderer.on('navigate', (event, viewName) => callback(viewName)),
    onShowStartupNotification: (callback) => ipcRenderer.on('show-startup-notification', (event, data) => callback(data)),

    // --- Remover Listeners (Boa prática) ---
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
});

console.log("Preload script loaded.");