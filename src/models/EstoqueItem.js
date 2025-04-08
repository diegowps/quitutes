const mongoose = require('mongoose');

const EstoqueItemSchema = new mongoose.Schema({
    nomeProduto: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true },
    codigoBarras: { type: String, unique: true, sparse: true, trim: true }, // sparse permite nulos
    quantidade: { type: Number, required: true, default: 0, min: 0 },
    unidade: { type: String, required: true, enum: ['un', 'kg', 'g', 'L', 'ml', 'caixa', 'pacote', 'lata'] }, // Ajuste as unidades
    precoCusto: { type: Number, required: true, min: 0 },
    precoVenda: { type: Number, min: 0 }, // Pode ser calculado ou definido
    fornecedor: { type: String }, // Ou: { type: mongoose.Schema.Types.ObjectId, ref: 'Fornecedor' }
    dataEntrada: { type: Date, default: Date.now },
    dataValidade: { type: Date },
    estoqueMinimo: { type: Number, default: 0, min: 0 },
    localizacao: { type: String, trim: true }, // Ex: Prateleira A3
    // caminhoImagem: { type: String } // Se usar imagens
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente

module.exports = mongoose.model('EstoqueItem', EstoqueItemSchema);