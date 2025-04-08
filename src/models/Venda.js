const mongoose = require('mongoose');

const ItemVendaSchema = new mongoose.Schema({
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'EstoqueItem', required: true }, // Ou Receita se vender direto da produção
    quantidade: { type: Number, required: true, min: 1 },
    precoUnitario: { type: Number, required: true }, // Preço no momento da venda
    totalItem: { type: Number, required: true }
});

const VendaSchema = new mongoose.Schema({
    dataVenda: { type: Date, default: Date.now },
    itens: [ItemVendaSchema],
    valorTotal: { type: Number, required: true },
    canalVenda: { type: String, required: true, enum: ['Balcão', 'WhatsApp', 'Ifood', 'Outro'] },
    clienteNome: { type: String }, // Ou: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }
    status: { type: String, default: 'Concluída', enum: ['Pendente', 'Concluída', 'Cancelada'] },
    observacoes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Venda', VendaSchema);