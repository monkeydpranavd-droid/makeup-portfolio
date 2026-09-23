document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    window.location.href = '/admin/login.html';
    return;
  }

  initSidebar();
  initLogout();
  initUploadForm();
  loadGallery();
  loadBookings();
});

function initSidebar() {
  const buttons = document.querySelectorAll('.admin-nav button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
      document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
    });
  });
}

function initLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.clearSession();
    window.location.href = '/admin/login.html';
  });
}

function initUploadForm() {
  const dropzone = document.getElementById('dropzone');
  const input = document.getElementById('imageInput');
  const preview = document.getElementById('preview');
  const dropzoneText = document.getElementById('dropzoneText');
  const form = document.getElementById('uploadForm');
  const uploadBtn = document.getElementById('uploadBtn');

  ['dragenter', 'dragover'].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag');
    })
  );
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      showPreview();
    }
  });
  input.addEventListener('change', showPreview);

  function showPreview() {
    const file = input.files[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    dropzoneText.textContent = file.name;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.files[0]) return showToast('Please choose an image first.', true);

    const formData = new FormData();
    formData.append('image', input.files[0]);
    formData.append('title', document.getElementById('title').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading…';

    try {
      await Auth.apiFetch('/api/gallery', { method: 'POST', body: formData });
      showToast('Look uploaded to the portfolio.');
      form.reset();
      preview.style.display = 'none';
      dropzoneText.textContent = 'Drag an image here, or click to choose a file (JPG, PNG, WEBP — up to 8MB)';
      loadGallery();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload look';
    }
  });
}

async function loadGallery() {
  const grid = document.getElementById('adminGallery');
  const stats = document.getElementById('galleryStats');
  try {
    const { images } = await Auth.apiFetch('/api/gallery');

    const byCategory = images.reduce((acc, img) => {
      acc[img.category] = (acc[img.category] || 0) + 1;
      return acc;
    }, {});

    stats.innerHTML = `
      <div class="stat-card"><b>${images.length}</b><span>Total looks live</span></div>
      ${Object.entries(byCategory)
        .map(([cat, count]) => `<div class="stat-card"><b>${count}</b><span>${capitalize(cat)}</span></div>`)
        .join('')}
    `;

    if (images.length === 0) {
      grid.innerHTML = `<p class="gallery-empty">No looks uploaded yet. Add your first one above.</p>`;
      return;
    }

    grid.innerHTML = images
      .map(
        (img) => `
      <div class="admin-tile">
        <img src="/uploads/${img.filename}" alt="${img.title}" />
        <div class="info">
          <b>${img.title}</b>
          <span>${capitalize(img.category)}</span>
        </div>
        <div class="tile-actions">
          <button class="tile-delete" data-id="${img.id}">Remove</button>
        </div>
      </div>
    `
      )
      .join('');

    grid.querySelectorAll('.tile-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this look from the portfolio?')) return;
        try {
          await Auth.apiFetch(`/api/gallery/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Look removed.');
          loadGallery();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  } catch (err) {
    grid.innerHTML = `<p class="gallery-empty">Could not load the gallery.</p>`;
  }
}

async function loadBookings() {
  const body = document.getElementById('bookingsBody');
  try {
    const { bookings } = await Auth.apiFetch('/api/bookings');
    if (bookings.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="6">No booking requests yet.</td></tr>`;
      return;
    }

    body.innerHTML = bookings
      .map(
        (b) => `
      <tr>
        <td>${b.name}</td>
        <td>${b.service}</td>
        <td>${b.event_date || '—'}</td>
        <td>${b.email}${b.phone ? `<br><span style="color:var(--ink-soft)">${b.phone}</span>` : ''}</td>
        <td style="max-width:220px;">${b.message || '—'}</td>
        <td>
          <select class="status-select" data-id="${b.id}">
            ${['new', 'contacted', 'booked', 'archived']
              .map((s) => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${capitalize(s)}</option>`)
              .join('')}
          </select>
        </td>
      </tr>
    `
      )
      .join('');

    body.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await Auth.apiFetch(`/api/bookings/${sel.dataset.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: sel.value }),
          });
          showToast('Booking updated.');
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="6">Could not load bookings.</td></tr>`;
  }
}

let toastTimer;
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
