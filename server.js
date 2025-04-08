
const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const passport = require('passport')
const GitHubStrategy = require('passport-github2').Strategy
const fs = require('fs')
const path = require('path')
const jsdom = require("jsdom")
const { JSDOM } = jsdom

require('dotenv').config()

const usersRouter = require('./api/v1/users')

const port = process.env.PORT || 3009
const app = express()
const { env } = process

app.use(express.json())
app.use(express.static('public'))

app.use(session({
	cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
	secret: env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

const strategyAuth = {
	clientID: env.GITHUB_CLIENT_ID,
	clientSecret: env.GITHUB_SECRET_KEY,
	callbackURL: `https://avatars.fvtc.software/auth/github/callback`
}

const strategyCallback = (_, __, profile, done) => done(null, profile)
passport.use(new GitHubStrategy(strategyAuth, strategyCallback))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))


// pages
const pagesPath = path.join(__dirname, 'views', 'pages')
const indexContent = fs.readFileSync(path.join(pagesPath, 'index.html'), 'utf-8')

// partials
const partialsPath = path.join(__dirname, 'views', 'partials')
const loginHtml = fs.readFileSync(path.join(partialsPath, 'login.html'), 'utf-8')
const logoutHtml = fs.readFileSync(path.join(partialsPath, 'logout.html'), 'utf-8')
const profileSelfHtml = fs.readFileSync(path.join(partialsPath, 'profile-self.html'), 'utf-8')
const profileOtherHtml = fs.readFileSync(path.join(partialsPath, 'profile-other.html'), 'utf-8')

const githubOptions = {
	scope: [], //'user:email'
	successRedirect: '/',
	failureRedirect: '/'
}

app.use('/api/v1/users', usersRouter)

const authWithGitHub = passport.authenticate('github', githubOptions)

app.get('/logout', (request, response) => request.logout(() => response.redirect('/')))

app.get('/auth/github', authWithGitHub)
app.get('/auth/github/callback', authWithGitHub, async (_, response) => response.redirect('/'))


const renderIndexPage = () => {
	const dom = new JSDOM(indexContent)
	const { document } = dom.window
	const contentElement = document.querySelector('main > div')
	const messageElement = document.createElement('p')
	messageElement.textContent = `It looks like you are not logged in.`
	contentElement.append(messageElement)
	contentElement.innerHTML += loginHtml
	return dom.serialize()
}


const renderProfilePage = async request => {
	const { username } = request.user

	const result = await fetch(`https://avatars.fvtc.software/api/v1/users/${username}`)
	if (!result.ok) return null

	const { displayName, avatarUrl, color } = await result.json()

	const dom = new JSDOM(indexContent)
	const { document } = dom.window
	const contentElement = document.querySelector('main > div')
	contentElement.innerHTML += profileSelfHtml
	contentElement.innerHTML += logoutHtml
	const usernameElements = contentElement.querySelectorAll('.username')
	usernameElements.forEach(element => element.textContent = displayName || username)
	const githubLinkElement = contentElement.querySelector('.github-profile')
	githubLinkElement.href = `https://github.com/${username}`
	const avatarElement = contentElement.querySelector('.avatar')
	avatarElement.src = avatarUrl
	avatarElement.alt = `${username}'s avatar`
	avatarElement.style.borderColor = color
	const displayNameElement = contentElement.querySelector('input#display-name')
	const colorElement = contentElement.querySelector('input#color')
	const saveButton = contentElement.querySelector('button#save')
	saveButton.dataset.username = username
	if (displayNameElement) displayNameElement.defaultValue = displayName || username
	if (colorElement) colorElement.defaultValue = color

	console.log(displayNameElement.defaultValue, colorElement.defaultValue)

	return dom.serialize()
}

const renderUserPage = async request => {
	const username = request.user?.username
	const { profileName } = request.params

	const result = await fetch(`https://avatars.fvtc.software/api/v1/users/${profileName}`)
	if (!result.ok) return null

	const { displayName, avatarUrl, color } = await result.json()

	const dom = new JSDOM(indexContent)
	const { document } = dom.window
	const contentElement = document.querySelector('main > div')
	contentElement.innerHTML += profileOtherHtml
	contentElement.innerHTML += profileName ? logoutHtml : loginHtml
	const usernameElements = contentElement.querySelectorAll('.username')
	usernameElements.forEach(element => element.textContent = displayName || profileName)
	const githubLinkElement = contentElement.querySelector('.github-profile')
	githubLinkElement.href = `https://github.com/${profileName}`
	const avatarElement = contentElement.querySelector('.avatar')
	avatarElement.src = avatarUrl
	avatarElement.alt = `${username}'s avatar`
	avatarElement.style.borderColor = color

	return dom.serialize()
}


app.get('/', (request, response) => {
	if (request.isAuthenticated()) {
		const { username } = request.user
		return response.redirect(`/${username}`)
	}

	response.send(renderIndexPage(request))
})

const getRandomColor = () => {
	const digits = '0123456789abcdef'
	return [...Array(6)].reduce((acc) => {
		const randomIndex = Math.floor(Math.random() * digits.length)
		const randomDigit = digits[randomIndex]
		return `${acc}${randomDigit}`
	}, '#')
}

// On GitHub, usernames can only contain alphanumeric characters and hyphens,
// cannot have consecutive hyphens or start/end with a hyphen,
// and are limited to 39 characters
app.get('/:profileName([a-zA-Z0-9-]{1,39})', async (request, response) => {

	if (request.isAuthenticated()) {
		const { username, displayName, photos } = request.user
		const color = getRandomColor()
		const avatarUrl = photos[0].value
		await fetch('https://avatars.fvtc.software/api/v1/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, displayName, avatarUrl, color })
		})
	}
	
	const username = request.user?.username
	const { profileName } = request.params

	const renderPage = username === profileName ? renderProfilePage : renderUserPage
	const html = await renderPage(request)
	if (!html) return response.send({ profileName, error: 'User not found', params: request.params })
	response.send(html)
})

app.listen(port, () => console.log(`Server is running: http://localhost:${port}`))