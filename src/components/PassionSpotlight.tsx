'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface PassionSpotlightProps {
  userPassions?: Array<{ passion_id: number | string; passions?: { name: string } | null }>;
  userId?: string;
  loading?: boolean;
}

const PassionSpotlight = ({ userPassions, userId, loading = false }: PassionSpotlightProps) => {
  const [featuredPassion, setFeaturedPassion] = useState<{ id: number | string; name: string } | null>(null);

  useEffect(() => {
    const namedPassions = (userPassions || [])
      .filter((passion): passion is { passion_id: number | string; passions: { name: string } } => Boolean(passion.passions?.name))
      .map((passion) => ({
        id: passion.passion_id,
        name: passion.passions.name,
      }));

    if (namedPassions.length === 0) {
      setFeaturedPassion(null);
      return;
    }

    const random = namedPassions[Math.floor(Math.random() * namedPassions.length)];
    setFeaturedPassion(random);
  }, [userPassions]);

  if (loading) {
    return (
      <div className="bg-surface-secondary/60 rounded-xl p-6 animate-pulse border border-line/30">
        <div className="h-4 bg-surface-secondary rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-surface-secondary rounded w-full mb-2"></div>
        <div className="h-3 bg-surface-secondary rounded w-2/3"></div>
      </div>
    );
  }

  if (!featuredPassion) {
    return (
      <div className="bg-brand/10 rounded-xl p-6 border border-brand/20">
        <h3 className="text-lg font-bold text-foreground mb-2">
          Passion Spotlight
        </h3>
        <p className="text-muted mb-4">
          Add a few passions to your profile to get more relevant suggestions on the dashboard.
        </p>
        <Link href="/edit-profile" className="text-sm text-brand hover:text-brand-soft transition underline">
          Complete your passions →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-brand/10 rounded-xl p-6 border border-brand/20">
      <h3 className="text-lg font-bold text-foreground mb-2">
        Passion Spotlight
      </h3>
      <p className="text-muted mb-4">
        {userPassions && userPassions.length > 0 && userId
          ? 'Your passion for '
          : 'Connect with others who share your love for '}
        <span className="font-semibold text-foreground">{featuredPassion.name}</span>
      </p>
      <Link href="/search" className="text-sm text-brand hover:text-brand-soft transition underline">
        Find people with this passion →
      </Link>
    </div>
  );
};

export default PassionSpotlight;
