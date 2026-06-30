/**
 * auth.js
 * Manages JWT token in localStorage and exposes Auth helpers.
 */
window.Auth = (() => {
  const TOKEN_KEY = 'krestlab_token';
  const USER_KEY  = 'krestlab_user';
  const BASE      = () => window.KrestConfig.API_BASE;

  function getToken()  { return localStorage.getItem(TOKEN_KEY); }
  function getUser()   {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  }
  function isLoggedIn() { return !!getToken(); }

  function _store(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function register(name, email, password) {
    const res = await fetch(`${BASE()}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    _store(data.token, data.user);
    return data;
  }

  async function login(email, password) {
    const res = await fetch(`${BASE()}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    _store(data.token, data.user);
    return data;
  }

  // Attach auth header to any fetch call
  function authHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  return { getToken, getUser, isLoggedIn, logout, register, login, authHeaders };
})();
