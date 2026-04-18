import Link from 'next/link';
import { MessageCircle, ShieldCheck, Sparkles, ArrowRight, Users, Heart, Zap, Star, ArrowDown, Search } from 'lucide-react';
import { marketingPageCopy } from '../lib/app-copy';

export default function Home() {
  const { home } = marketingPageCopy;

  return (
    <div className="pb-16 sm:pb-24">
      <section className="editorial-shell py-10 sm:py-16 lg:py-20">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-connection/10" />
          <div className="absolute -right-20 top-8 h-40 w-40 rounded-full bg-discovery/20 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-connection/15 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:items-end">
            <div className="text-left">
              <div className="editorial-kicker mb-6 border-brand/20 bg-brand/10 text-brand-soft animate-fade-in-up">
                <Zap size={16} className="text-warning animate-pulse" />
                <span>{home.badge}</span>
              </div>
              <h1 className="max-w-4xl text-4xl font-bold leading-[0.95] text-foreground sm:text-5xl md:text-7xl animate-fade-in-up delay-100">
                <span className="bg-gradient-to-r from-brand-start via-discovery-end to-connection-end bg-clip-text text-transparent">
                  {home.heroHeading}
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted sm:text-xl md:text-2xl animate-fade-in-up delay-200">
                {home.heroSubtitle}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row animate-fade-in-up delay-300">
                <Link
                  href="/login"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-start to-brand-end px-6 py-3 text-center font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-glow sm:w-auto sm:px-8 sm:py-4"
                >
                  {home.getStarted}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex w-full items-center justify-center rounded-full border border-line/40 bg-surface/60 px-6 py-3 text-center font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-line/60 hover:bg-surface-secondary/70 sm:w-auto sm:px-8 sm:py-4"
                >
                  {home.exploreConnections}
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="glass-surface rounded-[1.75rem] p-5">
                <div className="flex items-center gap-3 text-faint">
                  <Users size={18} className="text-brand" />
                  <span className="text-sm uppercase tracking-[0.2em]">{home.stats.activeUsers}</span>
                </div>
                <p className="mt-4 bg-gradient-to-r from-brand-start to-brand-end bg-clip-text text-4xl font-bold text-transparent">
                  10K+
                </p>
              </div>
              <div className="glass-surface rounded-[1.75rem] p-5">
                <div className="flex items-center gap-3 text-faint">
                  <Heart size={18} className="text-connection" />
                  <span className="text-sm uppercase tracking-[0.2em]">{home.stats.passions}</span>
                </div>
                <p className="mt-4 bg-gradient-to-r from-connection-start to-connection-end bg-clip-text text-4xl font-bold text-transparent">
                  500+
                </p>
              </div>
              <div className="glass-surface rounded-[1.75rem] p-5 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 text-faint">
                  <MessageCircle size={18} className="text-discovery" />
                  <span className="text-sm uppercase tracking-[0.2em]">{home.stats.languages}</span>
                </div>
                <p className="mt-4 bg-gradient-to-r from-discovery-start to-discovery-end bg-clip-text text-4xl font-bold text-transparent">
                  50+
                </p>
                <p className="mt-4 text-sm leading-6 text-muted">{home.featureCards[0].description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-shell py-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{home.coreFeaturesTitle}</h2>
            <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{home.ctaSubtitle}</p>
          </div>
          <div className="editorial-kicker border-line/30 bg-surface/70 text-faint">
            <Sparkles size={16} className="text-discovery" />
            <span>{home.badge}</span>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-surface card-hover-lift rounded-[1.75rem] p-6 text-left transition-all duration-300 hover:border-discovery/40">
            <div className="mb-6 inline-flex rounded-2xl bg-discovery/15 p-4">
              <Sparkles className="h-12 w-12 text-discovery" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{home.featureCards[0].title}</h3>
            <p className="mt-3 text-faint">{home.featureCards[0].description}</p>
          </div>
          <div className="glass-surface card-hover-lift rounded-[1.75rem] p-6 text-left transition-all duration-300 hover:border-connection/40">
            <div className="mb-6 inline-flex rounded-2xl bg-connection/15 p-4">
              <MessageCircle className="h-12 w-12 text-connection" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{home.featureCards[1].title}</h3>
            <p className="mt-3 text-faint">{home.featureCards[1].description}</p>
          </div>
          <div className="glass-surface card-hover-lift rounded-[1.75rem] p-6 text-left transition-all duration-300 hover:border-approval/40">
            <div className="mb-6 inline-flex rounded-2xl bg-approval/15 p-4">
              <ShieldCheck className="h-12 w-12 text-approval" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{home.featureCards[2].title}</h3>
            <p className="mt-3 text-faint">{home.featureCards[2].description}</p>
          </div>
        </div>
      </section>

      <section className="editorial-shell py-8 sm:py-10">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand/10 to-transparent" />
          <div className="relative">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">{home.howItWorksTitle}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="glass-surface rounded-[1.5rem] p-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-start to-brand-end">
                  <Star size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{home.steps[0].title}</h3>
                <p className="mt-3 text-faint">{home.steps[0].description}</p>
              </div>
              <div className="glass-surface rounded-[1.5rem] p-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-discovery-start to-discovery-end">
                  <Search size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{home.steps[1].title}</h3>
                <p className="mt-3 text-faint">{home.steps[1].description}</p>
              </div>
              <div className="glass-surface rounded-[1.5rem] p-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-connection-start to-connection-end">
                  <MessageCircle size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{home.steps[2].title}</h3>
                <p className="mt-3 text-faint">{home.steps[2].description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-shell py-8 sm:py-10">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-8 text-center sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/10 to-transparent pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{home.ctaHeading}</h2>
            <p className="mt-4 text-lg text-muted sm:text-xl">{home.ctaSubtitle}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-start to-brand-end px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-glow sm:w-auto"
              >
                {home.ctaPrimary}
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-line/40 bg-surface/70 px-8 py-4 font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-line/60 hover:bg-surface-secondary/70 sm:w-auto"
              >
                {home.ctaLogIn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-center pb-8">
        <div className="animate-float text-faint">
          <ArrowDown size={24} />
        </div>
      </div>
    </div>
  );
}
