const SocketWorker = require('socketcluster/scworker')

const expect = require('chai').expect

const clientID = '948918026196-p399ooibc7pr0ci7ida63jb5a6n4vsik.apps.googleusercontent.com'
const { OAuth2Client } = require('google-auth-library')
var client = new OAuth2Client(clientID, '', '');

let count = 0
class Slider extends SocketWorker {
  async login (info, respond, socket) {
    try {
      var login = await client.verifyIdToken({
        idToken: info.token,
        audience: clientID
      })
    } catch (err) {
      return respond('Login failed')
    }
    try {
      let payload = login.getPayload()
      expect(payload.hd).to.equal('illinois.edu')
      socket.setAuthToken({
        email: payload.email
      })
      return respond()
    } catch (err) {
      return respond('Please log in with your @illinois.edu email address')
    }
  }
  report (change) {
  }
  run () {
    this.scServer.on('connection', (socket) => {
      socket.on('login', (token, respond) => {
        return this.login(token, respond, socket)
      })
      socket.on('slideChange', (currentSlide, respond) => {
        let authToken = socket.getAuthToken()
        if (!(authToken)) {
          return respond('authentication required')
        }
        currentSlide.email = authToken.email
        console.log(currentSlide)
        return respond()
      })
    })
  }
}

new Slider()
