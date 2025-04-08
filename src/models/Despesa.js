const mongoose = require('mongoose');

const DespesaSchema = new mongoose.Schema({
    descricao: { type: String, required: true, trim: true },
    valor: { type: Number, required: true, min: 0 },
    dataVencimento: { type: Date },
    dataPagamento: { type: Date },
    status: { type: String, required: true, enum: ['Pendente', 'Paga', 'Atrasada'], default: 'Pendente' },
    categoria: { type: String, enum: ['Matéria Prima', 'Aluguel', 'Salário', 'Imposto', 'Marketing', 'Outros'] }, // Ajuste as categorias
    tipo: { type: String, required: true, enum: ['Conta a Pagar', 'Compra Avulsa', 'Salário'], default: 'Conta a Pagar'}, // Para a notificação
    observacoes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Despesa', DespesaSchema);