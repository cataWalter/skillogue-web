// src/styles/palettes.ts

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  'accent-secondary': string;
  background: string;
  'background-secondary': string;
  text: string;
  'text-secondary': string;
  'text-tertiary': string;
  success: string;
  warning: string;
  error: string;
}

export const palettes: { light: ColorPalette; dark: ColorPalette } = {
  light: {
    primary: '#005f73', // Deep Teal
    secondary: '#0a9396', // Bright Teal
    accent: '#ee9b00', // Amber
    'accent-secondary': '#ca6702', // Burnt Orange
    background: '#f8f9fa', // Off-White
    'background-secondary': '#e9ecef', // Light Silver
    text: '#212529', // Charcoal
    'text-secondary': '#495057', // Slate Gray
    'text-tertiary': '#6c757d', // Steel Gray
    success: '#2a9d8f', // Muted Green
    warning: '#e9c46a', // Saffron
    error: '#d62828', // Rich Red
  },
  dark: {
    primary: '#94d2bd', // Seafoam Green
    secondary: '#e5e5e5', // Light Gray (for high contrast text)
    accent: '#fca311', // Bright Amber
    'accent-secondary': '#e85d04', // Vibrant Orange
    background: '#001219', // Midnight Blue
    'background-secondary': '#003049', // Dark Slate Blue
    text: '#e9ecef', // Light Silver
    'text-secondary': '#adb5bd', // Cool Gray
    'text-tertiary': '#6c757d', // Steel Gray
    success: '#2a9d8f', // Muted Green
    warning: '#e9c46a', // Saffron
    error: '#f07167', // Coral Red
  },
};