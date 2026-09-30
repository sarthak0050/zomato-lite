import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantId, rating, comment } = body;

    const sql = getDb();

    // Check 1: rating is an integer from 1 to 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a whole number between 1 and 5' },
        { status: 400 }
      );
    }

    // Check 2: comment is a non-empty string after trimming
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    // Check 3: restaurantId refers to a restaurant that actually exists
    const restaurants = await sql`SELECT id FROM restaurants WHERE id = ${restaurantId}`;
    if (restaurants.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 400 }
      );
    }

    // All checks passed — insert the review
    const result = await sql`
      INSERT INTO reviews (restaurant_id, rating, comment)
      VALUES (${restaurantId}, ${rating}, ${comment.trim()})
      RETURNING id
    `;

    return NextResponse.json(
      { success: true, reviewId: result[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}