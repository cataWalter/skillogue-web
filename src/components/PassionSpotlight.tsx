'use client';

import { useState, useEffect } from 'react';
import { useMasterData } from '../hooks/useMasterData';

interface PassionSpotlightProps {
  userPassions?: Array<{ passion_id: number }>;
  userId?: string;
}

const PassionSpotlight = ({ userPassions, userId }: PassionSpotlightProps) => {
  const { passions, loading } = useMasterData();
  const [featuredPassion, setFeaturedPassion] = useState(passions[0]);

  useEffect(() => {
    if (passions.length > 0) {
      // If user has passions, pick randomly from their passions
      if (userPassions && userPassions.length > 0) {
        const userPassionIds = userPassions.map(p => p.passion_id);
        const randomUserPassionId = userPassionIds[Math.floor(Math.random() * userPassionIds.length)];
        const userPassion = passions.find(p => p.id === randomUserPassionId);
        if (userPassion) {
          setFeaturedPassion(userPassion);
          return;
        }
      }
      // Otherwise pick a random passion
      const random = passions[Math.floor(Math.random() * passions.length)];
      setFeaturedPassion(random);
    }
  }, [passions, userPassions]);

  if (loading || !featuredPassion) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-indigo-800/30">
      <h3 className="text-lg font-bold text-white mb-2">
        Passion Spotlight
      </h3>
      <p className="text-indigo-200 mb-4">
        {userPassions && userPassions.length > 0 && userId
          ? 'Your passion for '
          : 'Connect with others who share your love for '}
        <span className="font-semibold text-white">{featuredPassion.name}</span>
      </p>
      <button className="text-sm text-indigo-300 hover:text-indigo-200 transition underline">
        Find people with this passion →
      </button>
    </div>
  );
};

export default PassionSpotlight;
