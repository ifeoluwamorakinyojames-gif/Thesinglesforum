# The Singles Forum

Responsive Christian organisation website following the approved navy, orange and gold TSF mockup, with the supplied TSF logo. Public content is server-rendered; the browser admin manages homepage text, photographs, programmes, activities, venue and contact information.

## Run

Requires Node.js 22.13 or newer. No third-party runtime dependencies.

```sh
npm install
npm test
npm run build
npm start
```

Open http://localhost:3000. The build validates content and images and generates a homepage snapshot in `dist/`. `npm start` runs the complete application. The snapshot alone does not support admin editing.

## Admin setup

Copy `.env.example` to `.env`. Run `npm run password` in an interactive terminal to generate a salted scrypt hash, and set `ADMIN_PASSWORD_HASH` to the output. Generate a random `SESSION_SECRET` of at least 32 characters. Never commit credentials. Sign in at `/admin`.

Edit the labelled sections, upload a photo and paste its path into the relevant image field, save a draft, preview, then publish. Published changes appear immediately. Stale saves return a conflict rather than overwriting another session.

## Hosting

Use a Node.js host with HTTPS, a persistent writable disk and one server process. Set `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT`, HTTPS `SITE_URL`, credentials and an absolute `DATA_DIR` on the persistent disk. GitHub Pages and static hosts cannot run this backend. A final hosting provider has not been configured or tested.

Back up the entire `DATA_DIR`, including uploaded media. Atomic content saves retain old revisions under `history/`. To restore: stop the server, back up `content.json`, replace it with a selected history file, then restart. Multiple replicas require a shared database and distributed locking before use.

Authentication uses scrypt, HMAC-signed eight-hour sessions, HttpOnly/SameSite cookies (Secure in production), origin checks and login throttling. Rotate `SESSION_SECRET` to revoke all sessions. Add hosting edge rate limiting: the built-in counter is process-local and uses socket addresses. No default password is included.

## Scope and assets

The layout follows the mockup's header, hero, welcome steps, about collage, mission and vision, programme cards, gathering invitation and closing banner. Programme details and community contact information appear on demand. The nine requested activities are editable in admin.

Photographs are generated illustrations, not actual TSF members. The exact logo is user supplied. Confirm the brochure-derived phone number and venue before launch. No event dates, donation details, testimonials or social accounts are invented.

This is the homepage and a single-administrator CMS. Full event calendars, multi-user roles, multipage publishing and donations from the longer-term PRD remain future scope.

## Verification

Six automated tests cover validation, escaping, authentication, sessions, draft isolation, publishing, persistence, conflicts, HTTP origin checks, media validation and production configuration. Build passes. Desktop appearance and programme expansion were checked in a browser. Layouts at 390px and 768px were visually inspected. Mobile menu interaction verification remains incomplete. Production hosting, performance field metrics and a full accessibility audit remain unverified.
