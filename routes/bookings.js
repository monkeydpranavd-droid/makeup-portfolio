const express = require('express');
const db = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public: anyone (logged in or not) can request a booking from the site
router.post('/', (req, res) => {
  const { name, email, phone, service, event_date, message } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email.' });
  }
  if (!service || !service.trim()) return res.status(400).json({ error: 'Please select a service.' });

  const info = db
    .prepare(
      `INSERT INTO bookings (name, email, phone, service, event_date, message)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name.trim(), email.trim(), (phone || '').trim(), service.trim(), (event_date || '').trim(), (message || '').trim());

  res.status(201).json({ id: info.lastInsertRowid });
});

// Admin: view every booking request, newest first
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
  res.json({ bookings });
});

// Admin: update a booking's status (new -> contacted -> booked -> archived)
router.patch('/:id', requireAuth, requireAdmin, (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'contacted', 'booked', 'archived'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
