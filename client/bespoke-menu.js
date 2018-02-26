const $ = require('jquery')

module.exports = () => {
  return (deck) => {
    let isModifierPressed = e => {
      return !!(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey);
    }

    let toggleMenu = (show) => {
      show = show !== undefined ? show : $('nav').css('display') === 'none'
      if (show) {
        $('nav').show()
      } else {
        $('nav').hide()
      }
      deck.fire('should-scale')
    }
    let toggleHelp = () => {
      $("#helpModal").modal('toggle')
    }
    document.addEventListener('keydown', e => {
      if (e.which === 77 && !isModifierPressed(e)) {
        toggleMenu()
      } else if (e.which === 72 && !isModifierPressed(e)) {
        toggleHelp()
      }
    })

    deck.on('menu.toggle', () => {
      toggleMenu()
    })
    $('.menuToggle').click(() => {
      toggleMenu()
    })
    deck.on('menu.show', () => {
      toggleMenu(true)
    })
    deck.on('menu.hide', () => {
      toggleMenu(false)
    })

    deck.on('help.toggle', () => {
      toggleHelp()
    })
    $('.helpToggle').click(() => {
      toggleHelp()
    })

    $('.overviewToggle').click(() => {
      deck.fire('overview')
    })

    let updateLogin = (show) => {
      if (deck.authenticated) {
        $('nav #login').hide()
        $('nav #logout').show()
        $('nav #login').tooltip('hide')
      } else {
        $('nav #login').show()
        $('nav #logout').hide()
        if (show) {
          toggleMenu(true)
          $('nav #login').tooltip('show')
        }
      }
    }
    deck.on('login', () => {
      updateLogin()
    })
    deck.on('nologin', () => {
      forceShow = true
      updateLogin(true)
    })
  }
}
