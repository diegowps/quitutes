const { app, BrowserWindow, nativeTheme, Menu, shell, ipcMain, dialog, globalShortcut } = require('electron/main')
const path = require('node:path')
const fs = require('fs') // Para manipulaçaõ de arquivos --- Imagens

// Módulo de conexão --- Se liga ao database.js
const { dbConnect, desconectar } = require('./database.js')
let dbcon = null

// Importação de models 
const TarefaModel = require('./src/models/Tarefa.js');
const DespesaModel = require('./src/models/Despesa.js');
const EstoqueItem = require('./src/models/EstoqueItem');
const Venda = require('./src/models/Venda');
const Receita = require('./src/models/Receita');


// Janela Principal
let win
async function createWindow() {
    nativeTheme.themeSource = 'light'
    win = new BrowserWindow({
        width: 1200, // Largura
        height: 800, // Altura
        resizable: true, // Permite redimensionar
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Segurança --- Recomendado 
            nodeIntegration: false  // Segurança também!!!
        }
    })

    // Menu personalizado para JASBD
    Menu.setApplicationMenu(Menu.buildFromTemplate(createMenuTemplate()))

    await win.loadFile('./src/views/index.html') // Carregar a janela principal

    // --- Notificação Inicial ---
    // Executa após a janela carregar completamente
    win.webContents.on('did-finish-load', async () => {
        if (dbcon) { // Verifica se a conexão com o DB está ativa
            try {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
                const amanha = new Date(hoje);
                amanha.setDate(hoje.getDate() + 1); // Define o início do dia seguinte

                // Buscar tarefas (entregas) pendentes para hoje
                const entregasPendentes = await TarefaModel.find({
                    tipo: 'Entrega', // Ou como você definir o tipo
                    status: 'Pendente', // Ou como você definir o status
                    dueDate: {
                        $gte: hoje,
                        $lt: amanha
                    }
                }).lean(); // .lean() para retornar objetos JS puros

                // Buscar contas a pagar pendentes para hoje
                // (Ajuste o Model e os campos conforme sua estrutura financeira)
                const contasAPagarPendentes = await DespesaModel.find({ // Ou um model ContasPagar
                    tipo: 'Conta a Pagar', // Exemplo
                    status: 'Pendente', // Exemplo
                    dataVencimento: { // Exemplo de campo
                         $gte: hoje,
                         $lt: amanha
                    }
                }).lean();

                let notificationMessage = "";
                if (entregasPendentes.length > 0) {
                    notificationMessage += `Entregas Pendentes Hoje (${entregasPendentes.length}):\n`;
                    entregasPendentes.forEach(task => {
                        notificationMessage += `- ${task.description}\n`; // Ajuste para mostrar dados relevantes
                    });
                    notificationMessage += "\n";
                }

                if (contasAPagarPendentes.length > 0) {
                    notificationMessage += `Contas a Pagar Hoje (${contasAPagarPendentes.length}):\n`;
                    contasAPagarPendentes.forEach(conta => {
                        notificationMessage += `- ${conta.description} (R$ ${conta.amount})\n`; // Ajuste
                    });
                }

                if (notificationMessage) {
                    // Opção 1: Diálogo Nativo Simples
                    /*
                    dialog.showMessageBox(win, {
                        type: 'info',
                        title: 'Lembretes do Dia',
                        message: notificationMessage,
                        buttons: ['OK']
                    });
                    */

                    // Opção 2: Enviar para o Renderer exibir um modal customizado (mais flexível)
                    win.webContents.send('show-startup-notification', {
                      title: 'Lembretes do Dia',
                      message: notificationMessage
                    });

                } else {
                    console.log("Nenhuma entrega ou conta pendente para hoje.");
                    // Opcional: Enviar uma mensagem para o renderer indicando que não há avisos
                    // win.webContents.send('no-startup-notification');
                }

            } catch (error) {
                console.error("Erro ao buscar notificações iniciais:", error);
                dialog.showMessageBox(win, {
                    type: 'error',
                    title: 'Erro Notificação',
                    message: 'Não foi possível verificar as pendências do dia.',
                    buttons: ['OK']
                });
            }
        } else {
            console.warn("Banco de dados não conectado ao tentar buscar notificações.");
            // Opcional: Tentar reconectar ou avisar o usuário
        }
    });

    // --- Fim Notificação Inicial ---

    // (Opcional) Abrir DevTools automaticamente para desenvolvimento
    // win.webContents.openDevTools();
}

