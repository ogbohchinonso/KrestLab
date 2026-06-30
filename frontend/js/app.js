/**
 * app.js — Entry point. Boots all modules, sets up Split.js, wires all toolbar buttons.
 */

window.App = (() => {

  let _toastTimer;

  function toast(message, duration = 2400) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  function init() {
    // ── Split.js ──────────────────────────────────────────────────────────
    Split(['#editorPane', '#outputPane'], {
      sizes:     [50, 50],
      minSize:   200,
      gutterSize: 5,
      direction: 'horizontal',
      onDragEnd: () => Editor.refresh(),
    });

    Split(['#previewPane', '#consolePane'], {
      sizes:     [65, 35],
      minSize:   50,
      gutterSize: 5,
      direction: 'vertical',
      elementStyle: (dim, size, gutterSize) => ({ 'flex-basis': `calc(${size}% - ${gutterSize}px)` }),
      gutterStyle:  (dim, gutterSize)        => ({ 'flex-basis': `${gutterSize}px` }),
    });

    // ── Boot modules ──────────────────────────────────────────────────────
    Editor.init();
    Console.init();
    Tutor.init();
    Snippets.init();

    // ── Auth UI ───────────────────────────────────────────────────────────
    _updateAuthUI();

    // ── Toolbar buttons ───────────────────────────────────────────────────
    document.getElementById('btnRun').addEventListener('click', async () => {
      Console.clear();
      await Runner.run();
    });

    document.getElementById('btnClearEditor').addEventListener('click', () => {
      if (confirm('Clear the current editor?')) Editor.clearCurrent();
    });

    document.getElementById('btnCopy').addEventListener('click', async () => {
      const code = Editor.getValue(Editor.getActiveLang());
      try {
        await navigator.clipboard.writeText(code);
        toast('Copied ✓');
      } catch {
        toast('Press Ctrl+A then Ctrl+C to copy.');
      }
    });

    document.getElementById('btnRefresh').addEventListener('click', () => {
      Console.clear();
      Runner.run();
    });

    document.getElementById('btnClearConsole').addEventListener('click', () => Console.clear());

    // User menu
    const btnUserMenu = document.getElementById('btnUserMenu');
    if (btnUserMenu) {
      btnUserMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        document.getElementById('userDropdown')?.classList.add('hidden');
      });
    }

    // Logout (both in user menu and dashboard)
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      Auth.logout();
      window.location.href = 'login.html';
    });

    // ── Keyboard shortcuts ────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        Console.clear();
        Runner.run();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('btnSave').click();
      }
    });

    // ── Auto-run on load ──────────────────────────────────────────────────
    Runner.run();

    // ── Load shared snippet / saved snippet / curriculum from URL ──────────
    const params       = new URLSearchParams(window.location.search);
    const shareId       = params.get('share');
    const snippetId     = params.get('snippet');
    const curriculumId  = params.get('curriculum');

    if (shareId)      _loadSharedSnippet(shareId);
    if (snippetId)    _loadOwnSnippet(snippetId);
    if (curriculumId) _loadOwnCurriculum(curriculumId);
  }

  function _updateAuthUI() {
    const user      = Auth.getUser();
    const authBtns  = document.getElementById('authBtns');
    const userMenu  = document.getElementById('userMenu');
    const userInit  = document.getElementById('userInitials');

    if (user) {
      authBtns?.classList.add('hidden');
      userMenu?.classList.remove('hidden');
      if (userInit) userInit.textContent = user.name?.charAt(0).toUpperCase() || '?';
    } else {
      authBtns?.classList.remove('hidden');
      userMenu?.classList.add('hidden');
    }
  }

  async function _loadSharedSnippet(shareId) {
    try {
      const res  = await fetch(`${KrestConfig.API_BASE}/snippets/share/${shareId}`);
      const data = await res.json();
      if (data.snippet) Snippets.loadSnippet(data.snippet);
    } catch (err) {
      toast('Could not load shared snippet.');
    }
  }

  async function _loadOwnSnippet(id) {
    try {
      const { snippet } = await API.getSnippet(id);
      Snippets.loadSnippet(snippet);
      toast(`Loaded "${snippet.title}"`);
    } catch (err) {
      toast(err.message || 'Could not load snippet.');
    }
  }

  async function _loadOwnCurriculum(id) {
    try {
      const { curriculum } = await API.getCurriculum(id);
      Tutor.loadCurriculum(curriculum);
    } catch (err) {
      toast(err.message || 'Could not load learning path.');
    }
  }

  return { init, toast };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
