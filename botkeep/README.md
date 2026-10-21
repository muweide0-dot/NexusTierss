# Botkeep deployment

Select the full GitHub repository and set the project root to this botkeep directory.
Use Node.js 22 and the start command npm start.

Add these Botkeep secrets before starting:
- DATABASE_URL: a reachable PostgreSQL connection string.
- DISCORD_BOT_TOKEN: the Discord bot token.
- DISCORD_GUILD_ID: the Discord server ID.

The first start extracts the pinned source ZIP, installs the workspace with pnpm, typechecks shared libraries, builds the API and web assets, and then starts the combined API and Discord bot. Later starts reuse that build unless the source ZIP changes.

Botkeep must check out the full repository because the archive is stored one directory above this project root. The app needs an always-on process. If Botkeep stops the first build at its memory limit, increase the server allocation before retrying.

Optional Discord role and ticket-channel variables are documented in docs/railway-deployment.md.
