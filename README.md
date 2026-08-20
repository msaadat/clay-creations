# ClayCreations

Storefront for handmade polymer clay jewellery. Cart and orders, but no payment
gateway: customers pay by bank transfer and confirm on WhatsApp.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite via Prisma 7 (`better-sqlite3` driver adapter) |
| Cart | Zustand, persisted to localStorage |
| Forms | React Hook Form + Zod |
| Admin auth | Signed HTTP-only cookie (single admin user) |

No Vercel-specific APIs are used. `output: "standalone"` plus the included
`Dockerfile` means this runs on any host with Node and a persistent disk.

## Getting started

```bash
npm install
cp .env.example .env   # then edit the values
npm run db:migrate
npm run db:seed
npm run dev
```

The shop is at http://localhost:3000 and the admin at http://localhost:3000/admin.
Seeded credentials are printed by `db:seed` (default `admin@claycreations.pk` /
`changeme123` — change these).

## Before taking real orders

1. **Bank details** — `src/lib/shop-config.ts`. The order page shows an amber
   "Setup incomplete" banner until the placeholders are replaced.
2. **WhatsApp number** — `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env`, international
   format, digits only (e.g. `923001234567`).
3. **Session secret** — `ADMIN_SESSION_SECRET`, 32+ chars.
   Generate with `openssl rand -base64 32`.
4. **Admin password** — sign in and change it, or re-seed with `ADMIN_EMAIL` and
   `ADMIN_PASSWORD` set.
5. **Shipping** — flat fee and free-shipping threshold in `src/lib/shop-config.ts`.

## Conventions

- **Money is integer paisa.** Rs 1,550.00 is stored as `155000`. Convert only at
  the edges with the helpers in `src/lib/money.ts`. SQLite has no decimal type,
  and integer maths avoids rounding drift on totals.
- **Order status is a string, not an enum.** SQLite has no enums; the valid set
  lives in `src/lib/orders.ts` and is enforced by Zod.
- **Every product has at least one variant.** Products with nothing to choose get
  a single variant with a null `optionName`, so the cart, stock checks and order
  lines never branch between "simple" and "variant" products.
- **The cart is display state.** Prices and stock are re-read from the database
  inside a transaction at checkout; the client's numbers are ignored.
- **Order lines snapshot** product name, variant label and price, so editing or
  deleting a product never rewrites historical orders.

## Order lifecycle

`PENDING_PAYMENT` → `PAID` → `SHIPPED` → `COMPLETED`, plus `CANCELLED`.

Stock is decremented when the order is placed. Moving an order to `CANCELLED`
returns that stock; moving it back out takes it off the shelf again.

## Product images

Photos live in `public/products/`. The admin product form lists whatever is in
that folder as a picker. There is no upload UI yet — that arrives with the
object-storage decision (Cloudflare R2 or similar), at which point
`src/lib/product-images.ts` is the one file to swap.

## Deployment

Requires a host with **a persistent disk** — a VPS, Fly.io with a volume, or
Railway/Render with a volume. Serverless platforms (Vercel, Cloudflare Workers)
will not work while the database is SQLite.

The WhatsApp number is a `NEXT_PUBLIC_` variable, which Next inlines at compile
time. It has to be passed as a **build argument** — setting it at runtime has no
effect on the links the browser sees.

```bash
docker build \
  --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567 \
  -t claycreations .
docker run -d \
  -p 3000:3000 \
  -v claycreations-data:/data \
  -e ADMIN_SESSION_SECRET="$(openssl rand -base64 32)" \
  claycreations
```

The container runs `prisma migrate deploy` on boot, so schema changes apply
automatically. The database lives at `/data/prod.db` on the mounted volume — it
is deliberately outside the image so redeploys don't wipe it.

### First boot

A fresh volume has no catalogue and no admin user, so there is nothing to log in
with. Set `SEED_ON_BOOT=true` for one deploy to populate it:

```bash
docker run -d \
  -p 3000:3000 \
  -v claycreations-data:/data \
  -e ADMIN_SESSION_SECRET="$(openssl rand -base64 32)" \
  -e SEED_ON_BOOT=true \
  -e ADMIN_EMAIL="you@example.com" \
  -e ADMIN_PASSWORD="something-long" \
  claycreations
```

Remove the variable afterwards. It is safe to leave set by accident — the
entrypoint refuses to seed a database that already holds categories or orders,
because `prisma/seed.ts` deletes every product **and order** before inserting.

### Railway

Railway builds the `Dockerfile` automatically. What it needs beyond the defaults:

1. **A volume mounted at `/data`.** Without it the database is wiped on every
   deploy. Railway mounts volumes owned by root; the entrypoint starts as root,
   chowns the mount and drops to the `nextjs` user, so no `RAILWAY_RUN_UID`
   override is needed.
2. **Build argument** `NEXT_PUBLIC_WHATSAPP_NUMBER`, set under the service's
   build settings — not as a plain service variable.
3. **Service variables** `ADMIN_SESSION_SECRET`, and `SEED_ON_BOOT` /
   `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the first deploy only.
4. **One replica.** SQLite is a single-writer file on a single volume; it cannot
   be scaled horizontally, and overlapping deploys must not share the mount.

`PORT` is injected by Railway and honoured by the server.

**Back it up.** A single SQLite file on one disk with no backup is the real risk
of this setup. [Litestream](https://litestream.io) replicates it continuously to
S3/R2 for pennies a month and is the recommended next addition.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Generate Prisma client, then production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Wipe and reseed the catalogue |
| `npm run db:studio` | Prisma Studio |
