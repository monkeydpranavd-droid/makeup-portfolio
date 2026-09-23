// Run once with `npm run seed` to create the single admin account from your .env file.
// Safe to run again later — it will just update the admin's password if the account already exists.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first (see .env.example).');
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE email = ?')
    .run(passwordHash, 'admin', email);
  console.log(`Admin account updated: ${email}`);
} else {
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run('Studio Admin', email, passwordHash, 'admin');
  console.log(`Admin account created: ${email}`);
}
