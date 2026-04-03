'use client';

import { useState, useEffect } from 'react';
import { useMasterData } from '../hooks/useMasterData';

const PassionSpotlight = () => {
  const { passions, loading } = useMasterData();
  const [featuredPassion, setFeaturedPassion] = useState(passions[0]);

  useEffect(() => {
    if (passions.length > 0) {
      const random = passions[Math.floor(Math.random() * passions.length)];
      setFeaturedPassion(random);
    }
  }, [passions]);

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
        Connect with others who share your love for <span className="font-semibold text-white">{featuredPassion.name}</span>
      </p>
      <button className="text-sm text-indigo-300 hover:text-indigo-200 transition underline">
        Find people with this passion →
      </button>
    </div>
  );
};

export default PassionSpotlight;
