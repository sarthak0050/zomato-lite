import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <Link
        href="/restaurant/1"
        className="text-lg text-[#C45D3E] hover:text-[#B3512F] transition-colors"
      >
        Zomato Lite — Go to Ludhiana Burrito
      </Link>
    </div>
  );
}