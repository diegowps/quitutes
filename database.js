/**
 * Módulo de conexão com o banco de dados
 * Uso do mongoose
 */

const mongoose = require('mongoose')

// Definir a URl e autenticação do banco de dados (acrescentar ao final da URL um nome para o banco de dados)
const url = 'mongodb+srv://ademir:123senac@flusterconest.6u8u5.mongodb.net/conestDB'

// status de conexão ("ícone de conexão")
let isConnected = false

// só estabelecer uma conexão se não estiver conectado
const dbConnect = async () => {
    if (isConnected === false) {
        await conectar()
    }
}

// Conectar
const conectar = async () => {
    if (isConnected === false) {
        try {
            // A linha abaixo abre a conexão com o MongoDB
            await mongoose.connect(url)
            isConnected = true // sinalizar que o banco está conectado
            console.log("MongoDB conectado")
        } catch (error) {
            console.log(`Problema Detectado: ${error}`)
        }
    }
}

// Desconectar
const desconectar = async () => {
    if (isConnected === true) {
        try {
            // A linha termina a conexão com o MongoDB
            await mongoose.disconnect(url)
            isConnected = false // sinalizar que o banco não está conectado
            console.log("MongoDB desconectado")
        } catch (error) {
            console.log(`Problema Detectado: ${error}`)
        }
    }
}

// Exportação para o main as funções desejadas
module.exports = { dbConnect, desconectar }