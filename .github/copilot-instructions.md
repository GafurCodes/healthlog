## Quick context for AI coding agents

This monorepo contains two apps: the backend API at `apps/api/` (TypeScript + Express + Mongoose) and the frontend at `apps/web/` (React + Vite). Changes should be made with awareness of the monorepo layout and the separation between app creation and server startup in `apps/api`.

Keep suggestions specific, small, and testable. Prefer modifying or adding files under `apps/api/src/` or `apps/web/src/` and include unit tests for backend changes in `apps/api/src/test/`.

## Big picture (where things live)
- API entry / app factory: `apps/api/src/app.ts` (createApp) and `apps/api/src/server.ts` (process startup) — prefer modifying `createApp()` for testable changes.
- Routes → Controllers → Services → Models pattern:
  - Routes: `apps/api/src/routes/*.ts`
  - Controllers: `apps/api/src/controllers/*.ts`
  - Services: `apps/api/src/services/*.ts`
  - Models: `apps/api/src/models/*.ts`
- Validation: `apps/api/src/utils/validation.ts` (Zod schemas)
- Auth utilities: `apps/api/src/utils/jwt.ts`, `apps/api/src/utils/tokens.ts`
- Email service: `apps/api/src/services/email.service.ts` (Nodemailer / SendGrid integration)

## Important conventions & gotchas
- Project uses ES modules ("type": "module"). When running or referring to compiled code pay attention to file extensions — imports often use `.js` at runtime even for TypeScript sources.
- App factory separation: change `createApp()` (app-level middleware/routes) for behavior changes; avoid editing `server.ts` when writing unit tests.
- Tests use Jest + mongodb-memory-server. Tests run with `--runInBand` in `apps/api/package.json` to avoid race conditions.
- Rate limiting and CORS behavior are centrally configured in `apps/api/src/config/`.

## How to run & debug locally (developer commands)
- API (development):
  - cd apps/api
  - npm run dev    # nodemon + ts-node (hot reload)
  - npm test       # jest --runInBand (unit tests using in-memory mongo)
  - npx jest <path or -t pattern> to run a single test
- Web (development):
  - cd apps/web
  - npm run dev    # Vite dev server
  - npm run build  # tsc -b && vite build
- Docker compose (full stack):
  - docker-compose up --build
  - API: http://localhost:4000 (health: GET /api/health)
  - Web: http://localhost:80

## Tests & validation
- Unit tests live under `apps/api/src/test/`. Use the app factory export (`createApp`) to mount the app in Supertest.
- The project uses `mongodb-memory-server` for tests; do not run tests against a production MongoDB by default.

## Integration points & external dependencies
- MongoDB (docker-compose service `mongodb`) — container name `healthlog-mongodb` in compose. Healthchecks are configured in `docker-compose.yml`.
- Email: configured via `apps/api/.env` (SMTP / SendGrid); see `email.service.ts` for usage.
- JWT tokens: signed/verified in `utils/jwt.ts` and refresh logic in `utils/tokens.ts`.

## Suggested behaviour for edits
- Small, focused PRs: change one service, add/modify its tests, and run `npm test` in `apps/api` before opening PR.
- When adding schema or validation changes, update both `apps/api/src/models/*` and `apps/api/src/utils/validation.ts` and add tests that cover invalid inputs.
- For frontend changes, prefer updating `apps/web/src/api/client.ts` for API changes and corresponding types in `apps/web/src/types/index.ts`.

## Examples (how to reference code in suggestions)
- To add a new route, wire it into `createApp()` in `apps/api/src/app.ts` (use existing `apiLimiter` and error middleware):
  - app.use('/api/new', newRoutes);
- To run a single backend test file:
  - npx jest apps/api/src/test/log.service.test.ts

## If you need clarification
- Ask for the specific file the change should touch (route/controller/service/model). If unsure, propose a tiny prototype (3–6 files) and run tests locally.

---
If this looks right I can merge it into `.github/copilot-instructions.md` and iterate on any missing project-specific details you want included.
