# 🍔 Zomato Lite

A minimal, working **restaurant + reviews** app that proves the core of
Zomato's product loop in a few hundred lines: *a restaurant page → its
rating and reviews → write your own review → it appears instantly.*

The UI follows Zomato's visual language — signature red, warm off-white
canvas, card-based layout, star ratings — with no UI library and no extra
dependencies.

Built with **Next.js (App Router), TypeScript, Tailwind CSS v4, and Neon
serverless Postgres**. No external review APIs, no auth, no complexity — just
the review experience, done honestly.

**Live demo:** deploy to Vercel + Neon (see [Deploy to Vercel](#deploy-to-vercel))
— connect `DATABASE_URL`, run `npm run db:setup` once, and visit `/restaurant/1`.

---

## Table of contents

1. [What it does (features)](#what-it-does-features)
2. [Product decisions](#product-decisions)
3. [Data model](#data-model)
4. [Repository layout](#repository-layout)
5. [Tech stack](#tech-stack)
6. [Quickstart](#quickstart)
7. [API reference](#api-reference)
8. [The two database scripts](#the-two-database-scripts)
9. [Scheduler: demo-data health & weekly cron](#scheduler-demo-data-health--weekly-cron)
10. [Deploy to Vercel](#deploy-to-vercel)
11. [Configuration](#configuration)
12. [Removing the demo data](#removing-the-demo-data)
13. [Contributing](#contributing)

---

## What it does (features)

- **Restaurant page** (`/restaurant/[id]`) — red/orange gradient hero, a
  **rating card** (big average, 5-star row, review count), the **latest review
  highlighted** with stars and a formatted date, then older reviews in a
  divided card, plus a friendly empty state ("No reviews yet · Be the first").
- **Write a review** (`/review/[restaurantId]`) — 1–5 star picker with a
  caption (Poor → Excellent), comment box with a 500-char counter, submit
  gating, an error alert box, and a redirect back to the restaurant page on
  success.
- **Zomato-style app shell** — sticky header with the red "Z" logo and nav,
  plus a footer, shared by every page via `app/layout.tsx`.
- **Home page** — hero with a tagline, a "Zomato Lite" badge, a red
  call-to-action into the demo restaurant, and two trust badges.
- **Average rating computed fresh, never stored** — `AVG(rating)` runs on
  every request, so the number can never go stale or out of sync.
- **Server-side API** handing back exactly what the page needs:
  - `GET /api/restaurants/:id` → restaurant + `averageRating` +
    `totalReviews` + `latestReview` + `reviews`
  - `POST /api/reviews` → validates and inserts a review
- **Strict input validation** on every write (rating 1–5, non-empty comment,
  restaurant must exist).
- **Neon serverless Postgres** — connects straight from the edge; no local
  database server to babysit.
- **Lazy DB client** (`lib/db.ts`) — the connection is created on first
  request, so `next build` works without a live database.
- **Health + demo seeding scheduler** — a non-destructive job keeps the schema
  and demo data present (weekly via GitHub Actions).

## Product decisions

| Decision | Why |
|---|---|
| **Average + count computed per request, not stored** | Can never drift from the reviews table; accurate on day 1 and day 10,000 |
| **Latest review highlighted on the page** | Mirrors real review platforms ("Recently reviewed") — the newest signal is what a visitor wants |
| **Three validation checks on POST (rating, comment, restaurant)** | Every write path is guarded server-side, not just in the UI |
| **`UNIQUE`-free, append-only reviews** | Reviews are immutable once written — no edit/delete in scope |
| **SQL seed via an idempotent script, destructive setup as a separate script** | `db:setup` = fresh start (drops tables); `review-job` = never destroys data |
| **Neon serverless driver** | Same `neon()` template-tag API everywhere — setup script, API routes, and the scheduler |
| **Lazy, cached client in `lib/db.ts`** | Module-scope `neon()` crashed `next build` when `DATABASE_URL` was absent; deferring to first use keeps builds green and yields one clear runtime error |
| **Zomato-like visual language (`#E23744` red, warm `#F7F6F2` canvas, cards + soft rings)** | Familiar, appetising design that reads as a real food app — without pulling in a UI library |
| **Next.js App Router, RSC by default** | Data is fetched server-side; the review form is the only client component |

## Data model

```sql
restaurants(id SERIAL PK, name TEXT, cuisine TEXT, area TEXT)
reviews(id SERIAL PK, restaurant_id → restaurants.id,
        rating INT CHECK 1..5, comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW())
```

Seed (via `npm run db:setup` or the scheduler):
**Ludhiana Burrito** (Indian · Sector 32) with three reviews — *"Paneer burrito
is unreal"* ★5, *"Good, but slow service"* ★4, *"Solid. Would repeat."* ★4.

## Repository layout

```
.
├── app/
│   ├── layout.tsx                      # shared shell: header, nav, footer
│   ├── globals.css                     # Tailwind + theme tokens
│   ├── page.tsx                        # home hero → link to /restaurant/1
│   ├── restaurant/[id]/page.tsx        # restaurant page (server component)
│   ├── review/[restaurantId]/page.tsx  # write-a-review form (client component)
│   └── api/
│       ├── reviews/route.ts            # POST /api/reviews
│       └── restaurants/[id]/route.ts   # GET /api/restaurants/:id
├── db/
│   └── schema.sql                      # canonical schema + demo seed (readable copy)
├── lib/
│   └── db.ts                           # lazy, cached Neon client (build-safe)
├── scripts/
│   ├── db-setup.ts                     # DESTRUCTIVE fresh-start setup (drops tables)
│   └── review-job.ts                   # NON-destructive health + seed scheduler
├── .github/workflows/db-health.yml     # weekly cron health check + demo seed
├── .env.local.example                  # copy → .env.local, add DATABASE_URL
├── package.json / tsconfig / next.config.ts
└── README.md
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js App Router (TypeScript) | RSC-first data fetching, file-based API routes |
| UI | React 19 + Tailwind CSS v4 | Zomato-style design system (`#E23744` red, warm `#F7F6F2` canvas, cards + soft rings), zero UI lib |
| Database | Postgres via **Neon serverless** | `@neondatabase/serverless` — one `getDb()` call, edge-safe |
| Scripting | `tsx` | Run TypeScript DB scripts without a build step |
| Env | `dotenv` + `.env.local` | Local creds stay out of git (`.env*` ignored) |
| Scheduler | `review-job.ts` + GitHub Actions cron | Weekly, non-destructive demo-data health |

## Quickstart

```bash
# 1. Create a free Neon project → copy the connection string
#    https://neon.tech

# 2. Configure the database URL
cp .env.local.example .env.local
#    → set DATABASE_URL=postgresql://USER:PASSWORD@HOST/dbname?sslmode=require

# 3. Create + seed the tables
npm install
npm run db:setup          # creates tables + seeds Ludhiana Burrito (destructive, one-time)

# 4. Run the app
npm run dev               # → http://localhost:3000
```

Open `http://localhost:3000` → click **Go to Ludhiana Burrito** → see ★4.3 and
three reviews → **Write a review** → submit → it appears as the highlighted
"Latest" review on the restaurant page.

> **Non-destructive alternative:** instead of `npm run db:setup`, run
> `npm run review:job -- --mode once` — it creates missing tables and seeds
> demo data only when empty, and never drops anything.

## API reference

### `GET /api/restaurants/:id`

Returns the restaurant plus its **computed fresh** aggregates:

```json
{
  "name": "Ludhiana Burrito",
  "cuisine": "Indian",
  "area": "Sector 32",
  "averageRating": 4.3,
  "totalReviews": 3,
  "latestReview": { "id": 3, "rating": 4, "comment": "Solid. Would repeat.", "createdAt": "..." },
  "reviews": [ { "id": 2, "rating": 4, "comment": "Good, but slow service", "createdAt": "..." }, "..."]
}
```

`404` when the restaurant does not exist.

### `POST /api/reviews`

```bash
curl -X POST http://localhost:3000/api/reviews \
  -H 'Content-Type: application/json' \
  -d '{"restaurantId":1,"rating":5,"comment":"Finally tried it — worth the hype"}'
```

Validations, in order: `rating` is an integer 1–5 → `comment` is a non-empty
string → `restaurantId` exists. Success: `201 {"success":true,"reviewId":4}`.
Any failure returns a `400` with a specific `error` message (`500` only on a
DB failure).

## The two database scripts

| Script | Command | Behaviour |
|---|---|---|
| `db-setup.ts` | `npm run db:setup` | **Destructive fresh start** — drops and recreates tables, reseeds demos. Use once at setup |
| `review-job.ts` | `npm run review:job` | **Non-destructive** — creates missing tables, seeds only when empty; safe on every run |

`review-job.ts` modes:

```bash
npm run review:job -- --mode check    # report health; exit 2 if demo data is missing
npm run review:job -- --mode once     # fix any missing schema/seed idempotently (default)
npm run review:job -- --mode daemon --interval-minutes 60   # poll forever
```

Exit codes: `0` healthy/applied, `1` failure, `2` check found something to fix.

The scheduler **never touches user-written reviews** — it only seeds the demo
restaurant if the table is empty and the 3 demo reviews if the reviews table is
empty — so it is safe to run against a live database that already has real data.

## Scheduler: demo-data health & weekly cron

`.github/workflows/db-health.yml` runs **every Monday 06:37 UTC** (and on
manual "Run workflow"): it installs dependencies and runs
`npx tsx scripts/review-job.ts --mode once` with `DATABASE_URL` from the repo
secret. The effect lives in the database (no commit-back needed); a red run
means the DB needs attention.

**One-time set up of the secret:** GitHub → **Settings → Secrets and
variables → Actions → New repository secret** → name `DATABASE_URL`, value =
your Neon connection string.

## Deploy to Vercel

1. Push this repository to GitHub and **Import** it in Vercel (the build is
   the default Next.js build).
2. Add an **Environment Variable** `DATABASE_URL` (your Neon connection
   string) for the production environment.
3. Ensure the demo data exists: run `npm run review:job -- --mode once`
   locally one time (your local and deployed app can share the same Neon DB),
   or run the GitHub Actions "Database Health & Demo Seed" workflow.
4. Deploy → open your site at `/restaurant/1`.

## Configuration

| Variable | Where | Required |
|---|---|---|
| `DATABASE_URL` | `.env.local` (local) / Vercel env (prod) / GitHub secret (Actions) | Yes — the only secret |

## Removing the demo data

The demo rows are ordinary rows in your database. To start clean LATER without
recreating the schema:

```bash
npx tsx -e "const {neon}=require('@neondatabase/serverless');const s=neon(process.env.DATABASE_URL!);(async()=>{await s\`DELETE FROM reviews\`;await s\`DELETE FROM restaurants\`})()"
```

(Or just use `npm run db:setup` for a full destructive reset.)

## Contributing

- Keep the **avg computed fresh, not stored** — that property is the point.
- Keep **validation server-side** (rating/comment/restaurant checks) on any
  new write path.
- Keep DB access going through **`getDb()` in `lib/db.ts`** — constructing
  `neon()` at module scope breaks `next build` without a `DATABASE_URL`.
- Never make `review-job.ts` destructive — a separate `--force-reset` belongs
  in `db-setup.ts`, not the scheduler.
- This is a deliberately small, portable demo — resist framework sprawl.
- Match the Zomato palette (`#E23744` red, warm neutrals, card + ring
  patterns) so new screens look native to the app.

---

Built by [Sarthak Singh](https://github.com/sarthak0050) as a learning build of
the core Zomato review loop — Next.js · TypeScript · Neon.
This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Changelog Automation

`CHANGELOG.md` is regenerated weekly from the commit log by
`.github/workflows/weekly-changelog.yml` and committed **as the repo owner**
so this project's maintenance is credited to you rather than to
`github-actions[bot]`.

| | |
|---|---|
| Schedule | Wednesdays, 07:43 UTC |
| Source of truth | Commit messages on the default branch |
| Noise control | Only commits when the file actually changed |
| Credentials | Needs the `PAT_TOKEN` secret, otherwise it regenerates but does not commit |

**One-time setup**

1. Create a [fine-grained token](https://github.com/settings/personal-access-tokens/new)
   scoped to this repository only, with **Contents: Read and write**.
2. Add it as a repository secret named `PAT_TOKEN`:
   **Settings → Secrets and variables → Actions → New repository secret**.

Until that secret exists the job still regenerates `CHANGELOG.md` and prints
the diff, it just skips the commit, so no bot-authored noise lands in the
history.

