# Free deployment: D1 replaces R2

Use Workers Free and a D1 database named `tsf-content`. **Do not activate R2 or use the R2 instructions below for this deployment.** D1 Free currently allows 500 MB per database. Photos remain limited to 3 MB each and are split into smaller database rows. This is suitable for a modest photo collection, not unlimited photo hosting. Daily Worker and database limits still apply; reaching free limits can interrupt service. Stay on Workers Free to avoid paid-plan overages.

1. In Cloudflare, Storage & databases → D1 SQL Database → Create database. Name it `tsf-content`. Copy the database UUID (not a password) and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.jsonc`. Never deploy with that placeholder.
2. Run `migrations/0001_storage.sql` in the database Console, or `npx wrangler d1 migrations apply tsf-content --remote` after configuring the UUID. This creates the two storage tables. No R2 binding is needed.
3. Connect the Worker to GitHub branch `feat/tsf-mockup-website`. Project name `the-singles-forum`, build `npm run build:worker`, deploy `npx wrangler deploy`, root `/`.
4. Set encrypted **runtime** secrets `ADMIN_PASSWORD_HASH` and `SESSION_SECRET`, using `npm run password:worker` privately. Do not place the plain password in build variables or GitHub.
5. Import the backed-up content and uploaded photos into D1 before connecting the domain. Generate a private import with `node scripts/prepare-d1-import.mjs --directory <backup> --output <private-file.sql>`, then run `npx wrangler d1 execute tsf-content --remote --file <private-file.sql>` only against the new empty database. The generated SQL refuses an existing content database. Keep this file out of GitHub. The previous R2 importer below is not compatible with D1. Keep the original Site available until migration is verified.
6. Verify `/api/health`, `/admin`, login/logout, publish, image upload, banner and topic slides on the workers.dev URL. Then connect `thesinglesforum.com` as the Worker custom domain, preserving mail DNS.

The D1 adapter uses transactional compare-and-swap writes to preserve draft conflict checks and login throttling. The existing Sites runtime can still use its original R2 binding unchanged. Backups and secrets must remain outside GitHub.

Reference: https://developers.cloudflare.com/d1/platform/pricing/ and https://developers.cloudflare.com/d1/platform/limits/.

---

## Archived R2 deployment instructions (alternative only; requires R2 activation)

# TSF deployment to the owner's Cloudflare account

This branch contains a standalone Cloudflare Worker and an R2 storage binding. It preserves the existing public site, image uploads, draft publishing, content history, activities, banner slides and YouTube topic slideshow. The existing ChatGPT Sites deployment stays available during migration.

## Build and verify

Requires Node 22.13+. Run `npm ci`, `npm test`, `npm run build:worker` and `npm run test:worker`. `npm run build:worker` creates `dist/server/index.js`. The original `npm start` runs the separate Node backend, not the Cloudflare Worker.

## Cloudflare setup

1. Create a new private R2 bucket named `tsf-content` in the intended account. Do not make the bucket publicly accessible. `wrangler.jsonc` binds it as `BUCKET`.
2. Create a Worker named `the-singles-forum` and connect repository `ifeoluwamorakinyojames-gif/Thesinglesforum`, branch `feat/tsf-mockup-website`. Build command: `npm run build:worker`. Deploy command: `npx wrangler deploy`. Root directory: repository root.
3. Keep `AUTH_MODE=standalone`, as declared in `wrangler.jsonc`. This mode ignores externally supplied ChatGPT identity headers.
4. Run `npm run password:worker` in a private interactive terminal. Choose a long unique password (16–256 characters). Store the returned `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` separately as encrypted Worker secrets; never commit them or enter the plain password into GitHub. Rotate `SESSION_SECRET` to revoke existing sessions.
5. Deploy first to the Worker's staging workers.dev URL. Do not change domain DNS yet. `/api/health` reports configuration status without exposing content or secrets.

The admin uses PBKDF2-SHA256 password verification, signed eight-hour sessions, Secure/HttpOnly/SameSite cookies, origin checks and R2-backed login throttling (eight attempts per 15 minutes per keyed client IP). Login attempts are not reset on successful login, to prevent parallel attempts from bypassing the limit. Sign in at `/admin`.

## Migrate content and photos

Do not commit a backup. The .gitignore excludes `migration-data/`, `backups/`, `.dev.vars` and local Wrangler data.

The source Site supports temporary, read-only export routes under `/_migration/`. They remain disabled unless both `MIGRATION_EXPORT_TOKEN` and `MIGRATION_EXPORT_EXPIRES` are configured. Exports require a 32+ character token and an expiration within seven days; the migration will use a one-hour window. The source Site's private access boundary remains unchanged. Revoke both variables immediately after export.

`node scripts/export-storage.mjs` accepts one JSON object on stdin with `origin`, `serviceToken`, `migrationToken` and a new `outputDirectory`. Never pass tokens in shell arguments. It downloads content, history and media one object at a time, validates object versions and sizes, and produces a checksum manifest. Authentication/throttling records are excluded. Do not edit source content during the final export; changed object versions cause a failed backup rather than a mixed snapshot.

Authenticate Wrangler to the destination account using its secure login. Run:

```
node scripts/import-storage.mjs --directory <backup-directory> --bucket tsf-content
```

This verifies checksums and makes no remote writes. Only after confirming the destination is a newly created empty bucket, run:

```
node scripts/import-storage.mjs --directory <backup-directory> --bucket tsf-content --apply --empty-target-confirmed
```

The importer refuses a bucket with `cms/current.json`, uploads each object and downloads it again to verify its checksum. It uploads current website content last. Original repository images remain bundled with the Worker; uploaded images retain their existing `/media/` URLs. Current content and revision history stay private in R2.

## Verify before connecting the domain

Check public homepage, image URLs, banner rotation, YouTube topics, admin login/logout, draft-only edits, publish, image uploads and stale-save conflicts on the staging URL. Confirm that an anonymous visitor and forged identity headers cannot access admin APIs. Browser verification and real destination storage checks are required before domain cutover; local tests are not a substitute.

Add `thesinglesforum.com` as a Custom Domain on the verified Worker. This is a different destination from the earlier ChatGPT Sites custom-domain setup. Review existing A/CNAME records and the pending Sites association before changing DNS; leave mail records unchanged. Do not use the previously supplied ChatGPT Sites A records for the standalone Worker. Keep the source Site and backup until the migrated site and rollback path have been checked.

## Outstanding account work

The repository cannot create Cloudflare resources or transfer data without authorized Cloudflare account access. Account sign-in, any R2 billing/terms activation, setting secrets, real migration and domain cutover must be verified in that account. No production domain has been redirected by this code change.
