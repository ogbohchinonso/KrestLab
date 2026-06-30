/**
 * runner.js
 * Routes execution: HTML/CSS/JS → iframe, everything else → backend /execute
 */
window.Runner = (() => {

  const CONSOLE_BRIDGE = `
(function(){
  var lvls=['log','warn','error','info'];
  lvls.forEach(function(l){
    var orig=console[l].bind(console);
    console[l]=function(){
      var args=Array.prototype.slice.call(arguments);
      window.parent.postMessage({
        __source:'krestlab-iframe',level:l,
        args:args.map(function(a){
          if(a===null||a===undefined)return a;
          if(typeof a==='object'){try{return JSON.parse(JSON.stringify(a));}catch(e){return String(a);}}
          return a;
        })
      },'*');
      orig.apply(console,arguments);
    };
  });
  window.onerror=function(msg,s,line){
    window.parent.postMessage({__source:'krestlab-iframe',level:'error',args:[msg+(line?' (line '+line+')':'')]}, '*');
  };
})();`;

  function _buildDoc(html, css, js) {
    const isFullDoc = /<!doctype|<html/i.test(html.trim());
    if (isFullDoc) {
      return html
        .replace('</head>', `<style>${css}</style>\n</head>`)
        .replace('</body>', `<script>${CONSOLE_BRIDGE}<\/script>\n<script>${js}<\/script>\n</body>`);
    }
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;padding:20px}${css}</style></head><body>${html}<script>${CONSOLE_BRIDGE}<\/script><script>${js}<\/script></body></html>`;
  }

  async function run() {
    const lang = Editor.getActiveLang();

    if (Editor.isBrowserLang()) {
      _runBrowser();
    } else {
      await _runServer(lang);
    }
  }

  function _runBrowser() {
    const frame = document.getElementById('previewFrame');
    const execOut = document.getElementById('execOutput');

    frame.classList.remove('hidden');
    if (execOut) execOut.classList.add('hidden');

    const html = Editor.getValue('html');
    const css  = Editor.getValue('css');
    const js   = Editor.getValue('js');
    frame.srcdoc = _buildDoc(html, css, js);
  }

  async function _runServer(lang) {
    const frame    = document.getElementById('previewFrame');
    const execOut  = document.getElementById('execOutput');
    const execPre  = document.getElementById('execOutputPre');
    const btnRun   = document.getElementById('btnRun');

    // Switch panels
    frame.classList.add('hidden');
    if (execOut) {
      execOut.classList.remove('hidden');
      if (execPre) execPre.textContent = 'Running…';
    }

    btnRun.disabled    = true;
    btnRun.textContent = '⏳ Running…';

    try {
      const code   = Editor.getValue(lang);
      const result = await API.execute(lang, code);

      if (execPre) execPre.textContent = result.output || '(no output)';
      Console.showExecResult(result);
    } catch (err) {
      const msg = err.message || 'Execution failed.';
      if (execPre) execPre.textContent = `Error: ${msg}`;
      Console.writeError(msg);
    } finally {
      btnRun.disabled    = false;
      btnRun.textContent = '▶ Run';
    }
  }

  return { run };
})();
