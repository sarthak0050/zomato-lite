import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Dropping existing tables if they exist...');
  await sql`DROP TABLE IF EXISTS reviews`;
  await sql`DROP TABLE IF EXISTS restaurants`;

  console.log('Creating restaurants table...');
  await sql`
    CREATE TABLE restaurants (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      cuisine   TEXT NOT NULL,
      area      TEXT NOT NULL
    )
  `;

  console.log('Creating reviews table...');
  await sql`
    CREATE TABLE reviews (
      id            SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment       TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log('Seeding Ludhiana Burrito...');
  await sql`
    INSERT INTO restaurants (id, name, cuisine, area)
    VALUES (1, 'Ludhiana Burrito', 'Indian', 'Sector 32')
  `;

  console.log('Seeding reviews...');
  await sql`
    INSERT INTO reviews (restaurant_id, rating, comment, created_at)
    VALUES
      (1, 5, 'Paneer burrito is unreal', NOW() - INTERVAL '8 days'),
      (1, 4, 'Good, but slow service', NOW() - INTERVAL '6 days'),
      (1, 4, 'Solid. Would repeat.', NOW() - INTERVAL '2 days')
  `;

  console.log('\nVerifying rows...');
  const restaurants = await sql`SELECT * FROM restaurants`;
  console.log('\nRestaurants:');
  console.table(restaurants);

  const reviews = await sql`SELECT * FROM reviews ORDER BY created_at`;
  console.log('\nReviews:');
  console.table(reviews);

  console.log('\n✅ Database setup complete!');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});