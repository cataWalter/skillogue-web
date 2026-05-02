'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { passionSpotlightCopy } from '@/lib/app-copy';

interface PassionSpotlightProps {
  userPassions?: Array<{ passion_id: number | string; passions?: { name: string } | null }>;
  userId?: string;
  loading?: boolean;
}

const CYCLE_INTERVAL_MS = 5000;

const PassionSpotlight = ({ userPassions, loading = false }: PassionSpotlightProps) => {
  const [namedPassions, setNamedPassions] = useState<Array<{ id: number | string; name: string }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const filtered = (userPassions || [])
      .filter((p): p is { passion_id: number | string; passions: { name: string } } => Boolean(p.passions?.name))
      .map((p) => ({ id: p.passion_id, name: p.passions.name }));
    setNamedPassions(filtered);
    setActiveIndex(0);
    setVisible(true);
  }, [userPassions]);

  useEffect(() => {
    if (namedPassions.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % namedPassions.length);
        setVisible(true);
      }, 300);
    }, CYCLE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [namedPassions]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-line/30 bg-surface-secondary/60 p-6">
        <div className="mb-4 h-8 w-8 rounded-full bg-surface-secondary" />
        <div className="mb-3 h-4 w-1/2 rounded bg-surface-secondary" />
        <div className="mb-2 h-3 w-3/4 rounded bg-surface-secondary" />
        <div className="h-3 w-1/2 rounded bg-surface-secondary" />
      </div>
    );
  }

  if (namedPassions.length === 0) {
    return (
      <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand/10 to-discovery/10 p-6">
        <div className="mb-4 inline-flex rounded-full bg-brand/15 p-2">
          <Sparkles size={18} className="text-brand" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-foreground">{passionSpotlightCopy.title}</h3>
        <p className="mb-5 text-sm leading-6 text-muted">{passionSpotlightCopy.emptyText}</p>
        <Link
          href="/edit-profile"
          className="inline-flex items-center justify-center rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand/20"
        >
          {passionSpotlightCopy.emptyCta}
        </Link>
      </div>
    );
  }

  const featured = namedPassions[activeIndex];

  return (
    <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand/10 to-discovery/15 p-6">
      <div className="mb-4 inline-flex rounded-full bg-brand/15 p-2">
        <Sparkles size={18} className="text-brand" />
      </div>
      <h3 className="mb-3 text-lg font-bold text-foreground">{passionSpotlightCopy.title}</h3>

      <div
        className="mb-5 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-sm text-muted">{passionSpotlightCopy.intro}</p>
        <p className="mt-1 text-xl font-bold bg-gradient-to-r from-brand-start to-discovery-end bg-clip-text text-transparent">
          {featured.name}
        </p>
      </div>

      {namedPassions.length > 1 && (
        <div className="mb-5 flex gap-1.5">
          {namedPassions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setVisible(false);
                setTimeout(() => {
                  setActiveIndex(i);
                  setVisible(true);
                }, 200);
              }}
              aria-label={`View passion ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-4 bg-brand' : 'w-1.5 bg-brand/30'
              }`}
            />
          ))}
        </div>
      )}

      <Link
        href="/search"
        className="inline-flex items-center justify-center rounded-full border border-line/40 bg-surface/70 px-4 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-line/60 hover:bg-surface-secondary/70"
      >
        {passionSpotlightCopy.cta}
      </Link>
    </div>
  );
};

export default PassionSpotlight;
