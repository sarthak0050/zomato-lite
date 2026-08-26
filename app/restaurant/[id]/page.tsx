import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { notFound } from 'next/navigation';

const sql = neon(process.env.DATABASE_URL!);

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurantId = parseInt(id, 10);

  // Check if restaurant exists
  const restaurants = await sql`SELECT * FROM restaurants WHERE id = ${restaurantId}`;
  if (restaurants.length === 0) {
    notFound();
  }

  const restaurant = restaurants[0];

  // Compute averageRating — computed fresh, never stored
  const avgResult = await sql`SELECT AVG(rating) as average FROM reviews WHERE restaurant_id = ${restaurantId}`;
  const averageRating =
    avgResult[0].average !== null
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
  let reviews: { id: number; rating: number; comment: string; createdAt: string }[] = [];
  if (latestResult.length > 0) {
    reviews = await sql`
      SELECT id, rating, comment, created_at as "createdAt"
      FROM reviews
      WHERE restaurant_id = ${restaurantId} AND id != ${latestResult[0].id}
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

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-start justify-center px-4 pt-16">
      <div className="w-full max-w-[560px]">
        {/* Restaurant header */}
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {restaurant.name}
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          {restaurant.cuisine} · {restaurant.area}
        </p>

        {/* Average rating — big, first thing your eye lands on */}
        <div className="mt-8 flex items-baseline gap-2">
          <span className="text-5xl font-bold text-[#1A1A1A]">
            {averageRating !== null ? averageRating : '—'}
          </span>
          <span className="text-sm text-[#6B6B6B]">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Latest review — highlighted */}
        {latestReview && (
          <div className="mt-10 p-5 rounded-xl bg-white border border-[#E5E5E2]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[#C45D3E] bg-[#FEF3EE] px-2 py-0.5 rounded">
                Latest
              </span>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {latestReview.rating}.0
              </span>
            </div>
            <p className="text-[#1A1A1A]">{latestReview.comment}</p>
          </div>
        )}

        {/* Older reviews */}
        {reviews.length > 0 && (
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="py-4 border-b border-[#EFEFEC]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {review.rating}.0
                  </span>
                </div>
                <p className="text-[#1A1A1A]">{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {totalReviews === 0 && (
          <div className="mt-10 text-center">
            <p className="text-[#6B6B6B] mb-4">No reviews yet. Be the first!</p>
          </div>
        )}

        {/* Link to write a review */}
        <div className="mt-10 mb-16">
          <Link
            href={`/review/${restaurantId}`}
            className="block w-full py-3 rounded-lg font-medium text-white text-center bg-[#C45D3E] hover:bg-[#B3512F] transition-colors"
          >
            Write a review
          </Link>
        </div>
      </div>
    </div>
  );
}