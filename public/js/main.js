document.addEventListener('DOMContentLoaded', () => {
  renderNavAuth();
  initMobileNav();
  initGallery();
  initBookingForm();
});

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  if (!toggle || !drawer) return;
  toggle.addEventListener('click', () => {
    drawer.classList.toggle('open');
  });
  drawer.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => drawer.classList.remove('open'))
  );
}

let allImages = [];
let activeCategory = 'all';
let myFavoriteIds = new Set();

async function initGallery() {
  const grid = document.getElementById('galleryGrid');
  const filters = document.getElementById('galleryFilters');
  if (!grid) return;

  try {
    const { images } = await Auth.apiFetch('/api/gallery');
    allImages = images;
  } catch (err) {
    grid.innerHTML = `<p class="gallery-empty">Could not load the gallery right now.</p>`;
    return;
  }

  if (Auth.isLoggedIn() && !Auth.isAdmin()) {
    try {
      const { favorites } = await Auth.apiFetch('/api/favorites');
      myFavoriteIds = new Set(favorites.map((f) => f.id));
    } catch (err) {
      // not fatal — favorites just won't be pre-marked
    }
  }

  const categories = ['all', ...new Set(allImages.map((i) => i.category))];
  if (filters) {
    filters.innerHTML = categories
      .map(
        (c) =>
          `<button class="filter-chip${c === 'all' ? ' active' : ''}" data-cat="${c}">${
            c === 'all' ? 'All looks' : capitalize(c)
          }</button>`
      )
      .join('');
    filters.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        filters.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.cat;
        renderGallery();
      });
    });
  }

  renderGallery();
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const items = allImages.filter((i) => activeCategory === 'all' || i.category === activeCategory);

  if (items.length === 0) {
    grid.innerHTML = `<p class="gallery-empty">No looks uploaded yet — check back soon.</p>`;
    return;
  }

  grid.innerHTML = items
    .map(
      (img) => `
    <div class="gallery-item" data-id="${img.id}">
      <img src="/uploads/${img.filename}" alt="${escapeHtml(img.title)}" loading="lazy" />
      <div class="shine"></div>
      ${
        !Auth.isAdmin()
          ? `<button class="fav-btn${myFavoriteIds.has(img.id) ? ' active' : ''}" data-id="${img.id}" title="Save to favorites">
              <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.4 5 6 5c2 0 3.4 1.1 4 2.3C10.6 6.1 12 5 14 5c3.6 0 5.5 3.4 4 6.9C19.5 16.4 12 21 12 21z"/>
              </svg>
            </button>`
          : ''
      }
      <div class="gallery-caption">
        <b>${escapeHtml(img.title)}</b>
        <span>${capitalize(img.category)}</span>
      </div>
    </div>
  `
    )
    .join('');

  grid.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFavorite(btn);
    });
  });

  observeGalleryItems();
}

async function toggleFavorite(btn) {
  const id = btn.dataset.id;
  if (!Auth.isLoggedIn()) {
    window.location.href = `/login.html?next=/`;
    return;
  }
  const isActive = btn.classList.contains('active');
  try {
    if (isActive) {
      await Auth.apiFetch(`/api/favorites/${id}`, { method: 'DELETE' });
      myFavoriteIds.delete(Number(id));
    } else {
      await Auth.apiFetch(`/api/favorites/${id}`, { method: 'POST' });
      myFavoriteIds.add(Number(id));
    }
    btn.classList.toggle('active');
  } catch (err) {
    alert(err.message);
  }
}

function observeGalleryItems() {
  const items = document.querySelectorAll('.gallery-item:not(.in-view)');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((item) => observer.observe(item));
}

async function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;
  const note = document.getElementById('bookingNote');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    note.textContent = '';
    note.className = 'form-note';

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await Auth.apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
      note.textContent = "Thank you! We'll be in touch within 24 hours to confirm your look.";
      note.classList.add('success');
      form.reset();
    } catch (err) {
      note.textContent = err.message;
      note.classList.add('error');
    }
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
