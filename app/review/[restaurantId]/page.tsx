'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = Number(params.restaurantId);

  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = rating !== null && comment.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, rating, comment: comment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setSubmitting(false);
        return;
      }

      router.push(`/restaurant/${restaurantId}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#F7F6F2] py-10 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8E6DE] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#E23744] to-[#FF7A45]" />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
              Ludhiana Burrito
            </h1>
            <p className="mt-1 text-sm text-[#6B6B6B]">Share your experience</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <div>
                <label className="mb-3 block text-sm font-medium text-[#111111]">
                  Your rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} star${star === 1 ? '' : 's'}`}
                      onClick={() => setRating(star)}
                      className={`h-12 w-12 rounded-lg text-lg font-medium transition-all ${
                        rating !== null && star <= rating
                          ? 'bg-[#E23744] text-white shadow-sm scale-105'
                          : 'bg-[#F1EFE8] text-[#6B6B6B] hover:bg-[#E7E4DA]'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="mt-2 h-4 text-xs text-[#6B6B6B]">
                  {rating === null
                    ? 'Tap a star to rate'
                    : ['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent'][rating]}
                </p>
              </div>

              <div>
                <label
                  htmlFor="comment"
                  className="mb-2 block text-sm font-medium text-[#111111]"
                >
                  Your review
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border border-[#E0DDD3] bg-white px-4 py-3 text-[#111111] placeholder-[#9A9A9A] transition-colors focus:border-[#E23744] focus:outline-none"
                  placeholder="How was your experience?"
                />
                <p className="mt-1 text-right text-xs text-[#6B6B6B]">
                  {comment.length}/500
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#F3C6C6] bg-[#FFF1EE] px-4 py-3 text-sm text-[#C1272F]"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto rounded-full border border-[#E0DDD3] px-5 py-3 text-sm font-medium text-[#4F4F4F] transition-colors hover:bg-[#F7F6F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full sm:w-auto rounded-full bg-[#E23744] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#D12C39] hover:shadow-md active:scale-[0.995] disabled:cursor-not-allowed disabled:bg-[#D9D6CB] disabled:text-[#9A9A9A] disabled:shadow-none"
                >
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}