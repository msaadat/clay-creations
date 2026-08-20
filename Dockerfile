# Host-agnostic image: runs on any VPS, Fly.io, Railway, Render or plain Docker.
# The SQLite file lives on a mounted volume at /data, NOT inside the image.
#
# Three things this image has to get right, each of which bit us before:
#   1. `next build` renders the site header, which queries the database — so the
#      build stage needs a real, migrated SQLite file, not just a URL.
#   2. `prisma migrate deploy` at boot needs the Prisma CLI *and its transitive
#      dependencies*. Cherry-picking node_modules/prisma is not enough; the /ops
#      stage below builds a self-contained toolchain instead.
#   3. NEXT_PUBLIC_* variables are inlined at compile time, so the WhatsApp
#      number must arrive as a build ARG. Setting it at runtime does nothing.

FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# better-sqlite3 compiles from source when no prebuilt binary matches the
# runtime. Only the building stages need a compiler — the final image does not.
FROM base AS buildbase
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# --- deps ------------------------------------------------------------------
FROM buildbase AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts=false

# --- build -----------------------------------------------------------------
FROM buildbase AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inlined into the client bundle at compile time. Override with:
#   docker build --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER=923001112222 .
# The default matches the fallback in src/lib/shop-config.ts, so an unset value
# still trips the app's own "setup incomplete" banner rather than shipping a
# malformed wa.me link.
ARG NEXT_PUBLIC_WHATSAPP_NUMBER="+923332402828"
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER

ENV NEXT_TELEMETRY_DISABLED=1
# Throwaway value: admin routes are dynamic so none are prerendered, but the
# module-level check in src/lib/auth.ts should not be able to fail the build.
# Not a NEXT_PUBLIC_ var, so Next does not inline it — the real secret is read
# from the environment at request time.
ENV ADMIN_SESSION_SECRET="build-time-placeholder-not-used-at-runtime-000"

# Prisma resolves DATABASE_URL eagerly when it loads prisma.config.ts, so this
# must be set before any prisma command runs.
ENV DATABASE_URL="file:/tmp/build.db"
# Create the schema: prerendering /_not-found and /checkout renders SiteHeader,
# which does a real `category.findMany()`. An empty file gives TableDoesNotExist.
RUN npx prisma migrate deploy
RUN npm run build

# --- ops toolchain ---------------------------------------------------------
# A self-contained node_modules for the migrate/seed commands, pinned to the
# exact versions the app was built against. Kept out of /app/node_modules so the
# standalone server bundle stays small.
FROM deps AS ops
WORKDIR /ops
# The manifest is generated rather than written by hand so that versions are
# read back from the tree npm ci just resolved, and `allowScripts` is inherited
# from the app. That second part matters: npm 12 refuses to run install scripts
# for packages missing from the allowlist, and better-sqlite3 silently ends up
# without its native binding — the failure only shows at runtime.
RUN node -e ' \
  const fs = require("fs"); \
  const app = require("/app/package.json"); \
  const v = (n) => require("/app/node_modules/" + n + "/package.json").version; \
  const names = ["prisma","@prisma/client","@prisma/adapter-better-sqlite3","better-sqlite3","bcryptjs","dotenv","tsx"]; \
  const dependencies = {}; \
  for (const n of names) dependencies[n] = v(n); \
  fs.writeFileSync("package.json", JSON.stringify({ \
    name: "clay-creations-ops", version: "0.0.0", private: true, \
    dependencies, allowScripts: app.allowScripts ?? {}, \
  }, null, 2) + "\n"); \
' && npm install --ignore-scripts=false --no-audit --no-fund

# Do not try to slim this down by deleting @prisma/studio-core and friends: the
# CLI requires "@prisma/studio-core/data/bff" while booting *any* command, so
# `migrate deploy` dies on a fresh volume. Measured, tried, reverted.

# Layout mirrors the repo so prisma.config.ts's relative paths and seed.ts's
# `../src/generated/prisma/client` import both resolve with /ops as the cwd.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/generated ./src/generated

# --- runtime ---------------------------------------------------------------
FROM base AS runner
# gosu drops privileges in the entrypoint after it has fixed up the volume.
RUN apt-get update && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/data/prod.db"

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home-dir /home/nextjs --create-home nextjs

# standalone bundles only the server's own dependencies; static and public are
# copied separately because Next expects them beside the server.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

COPY --from=ops --chown=nextjs:nodejs /ops /ops
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# The database must outlive the container, so /data is where a persistent volume
# gets mounted — `docker run -v claycreations-data:/data`, or a Railway volume
# with /data as its mount path.
#
# Deliberately NO `VOLUME /data` instruction: Railway rejects the Dockerfile
# outright if it finds one ("docker VOLUME ... is not supported, use Railway
# Volumes"). Nothing is lost — an explicit -v mount works either way, and the
# entrypoint creates and chowns the directory at boot.
RUN mkdir -p /data && chown nextjs:nodejs /data

EXPOSE 3000

# Deliberately no `USER` directive: the entrypoint starts as root so it can
# chown the freshly-mounted volume, then re-executes the server as nextjs.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
