
const router = require('express').Router()

const { getConnection } = require('../../modules/db-connection')

// const allowAll = (_, response, next) => {
// 	response.setHeader('Content-Type', 'application/json')
// 	response.setHeader('Access-Control-Allow-Origin', 'github.com')
// 	next()
// }

// router.use(allowAll)

const ensureAuthenticated = (request, response, next) => {
	if (request.isAuthenticated()) return next()
	response.status(401).json({ error: 'Not authenticated' })
}

const ensureAuthorized = (request, response, next) => {
	const loggedInUsername = request.user?.username
	const targetUsername = request.params.username || request.body.username
  
	if (loggedInUsername === targetUsername) return next()
  
	response.status(403).json({ error: 'Forbidden: Not your account' })
  }

router.get('/', async (_, response) => {
	const { connection, error } = await getConnection()

	if (error) {
		console.error('Error connecting to the database:', error)
		response.status(500).send('Error connecting to the database')
		return
	}

	const query = 'SELECT * FROM users'
	const [rows] = await connection.query(query)

	connection.release()

	response.json(rows)
})

router.get('/:username([a-zA-Z0-9-]{1,39})', async (request, response) => {
	const { username } = request.params

	const { connection, error } = await getConnection()

	if (error) {
		console.error('Error connecting to the database:', error)
		response.status(500).send('Error connecting to the database')
		return
	}

	const query = 'SELECT * FROM users WHERE username = ?'
	const [rows] = await connection.query(query, [username])

	connection.release()

	if (rows.length === 0) {
		return response.status(404).send('User not found')
	}

	response.json(rows[0])
})

router.post('/', ensureAuthenticated, async (request, response) => {
	const { username } = request.body
	if (!username) return response.status(400).send('Bad Request')

	const { connection, error } = await getConnection()

	if (error) {
		console.error('Error connecting to the database:', error)
		return response.status(500).send('Error connecting to the database')
	}

	const { displayName, avatarUrl, color } = request.body
	const query = 'INSERT IGNORE INTO users (username, displayName, avatarUrl, color) VALUES (?, ?, ?, ?)'
	const [result] = await connection.query(query, [ username, displayName, avatarUrl, color ])
	connection.release()

	if (result.affectedRows === 0) {
		// user is already in the database
		return response.status(200).json({ username })
	}

	response.status(201).json({ username })
})

router.patch('/:username([a-zA-Z0-9-]{1,39})', 
	ensureAuthenticated, ensureAuthorized, async (request, response) => {

	const { connection, error } = await getConnection()

	if (error) {
		console.error('Error connecting to the database:', error)
		return response.status(500).send('Error connecting to the database')
	}

	const { username, displayName, color } = request.body

	const query = 'UPDATE users SET displayName = ?, color = ? WHERE username = ?'
	const [result] = await connection.query(query, [ displayName, color, username ])

	connection.release()

	if (result.affectedRows === 0) {
		return response.status(404).send('User not found')
	}

	response.status(200).json({ username })
})

module.exports = router