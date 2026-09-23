// Small shared helper for reading/writing the logged-in visitor's session.
// Token + user are kept in localStorage so the session survives a page reload.

const Auth = {
  getToken() {
    return localStorage.getItem('mp_token');
  },
  getUser() {
    const raw = localStorage.getItem('mp_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem('mp_token', token);
    localStorage.setItem('mp_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_user');
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  isAdmin() {
    return this.getUser()?.role === 'admin';
  },
  // Wrapper around fetch that adds the auth header automatically when logged in
  async apiFetch(url, options = {}) {
    const token = this.getToken();
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  },
};

// Renders the nav's login/account area on every public page that includes this script.
function renderNavAuth(containerId = 'navAuthSlot') {
  const slot = document.getElementById(containerId);
  if (!slot) return;
  const user = Auth.getUser();

  if (!user) {
    slot.innerHTML = `
      <a href="/login.html" class="btn btn-ghost">Log in</a>
      <a href="/signup.html" class="btn btn-primary">Book with us</a>
    `;
    return;
  }

  const initial = user.name.trim().charAt(0).toUpperCase();
  slot.innerHTML = `
    <a href="/favorites.html" class="btn btn-ghost">My favorites</a>
    <div class="user-chip">
      <span class="avatar">${initial}</span>
      <span>${user.name.split(' ')[0]}</span>
    </div>
    <button class="btn btn-ghost" id="logoutBtn" type="button">Log out</button>
  `;
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    Auth.clearSession();
    window.location.href = '/';
  });
}
