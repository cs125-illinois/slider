/* global gapi */

const $ = require('jquery')
const socketCluster = require('socketcluster-client')

const GOOGLE_ID = '948918026196-p399ooibc7pr0ci7ida63jb5a6n4vsik.apps.googleusercontent.com'

module.exports.from = (opts, plugins) => {
  const parent = (opts.parent || opts).nodeType === 1
    ? (opts.parent || opts)
    : document.querySelector(opts.parent || opts)
  const slides = [].filter.call(typeof opts.slides === 'string'
    ? parent.querySelectorAll(opts.slides)
    : (opts.slides || parent.children), function (el) {
    return el.nodeName !== 'SCRIPT'
  })
  let activeSlide = slides[0]
  const listeners = {}

  const activate = function (index, customData) {
    if (!slides[index]) {
      return
    }

    fire('deactivate', createEventData(activeSlide, customData))
    activeSlide = slides[index]
    const slideData = createEventData(activeSlide, customData)
    fire('activate', slideData)
  }

  const slide = function (index, customData) {
    if (arguments.length) {
      fire('slide', createEventData(slides[index], customData)) &&
        activate(index, customData)
    } else {
      return slides.indexOf(activeSlide)
    }
  }

  const step = function (offset, customData) {
    const slideIndex = slides.indexOf(activeSlide) + offset

    fire(offset > 0 ? 'next'
      : 'prev', createEventData(activeSlide, customData)) &&
      activate(slideIndex, customData)
  }

  const on = function (eventName, callback) {
    (listeners[eventName] || (listeners[eventName] = [])).push(callback)
    return off.bind(null, eventName, callback)
  }

  const off = function (eventName, callback) {
    listeners[eventName] = (listeners[eventName] || []).filter(function (listener) { return listener !== callback })
  }

  const fire = function (eventName, eventData) {
    return (listeners[eventName] || [])
      .reduce((notCancelled, callback) => {
        return notCancelled && callback(eventData) !== false
      }, true)
  }

  const createEventData = function (el, eventData) {
    eventData = eventData || {}
    eventData.index = slides.indexOf(el)
    eventData.slide = el
    eventData.slideID = $(el).attr('data-slideid')
    return eventData
  }

  const deck = {
    id: $('meta[name="slider-id"]').attr('content').trim(),
    semester: $('meta[name="slider-semester"]').attr('content').trim(),
    on: on,
    off: off,
    fire: fire,
    slide: slide,
    next: step.bind(null, 1),
    prev: step.bind(null, -1),
    parent: parent,
    slides: slides,
    authenticated: false
  };

  (plugins || []).forEach((plugin) => {
    plugin(deck)
  })
  activate(0)

  gapi.load('auth2', function () {
    gapi.auth2.init({
      client_id: GOOGLE_ID, hosted_domain: 'illinois.edu'
    }).then(auth2 => {
      const currentUser = auth2.currentUser.get()
      if (currentUser.isSignedIn()) {
        login(currentUser)
      } else {
        deck.fire('nologin')
      }
      auth2.currentUser.listen(user => { login(user) })
      auth2.attachClickHandler($('nav #login').get(0))
    })
  })
  const login = (user) => {
    if (!user) {
      $('#badEmailModal').modal('show')
      return
    }
    const email = user.getBasicProfile().getEmail()
    if (!email || !(email.endsWith('@illinois.edu'))) {
      $('#badEmailModal').modal('show')
      return
    }
    const token = user.getAuthResponse().id_token
    fire('token', token)
    if (deck.socket) {
      deck.socket.emit('login', {
        sliderID: deck.id,
        token: token
      }, function (err) {
        if (err) {
          $('#badEmailModal').modal('show')
        }
      })
      return
    }
    const link = document.createElement('a')
    link.setAttribute('href', $(parent).attr('data-slider'))

    deck.socket = socketCluster.connect({
      path: link.pathname,
      hostname: link.hostname,
      port: link.port,
      secure: (link.port === 443 || link.protocol === 'https:')
    })
    deck.socket.on('connect', status => {
      if (!(status.isAuthenticated)) {
        deck.socket.emit('login', {
          sliderID: deck.id,
          token: token
        }, function (err) {
          if (err) {
            $('#badEmailModal').modal('show')
          }
        })
      }
    })
    deck.socket.on('authenticate', () => {
      deck.authenticated = true
      fire('login', deck.socket.getAuthToken())
      $('#badEmailModal').modal('hide')
    })
    deck.socket.on('deauthenticate', () => {
      fire('logout', {
        email: user.getBasicProfile().getEmail()
      })
    })
    deck.socket.on('user', (payload, respond) => {
      deck.user = payload
      return respond()
    })
    deck.socket.on('error', (err) => {
      console.error(err)
    })
  }

  return deck
}
