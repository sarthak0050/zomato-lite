import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDb } from '@/lib/db';

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurantId = parseInt(id, 10);

  const sql = getDb();

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
  let reviews;
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
    <div className="bg-[#F7F6F2] py-8 px-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E8E6DE]">
          <div className="h-28 sm:h-32 bg-gradient-to-r from-[#E23744] to-[#FF7A45]" />
          <div className="-mt-10 px-6 pb-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
                  {restaurant.name}
                </h1>
                <p className="mt-1 text-sm text-[#6B6B6B]">
                  {restaurant.cuisine} · {restaurant.area}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#E8E6DE] self-start sm:self-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#111111] leading-none">
                    {averageRating !== null ? averageRating.toFixed(1) : '—'}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-0.5" aria-hidden>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-[11px] leading-none ${
                          averageRating !== null && star <= Math.round(averageRating)
                            ? 'text-[#E23744]'
                            : 'text-[#DCD9CF]'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-9 w-px bg-[#E8E6DE]" />
                <div className="text-sm text-[#6B6B6B]">
                  <span className="block font-semibold text-[#111111] text-base leading-none">
                    {totalReviews}
                  </span>
                  <span className="mt-1 block">
                    {totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link
          href={`/review/${restaurantId}`}
          className="flex items-center justify-center gap-2 rounded-full bg-[#E23744] px-5 py-3 text-white shadow-sm transition-all hover:bg-[#D12C39] hover:shadow-md active:scale-[0.995]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Write a review
        </Link>

        {latestReview && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E8E6DE]">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1EE] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#E23744]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E23744]" />
                Latest
              </span>
              <span className="text-sm text-[#6B6B6B]">
                {new Date(latestReview.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm leading-none ${
                    star <= latestReview.rating ? 'text-[#E23744]' : 'text-[#DCD9CF]'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-[#111111] leading-relaxed">{latestReview.comment}</p>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8E6DE] divide-y divide-[#F0EEE7]">
            {reviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm leading-none ${
                          star <= review.rating ? 'text-[#E23744]' : 'text-[#DCD9CF]'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-[#6B6B6B]">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-[#111111] leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {totalReviews === 0 && (
          <div className="rounded-2xl border border-dashed border-[#DCD9CF] bg-white/60 py-12 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#F1EFE8] grid place-items-center text-xl">
              🍽️
            </div>
            <p className="font-medium text-[#111111]">No reviews yet</p>
            <p className="mt-1 text-sm text-[#6B6B6B]">Be the first to share your experience.</p>
          </div>
        )}
      </div>
    </div>
  );
}