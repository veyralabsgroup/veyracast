# VeyraCast

**API-first AI social content agent.** Generate on-brand posts and comments with Claude (multi-provider), schedule across platforms, and publish through official APIs — X, Instagram Graph (business/creator), with LinkedIn and Bluesky on the roadmap.

Built and maintained by [VeyraLabs](https://github.com/veyralabsgroup). A hard fork of [Riona-AI-Agent](https://github.com/David-patrick-chuks/Riona-AI-Agent) by David-patrick-chuks (MIT) — see [NOTICE](NOTICE). VeyraCast re-centers the project on official-API publishing (lower ban risk than browser automation), swaps the content engine to a pluggable multi-provider layer defaulting to Claude, and adds brand-voice guardrails and an approval queue.

> ⚠️ **Instagram note.** The legacy stealth-browser Instagram path is retained only as an explicit opt-in (`IG_MODE=stealth`) and is **off by default** — it violates Meta's ToS and risks account bans. The default IG path targets the official Instagram Graph API for business/creator accounts.

## Run with Docker

The fastest way to run the whole stack (API + PostgreSQL):

```sh
cp .env.example .env      # add your ANTHROPIC_API_KEY, and set JWT_SECRET / SESSION_SECRET
docker compose up
```

The API comes up on `http://localhost:3000` and the dashboard on `http://localhost:3000/dashboard`. PostgreSQL runs alongside it and the schema is applied on startup.

The image skips the headless-browser download by default (the official-API path doesn't need it). To use the stealth Instagram mode (`IG_MODE=stealth`), build with a Chrome-enabled base image.

> The compose file ships throwaway dev values for `JWT_SECRET` and `SESSION_SECRET` so it boots out of the box. **Set real values in `.env` before exposing it to anyone.**

## Content engine (multi-provider)

The agent generates schema-constrained JSON via a pluggable provider. Select with `AI_PROVIDER`:

| `AI_PROVIDER`         | Backend | Notes                                                                                                |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `anthropic` (default) | Claude  | Structured outputs (`output_config.format`); model via `ANTHROPIC_MODEL` (default `claude-opus-4-8`) |
| `gemini`              | Gemini  | Original behavior: JSON mode + API-key rotation                                                      |

Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) for the default provider.

## Training Inputs

Before running automation, you can shape the agent with:

- YouTube video URLs
- Audio files
- Portfolio or website links
- Documents and text files including PDF, DOC, DOCX, and TXT

## Feature Summary

- Instagram automation with cookies, relogin handling, posting, scheduling, and interactions
- AI-generated captions and comments with schema-guided responses
- Multi-account and profile-based operation support
- PostgreSQL-backed action logs, summaries, and optional persistence
- Simple dashboard for runtime health and latest activity
- Logging, environment validation, and utility scripts for operations

## Planned Expansion

- Complete X/Twitter workflow coverage
- GitHub automation
- Additional analytics, reporting, and compliance controls

## Installation

1. **Clone the repository**:

```sh
 git clone https://github.com/veyralabsgroup/veyracast.git
 cd veyracast
```

2. **Install dependencies**:

This is a **pnpm workspace** monorepo. Install [pnpm](https://pnpm.io/installation), then:

```sh
pnpm install
```

3. **Set up environment variables**:
   Copy `.env.example` to `.env` in the **repo root** and add your credentials. All apps read from this file.

## Monorepo

This repository is a **pnpm workspace** with one app and shared tooling:

| Package               | Path                 | Description                                 |
| --------------------- | -------------------- | ------------------------------------------- |
| `@veyracast/api`      | `apps/api/`          | Main API, Instagram/X automation, dashboard |
| `@veyracast/tsconfig` | `packages/tsconfig/` | Shared TypeScript config                    |

```sh
pnpm install                            # install all workspace deps
pnpm dev                                # run API (@veyracast/api)
pnpm --filter @veyracast/api <script>   # run any API script
```

Full layout, paths, and contributor workflow: [Guides/Monorepo.md](Guides/Monorepo.md).

## PostgreSQL Setup

The app uses PostgreSQL for action logs. If `DATABASE_URL` is not set, action logs fall back to `apps/api/logs/actionLogs.json`.

### Option A: Docker (recommended for contributors)

```sh
pnpm db:up
```

This starts PostgreSQL on port `5432` with credentials that match `.env.example`.

### Option B: Local PostgreSQL

Install PostgreSQL locally, create a database, and point `.env` at it:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/veyracast
```

Create the database if needed:

```sh
createdb veyracast
```

Schema is applied automatically on startup. To run migrations manually:

```sh
pnpm db:migrate
```

### Verify

```sh
docker compose ps
# or
psql "$DATABASE_URL" -c '\dt'
```

Stop Docker Postgres:

```sh
pnpm db:down
```

### Upgrading from a MongoDB fork

If your fork still uses `MONGODB_URI`, merge this branch and update `.env`:

1. Remove `MONGODB_URI` / `MONGODB_REQUIRED`
2. Add `DATABASE_URL` and `DB_REQUIRED=false` (see `.env.example`)
3. Run `pnpm install`
4. Start Postgres with `pnpm db:up` or use your local instance

No data migration script is provided — MongoDB action logs were optional and the app still works without a database.

## Usage

1. **Run the agent**:

```sh
pnpm start
# or during development:
pnpm dev
```

This starts the API server on port 3000 and opens the dashboard at `http://localhost:3000/dashboard`. The Instagram browser only launches when you log in or trigger interactions — it does not auto-comment on its own unless `IG_AGENT_ENABLED=true`.

2. **Log in and trigger interactions**:

```sh
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_IG_USERNAME","password":"YOUR_IG_PASSWORD"}'
```

Then open the dashboard or call `POST /api/interact` with your session cookie to start liking and commenting on feed posts.

3. **Optional: auto-run the Instagram agent loop**
   Set `IG_AGENT_ENABLED=true` in `.env` to run the interaction loop continuously.
4. **Post a photo (by URL)**

```sh
 curl -X POST http://localhost:3000/api/post-photo \\
   -H "Content-Type: application/json" \\
   --cookie "token=YOUR_JWT_TOKEN" \\
   -d '{"imageUrl":"https://example.com/photo.jpg","caption":"Hello IG!"}'
```

5. **Post a photo (file upload)**

```sh
 curl -X POST http://localhost:3000/api/post-photo-file \\
   -H "Content-Type: multipart/form-data" \\
   --cookie "token=YOUR_JWT_TOKEN" \\
   -F "image=@/path/to/photo.jpg" \\
   -F "caption=Hello IG!"
```

6. **Schedule a photo post**

```sh
 curl -X POST http://localhost:3000/api/schedule-post \\
   -H "Content-Type: application/json" \\
   --cookie "token=YOUR_JWT_TOKEN" \\
   -d '{"imageUrl":"https://example.com/photo.jpg","caption":"Scheduled post","cronTime":"0 9 * * *"}'
```

## Dashboard

Open `http://localhost:3000/dashboard` for live status, the last IG run summary, recent
actions, application logs, and errors.

## Development

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm check`         | Lint + typecheck + test + format (CI parity) |
| `pnpm test`          | Run API test suite                           |
| `pnpm test:coverage` | Tests with coverage report                   |
| `pnpm lint`          | ESLint on `apps/api`                         |
| `pnpm format`        | Prettier write                               |
| `pnpm check:env`     | Validate required env vars                   |
| `pnpm setup`         | Setup health check                           |
| `pnpm dev`           | API dev server (`@veyracast/api`)            |
| `pnpm dev:all`       | All apps in parallel                         |
| `pnpm build`         | Build all packages                           |

## Guides

- [Guides/Monorepo.md](Guides/Monorepo.md) — workspace layout & commands
- `Guides/Instagram-Bot.md`
- `Guides/Operations.md`
- `Guides/API.md`
- `Guides/Env.md`
- `Guides/Testing.md`
- `Guides/CI.md`
- `Guides/Scripts.md`
- `Guides/Training.md`
- `Guides/FAQ.md`
- `Guides/Logging.md`

## Configuration Reference

### Instagram

| Variable                 | Type    | Default                                                                | Description                                    |
| ------------------------ | ------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| `IGusername`             | string  |                                                                        | Instagram username                             |
| `IGpassword`             | string  |                                                                        | Instagram password                             |
| `IG_RUN_PROFILE`         | string  | `standard`                                                             | Run profile: `safe`, `standard`, `aggressive`  |
| `IG_AGENT_ENABLED`       | boolean | `false`                                                                | Auto-run Instagram agent loop                  |
| `IG_AGENT_INTERVAL_MS`   | number  | `30000`                                                                | Agent loop interval in ms                      |
| `IG_DAILY_MAX_ACTIONS`   | number  | `0`                                                                    | Daily max IG actions (0 = unlimited)           |
| `IG_MAX_POSTS_PER_RUN`   | number  |                                                                        | Max posts per run (overrides profile)          |
| `IG_ACTION_DELAY_MIN_MS` | number  |                                                                        | Min action delay (overrides profile)           |
| `IG_ACTION_DELAY_MAX_MS` | number  |                                                                        | Max action delay (overrides profile)           |
| `IG_COOLDOWN_MINUTES`    | number  |                                                                        | Cooldown duration in minutes                   |
| `IG_COMMENT_ALLOWLIST`   | string  |                                                                        | Comma-separated allowed comment terms          |
| `IG_COMMENT_DENYLIST`    | string  |                                                                        | Comma-separated blocked comment terms          |
| `IG_COMMENT_SENTIMENT`   | string  | `any`                                                                  | Sentiment filter: `any`, `positive`, `neutral` |
| `IG_COMMENT_MIN_LENGTH`  | number  |                                                                        | Minimum allowed comment length (chars)         |
| `IG_COMMENT_MAX_LENGTH`  | number  |                                                                        | Maximum allowed comment length (chars)         |
| `IG_AD_MARKERS`          | string  | `sponsored,paid partnership,paid partnership with`                     | Comma-separated ad markers                     |
| `IG_AD_BUTTON_MARKERS`   | string  | `learn more,shop now,sign up,install now,get offer,subscribe,book now` | Comma-separated ad button markers              |

### X/Twitter

| Variable    | Type   | Default | Description        |
| ----------- | ------ | ------- | ------------------ |
| `Xusername` | string |         | X/Twitter username |
| `Xpassword` | string |         | X/Twitter password |

### AI & APIs

| Variable           | Type   | Default | Description              |
| ------------------ | ------ | ------- | ------------------------ |
| `GEMINI_API_KEY`   | string |         | Primary Gemini API key   |
| `GEMINI_API_KEY_1` | string |         | Secondary Gemini API key |
| `GEMINI_API_KEY_2` | string |         | Tertiary Gemini API key  |

### Database

| Variable       | Type    | Default | Description                                     |
| -------------- | ------- | ------- | ----------------------------------------------- |
| `DATABASE_URL` | string  |         | PostgreSQL connection URL                       |
| `DB_REQUIRED`  | boolean | `false` | Require PostgreSQL connection (exit if missing) |

### Logging & General

| Variable | Type   | Default   | Description                             |
| -------- | ------ | --------- | --------------------------------------- |
| `LOGGER` | string | `console` | Logging backend: `winston` or `console` |

## Multi-Account Support

Create `apps/api/src/config/accounts.json` (not committed) based on `apps/api/src/config/accounts.example.json`.
Then pass `account` in `/api/login` to select which account to use.

## Project Policies

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `LICENSE`

## Project Structure

```
apps/
  api/          @veyracast/api — REST API, agent loop, IG/X clients, dashboard
    src/
      Agent/      AI training, characters, schema
      client/     Instagram & X/Twitter automation
      config/     accounts, igProfile, logger, database
      routes/     Express API (api.ts)
      services/   action logs, webhooks, metrics, igChallenge
      views/      Admin dashboard HTML
    scripts/      env check, setup, DB migrate
packages/
  tsconfig/     @veyracast/tsconfig — shared compiler base
Guides/         Documentation
docker-compose.yml
pnpm-workspace.yaml
```

See [Guides/Monorepo.md](Guides/Monorepo.md) for paths, runtime directories, and CI details.

## Logging

Winston writes rotating logs to `apps/api/logs/`. Set `LOGGER=console` to log only to stdout. See [Guides/Logging.md](Guides/Logging.md).

## Error Handling

Process-level error handlers are set up to catch unhandled promise rejections, uncaught exceptions, and process warnings. Errors are logged using the custom logger.

## Contributing

Contributions are welcome and appreciated.

1. Fork the repository.
2. Create a feature branch.
3. Install deps: `pnpm install`
4. Run checks: `pnpm check`
5. Commit your changes and open a pull request.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [Guides/Monorepo.md](Guides/Monorepo.md).

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Stargazers

Thank you to all our supporters!

## Community & Contact

- GitHub Discussions: use the Discussions tab for Q&A
- Issues: bug reports and feature requests
- Maintained by [VeyraLabs](https://github.com/veyralabsgroup)
