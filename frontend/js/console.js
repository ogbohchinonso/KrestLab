/**
 * console.js — captures postMessage from iframe + renders exec output
 */
window.Console = (() => {
  const el = () => document.getElementById('consoleOutput');

  function init() {
    window.addEventListener('message', (e) => {
      if (!e.data || e.data.__source !== 'krestlab-iframe') return;
      _append(e.data.level, e.data.args);
    });
  }

  function _append(level, args) {
    const out = el();
    out.querySelector('.console-hint')?.remove();

    const entry = document.createElement('div');
    entry.className = `log-entry log-${level}`;
    entry.textContent = args.map(_str).join(' ');
    out.appendChild(entry);
    out.scrollTop = out.scrollHeight;
  }

  function _str(v) {
    if (v === null)      return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'object') { try { return JSON.stringify(v, null, 2); } catch { return String(v); } }
    return String(v);
  }

  function clear() {
    el().innerHTML = '<p class="console-hint">Console cleared.</p>';
  }

  function writeError(msg) { _append('error', [msg]); }
  function writeInfo(msg)  { _append('info',  [msg]); }
  function writeLog(msg)   { _append('log',   [msg]); }

  // Show server execution result in console
  function showExecResult(result) {
    const out = el();
    out.querySelector('.console-hint')?.remove();

    const meta = document.getElementById('execMeta');
    if (meta) {
      meta.textContent = result.time ? `${result.time}s · ${result.memory}KB` : '';
      meta.classList.toggle('hidden', !result.time);
    }

    const lines = (result.output || '').split('\n');
    const level = result.success ? 'log' : 'error';
    lines.forEach((line) => {
      if (!line && lines.length === 1) return;
      const entry = document.createElement('div');
      entry.className = `log-entry log-${level}`;
      entry.textContent = line;
      out.appendChild(entry);
    });
    out.scrollTop = out.scrollHeight;
  }

  return { init, clear, writeError, writeInfo, writeLog, showExecResult };
})();
