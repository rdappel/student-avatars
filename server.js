
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const GitHubStrategy = require('passport-github2').Strategy
const fs = require('fs')
const path = require('path')
const jsdom = require("jsdom")
const { JSDOM } = jsdom

require('dotenv').config()

const port = process.env.PORT || 3009
const app = express()
const { env } = process

app.use(express.json())
app.use(express.static('public'))

app.use(session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

const strategyAuth = {
    clientID: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_SECRET_KEY,
    callbackURL: `http://localhost:${port}/auth/github/callback`
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
const loginContent = fs.readFileSync(path.join(partialsPath, 'login.html'), 'utf-8')
const logoutContent = fs.readFileSync(path.join(partialsPath, 'logout.html'), 'utf-8')
const userContent = fs.readFileSync(path.join(partialsPath, 'user.html'), 'utf-8')

const githubOptions = {
    scope: [], //'user:email'
    successRedirect: '/',
    failureRedirect: '/'
}

const authWithGitHub = passport.authenticate('github', githubOptions)

app.get('/', (request, response) => {
    if (request.isAuthenticated()) {
        const { username } = request.user
        return response.redirect(`/${username}`)
    } 

	const indexDom = new JSDOM(indexContent)
	const { document } = indexDom.window
	const authElement = document.querySelector('main .auth')
	authElement.innerHTML = loginContent
	const userElement = document.querySelector('main .user')
	userElement.innerHTML = `<p>It looks like you're not logged in.</p>`
    response.send(indexDom.serialize())
})


app.get('/logout', (request, response) => request.logout(() => response.redirect('/')))

app.get('/auth/github', authWithGitHub)
app.get('/auth/github/callback', authWithGitHub, (_, response) => response.redirect('/'))

// 
// On GitHub, usernames can only contain alphanumeric characters and hyphens,
// cannot have consecutive hyphens or start/end with a hyphen,
// and are limited to 39 characters
// 
app.get('/:username([a-zA-Z0-9-]{1,39})', (request, response) => {
    const { username } = request.params
	
	const indexDom = new JSDOM(indexContent)
	const { document } = indexDom.window

	const getAuthHtml = () => {
		if (request.isAuthenticated()) {
			const { username } = request.user
			console.log(request.user)
			return logoutContent.replaceAll('{username}', username)
		}
		return loginContent
	}

	const authElement = document.querySelector('main .auth')
	authElement.innerHTML = getAuthHtml()

	const userElement = document.querySelector('main .user')
	userElement.innerHTML = userContent.replaceAll('{username}', username)

	return response.send(indexDom.serialize())
})

app.listen(port, () => console.log(`Server is running: http://localhost:${port}`))