let $ = require('jquery')
let Hammer = require('hammerjs')

module.exports = (options) => {
  return (deck) => {
    let hammertime = new Hammer(deck.parent)

    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    hammertime.on('swipeleft', () => {
      deck.prev()
    })
    hammertime.on('swiperight', () => {
      deck.next()
    })
    hammertime.on('swipeup', () => {
      deck.fire('menu.show')
    })
    hammertime.on('swipedown', () => {
      deck.fire('menu.hide')
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
