/**
 * review-job — scheduled database health + idempotent demo seeding.
 *
 * Unlike scripts/db-setup.ts (which DROPs and recreates the tables every run),
 * this job is non-destructive:
 *   - creates the tables only if they do not exist
 *   - seeds the demo restaurant only if the restaurants table is empty
 *   - seeds the 3 demo reviews only if there are zero reviews in the system
 *   - never touches existing (user-written) reviews
 *
 * Modes:
 *   check      Verify connection + schema + seed presence; report only.
 *   once       Same checks, then apply any missing schema/seed idempotently.
 *   daemon     Loop every --interval-minutes, running the `once` logic.
 *
 * Exit codes:
 *   0   healthy (or setup/seed applied successfully)
 *   1   failed (DB unreachable, bad DATABASE_URL, or query error)
 *   2   check mode: an issue was found that `--mode once` would fix
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

type Sql = NeonQueryFunction<false, false>;

const DEMO_RESTAURANTS = [
  {
    id: 1,
    name: 'Ludhiana Burrito',
    cuisine: 'Indian',
    area: 'Sector 32',
  },
];

const DEMO_REVIEWS = [
  { rating: 5, comment: 'Paneer burrito is unreal' },
  { rating: 4, comment: 'Good, but slow service' },
  { rating: 4, comment: 'Solid. Would repeat.' },
];

interface ArgOptions {
  mode: 'check' | 'once' | 'daemon';
  intervalMinutes: number;
}

function parseArgs(argv: string[]): ArgOptions {
  const options: ArgOptions = { mode: 'once', intervalMinutes: 60 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mode') {
      const value = argv[i + 1] as ArgOptions['mode'] | undefined;
      if (!value || !['check', 'once', 'daemon'].includes(value)) {
        throw new Error(`Unknown --mode "${value ?? ''}" (check|once|daemon)`);
      }
      options.mode = value;
    } else if (arg === '--interval-minutes') {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('--interval-minutes must be a positive number');
      }
      options.intervalMinutes = value;
    }
  }
  return options;
}

function getSql() {
  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (see .env.local.example) ' +
        'or as a GitHub Actions secret',
    );
  }
  return neon(DATABASE_URL);
}

async function tableExists(sql: Sql, table: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
  `;
  return rows.length > 0;
}

interface Health {
  tablesReady: boolean;
  restaurants: number;
  reviews: number;
  issues: string[];
}

async function checkHealth(sql: Sql): Promise<Health> {
  const reviewsExist = await tableExists(sql, 'reviews');
  const restaurantsExist = await tableExists(sql, 'restaurants');
  const tablesReady = reviewsExist && restaurantsExist;

  let restaurants = 0;
  let reviews = 0;
  if (tablesReady) {
    const [rRes, vRes] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM restaurants`,
      sql`SELECT COUNT(*)::int AS count FROM reviews`,
    ]);
    restaurants = rRes[0].count;
    reviews = vRes[0].count;
  }

  const issues: string[] = [];
  if (!tablesReady) {
    issues.push('schema missing (run --mode once to create the tables)');
  } else if (restaurants === 0) {
    issues.push('no restaurants (run --mode once to seed the demo restaurant)');
  } else if (reviews === 0) {
    issues.push('no reviews (run --mode once to seed the 3 demo reviews)');
  }

  return { tablesReady, restaurants, reviews, issues };
}

function printHealth(health: Health): void {
  console.log(`tables ready:  ${health.tablesReady ? 'yes' : 'no'}`);
  console.log(`restaurants:   ${health.restaurants}`);
  console.log(`reviews:       ${health.reviews}`);
  if (health.issues.length === 0) {
    console.log('status:        healthy');
  } else {
    console.log(`issues:        ${health.issues.join('; ')}`);
  }
}

async function ensureSchema(sql: Sql): Promise<void> {
  console.log('Creating restaurants table if missing…');
  await sql`
    CREATE TABLE IF NOT EXISTS restaurants (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      cuisine   TEXT NOT NULL,
      area      TEXT NOT NULL
    )
  `;
  console.log('Creating reviews table if missing…');
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id            SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment       TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function seedDemo(sql: Sql): Promise<void> {
  const [rRes] = await sql`SELECT COUNT(*)::int AS count FROM restaurants`;
  if (rRes.count === 0) {
    console.log('Seeding demo restaurant (Ludhiana Burrito)…');
    for (const restaurant of DEMO_RESTAURANTS) {
      await sql`
        INSERT INTO restaurants (id, name, cuisine, area)
        VALUES (${restaurant.id}, ${restaurant.name}, ${restaurant.cuisine}, ${restaurant.area})
      `;
    }
  } else {
    console.log('Restaurants already present; skipping restaurant seed.');
  }

  const [vRes] = await sql`SELECT COUNT(*)::int AS count FROM reviews`;
  if (vRes.count === 0) {
    console.log('Seeding 3 demo reviews…');
    for (const review of DEMO_REVIEWS) {
      await sql`
        INSERT INTO reviews (restaurant_id, rating, comment, created_at)
        VALUES (1, ${review.rating}, ${review.comment}, NOW() - (RANDOM() * INTERVAL '10 days'))
      `;
    }
  } else {
    console.log('Reviews already present; never touching user-written reviews.');
  }
}

async function runOnce(sql: Sql): Promise<void> {
  const health = await checkHealth(sql);
  printHealth(health);

  if (health.tablesReady && health.restaurants > 0 && health.reviews > 0) {
    console.log('UP TO DATE: schema and demo data already present.');
    return;
  }

  console.log('Applying missing schema/seed (non-destructive)…');
  await ensureSchema(sql);
  await seedDemo(sql);

  const after = await checkHealth(sql);
  printHealth(after);
}

async function runDaemon(
  sql: Sql,
  intervalMinutes: number,
): Promise<never> {
  const intervalMs = Math.max(30, intervalMinutes * 60 * 1000);
  let tick = 0;
  console.log(
    `DAEMON START: polling every ${intervalMinutes}m (first run seeds if empty)`,
  );
  // biome-ignore lint/style/noInfiniteLoop: intentional long-running scheduler
  for (;;) {
    tick += 1;
    const stamp = new Date().toISOString();
    console.log(`\n[${stamp}] check #${tick}`);
    const health = await checkHealth(sql);
    printHealth(health);
    if (health.issues.length > 0) {
      await runOnce(sql);
    } else {
      console.log('Healthy; nothing to do.');
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs));
  }
}

async function main(argv: string[]): Promise<number> {
  let options: ArgOptions;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`ARGUMENT ERROR: ${(error as Error).message}`);
    console.error('Usage: tsx scripts/review-job.ts --mode check|once|daemon [--interval-minutes N]');
    return 1;
  }

  let sql: Sql;
  try {
    sql = getSql();
  } catch (error) {
    console.error(`DB CONFIG ERROR: ${(error as Error).message}`);
    return 1;
  }

  try {
    if (options.mode === 'check') {
      const health = await checkHealth(sql);
      printHealth(health);
      return health.issues.length === 0 ? 0 : 2;
    }
    if (options.mode === 'daemon') {
      await runDaemon(sql, options.intervalMinutes);
      return 0; // unreachable
    }
    await runOnce(sql);
    return 0;
  } catch (error) {
    console.error(`DB ERROR: ${(error as Error).message}`);
    return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`FATAL: ${(error as Error).message}`);
    process.exitCode = 1;
  });