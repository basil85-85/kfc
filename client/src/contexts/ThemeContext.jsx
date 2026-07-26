import { createContext, useEffect, useState } from 'react';
import api from '../services/api';

export const ThemeContext = createContext();

// Helper to compute luminance from hex color string
const getLuminance = (hex) => {
  if (!hex || typeof hex !== 'string') return 0;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const applyTheme = (theme) => {
  if (!theme) return;
  const root = document.documentElement;

  const primary = theme.primaryColor || '#060B14';
  const secondary = theme.secondaryColor || '#0F1A2E';
  const accent = theme.accentColor || '#FF6B1A';
  const background = theme.backgroundColor || '#060B14';

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--secondary', secondary);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--background', background);

  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-background', background);

  // Contrast Safety Check for readable text against dynamic admin background
  const lum = getLuminance(background);
  if (lum > 0.65) {
    // Light Background Safety
    root.style.setProperty('--color-text', '#0F172A');
    root.style.setProperty('--color-text-muted', '#475569');
    root.style.setProperty('--text', '#0F172A');
    root.style.setProperty('--text-muted', '#475569');
  } else {
    // Dark Background Safety
    root.style.setProperty('--color-text', '#F5F1EA');
    root.style.setProperty('--color-text-muted', '#8B96AB');
    root.style.setProperty('--text', '#F5F1EA');
    root.style.setProperty('--text-muted', '#8B96AB');
  }

  document.body.className = theme.fontStyle ? `font-${theme.fontStyle.toLowerCase()}` : '';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    primaryColor: '#060B14',
    secondaryColor: '#0F1A2E',
    accentColor: '#FF6B1A',
    backgroundColor: '#060B14',
    fontStyle: 'Modern',
    heroText: 'Kolothum Kadhavu FC',
    tagline: 'Every Click. Every Goal. Every Spot Earned.',
    logoURL: '',
    bannerURL: '',
  });

  const fetchTheme = async () => {
    try {
      const { data } = await api.get('/theme');
      setTheme(data);
      applyTheme(data);
    } catch (error) {
      console.error('Unable to load theme', error);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  const updateTheme = async (updates) => {
    const { data } = await api.put('/theme', updates);
    setTheme(data);
    applyTheme(data);
    return data;
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, reloadTheme: fetchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

