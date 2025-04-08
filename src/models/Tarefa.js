const mongoose = require('mongoose');

const TarefaSchema = new mongoose.Schema({
    description: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    type: { type: String, required: true, enum: ['Entrega', 'Pagamento', 'Produção', 'Limpeza', 'Outro'], default: 'Outro' },
    status: { type: String, required: true, enum: ['Pendente', 'Em Andamento', 'Concluída', 'Cancelada'], default: 'Pendente' },
    assignedTo: { type: String }, // Nome ou ID do responsável
    relatedTo: { // Opcional: Link para outra entidade
        kind: String, // Ex: 'Venda', 'Despesa'
        item: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedTo.kind' }
    },
    priority: { type: Number, min: 1, max: 5 }, // 1=Alta, 5=Baixa
    notes: { type: String }
}, { timestamps: true });

// Índice para buscar rapidamente por data e status (bom para notificações)
TarefaSchema.index({ dueDate: 1, status: 1, type: 1 });

module.exports = mongoose.model('Tarefa', TarefaSchema);