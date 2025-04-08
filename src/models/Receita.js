const mongoose = require('mongoose');

const IngredienteSchema = new mongoose.Schema({
    itemEstoque: { type: mongoose.Schema.Types.ObjectId, ref: 'EstoqueItem', required: true },
    quantidade: { type: Number, required: true, min: 0 },
    unidadeReceita: { type: String, required: true } // Unidade usada na receita (ex: xícara, colher) - pode precisar de conversão
});

const ReceitaSchema = new mongoose.Schema({
    nomeReceita: { type: String, required: true, unique: true, trim: true },
    descricao: { type: String, trim: true },
    ingredientes: [IngredienteSchema],
    instrucoes: { type: String },
    rendimento: { type: Number }, // Quantas porções/unidades a receita rende
    unidadeRendimento: { type: String }, // Ex: 'unidades', 'porções', 'kg'
    tempoPreparo: { type: Number }, // Em minutos
    custoCalculado: { type: Number }, // Pode ser calculado dinamicamente
    produtoFinalEstoque: { type: mongoose.Schema.Types.ObjectId, ref: 'EstoqueItem' } // Se a receita gera um item que vai pro estoque (ex: Pão de Mel pronto)
}, { timestamps: true });

module.exports = mongoose.model('Receita', ReceitaSchema);