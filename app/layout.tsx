import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zomato Lite",
  description: "Discover restaurants and share reviews — a Zomato Lite experience",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F7F6F2] text-[#111111] flex flex-col">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E8E6DE] shadow-sm">
          <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-[#E23744] grid place-items-center shadow-sm">
                <span className="text-white text-lg font-semibold">Z</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">Zomato Lite</span>
            </div>
            <nav className="flex items-center gap-4 text-sm text-[#1F1F1F]">
              <Link href="/" className="hover:text-[#E23744] transition-colors">Home</Link>
              <Link href="/restaurant/1" className="hover:text-[#E23744] transition-colors">Restaurants</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#E8E6DE] bg-white/90">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-[#6B6B6B] flex flex-col md:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Zomato Lite</p>
            <p>Made with Next.js & Neon</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
