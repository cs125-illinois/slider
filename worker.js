const SocketWorker = require('socketcluster/scworker')

const express = require('express')
const serveStatic = require('serve-static')
const path = require('path')

class Slider extends SocketWorker {
  login(token) {
    console.log(token)
  }
  run() {
    var app = express()
    app.use(serveStatic(path.resolve(__dirname, 'public')))
    this.httpServer.on('request', app)

    this.scServer.on('connection', (socket) => {

      socket.on('login', this.login)

      socket.on('disconnect', () => {
        console.log('disconnect')
      })
    })
  }
}

new Slider()
