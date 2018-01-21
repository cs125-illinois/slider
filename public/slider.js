const clientID = '948918026196-p399ooibc7pr0ci7ida63jb5a6n4vsik.apps.googleusercontent.com'
let socket = socketCluster.connect()
socket.on('error', function (err) { throw(err) })

let login = (token) => {
  socket.emit('login', token)
}
window.googleLoginHelper
  .config(clientID)
  .login(token => {
    login(token)
  })
  .manual(error => {
    // Need to enable manual signin here
    console.log(error)
  })
socket.on('connect', function () {
  window.googleLoginHelper.start()
})
