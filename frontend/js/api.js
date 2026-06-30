/**
 * api.js
 * Thin wrapper around fetch for all KrestLab API calls.
 */
window.API = (() => {
  const base = () => window.KrestConfig.API_BASE;

  async function _request(method, path, body) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...Auth.authHeaders(),
      },
    };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(`${base()}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  const get    = (path)        => _request('GET',    path);
  const post   = (path, body)  => _request('POST',   path, body);
  const put    = (path, body)  => _request('PUT',    path, body);
  const del    = (path)        => _request('DELETE', path);

  // ── Execute ──────────────────────────────────────────────────────────────
  const execute = (language, code, stdin = '') =>
    post('/execute', { language, code, stdin });

  // ── Snippets ─────────────────────────────────────────────────────────────
  const getSnippets   = ()           => get('/snippets');
  const getSnippet    = (id)         => get(`/snippets/${id}`);
  const createSnippet = (data)       => post('/snippets', data);
  const updateSnippet = (id, data)   => put(`/snippets/${id}`, data);
  const deleteSnippet = (id)         => del(`/snippets/${id}`);
  const shareSnippet  = (id)         => post(`/snippets/${id}/share`);
  const forkSnippet   = (id)         => post(`/snippets/${id}/fork`);
  const getPublic     = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/snippets/public${qs ? '?' + qs : ''}`);
  };

  // ── Tutor ────────────────────────────────────────────────────────────────
  const tutorAction     = (payload)  => post('/tutor', payload);
  const getCurricula    = ()         => get('/tutor/curricula');
  const getCurriculum   = (id)       => get(`/tutor/curricula/${id}`);

  // ── Users ────────────────────────────────────────────────────────────────
  const getProfile      = ()         => get('/users/profile');
  const updateProfile   = (data)     => put('/users/profile', data);
  const changePassword  = (data)     => put('/users/password', data);

  return {
    execute,
    getSnippets, getSnippet, createSnippet, updateSnippet, deleteSnippet,
    shareSnippet, forkSnippet, getPublic,
    tutorAction, getCurricula, getCurriculum,
    getProfile, updateProfile, changePassword,
  };
})();
