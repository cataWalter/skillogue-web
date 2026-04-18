// src/hooks/useTheme.ts

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

const getPreferredTheme = (): Theme => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;

    if (root.classList.contains('light')) {
      return 'light';
    }

    if (root.classList.contains('dark')) {
      return 'dark';
    }
  }

  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedTheme = localStorage.getItem('theme');

  if (isTheme(savedTheme)) {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useTheme = (): [Theme, () => void] => {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return [theme, toggleTheme];
};