import Link from 'next/link';
import { MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <>
      <section className="px-4 sm:px-6 py-12 sm:py-16 text-center max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent leading-tight">
          Connect by Passion
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
          Skillogue brings together people who share your interests — not just your looks.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto px-4 sm:px-0">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition text-center"
          >
            Get Started
          </Link>
          <Link
            href="/search"
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 border border-gray-600 rounded-full font-semibold hover:bg-gray-800 transition text-center"
          >
            Explore Connections
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-gray-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 md:gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-purple-600/20 rounded-full mb-4">
              <Sparkles className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Passion-Based Matching</h3>
            <p className="text-gray-400">
              Discover people who love what you love — from coding to cooking, music to
              mountaineering.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-4 bg-blue-600/20 rounded-full mb-4">
              <MessageCircle className="h-12 w-12 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Private Messaging</h3>
            <p className="text-gray-400">
              Chat securely with like-minded individuals in real time.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-4 bg-green-600/20 rounded-full mb-4">
              <ShieldCheck className="h-12 w-12 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Safe & Trusted</h3>
            <p className="text-gray-400">
              Built-in safety tools and verified profiles keep your experience secure.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12 sm:py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Find Your Tribe?</h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
          Join Skillogue today and start connecting with people who truly get you.
        </p>
        <Link
          href="/signup"
          className="inline-block w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition"
        >
          Start Searching by Passion
        </Link>
      </section>
    </>
  );
}
