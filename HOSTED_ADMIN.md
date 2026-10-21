# Hosted TSF editor

The private Site at https://tsf-design-preview.sacredpin33.chatgpt.site now runs the Worker adapter in worker/runtime.js. Its /admin uses ChatGPT sign-in. Every admin API checks the signed-in email and identity supplied by Sites against the server-only ADMIN_EMAIL setting. No password needs to be shared.

Build: `node scripts/build-hosted.mjs`. Check: `node scripts/test-hosted.mjs`. The build embeds public assets and the hosted admin scripts into dist/server/index.js. Deploy this output through Sites using the tracked .openai/hosting.json. Sites provisions the BUCKET R2 binding. Configure ADMIN_EMAIL in Sites runtime settings, never in source.

Content and uploaded photographs persist in R2. Saves use conditional ETag writes to detect concurrent changes. Prior revisions are retained under cms/history/. Drafts remain private until published. No content is stored in browser-only storage.

The original Node backend remains available with npm start; its password authentication is separate. GitHub Pages cannot run either backend. The preview remains owner-private. Hosted behavior passes mocked storage and authorization checks; live interactive browser verification remains outstanding.
