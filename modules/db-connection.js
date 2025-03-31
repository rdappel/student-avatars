
const mysql = require('mysql2/promise')

const { env } = process

const config = {
	host: env.DATABASE_HOST || 'localhost',
	user: env.DATABASE_USER,
	password: env.DATABASE_PASSWORD,
	database: env.DATABASE_NAME
}

const pool = mysql.createPool(config)

const getConnection = async () => {
	try {
		const connection = await pool.getConnection()
		return { connection, error: null }
	}
	catch (error) { return { connection: null, error } }
}

module.exports = { getConnection }