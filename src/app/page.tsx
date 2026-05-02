import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { marketingPageCopy } from '../lib/app-copy';

export const metadata: Metadata = {
  title: {
    absolute: 'Skillogue — Connect Through Shared Passions',
  },
  description: 'Find and connect with people who share your passions and skills. Join Skillogue today to discover your community.',
  openGraph: {
    title: 'Skillogue — Connect Through Shared Passions',
    description: 'Find and connect with people who share your passions and skills.',
    url: 'https://skillogue.vercel.app',
    type: 'website',
  },
};

const PASSION_TAGS: { label: string; color: string }[] = [
  { label: 'Hiking', color: 'bg-discovery/15 text-discovery border-discovery/25' },
  { label: 'Coffee', color: 'bg-warning/15 text-warning border-warning/25' },
  { label: 'Photography', color: 'bg-brand/15 text-brand border-brand/25' },
  { label: 'Chess', color: 'bg-connection/15 text-connection border-connection/25' },
  { label: 'Baking', color: 'bg-warning/15 text-warning border-warning/25' },
  { label: 'Gaming', color: 'bg-brand/15 text-brand border-brand/25' },
  { label: 'Climbing', color: 'bg-discovery/15 text-discovery border-discovery/25' },
  { label: 'Yoga', color: 'bg-connection/15 text-connection border-connection/25' },
  { label: 'Writing', color: 'bg-brand/15 text-brand border-brand/25' },
  { label: 'Cooking', color: 'bg-warning/15 text-warning border-warning/25' },
  { label: 'Travel', color: 'bg-discovery/15 text-discovery border-discovery/25' },
  { label: 'Music', color: 'bg-connection/15 text-connection border-connection/25' },
  { label: 'Running', color: 'bg-brand/15 text-brand border-brand/25' },
  { label: 'Anime', color: 'bg-connection/15 text-connection border-connection/25' },
  { label: 'Cycling', color: 'bg-discovery/15 text-discovery border-discovery/25' },
  { label: 'Architecture', color: 'bg-warning/15 text-warning border-warning/25' },
  { label: 'Dancing', color: 'bg-connection/15 text-connection border-connection/25' },
  { label: 'Books', color: 'bg-brand/15 text-brand border-brand/25' },
  { label: 'Astronomy', color: 'bg-discovery/15 text-discovery border-discovery/25' },
  { label: 'Surfing', color: 'bg-warning/15 text-warning border-warning/25' },
];

export default function Home() {
  const { home } = marketingPageCopy;

  return (
    <div className="pb-12 sm:pb-20">
      {/* ── Hero ── */}
      <section className="editorial-shell py-10 sm:py-16 lg:py-20">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-connection/10" />
          <div className="absolute -right-24 -top-8 h-64 w-64 rounded-full bg-discovery/15 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-8 left-8 h-48 w-48 rounded-full bg-connection/10 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-center">
            {/* Left: copy */}
            <div className="text-left">
              <div className="editorial-kicker mb-6 border-brand/20 bg-brand/10 text-brand-soft animate-fade-in-up">
                <span>{home.badge}</span>
              </div>
              <h1 className="text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up delay-100">
                <span className="bg-gradient-to-r from-brand-start via-discovery-end to-connection-end bg-clip-text text-transparent">
                  {home.heroHeading}
                </span>
              </h1>
              <p className="mt-4 text-xs text-faint animate-fade-in-up delay-200">
                Photography · Chess · Baking · Hiking · Astronomy
              </p>
              <p className="mt-3 max-w-xl text-base text-muted sm:text-lg md:text-xl animate-fade-in-up delay-300">
                {home.heroSubtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-fade-in-up delay-400">
                <Link
                  href="/signup"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-start to-brand-end px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-glow sm:w-auto sm:px-8 sm:py-4"
                >
                  {home.getStarted}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex w-full items-center justify-center rounded-full border border-line/40 bg-surface/60 px-6 py-3 font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-line/60 hover:bg-surface-secondary/70 sm:w-auto sm:px-8 sm:py-4"
                >
                  {home.exploreConnections}
                </Link>
              </div>
            </div>

            {/* Right: passion tag cloud — desktop only */}
            <div className="hidden lg:block">
              <p className="mb-3 text-right text-xs font-semibold uppercase tracking-widest text-faint">100 passions to explore</p>
              <div className="flex flex-wrap justify-end gap-2.5" aria-hidden="true">
                {PASSION_TAGS.map((tag) => (
                  <span
                    key={tag.label}
                    className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium ${tag.color}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sign-in prompt ── */}
      <div className="editorial-shell pb-8 text-center">
        <p className="text-sm text-faint">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand transition-colors hover:text-brand-soft">
            {home.ctaLogIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
