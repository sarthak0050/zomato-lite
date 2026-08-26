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
    <div className="min-h-screen bg-[#FAFAF8] flex items-start justify-center px-4 pt-16">
      <div className="w-full max-w-[560px]">
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">
          Ludhiana Burrito
        </h1>
        <p className="text-sm text-[#6B6B6B] mb-10">Write a review</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-12 h-12 rounded-lg text-lg font-medium transition-colors ${
                    rating !== null && star <= rating
                      ? 'bg-[#C45D3E] text-white'
                      : 'bg-[#EFEFEC] text-[#6B6B6B] hover:bg-[#E5E5E2]'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[#D9D9D5] bg-white px-4 py-3 text-[#1A1A1A] placeholder-[#9A9A9A] focus:outline-none focus:border-[#C45D3E] resize-none"
              placeholder="How was your experience?"
            />
          </div>

          {error && (
            <p className="text-sm text-[#C45D3E]">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 rounded-lg font-medium text-white transition-colors bg-[#C45D3E] hover:bg-[#B3512F] disabled:bg-[#D9D9D5] disabled:text-[#9A9A9A] disabled:cursor-not-allowed"
          >
            Submit review
          </button>
        </form>
      </div>
    </div>
  );
}