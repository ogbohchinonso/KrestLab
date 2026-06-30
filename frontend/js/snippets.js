/**
 * snippets.js — Save and Share modals
 */
window.Snippets = (() => {

  let currentSnippetId = null;

  function init() {
    // Save
    document.getElementById('btnSave').addEventListener('click', _openSaveModal);
    document.getElementById('btnConfirmSave').addEventListener('click', _saveSnippet);
    document.getElementById('btnCancelSave').addEventListener('click', _closeSaveModal);
    document.getElementById('btnCloseSaveModal').addEventListener('click', _closeSaveModal);

    // Share
    document.getElementById('btnShare').addEventListener('click', _shareSnippet);
    document.getElementById('btnCloseShareModal').addEventListener('click', _closeShareModal);
    document.getElementById('btnCopyLink').addEventListener('click', _copyShareLink);

    // Close modals on overlay click
    document.getElementById('saveModal').addEventListener('click',  (e) => { if (e.target.id === 'saveModal')  _closeSaveModal(); });
    document.getElementById('shareModal').addEventListener('click', (e) => { if (e.target.id === 'shareModal') _closeShareModal(); });
  }

  function _openSaveModal() {
    if (!Auth.isLoggedIn()) {
      window.App.toast('Please log in to save snippets.');
      return;
    }
    document.getElementById('saveModal').classList.remove('hidden');
    document.getElementById('snippetTitle').focus();
  }

  function _closeSaveModal() {
    document.getElementById('saveModal').classList.add('hidden');
  }

  async function _saveSnippet() {
    const title    = document.getElementById('snippetTitle').value.trim();
    const tagsRaw  = document.getElementById('snippetTags').value;
    const isPublic = document.getElementById('snippetPublic').checked;
    const lang     = Editor.getActiveLang();

    if (!title) { window.App.toast('Please enter a title.'); return; }

    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

    const payload = {
      title,
      language: lang,
      code:     Editor.getValue(lang),
      htmlCode: Editor.getValue('html'),
      cssCode:  Editor.getValue('css'),
      jsCode:   Editor.getValue('js'),
      isPublic,
      tags,
    };

    const btn = document.getElementById('btnConfirmSave');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    try {
      const { snippet } = currentSnippetId
        ? await API.updateSnippet(currentSnippetId, payload)
        : await API.createSnippet(payload);

      currentSnippetId = snippet._id;
      _closeSaveModal();
      window.App.toast('Snippet saved ✓');
    } catch (err) {
      window.App.toast(err.message || 'Failed to save snippet.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Save';
    }
  }

  async function _shareSnippet() {
    if (!Auth.isLoggedIn()) { window.App.toast('Please log in to share snippets.'); return; }
    if (!currentSnippetId)  { window.App.toast('Save your snippet first.'); _openSaveModal(); return; }

    try {
      const { shareId } = await API.shareSnippet(currentSnippetId);
      const url = `${window.location.origin}/index.html?share=${shareId}`;
      document.getElementById('shareLinkInput').value = url;
      document.getElementById('shareModal').classList.remove('hidden');
    } catch (err) {
      window.App.toast(err.message || 'Failed to generate share link.');
    }
  }

  async function _copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    try {
      await navigator.clipboard.writeText(input.value);
      window.App.toast('Link copied ✓');
    } catch {
      input.select();
      window.App.toast('Copy the link manually.');
    }
  }

  function _closeShareModal() {
    document.getElementById('shareModal').classList.add('hidden');
  }

  // Load a snippet into the editor (called from dashboard)
  function loadSnippet(snippet) {
    currentSnippetId = snippet._id;
    Editor.switchTo(snippet.language, snippet.code);
    if (snippet.htmlCode) Editor.setValue('html', snippet.htmlCode);
    if (snippet.cssCode)  Editor.setValue('css',  snippet.cssCode);
    if (snippet.jsCode)   Editor.setValue('js',   snippet.jsCode);
  }

  return { init, loadSnippet };
})();
