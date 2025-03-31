
const router = require('express').Router()

const { getConnection } = require('../../modules/db-connection')

const allowAll = (_, response, next) => {
	response.setHeader('Content-Type', 'application/json')
	response.setHeader('Access-Control-Allow-Origin', '*')
	next()
}

router.use(allowAll)

router.get('/', async (_, response) => {
	const { connection, error } = await getConnection()

	if (error) {
		console.error('Error connecting to the database:', error)
		response.status(500).send('Error connecting to the database')
		return
	}

	const query = 'SELECT username, avatarUrl FROM users'
	const [rows] = await connection.query(query)

	connection.release()

	response.json(rows)
})

router.get('/:username([a-zA-Z0-9-]{1,39})', async (request, response) => {
	const { connection, error } = await getConnection()

	if (error) {
		console.error('Error connecting to the database:', error)
		response.status(500).send('Error connecting to the database')
		return
	}

	const { username } = request.params
	const query = 'SELECT * FROM users WHERE username = ?'
	const [ rows ] = await connection.query(query, [ username ])

	connection.release()

	if (rows.length === 0) {
		response.status(404).send('User not found')
		return
	}

	response.json(rows[0])
})

router.post('/', async (request, response) => {
	const { connection, error } = await getConnection()

	if (error) {
		console.error('Error connecting to the database:', error)
		response.status(500).send('Error connecting to the database')
		return
	}

	const { username, displayName, avatarUrl } = request.body
	const query = 'INSERT IGNORE INTO users (username, displayName, avatarUrl) VALUES (?, ?, ?)'
	const [ result ] = await connection.query(query, [ username, displayName, avatarUrl ])
	connection.release()

	if (result.affectedRows === 0) {
		// user is already in the database
		return response.status(200).json({ username })
	}

	response.status(201).json({ username })
})

module.exports = router