const wc = window.console
module.exports = {
  l: () => {}, // no-op
  // l: console.log.bind(window.console),
  cl: console.clear.bind(window.console),
}