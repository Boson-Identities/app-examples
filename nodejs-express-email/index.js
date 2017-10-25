const request = require('request')
const express = require('express')
const session = require('express-session')
const randomstring = require('randomstring')

const host = 'https://app.boson/me'

const oauth2 = require('simple-oauth2').create({
  client: {
    id: '<YOUR APP ID>',
    secret: '<YOUR SECRET ID>'
  },
  auth: {
    tokenPath: '/oauth2/token',
    authorizePath: '/oauth2/authorize',
    tokenHost: host,
  }
});

const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: 'https://<YOUR WEBSITE>/login',
  scope: 'data:email',
  state: randomstring.generate()
})

var app = express()
app.use(session({
  secret: randomstring.generate(),
  resave: false,
  saveUninitialized: true
}))

app.get('/login', (req, res) => {
  const options = { code: req.query.code }
  oauth2.authorizationCode.getToken(options, (err, result) => {
    if (err) {
      console.log("Token access error: ", err.message)
      return res.json('Authentication failed')
    }

    req.session.token_data = result
    res.redirect('/')
    res.end()
  })
})

app.get('/', (req, res) => {
  var token = undefined;
  if (req.session.token_data) {
    token = oauth2.accessToken.create(req.session.token_data)
  }

  if (!token || token.expired()) {
    return res.send('<a href="' + authorizationUri + '">Log-in</a>')
  } else {
    request(
      host + '/api/v1/user/me',
      { headers: {
        Authorization: `Bearer ${token.token.access_token}`
      }},
      (err, response, body) => {
        if (err) {
          return res.send(err)
        }
        res.write('Logged in!\n')
        res.write('Token: ' + JSON.stringify(token) + '\n')
        res.write('/api/v1/user/me: ' + body)
        res.end()
      }
    )
  }
})

app.listen(8080, () => {
  console.log("Example listening on port 8080");
});
