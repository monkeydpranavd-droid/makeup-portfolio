require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const favoritesRoutes = require('./routes/favorites');
const bookingsRoutes = require('./routes/bookings');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and fill it in before starting.');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/bookings', bookingsRoutes);

// Fallback error handler (e.g. multer file-size errors bubble up here too)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Studio site running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at   http://localhost:${PORT}/admin/login.html`);
});
