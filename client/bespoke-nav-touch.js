let $ = require('jquery')
let Hammer = require('hammerjs')
delete Hammer.defaults.cssProps.userSelect;

function getSelectedText() {
  let text
  if (typeof window.getSelection != "undefined") {
    text = window.getSelection().toString()
  } else if (typeof document.selection != "undefined" &&
    document.selection.type == "Text") {
    text = document.selection.createRange().text
  }
  return text
}

module.exports = (options) => {
  return (deck) => {
    let hammertime = new Hammer(deck.parent)

    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    hammertime.on('swipeleft', () => {
      if (!getSelectedText()) {
        deck.next()
      }
    })
    hammertime.on('swiperight', () => {
      if (!getSelectedText()) {
        deck.prev()
      }
    })
    hammertime.on('swipeup', () => {
      deck.fire('menu.toggle')
    })
  }
}
let old = function(options) {
  return function(deck) {
    var opts = (options || {}), TS = 'touchstart', TM = 'touchmove', ADD = 'addEventListener', RM = 'removeEventListener',
      src = deck.parent, start = null, delta = null, axis = 'page' + (opts.axis === 'y' ? 'Y' : 'X'),
      gap = typeof opts.threshold === 'number' ? opts.threshold : 50 / window.devicePixelRatio,
      onStart = function(e) { start = e.touches.length === 1 ? e.touches[0][axis] : null; },
      onMove = function(e) {
        if (start === null) return; // not ours
        if (start === undefined) return e.preventDefault(); // action already taken
        if (Math.abs(delta = e.touches[0][axis] - start) > gap) {
          (delta > 0 ? deck.prev : deck.next)();
          start = e.preventDefault(); // mark action taken
        }
      };
    deck.on('destroy', function() { src[RM](TS, onStart); src[RM](TM, onMove); });
    src[ADD](TS, onStart); src[ADD](TM, onMove);
  };
};
