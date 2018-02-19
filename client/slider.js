require('jquery')
require('bootstrap')

const bespoke = require('./bespoke.js')
const reporter = require('./bespoke-reporter.js')
const scale = require('./bespoke-scale.js')
const janini = require('./bespoke-janini.js')
const overview = require('./bespoke-overview.js')
const menu = require('./bespoke-menu.js')

const classes = require('bespoke-classes')
const nav = require('bespoke-nav')
const bullets = require('bespoke-bullets')
const hash = require('bespoke-hash')
const extern = require('bespoke-extern')
const fullscreen = require('bespoke-fullscreen')
const forms = require('bespoke-forms')

highlightJS = require('highlight.js')
window.hljs = highlightJS
highlightJSNumbers = require('./lib/highlightjs-line-numbers.js')
highlightJS.initHighlightingOnLoad()
highlightJS.initLineNumbersOnLoad({ singleLine: true })

$(() => {

  $('div.lazyiframe').each(function() {
    var iframe = $("<iframe/>")
    $.each(JSON.parse(decodeURI($(this).data('attribs'))), (name, value) => {
      $(iframe).attr(name, value);
    })
    $(this).replaceWith(iframe)
  })
  $('[data-toggle="popover"]').popover()
  $('body').on('click', e => {
    $('[data-toggle="popover"]').each(function() {
      if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
        $(this).popover('hide');
      }
    })
  })
  $('[data-toggle="tooltip"]').tooltip()

  bespoke.from({
    parent: 'article',
    slides: 'div.sect1'
  }, [
    reporter(),
    classes(),
    nav(),
    scale('transform'),
    overview(),
    bullets('.bullet'),
    hash(),
    extern(bespoke),
    fullscreen(),
    forms(),
    janini(),
    menu()
  ])
})
