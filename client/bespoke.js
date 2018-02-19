const $ = require('jquery')
const socketCluster = require('socketcluster-client')

module.exports.from = (opts, plugins) => {
  let parent = (opts.parent || opts).nodeType === 1 ?
    (opts.parent || opts) :
    document.querySelector(opts.parent || opts)
  let slides = [].filter.call(typeof opts.slides === 'string' ?
    parent.querySelectorAll(opts.slides) :
    (opts.slides || parent.children), function(el) {
      return el.nodeName !== 'SCRIPT'
    })
  let activeSlide = slides[0]
  let listeners = {}
  let slideID

  let activate = function(index, customData) {
    if (!slides[index]) {
      return
    }

    fire('deactivate', createEventData(activeSlide, customData))
    activeSlide = slides[index]
    let slideData = createEventData(activeSlide, customData)
    fire('activate', slideData)
  }

  let slide = function(index, customData) {
    if (arguments.length) {
      fire('slide', createEventData(slides[index], customData))
        && activate(index, customData)
    } else {
      return slides.indexOf(activeSlide)
    }
  }

  let step = function(offset, customData) {
    let slideIndex = slides.indexOf(activeSlide) + offset

    fire(offset > 0 ? 'next' :
      'prev', createEventData(activeSlide, customData)) &&
      activate(slideIndex, customData)
  }

  let on = function(eventName, callback) {
    (listeners[eventName] || (listeners[eventName] = [])).push(callback)
    return off.bind(null, eventName, callback)
  }

  let off = function(eventName, callback) {
    listeners[eventName] = (listeners[eventName] || []).filter(function(listener) { return listener !== callback; });
  }

  let  fire = function(eventName, eventData) {
    return (listeners[eventName] || [])
      .reduce((notCancelled, callback) => {
        return notCancelled && callback(eventData) !== false;
      }, true)
  }

  let createEventData = function(el, eventData) {
    eventData = eventData || {}
    eventData.index = slides.indexOf(el)
    eventData.slide = el
    eventData.slideID = $(el).attr('data-slideid')
    return eventData
  }

  let deck = {
    id: $('meta[name="slider-id"]').attr('content').trim(),
    on: on,
    off: off,
    fire: fire,
    slide: slide,
    next: step.bind(null, 1),
    prev: step.bind(null, -1),
    parent: parent,
    slides: slides
  };

  (plugins || []).forEach((plugin) => {
    plugin(deck)
  })
  activate(0)

  let user
  window.onSignIn = (u) => {
    user = u
    login()
  }

  let login = () => {
    if (!user) {
      $("#badEmailModal").modal('show')
      return
    }
    let email = user.getBasicProfile().getEmail()
    if (!email || !(email.endsWith('@illinois.edu'))) {
      $("#badEmailModal").modal('show')
      return
    }

    let token = user.getAuthResponse().id_token
    if (deck.socket) {
      deck.socket.emit('login', {
        sliderID: deck.id,
        token: token
      }, function (err) {
        if (err) {
          $("#badEmailModal").modal('show')
          return
        }
      })
      return
    }
    let link = document.createElement('a')
    link.setAttribute('href', $(parent).attr('data-slider'))

    deck.socket = socketCluster.connect({
      path: '/slider/',
      hostname: link.hostname,
      port: link.port,
      secure: (link.port === 443)
    })
    deck.socket.on('connect', status => {
      if (!(status.isAuthenticated)) {
        deck.socket.emit('login', {
          sliderID: deck.id,
          token: token
        }, function (err) {
          if (err) {
            $("#badEmailModal").modal('show')
            return
          }
        })
      }
    })
    deck.socket.on('authenticate', () => {
      fire('login', {
        email: user.getBasicProfile().getEmail()
      })
      $("#badEmailModal").modal('hide')
      $("#cornerSignin").hide()
    })
    deck.socket.on('deauthenticate', () => {
      fire('logout', {
        email: user.getBasicProfile().getEmail()
      })
      $("#cornerSignin").show()
    })
    deck.socket.on('error', (err) => {
      console.error(err)
    })
  }

  return deck
}
