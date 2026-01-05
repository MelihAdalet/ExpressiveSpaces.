import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeSettings } from '../types';

interface ThemeContextType extends ThemeSettings {
  setSeedColor: (color: string) => void;
  toggleDarkMode: () => void;
  toggleRainbowMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'm3_expressive_theme_settings';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [seedColor, setSeedColor] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved ? JSON.parse(saved).seedColor : '#6366f1';
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    // Default to false for light mode on first load
    return saved ? JSON.parse(saved).isDarkMode : false;
  });

  const [isRainbowMode, setIsRainbowMode] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved ? JSON.parse(saved).isRainbowMode : false;
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ seedColor, isDarkMode, isRainbowMode }));
  }, [seedColor, isDarkMode, isRainbowMode]);

  const toggleDarkMode = () => setIsDarkMode((prev: boolean) => !prev);
  const toggleRainbowMode = () => setIsRainbowMode((prev: boolean) => !prev);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    let interval: number;
    if (isRainbowMode) {
      let hue = 0;
      interval = window.setInterval(() => {
        hue = (hue + 2) % 360;
        setSeedColor(`hsl(${hue}, 70%, 60%)`);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRainbowMode]);

  const getCssVariables = () => {
    if (seedColor.startsWith('hsl')) {
      return {
        '--primary': seedColor,
        '--primary-bg': seedColor.replace(')', ', 0.15)').replace('hsl', 'hsla'),
        '--primary-soft': seedColor.replace(')', ', 0.4)').replace('hsl', 'hsla'),
      };
    }
    
    const hex = seedColor.replace('#', '');
    const fullHex = hex.length === 3 ? hex.split('').map((c: string) => c + c).join('') : hex;
    const r = parseInt(fullHex.substring(0, 2), 16) || 0;
    const g = parseInt(fullHex.substring(2, 4), 16) || 0;
    const b = parseInt(fullHex.substring(4, 6), 16) || 0;
    
    const rgb = `${r}, ${g}, ${b}`;
    return {
      '--primary': `rgb(${rgb})`,
      '--primary-bg': `rgba(${rgb}, 0.15)`,
      '--primary-soft': `rgba(${rgb}, 0.4)`,
    };
  };

  const vars = getCssVariables();

  return (
    <ThemeContext.Provider value={{ seedColor, isDarkMode, isRainbowMode, setSeedColor, toggleDarkMode, toggleRainbowMode }}>
      <style>
        {`
          /* Smoothly transition the CSS variables using the modern @property API */
          @property --primary {
            syntax: '<color>';
            inherits: true;
            initial-value: #6366f1;
          }
          @property --primary-bg {
            syntax: '<color>';
            inherits: true;
            initial-value: rgba(99, 102, 241, 0.15);
          }
          @property --primary-soft {
            syntax: '<color>';
            inherits: true;
            initial-value: rgba(99, 102, 241, 0.4);
          }

          :root {
            --primary: ${vars['--primary']};
            --primary-bg: ${vars['--primary-bg']};
            --primary-soft: ${vars['--primary-soft']};
            /* Transition duration for the variables themselves */
            transition: --primary 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                        --primary-bg 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                        --primary-soft 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Ensure components using these variables transition smoothly */
          * {
            transition: background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                        color 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                        border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                        box-shadow 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          ::selection {
            background-color: var(--primary);
            color: white;
          }
        `}
      </style>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};