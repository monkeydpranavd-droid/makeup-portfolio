const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Every route here requires a logged-in visitor (or admin, but this is built for visitors)
router.use(requireAuth);

// List the current user's favorited looks, with the image details joined in
router.get('/', (req, res) => {
  const favorites = db
    .prepare(
      `SELECT gallery_images.* FROM favorites
       JOIN gallery_images ON gallery_images.id = favorites.image_id
       WHERE favorites.user_id = ?
       ORDER BY favorites.created_at DESC`
    )
    .all(req.user.id);
  res.json({ favorites });
});

// Favorite a look
router.post('/:imageId', (req, res) => {
  const image = db.prepare('SELECT id FROM gallery_images WHERE id = ?').get(req.params.imageId);
  if (!image) return res.status(404).json({ error: 'Image not found.' });

  try {
    db.prepare('INSERT INTO favorites (user_id, image_id) VALUES (?, ?)').run(
      req.user.id,
      req.params.imageId
    );
  } catch (err) {
    // Already favorited — treat as success so the UI can stay simple
  }
  res.json({ success: true });
});

// Un-favorite a look
router.delete('/:imageId', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND image_id = ?').run(
    req.user.id,
    req.params.imageId
  );
  res.json({ success: true });
});

module.exports = router;
