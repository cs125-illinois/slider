const SocketWorker = require('socketcluster/scworker')

const expect = require('chai').expect

const clientID = '948918026196-p399ooibc7pr0ci7ida63jb5a6n4vsik.apps.googleusercontent.com'
const { OAuth2Client } = require('google-auth-library')
var client = new OAuth2Client(clientID, '', '');

class Slider extends SocketWorker {
  async login (token, respond, socket) {
    console.log('login')
    try {
      var login = await client.verifyIdToken({
        idToken: token,
        audience: clientID
      })
    } catch (err) {
      console.log(err)
      return respond('Login failed')
    }
    try {
      let payload = login.getPayload()
      console.log(payload)
      expect(payload.hd).to.equal('illinois.edu')
      socket.setAuthToken({
        username: payload.email
      })
      console.log('done')
      respond()
    } catch (err) {
      console.log(err)
      respond('Please log in with your @illinois.edu email address')
    }
  }
  run () {
    this.scServer.on('connection', (socket) => {
      socket.on('login', (token, respond) => {
        return this.login(token, respond, socket)
      })
      socket.on('disconnect', () => {
        console.log('disconnect')
      })
    })
  }
}

new Slider()
