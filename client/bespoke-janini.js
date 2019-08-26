const $ = require('jquery')
const _ = require('lodash')

let CodeMirror = require('codemirror')
require("codemirror/mode/clike/clike")
require("codemirror/addon/edit/closebrackets")
require("codemirror/lib/codemirror.css")
let Split = require('split.js')

module.exports = () => {
  return (deck) => {
    /*
     * Track the active editor across slide changes.
     */
    let active
    deck.on('activate', e => {
      active = e
      if (janinis[active.index]) {
        janinis[active.index].refresh()
      }
    })

    let token
    deck.on('token', t => { token = t })

    /*
     * Refreshing the editor causes it to immediately respond to font changes.
     */
    let refreshAll = () => {
      _(janinis)
        .each(editor => {
          editor.refresh()
        })
    }
    window.addEventListener('resize', () => { refreshAll() })
    deck.on('overview-end', () => { refreshAll() })

    /*
     * Handle run events.
     */
    $(window).keypress(function (event) {
      if (!(event.which === 13 && event.ctrlKey) &&
          !(event.which === 10 && event.ctrlKey)) {
        return true
      }
      event.preventDefault()
      run()
    })

    let run = () => {
      if (!(janinis[active.index])) {
        return true
      }
      let source = janinis[active.index]

      let output = $(active.slide).find('.output').first()

      let toRun = source.getValue()
      if (toRun.trim() === "") {
        $(output).html($(output).data('blank'))
        return
      } else {
        $(output).html(`<span class="text-warning">Running...</span>`)
      }

      source = source.getValue() + "\n"
      const job = {
        label: `slider:${ deck.id }:${ active.slideID || "(?)" }`,
        tasks: [ "execute" ],
      }
      if ($(active.slide).hasClass('compiler')) {
        job.sources = { "Example.java": source }
      } else {
        job.snippet = source
      }
      console.debug(job)
      if (token) {
        job.authToken = token
      }

      $.ajax({
        url: "https://cs125-cloud.cs.illinois.edu/jeed/",
        type: "POST",
        data: JSON.stringify(job),
        contentType:"application/json; charset=utf-8",
        dataType: "json"
      }).done(result => {
        console.debug(result)
        let resultOutput = ""
        if (result.failed.snippet) {
          const { errors } = result.failed.snippet
          resultOutput += errors.map(error => {
            const { line, column, message } = error
            const originalLine = job.snippet.split("\n")[line - 1]
            return `Line ${ line }: error: ${ message }
${ originalLine }
${ new Array(column).join(" ") }^`
          }).join("\n")

          const errorCount = Object.keys(errors).length
          resultOutput += `
${ errorCount } error${ errorCount > 1 ? "s" : "" }`
        } else if (result.failed.compilation) {
          const { errors } = result.failed.compilation
          resultOutput += errors.map(error => {
            const { source, line, column } = error.location
            const originalLine = source === "" ?
              job.snippet.split("\n")[line - 1] :
              job.sources[source].split("\n")[line - 1]
            const firstErrorLine = error.message.split("\n").slice(0, 1).join("\n")
            const restError = error.message.split("\n").slice(1).filter(errorLine => {
              if (source === "" && errorLine.trim().startsWith("location: class")) {
                return false
              } else {
                return true
              }
            }).join("\n")
            return `${ source === "" ? "Line " : source }${ line }: error: ${ firstErrorLine }
${ originalLine }
${ new Array(column).join(" ") }^
${ restError }`
          }).join("\n")
          const errorCount = Object.keys(errors).length
          resultOutput += `
${ errorCount } error${ errorCount > 1 ? "s" : "" }`
        } else if (result.failed.execution) {
          resultOutput += result.failed.execution
        }

        if (Object.keys(result.failed).length === 0) {
          if (result.completed.execution) {
            const { execution } = result.completed
            resultOutput += execution.outputLines.map(outputLine => {
              return outputLine.line
            }).join("\n")
            if (execution.timeout) {
              resultOutput += "\n(Program Timed Out)"
            }
            if (execution.truncatedLines > 0) {
              resultOutput += `\n(${ execution.truncatedLines } lines were truncated)`
            }
          }
        }
        $(output).text(resultOutput)
      }).fail((xhr, status, error) => {
        console.error("Request failed")
        console.error(JSON.stringify(xhr, null, 2))
        console.error(JSON.stringify(status, null, 2))
        console.error(JSON.stringify(error, null, 2))
        $(output).html(`<span class="text-danger">An error occurred</span>`)
      })
    }

    /*
     * Set up Janini editor windows.
     */
    let janinis = {}
    _.each(deck.slides, (slide, i) => {
      $(slide).find("textarea.janini").each((unused, editor) => {
        janinis[i] = CodeMirror.fromTextArea($(editor).get(0), {
          mode: 'text/x-java',
          lineNumbers: true,
          matchBrackets: true,
          lineWrapping: true
        })
        $(slide).find("div.output").click((e) => {
          var sel = getSelection().toString();
          if (!(getSelection().toString().length > 0 &&
            e.target.contains(getSelection().anchorNode))) {
            run()
          }
        })
        $(slide).find("div.output").each((unused, output) => {
          $(output).attr('id', `janini-output-${ i }`)
        })
        $(slide).find(".CodeMirror").each((unused, input) => {
          $(input).attr('id', `janini-input-${ i }`)
        })
        Split([`#janini-input-${ i }`, `#janini-output-${ i }`], {
          sizes: [ 70, 30 ],
          direction: 'vertical',
          elementStyle: function (dimension, size, gutterSize) {
            return {
              'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
            }
          },
          gutterStyle: function (dimension, gutterSize) {
            return {
              'flex-basis':  gutterSize + 'px'
            }
          }
        })
      })
    })

  }
}
