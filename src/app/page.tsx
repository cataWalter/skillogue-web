import Link from 'next/link';
import { MessageCircle, ShieldCheck, Sparkles, ArrowRight, Users, Heart, Zap, Star, ArrowDown, Search } from 'lucide-react';
import { marketingPageCopy } from '../lib/app-copy';

export default function Home() {
  const { home } = marketingPageCopy;

  return (
    <>
      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-6 animate-fade-in-up">
          <Zap size={16} className="text-yellow-400 animate-pulse" />
          <span>{home.badge}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent leading-tight animate-fade-in-up delay-100">
          {home.heroHeading}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
          {home.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto px-4 sm:px-0 animate-fade-in-up delay-300">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105 transition-all duration-300 text-center group"
          >
            <span className="flex items-center justify-center gap-2">
              {home.getStarted}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <Link
            href="/search"
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 border-2 border-gray-600 rounded-full font-semibold hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 text-center"
          >
            {home.exploreConnections}
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-gray-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 md:gap-12 text-center">
          <h2 className="sr-only">{home.coreFeaturesTitle}</h2>
          <div className="flex flex-col items-center p-6 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 card-hover-lift">
            <div className="p-4 bg-purple-600/20 rounded-2xl mb-4">
              <Sparkles className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{home.featureCards[0].title}</h3>
            <p className="text-gray-400">
              {home.featureCards[0].description}
            </p>
          </div>

          <div className="flex flex-col items-center p-6 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300 card-hover-lift">
            <div className="p-4 bg-blue-600/20 rounded-2xl mb-4">
              <MessageCircle className="h-12 w-12 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{home.featureCards[1].title}</h3>
            <p className="text-gray-400">
              {home.featureCards[1].description}
            </p>
          </div>

          <div className="flex flex-col items-center p-6 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-green-500/50 transition-all duration-300 card-hover-lift">
            <div className="p-4 bg-green-600/20 rounded-2xl mb-4">
              <ShieldCheck className="h-12 w-12 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{home.featureCards[2].title}</h3>
            <p className="text-gray-400">
              {home.featureCards[2].description}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                10K+
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Users size={18} />
                <span>{home.stats.activeUsers}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Heart size={18} />
                <span>{home.stats.passions}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                50+
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <MessageCircle size={18} />
                <span>{home.stats.languages}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                100K+
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <MessageCircle size={18} />
                <span>{home.stats.connections}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">{home.ctaHeading}</h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
            {home.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 group"
            >
              {home.ctaPrimary}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300"
            >
              {home.ctaLogIn}
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">{home.howItWorksTitle}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform">
                <Star size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{home.steps[0].title}</h3>
              <p className="text-gray-400">{home.steps[0].description}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform">
                <Search size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{home.steps[1].title}</h3>
              <p className="text-gray-400">{home.steps[1].description}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{home.steps[2].title}</h3>
              <p className="text-gray-400">{home.steps[2].description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className="flex justify-center pb-8">
        <div className="animate-bounce text-gray-500">
          <ArrowDown size={24} />
        </div>
      </div>
    </>
  );
}
