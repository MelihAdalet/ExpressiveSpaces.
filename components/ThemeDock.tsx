
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const ThemeDock: React.FC = () => {
  const { isDarkMode, toggleDarkMode, setSeedColor, seedColor, isRainbowMode, toggleRainbowMode } = useTheme();
  const [clickCount, setClickCount] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleEasterEgg = () => {
    // If already in rainbow mode, one click disables it
    if (isRainbowMode) {
      toggleRainbowMode();
      setClickCount(0);
      return;
    }

    setClickCount(prev => {
      if (prev + 1 >= 5) {
        toggleRainbowMode();
        return 0;
      }
      return prev + 1;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presetColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[400] px-4 py-3 rounded-3xl bg-[rgba(var(--surface),0.85)] border border-[rgba(var(--primary),0.2)] shadow-2xl flex items-center gap-2 md:gap-3 backdrop-blur-3xl"
    >
      {/* Theme Toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-2 md:p-3 rounded-2xl hover:bg-[rgba(var(--primary),0.1)] text-[rgb(var(--text))] transition-all"
        title="Toggle Dark Mode"
      >
        {isDarkMode ? (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        ) : (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>

      <div className="h-6 w-px bg-[rgba(var(--text),0.1)] mx-0.5 md:mx-1" />

      {/* Preset Swatches */}
      <div className="flex gap-1 md:gap-2">
        {presetColors.map(color => (
          <motion.button
            key={color}
            whileHover={{ scale: 1.2 }}
            onClick={() => {
              if (isRainbowMode) toggleRainbowMode();
              setSeedColor(color);
            }}
            className={`w-5 h-5 md:w-6 md:h-6 rounded-lg transition-all ${seedColor === color && !isRainbowMode ? 'ring-2 md:ring-4 ring-[var(--primary-soft)]' : ''}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="h-6 w-px bg-[rgba(var(--text),0.1)] mx-0.5 md:mx-1" />

      {/* Integrated Picker Container */}
      <div className="relative" ref={pickerRef}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowPicker(!showPicker)}
          className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary-bg)] flex items-center justify-center relative overflow-hidden"
        >
          <div className="w-4 h-4 md:w-5 md:h-5 rounded-md shadow-sm" style={{ backgroundColor: seedColor }} />
        </motion.button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full right-0 mb-4 p-4 md:p-6 rounded-[2rem] bg-[rgba(var(--surface),0.95)] backdrop-blur-3xl border border-[rgba(var(--primary),0.2)] shadow-4xl w-[220px] md:w-[260px]"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-4 text-center">Spectrum</p>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="360"
                  onChange={(e) => {
                    if (isRainbowMode) toggleRainbowMode();
                    setSeedColor(`hsl(${e.target.value}, 70%, 60%)`);
                  }}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                />
                <div className="flex justify-center gap-4">
                  <button onClick={() => setSeedColor('#6366f1')} className="text-[10px] font-bold opacity-40 hover:opacity-100 uppercase">Reset</button>
                  <button onClick={() => setShowPicker(false)} className="text-[10px] font-bold text-[var(--primary)] uppercase">Done</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Easter Egg Trigger / Rainbow Toggle */}
      <motion.button
        animate={isRainbowMode ? { 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={handleEasterEgg}
        className={`ml-0.5 md:ml-1 text-lg md:text-xl transition-transform hover:scale-125 ${isRainbowMode ? 'drop-shadow-[0_0_8px_var(--primary)]' : ''}`}
        title={isRainbowMode ? "Disable Rainbow Mode" : "Click 5 times for Rainbow Mode"}
      >
        ✨
      </motion.button>
    </motion.div>
  );
};

export default ThemeDock;
