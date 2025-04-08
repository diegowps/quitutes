/**
 * Módulo de conexão com o banco de dados
 * Uso do mysql2/promise
 */

const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'quitutes_db'
};

async function dbConnect() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
        return connection;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

async function desconectar(connection) {
    try {
        await connection.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database connection:', error);
        throw error;
    }
}

module.exports = { dbConnect, desconectar };