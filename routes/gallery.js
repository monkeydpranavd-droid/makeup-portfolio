const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed.'));
    }
    cb(null, true);
  },
});

// Public: list every gallery image, newest first. Anyone can view the portfolio.
router.get('/', (req, res) => {
  const images = db.prepare('SELECT * FROM gallery_images ORDER BY uploaded_at DESC').all();
  res.json({ images });
});

// Admin: upload a new look to the gallery
router.post('/', requireAuth, requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Please choose an image to upload.' });

    const { title, category, description } = req.body;
    if (!title || !title.trim()) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Please give this look a title.' });
    }

    const info = db
      .prepare(
        'INSERT INTO gallery_images (filename, title, category, description) VALUES (?, ?, ?, ?)'
      )
      .run(req.file.filename, title.trim(), (category || 'editorial').trim(), (description || '').trim());

    const image = db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ image });
  });
});

// Admin: remove a look from the gallery (also deletes the file and any favorites of it)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const image = db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });

  db.prepare('DELETE FROM gallery_images WHERE id = ?').run(req.params.id);

  const filePath = path.join(UPLOAD_DIR, image.filename);
  fs.existsSync(filePath) && fs.unlinkSync(filePath);

  res.json({ success: true });
});

module.exports = router;
