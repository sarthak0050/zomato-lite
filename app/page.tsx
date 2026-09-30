import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-gradient-to-b from-[#F7F6F2] to-white flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 shadow-sm ring-1 ring-[#E8E6DE]">
          <span className="h-2 w-2 rounded-full bg-[#E23744]" />
          <span className="text-xs font-medium text-[#4F4F4F]">Zomato Lite</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#111111] leading-tight">
          Discover restaurants. Share your reviews.
        </h1>
        <p className="text-base sm:text-lg text-[#6B6B6B]">
          A minimal Zomato-like experience — browse, see honest ratings, and add your own review in seconds.
        </p>
        <Link
          href="/restaurant/1"
          className="inline-flex items-center gap-2 rounded-full bg-[#E23744] px-6 py-3 text-white shadow-sm transition-all hover:bg-[#D12C39] hover:shadow-md active:scale-[0.995]"
        >
          Go to Ludhiana Burrito
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
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="flex items-center justify-center gap-6 text-xs text-[#6B6B6B] pt-2">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> Ratings computed fresh
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" /> Latest review highlighted
          </span>
        </div>
      </div>
    </div>
  );
}