// Template do Menu para JASBD SYSTEM
function createMenuTemplate() {
    return [
        {
            label: 'Arquivo',
            submenu: [
                // { label: 'Configurações', click: () => { /* Abrir janela/view de config */ } },
                { type: 'separator' },
                { label: 'Sair', accelerator: 'Alt+F4', click: () => app.quit() }
            ]
        },
        {
            label: 'Módulos',
            submenu: [
                { label: 'Estoque', click: () => navigateToView('estoque') },
                { label: 'Produção', click: () => navigateToView('producao') },
                { label: 'Vendas', click: () => navigateToView('vendas') },
                { label: 'Financeiro', click: () => navigateToView('financeiro') },
                { label: 'Relatórios', click: () => navigateToView('relatorios') },
                { label: 'Tarefas', click: () => navigateToView('tarefas') },
            ]
        },
        // { // Manter Relatórios separados se preferir gerar PDFs como no CONEST
        //     label: 'Relatórios',
        //     submenu: [
        //         { label: 'Estoque Baixo', click: () => { /* Lógica para gerar relatório */ } },
        //         { label: 'Vendas por Período', click: () => { /* Lógica para gerar relatório */ } },
        //         // ... outros relatórios
        //     ]
        // },
        {
            label: 'Ajuda',
            submenu: [
                // { label: 'Documentação', click: () => shell.openExternal('URL_DA_DOC') },
                { label: 'Sobre', click: () => aboutWindow() } // Reutilizar a janela Sobre
            ]
        }
    ];
}

// Função para navegar entre as "telas" na janela principal
function navigateToView(viewName) {
    if (win) {
        // Envia uma mensagem para o renderer carregar a view correta
        win.webContents.send('navigate', viewName);
    }
}

// Janela Sobre (Reutilizada do CONEST)
let aboutWin;
function aboutWindow() {
    if (aboutWin && !aboutWin.isDestroyed()) {
        aboutWin.focus();
        return;
    }
    nativeTheme.themeSource = "light"
    const parentWin = BrowserWindow.getFocusedWindow()
    if (parentWin) {
        aboutWin = new BrowserWindow({
            width: 380,
            height: 250,
            autoHideMenuBar: true,
            resizable: false,
            minimizable: false,
            parent: parentWin,
            modal: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'), // Usar o mesmo preload
                contextIsolation: true,
                nodeIntegration: false
            }
        })
        aboutWin.loadFile('./src/views/sobre.html') // Criar um sobre.html simples
        aboutWin.on('closed', () => { aboutWin = null });
    }
}

