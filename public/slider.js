var socket = socketCluster.connect()
socket.on('error', function (err) {
  throw 'Socket error - ' + err
})
socket.on('connect', function () {
  window.googleLoginHelper.start()
})

window.googleLoginHelper
  .config('531745357390-akh3vsslmb6c3jmufjrqqr5qkif95g1i.apps.googleusercontent.com')
  .login(user => {
    $("#signin").hide()
  })
  .manual(error => {
    $("#signin").show()
  })

