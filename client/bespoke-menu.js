const $ = require('jquery')

module.exports = () => {
  return (deck) => {
    let KEY_M = 77
    let EVT_KEYDOWN = 'keydown'

    let toggleMenu = (show) => {
      show = show !== undefined ? show : $('nav').css('display') === 'none'
      if (show) {
        $('nav').show()
      } else {
        $('nav').hide()
      }
      deck.fire('should-scale')
    }

    let isModifierPressed = e => {
      return !!(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey);
    }

    let onKeydown = e => {
      var key = e.which;
      if (key === KEY_M && !isModifierPressed(e)) {
        toggleMenu()
      }
    }
    deck.on('menu.toggle', toggleMenu())
    deck.on('menu.show', toggleMenu(true))
    deck.on('menu.hide', toggleMenu(false))

    document.addEventListener(EVT_KEYDOWN, onKeydown)
  }
}
