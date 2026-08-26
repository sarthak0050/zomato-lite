import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id, 10);

    // Check if restaurant exists
    const restaurants = await sql`SELECT * FROM restaurants WHERE id = ${restaurantId}`;
    if (restaurants.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const restaurant = restaurants[0];

    // Compute averageRating — this is computed fresh every time, never stored
    const avgResult = await sql`SELECT AVG(rating) as average FROM reviews WHERE restaurant_id = ${restaurantId}`;
    const averageRating = avgResult[0].average !== null
      ? parseFloat(parseFloat(avgResult[0].average).toFixed(1))
      : null;

    // Compute totalReviews
    const countResult = await sql`SELECT COUNT(*) as count FROM reviews WHERE restaurant_id = ${restaurantId}`;
    const totalReviews = parseInt(countResult[0].count, 10);

    // Get latestReview (newest by created_at)
    const latestResult = await sql`
      SELECT id, rating, comment, created_at as "createdAt"
      FROM reviews
      WHERE restaurant_id = ${restaurantId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const latestReview = latestResult.length > 0 ? latestResult[0] : null;

    // Get all other reviews (newest first, excluding latest)
    let reviews;
    if (latestReview) {
      reviews = await sql`
        SELECT id, rating, comment, created_at as "createdAt"
        FROM reviews
        WHERE restaurant_id = ${restaurantId} AND id != ${latestReview.id}
        ORDER BY created_at DESC
      `;
    } else {
      reviews = await sql`
        SELECT id, rating, comment, created_at as "createdAt"
        FROM reviews
        WHERE restaurant_id = ${restaurantId}
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      area: restaurant.area,
      averageRating,
      totalReviews,
      latestReview,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}