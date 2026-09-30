import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null = null;

/**
 * Lazy, cached Neon client.
 *
 * Created on first use rather than at module scope so that `next build` can
 * compile the routes without a live database, and so a missing DATABASE_URL
 * surfaces as one clear error at request time.
 */
export function getDb(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Add it to .env.local (local), Vercel "Environment Variables" (deploy), or a GitHub Actions secret (CI).',
      );
    }
    client = neon(url);
  }
  return client;
}