// --- Lógica de Inicialização e Banco de Dados ---
app.whenReady().then(async () => {
    // Conectar ao banco ANTES de criar a janela principal
    try {
        dbcon = await dbConnect();
        console.log("Banco de dados conectado com sucesso.");
        if (win) {
            win.webContents.once('did-finish-load', () => {
                win.webContents.send('db-connection-status', { connected: true });
            });
        }
    } catch (error) {
        console.error("Falha ao conectar ao banco de dados:", error);
        if (win) {
            win.webContents.once('did-finish-load', () => {
                win.webContents.send('db-connection-status', { connected: false });
            });
        }
        dialog.showErrorBox("Erro Crítico de Banco de Dados", "Não foi possível conectar ao banco de dados. O aplicativo não pode continuar.\n\nDetalhes: " + error.message);
        app.quit();
        return; // Impede a criação da janela se o DB falhar
    }

    // Registrar atalho DevTools (Manter do CONEST)
    globalShortcut.register('Ctrl+Shift+I', () => {
        const focusedWin = BrowserWindow.getFocusedWindow();
        if (focusedWin) {
            focusedWin.webContents.toggleDevTools();
        }
    });

    createWindow(); // Cria a janela principal

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Desconectar do banco ao sair (Manter do CONEST)
app.on('before-quit', async () => {
    if (dbcon) {
        await desconectar(dbcon);
        console.log("Desconectado do banco de dados.");
    }
    globalShortcut.unregisterAll(); // Desregistrar atalhos
});

// Encerrar aplicação (Manter do CONEST)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Reduzir logs (Manter do CONEST)
app.commandLine.appendSwitch('log-level', '3');

// --- IPC Handlers para JASBD SYSTEM ---

// Exemplo: Adicionar item ao estoque
ipcMain.handle('add-stock-item', async (event, itemData) => {
    try {
        // Validação dos dados recebidos (itemData) aqui...
        // const newItem = new EstoqueItemModel(itemData);
        // await newItem.save();
        console.log("Recebido para adicionar estoque:", itemData); // Placeholder
        // Simular sucesso
         return { success: true, message: 'Item adicionado ao estoque!', data: itemData };
        // return { success: true, message: 'Item adicionado ao estoque!', data: newItem.toObject() };
    } catch (error) {
        console.error("Erro ao adicionar item ao estoque:", error);
        return { success: false, message: 'Erro ao adicionar item: ' + error.message };
    }
});

// Exemplo: Buscar itens do estoque
ipcMain.handle('get-stock-items', async (event, filter = {}) => {
    try {
        // const items = await EstoqueItemModel.find(filter).lean();
        // return { success: true, data: items };
        console.log("Recebido pedido para buscar estoque com filtro:", filter); // Placeholder
        // Simular dados
        const simulatedItems = [
            { _id: '1', nomeProduto: 'Leite Condensado', quantidade: 10, unidade: 'lata', precoCusto: 5.50 },
            { _id: '2', nomeProduto: 'Farinha de Trigo', quantidade: 5, unidade: 'kg', precoCusto: 4.00 },
        ];
        return { success: true, data: simulatedItems };
    } catch (error) {
        console.error("Erro ao buscar itens do estoque:", error);
        return { success: false, message: 'Erro ao buscar itens: ' + error.message, data: [] };
    }
});

// Adicione outros handlers conforme necessário para:
// - Produção/Receitas (CRUD)
// - Vendas (Registrar venda, buscar vendas)
// - Financeiro (CRUD Despesas, Gerar Fluxo Caixa)
// - Relatórios (Buscar dados para relatórios)
// - Tarefas (CRUD)

// Handler para fechar a janela Sobre (Reutilizado do CONEST)
ipcMain.on('close-about', () => {
    if (aboutWin && !aboutWin.isDestroyed()) {
        aboutWin.close();
    }
});

// (Manter se usar upload de imagens como no CONEST)
ipcMain.handle('open-file-dialog', async () => {
    // ... (código do CONEST para selecionar imagem) ...
});

const setupIpcHandlers = () => {
    // Estoque handlers
    ipcMain.handle('add-stock-item', async (_, itemData) => {
        return await EstoqueItem.create(itemData);
    });

    ipcMain.handle('get-stock-items', async () => {
        return await EstoqueItem.findAll();
    });

    ipcMain.handle('update-stock-item', async (_, { id, itemData }) => {
        return await EstoqueItem.update(id, itemData);
    });

    ipcMain.handle('delete-stock-item', async (_, id) => {
        return await EstoqueItem.delete(id);
    });

    // Receitas handlers
    ipcMain.handle('add-receita', async (_, receitaData) => {
        return await Receita.create(receitaData);
    });

    ipcMain.handle('get-receitas', async () => {
        return await Receita.findAll();
    });

    ipcMain.handle('update-receita', async (_, { id, receitaData }) => {
        return await Receita.update(id, receitaData);
    });

    ipcMain.handle('delete-receita', async (_, id) => {
        return await Receita.delete(id);
    });

    // Vendas handlers
    ipcMain.handle('add-venda', async (_, vendaData) => {
        return await Venda.create(vendaData);
    });

    ipcMain.handle('get-vendas', async () => {
        return await Venda.findAll();
    });

    ipcMain.handle('update-venda', async (_, { id, vendaData }) => {
        return await Venda.update(id, vendaData);
    });

    ipcMain.handle('delete-venda', async (_, id) => {
        return await Venda.delete(id);
    });

    // Despesas handlers
    ipcMain.handle('add-despesa', async (_, despesaData) => {
        return await Despesa.create(despesaData);
    });

    ipcMain.handle('get-despesas', async () => {
        return await Despesa.findAll();
    });

    ipcMain.handle('update-despesa', async (_, { id, despesaData }) => {
        return await Despesa.update(id, despesaData);
    });

    ipcMain.handle('delete-despesa', async (_, id) => {
        return await Despesa.delete(id);
    });

    // Tarefas handlers
    ipcMain.handle('add-tarefa', async (_, tarefaData) => {
        return await Tarefa.create(tarefaData);
    });

    ipcMain.handle('get-tarefas', async () => {
        return await Tarefa.findAll();
    });

    ipcMain.handle('update-tarefa', async (_, { id, tarefaData }) => {
        return await Tarefa.update(id, tarefaData);
    });

    ipcMain.handle('delete-tarefa', async (_, id) => {
        return await Tarefa.delete(id);
    });
};

const checkPendingItems = async () => {
    try {
        const today = new Date();
        const [pendingTasks, pendingPayments] = await Promise.all([
            Tarefa.findPendentes(today),
            Despesa.findPendentes(today)
        ]);

        if (pendingTasks.length > 0 || pendingPayments.length > 0) {
            mainWindow.webContents.send('pending-items', {
                tasks: pendingTasks,
                payments: pendingPayments
            });
        }
    } catch (error) {
        console.error('Error checking pending items:', error);
    }
};