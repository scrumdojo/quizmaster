---
name: run-app
description: Run the Quizmaster web app locally in Docker so you can click through it — builds the frontend and brings up the Spring Boot backend + Postgres at http://localhost:8080, with no JDK or Postgres installed on the host. Use when asked to run, start, launch, serve, or preview the Quizmaster app (the scrumdojo/quizmaster repo).
---

# Run Quizmaster locally (Docker, no host toolchain)

Runs the whole app in throwaway Docker containers: Postgres 16 + the Spring Boot
backend on `eclipse-temurin:21-jdk`. The backend serves the prebuilt React
frontend, so there is a single URL: **http://localhost:8080**.

Companion compose file lives next to this skill:
`.claude/skills/run-app/docker-compose.yml`. It bind-mounts the repo (defaults to
the repo root, since the skill lives at `.claude/skills/run-app/`; override with
the `QUIZMASTER_DIR` env var if you run it from elsewhere) and caches Gradle in a
volume.

## Launch

Run from the quizmaster repo root:

```bash
CF=.claude/skills/run-app/docker-compose.yml

# 1. Build the frontend into backend/src/main/resources/static
#    (uses host node/pnpm — no JDK needed; fast)
pnpm build:fe:dev

# 2. Ensure images exist (first time only)
docker image inspect postgres:16          >/dev/null 2>&1 || docker pull postgres:16
docker image inspect eclipse-temurin:21-jdk >/dev/null 2>&1 || docker pull eclipse-temurin:21-jdk

# 3. Start Postgres + backend
#    First boot runs a Gradle build + Flyway migrations (~1-3 min); later boots are fast.
docker compose -f "$CF" up -d

# 4. Wait until it answers
until curl -sf -o /dev/null http://localhost:8080/; do sleep 3; done
echo "Quizmaster is up -> http://localhost:8080"
```

## Verify it actually renders

```bash
curl -s http://localhost:8080/api/feature-flag   # -> false  (backend + DB OK)

# Optional real-browser screenshot via the Playwright already installed in specs/:
pnpm -C specs exec playwright screenshot --browser chromium \
  --wait-for-timeout 3000 http://localhost:8080 /tmp/qm-home.png
```

The home page should read "Welcome to Quizmaster!" with a **Create new workspace**
button. The DB starts empty — create a workspace to begin. Swagger UI is at
`http://localhost:8080/swagger-ui/index.html`.

## Controls

```bash
CF=.claude/skills/run-app/docker-compose.yml
docker compose -f "$CF" logs -f app   # tail backend logs
docker compose -f "$CF" stop          # pause (keeps DB data + Gradle cache)
docker compose -f "$CF" up -d         # resume (fast)
docker compose -f "$CF" down -v       # remove containers + DB + Gradle cache
```

## Run the E2E suite in Docker

To run the full Cucumber/Playwright E2E suite with **no host Java/Postgres** —
the backend (with the `e2e` Spring profile) and a fresh Postgres run in Docker,
while the specs run on the host against `http://localhost:8080`:

```bash
# whole suite
.claude/skills/run-app/test-e2e-docker.sh

# forward args to Playwright (e.g. grep a subset)
.claude/skills/run-app/test-e2e-docker.sh --grep "Background animation preferences"
```

The script builds the frontend on the host, stops this launcher's backend first
(they share `backend/build`), runs the specs, then tears the E2E stack down
(keeping the shared Gradle cache). Exit code mirrors the Playwright run. It
prints how to bring the launcher backend back up afterwards.

## Notes

- **Nothing is installed on the host** — Java 21 and Postgres run only in containers.
- After editing **frontend** code: re-run `pnpm build:fe:dev`, then
  `docker compose -f "$CF" restart app`.
  After editing **backend** code: just `docker compose -f "$CF" restart app`.
- **AI question generation (Robin)** needs `OPENROUTER_API_KEY` in the repo's `.env`.
- Needs port **8080** free. If it's taken, stop the other process — don't blindly kill it.
- This serves a production-style single port. For hot-reload frontend dev you'd
  instead run `pnpm start` (Vite on :5173 + backend) — but that needs a JDK 21 on
  the host, which this Docker approach deliberately avoids.
