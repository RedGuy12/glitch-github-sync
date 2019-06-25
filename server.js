const express = require('express')
const cmd = require('node-cmd')
const crypto = require('crypto')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())

const verifySignature = (req, res, next) => {
  const payload = JSON.stringify(req.body)
  const hmac = crypto.createHmac('sha1', process.env.GITHUB_SECRET)
  const digest = 'sha1=' + hmac.update(payload).digest('hex')
  const checksum = req.headers['x-hub-signature']

  if (!checksum || !digest || checksum !== digest) {
    return res.status(403).send('auth failed')
  }

  return next()
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// Github webhook listener
app.post('/git', verifySignature, (req, res) => {
  if (req.headers['x-github-event'] == 'push') {
    cmd.get('bash git.sh', (err, data) => {
      if (err) return console.log(err)
      console.log(data)
      cmd.run('refresh')
      console.log('> [GIT] Updated with origin/master')
      return res.sendStatus(200)
    })
  }
})

app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${process.env.PORT}`)
})
