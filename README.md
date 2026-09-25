# Rajashree Makeup — Portfolio Site

A glossy, scroll-animated makeup artist portfolio with:
- A public site (portfolio gallery, services, testimonials, booking form)
- Visitor accounts (sign up / log in, favorite looks, view saved favorites)
- A single admin dashboard to upload/remove portfolio images and manage booking requests

Built with plain HTML/CSS/JS on the front end and Node.js + Express + SQLite on the back end — no build step, and no native compilation (it uses Node's built-in `node:sqlite`, not a compiled module), so `npm install` works the same on Windows, Mac, and Linux without Visual Studio Build Tools or Xcode.

**Requires Node.js 22.5 or newer** (run `node --version` to check — if you're below that, install the latest LTS from [nodejs.org](https://nodejs.org)). You'll see a one-line `ExperimentalWarning: SQLite is an experimental feature` in the terminal when the server starts — that's expected and harmless, not an error.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure your environment

```bash
cp .env.example .env
```

Open `.env` and set:
- `JWT_SECRET` — any long random string (used to sign login sessions)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your studio login credentials

## 3. Create the admin account

```bash
npm run seed
```

Run this again any time you want to change the admin password — it updates the existing account instead of creating a duplicate.

## 4. Start the server

```bash
npm start
```

- Public site: http://localhost:3000
- Studio (admin) login: http://localhost:3000/admin/login.html

## Replacing the placeholder content

- **Hero and about photos**: swap the Unsplash URLs in `public/index.html` (search for `hero-visual` and `about-portrait`) for your own images, or just leave them — real portfolio images uploaded through the admin dashboard populate the gallery section automatically.
- **Brand name, copy, services, pricing**: edit directly in `public/index.html`.
- **Colors**: all defined as CSS variables at the top of `public/css/style.css` (`--porcelain`, `--blush`, `--rose`, etc.) — change them once and the whole site updates.

## How image uploads work

Uploaded images are saved to `public/uploads/` on the server and referenced from a SQLite database (`data.db`, created automatically on first run). There's no external storage service required — this is enough for a single-studio portfolio. If you outgrow local disk storage later (e.g. deploying to a host with an ephemeral filesystem, like Render's free tier or Heroku), swap the `multer.diskStorage` in `routes/gallery.js` for a cloud storage SDK (S3, Cloudinary, etc.).

## Deploying

Any Node.js host works (Render, Railway, a VPS, etc.). Make sure to:
1. Set the same environment variables from `.env` in your host's dashboard.
2. Run `npm run seed` once after deploying to create the admin account.
3. Use a host with persistent disk storage (or switch to cloud image storage as noted above) so uploaded images and `data.db` survive restarts.

## Project structure

```
server.js              Express app entry point
db/database.js         SQLite connection + table setup
db/seed.js              Creates/updates the admin account
middleware/auth.js      JWT auth + admin-only guard
routes/auth.js          Signup, login, session check
routes/gallery.js       Public gallery listing + admin upload/delete
routes/favorites.js     Visitor favorites
routes/bookings.js      Public booking form + admin booking management
public/                 Front end (plain HTML/CSS/JS)
  index.html             Portfolio homepage
  login.html / signup.html / favorites.html   Visitor account pages
  admin/                 Admin login + dashboard
  css/style.css           Public site styles (design tokens at the top)
  css/admin.css           Admin dashboard styles
  js/auth.js              Shared session + fetch helper
  js/main.js               Public site behavior (gallery, favorites, scroll reveal, booking form)
  js/admin.js               Admin dashboard behavior (upload, gallery management, bookings)
```
