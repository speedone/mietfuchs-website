// Hell/Dunkel: ohne Wahl gilt die Systemeinstellung. Die Wahl liegt nur im Browser (localStorage),
// sie wird nie übertragen. Absichtlich im <head> geladen, damit die Seite nicht erst hell aufblitzt.
;(function () {
  var KEY = 'mietfuchs-theme'
  var root = document.documentElement
  function read() { try { return localStorage.getItem(KEY) } catch (e) { return null } }
  function write(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY) } catch (e) { /* ohne Speicher gilt die Wahl nur bis zum Neuladen */ } }
  function apply(v) { if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v); else root.removeAttribute('data-theme') }
  apply(read())
  var LABELS = { '': 'Design: wie System', light: 'Design: hell', dark: 'Design: dunkel' }
  var NEXT = { '': 'light', light: 'dark', dark: '' }
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('[data-theme-toggle]')
    if (!btn) return
    btn.hidden = false
    function show() { var v = root.getAttribute('data-theme') || ''; btn.setAttribute('data-state', v || 'system'); btn.querySelector('[data-theme-label]').textContent = LABELS[v] }
    show()
    btn.addEventListener('click', function () { var v = NEXT[root.getAttribute('data-theme') || '']; apply(v); write(v); show() })
  })
})()
