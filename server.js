'use strict'

require('dotenv/config')
const { name, version } = require('./package.json')

const path = require('path')
const SocketCluster = require('socketcluster')
const scHotReboot = require('sc-hot-reboot')

const { PORT, WORKERS, ENVIRONMENT, AUTHKEY } = process.env
const options = module.exports.options = {
  name,
  version,
  port: parseInt(PORT) || 8000,
  workers: parseInt(WORKERS) || 1,
  environment: ENVIRONMENT || 'dev',
  authKey: AUTHKEY || null,
  authDefaultExpiry: 365 * 24 * 60 * 60,
  logLevel: 1,
  socketChannelLimit: 16,
  allowClientPublish: false,
  path: '/',
  workerController: path.join(__dirname, 'worker.js'),
  killMasterOnSignal: 'NODEMON' in process.env
}

const socketCluster = new SocketCluster(options)
if (options.environment === 'dev') {
  scHotReboot.attach(socketCluster, {
    cwd: __dirname, ignored: ['node_modules/**/*', 'server.js', '**/.*.swp', '**/.*.swo']
  })
}

process.on('unhandledRejection', (reason, promise) => {
  console.error(`server: unhandled promise rejection ${reason.stack || reason}`)
})
