require('dotenv').config()
const SocketWorker = require('socketcluster/scworker')
const _ = require('lodash')
const jsYAML = require('js-yaml')

const express = require('express')
const serveStatic = require('serve-static')
const path = require('path')
const fs = require('fs')

const mongo = require('mongodb').MongoClient
const expect = require('chai').expect
const bunyan = require('bunyan')
const moment = require('moment-timezone')
const log = bunyan.createLogger({ name: 'slider' })

const config = _.extend(
  require('minimist')(process.argv.slice(2)),
  jsYAML.safeLoad(fs.readFileSync('config.yaml', 'utf8'))
)

const semesters = _.mapValues(config.semesters, semester => {
  return {
    start: moment.tz(new Date(semester.start), config.timezone),
    end: moment.tz(new Date(semester.end), config.timezone)
  }
})

function getCurrentSemester () {
  const now = moment()
  return _.findKey(semesters, ({ start, end }) => {
    return now.isBetween(start, end, null, '[]')
  })
}

const PrettyStream = require('bunyan-prettystream')
const prettyStream = new PrettyStream()
prettyStream.pipe(process.stdout)
if (config.debug) {
  log.addStream({
    type: 'raw',
    stream: prettyStream,
    level: 'debug'
  })
} else {
  log.addStream({
    type: 'raw',
    stream: prettyStream,
    level: 'warn'
  })
}

const { OAuth2Client } = require('google-auth-library')
var client = new OAuth2Client(process.env.GOOGLE, '', '')

const fileWatcher = require('filewatcher')
const distWatcher = fileWatcher()

class Slider extends SocketWorker {
  constructor (db) {
    super()
    this.db = db
    this.sliderChanges = db.collection('sliderChanges')
  }

  async login (info, respond, socket) {
    try {
      var login = await client.verifyIdToken({
        idToken: info.token,
        audience: process.env.GOOGLE
      })
    } catch (err) {
      log.warn(`login failed: ${err}`)
      return respond('login failed')
    }
    try {
      const payload = login.getPayload()
      expect(payload.hd).to.equal('illinois.edu')
      socket.setAuthToken({
        email: payload.email,
        presenter: (payload.email === 'challen@illinois.edu')
      })
      return respond()
    } catch (err) {
      log.warn(`login failed ${err}`)
      return respond('Please log in with your @illinois.edu email address')
    }
  }

  async reporter (currentSlide, respond, socket) {
    const authToken = socket.getAuthToken()
    if (!(authToken)) {
      log.warn('authentication required')
      return respond('authentication required')
    }

    currentSlide.email = authToken.email
    currentSlide.timestamp = moment().toDate()
    currentSlide.address = socket.remoteAddress
    const currentSemester = getCurrentSemester()
    if (currentSemester) {
      currentSlide.currentSemester = currentSemester
    }
    if (socket.request.headers['x-forward-for']) {
      currentSlide.forwardedFor = socket.request.headers['x-forward-for']
    }
    currentSlide.socketID = socket.id

    log.debug(currentSlide)
    this.sliderChanges.insertOne(currentSlide)

    return respond()
  }

  async run () {
    const app = express()
    let mapping = {}
    const loadMapping = () => {
      mapping = {}
      _.each(fs.readdirSync(path.resolve(__dirname, 'dist')), filename => {
        const components = filename.split('.')
        mapping[`${components[0]}.${components[2]}`] = filename
      })
    }
    loadMapping()
    distWatcher.add(path.resolve(__dirname, 'dist'))
    distWatcher.on('change', () => {
      log.debug('Reloading client library')
      loadMapping()
    })
    app.use((req, res, next) => {
      const url = req.url.split('/').slice(1).join('/')
      if (url in mapping) {
        req.url = mapping[url]
      }
      return next()
    })
    app.use(serveStatic(path.resolve(__dirname, 'dist')))
    this.httpServer.on('request', app)

    this.scServer.on('connection', (socket) => {
      socket.on('login', (token, respond) => {
        return this.login(token, respond, socket)
      })
      socket.on('reporter', (payload, respond) => {
        return this.reporter(payload, respond, socket)
      })
    })
  }
}

mongo.connect(process.env.MONGO, { useUnifiedTopology: true })
  .then(client => {
    new Slider(client.db('cs125')) // eslint-disable-line
  })
