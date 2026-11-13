# Railway deployment

NexusTiers runs as one always-on service. The service serves the Minecraft website, the /api endpoints, and the Discord bot from the same Node process.

## Required Railway variables

Set these in the Railway service's Variables tab:

- `DATABASE_URL` — PostgreSQL connection string
- `DISCORD_BOT_TOKEN` — Discord bot token

Railway provides `PORT` automatically. Do not hardcode it.

## Discord server routing

The bot keeps kit requests and verification scoped to the two test servers. These overrides are optional because the defaults already match the configured servers:

- `NEXUS_TIERS_GUILD_ID` — NexusTiers; defaults to `1552686607289684098`
- `NEXUS_SUBTIERS_GUILD_ID` — Nexus Subtiers; defaults to `1570409542171238420`

If you add them in Railway, use the IDs shown above. The legacy `DISCORD_GUILD_ID` variable is no longer used by the production Docker build.

## Optional role and channel variables

The bot can use role IDs when names are not unique:

- `DISCORD_TESTER_ROLE_ID`
- `MEMBER_ROLE_ID`
- `BOOSTER_ROLE_ID`
- `RESTRICTED_ROLE_ID`
- `MANAGER_ROLE_ID`
- `ADMIN_ROLE_ID`
- `MOD_ROLE_ID`
- `HELPER_ROLE_ID`

Ticket category and panel overrides:

- `SUPPORT_CATEGORY_ID`
- `REPORTS_CATEGORY_ID`
- `STAFF_REPORTS_CATEGORY_ID`
- `TICKET_PANEL_CHANNEL_ID`

## Build and runtime

The repository's production Dockerfile extracts `NexusTiers-ticket-system-complete.tar.xz`, installs the locked pnpm workspace, typechecks shared libraries, builds the Minecraft frontend and API server, then starts the combined API and Discord bot. Use the Dockerfile builder so Railway builds the updated production archive.

The health check is `GET /api/healthz`.

Use an always-on Railway service. The Discord gateway must stay connected continuously; a sleep-on-idle deployment will disconnect the bot.
