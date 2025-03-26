
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const GitHubStrategy = require('passport-github2').Strategy

require('dotenv').config()

const port = 3009
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

const githubOptions = {
    scope: [], //'user:email'
    successRedirect: '/',
    failureRedirect: '/'
}

const authWithGitHub = passport.authenticate('github', githubOptions)


app.get('/', (request, response) => {
    if (request.isAuthenticated()) {
        const { username, photos, emails } = request.user
        response.sendFile(__dirname + '/public/home.html')
    } else {
        response.send(`
            <h1>Home</h1>
            <a href="/auth/github">Login with GitHub</a>
            <a href="/logout">Logout</a>
        `)
    }
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
    response.send(`
        <h1>${username}</h1>
        <a href="/">Home</a>
    `)
})

app.listen(port, () => console.log(`Server is running: http://localhost:${port}`))