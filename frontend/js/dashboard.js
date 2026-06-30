/**
 * dashboard.js — Dashboard page logic (snippets, curricula, profile)
 */
(function () {

  // ── Auth guard ───────────────────────────────────────────────────────────
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
  }

  let _toastTimer;
  function toast(message, duration = 2400) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ── Tab switching ────────────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.dash-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dash-nav-item').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.dash-tab').forEach((t) => t.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
      });
    });
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  document.getElementById('btnLogout').addEventListener('click', () => {
    Auth.logout();
    window.location.href = 'login.html';
  });

  // ── Load profile + XP ────────────────────────────────────────────────────
  async function loadProfile() {
    try {
      const { user } = await API.getProfile();

      document.getElementById('xpValue').textContent = user.tutor?.xp ?? 0;
      document.getElementById('xpLevel').textContent  = user.tutor?.level ?? 1;

      document.getElementById('profileName').value  = user.name;
      document.getElementById('profileEmail').value = user.email;
    } catch (err) {
      toast(err.message || 'Failed to load profile.');
    }
  }

  // ── Snippets tab ─────────────────────────────────────────────────────────
  async function loadSnippets() {
    const grid = document.getElementById('snippetGrid');
    try {
      const { snippets } = await API.getSnippets();

      if (!snippets.length) {
        grid.innerHTML = `<p class="loading-text">No snippets yet. Create one in the IDE and hit Save.</p>`;
        return;
      }

      grid.innerHTML = snippets.map((s) => `
        <div class="snippet-card" data-id="${s._id}">
          <span class="snippet-card__lang">${s.language}</span>
          <span class="snippet-card__title">${_esc(s.title)}</span>
          <div class="snippet-card__tags">
            ${(s.tags || []).map((t) => `<span class="tag-chip">${_esc(t)}</span>`).join('')}
          </div>
          <span class="snippet-card__meta">${new Date(s.createdAt).toLocaleDateString()} ${s.isPublic ? '· Public' : ''}</span>
        </div>
      `).join('');

      grid.querySelectorAll('.snippet-card').forEach((card) => {
        card.addEventListener('click', () => {
          window.location.href = `index.html?snippet=${card.dataset.id}`;
        });
      });
    } catch (err) {
      grid.innerHTML = `<p class="loading-text">Failed to load snippets.</p>`;
    }
  }

  // ── Curricula tab ────────────────────────────────────────────────────────
  async function loadCurricula() {
    const list = document.getElementById('curriculumList');
    try {
      const { curricula } = await API.getCurricula();

      if (!curricula.length) {
        list.innerHTML = `<p class="loading-text">No learning paths yet. Open the AI Tutor in the IDE to start one.</p>`;
        return;
      }

      list.innerHTML = curricula.map((c) => {
        const pct = c.totalSteps ? Math.round((c.completedSteps / c.totalSteps) * 100) : 0;
        return `
          <div class="curriculum-card" data-id="${c._id}">
            <div class="curriculum-card__info">
              <div class="curriculum-card__topic">${_esc(c.topic)}</div>
              <div class="curriculum-card__lang">${c.language} · ${c.level}</div>
              <div class="curriculum-card__bar"><div class="curriculum-card__fill" style="width:${pct}%"></div></div>
            </div>
            <span class="curriculum-card__status status--${c.status}">${c.status}</span>
          </div>
        `;
      }).join('');

      list.querySelectorAll('.curriculum-card').forEach((card) => {
        card.addEventListener('click', () => {
          window.location.href = `index.html?curriculum=${card.dataset.id}`;
        });
      });
    } catch (err) {
      list.innerHTML = `<p class="loading-text">Failed to load learning paths.</p>`;
    }
  }

  // ── Profile tab ──────────────────────────────────────────────────────────
  document.getElementById('btnSaveProfile').addEventListener('click', async () => {
    const name = document.getElementById('profileName').value.trim();
    if (!name) return toast('Name cannot be empty.');
    try {
      await API.updateProfile({ name });
      toast('Profile updated ✓');
    } catch (err) {
      toast(err.message || 'Failed to update profile.');
    }
  });

  document.getElementById('btnChangePw').addEventListener('click', async () => {
    const currentPassword = document.getElementById('currentPw').value;
    const newPassword     = document.getElementById('newPw').value;
    if (!currentPassword || !newPassword) return toast('Fill in both password fields.');
    if (newPassword.length < 8) return toast('New password must be at least 8 characters.');

    try {
      await API.changePassword({ currentPassword, newPassword });
      toast('Password updated ✓');
      document.getElementById('currentPw').value = '';
      document.getElementById('newPw').value      = '';
    } catch (err) {
      toast(err.message || 'Failed to update password.');
    }
  });

  function _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  initTabs();
  loadProfile();
  loadSnippets();
  loadCurricula();

})();
