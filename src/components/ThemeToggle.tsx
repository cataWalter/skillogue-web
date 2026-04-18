'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { componentCopy } from '../lib/app-copy';

const ThemeToggle = () => {
  const [theme, toggleTheme] = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = !mounted
    ? componentCopy.navbar.toggleTheme
    : theme === 'light'
      ? componentCopy.navbar.switchToDarkMode
      : componentCopy.navbar.switchToLightMode;
  const Icon = mounted && theme === 'light' ? MoonStar : SunMedium;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/40 bg-surface-secondary text-muted transition hover:bg-surface-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <Icon size={18} />
    </button>
  );
};

export default ThemeToggle;