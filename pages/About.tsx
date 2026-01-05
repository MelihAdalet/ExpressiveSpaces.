import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BackgroundShapes from '../components/BackgroundShapes';

const About: React.FC = () => {
  const cards = [
    {
      title: "Material Expressive",
      icon: "M",
      description: "A design philosophy that combines the structure of Material 3 with the fluid, organic chaos of nature. It breathes through motion."
    },
    {
      title: "Living History",
      icon: "H",
      description: "Archives shouldn't be dusty. They should feel alive. We use modern physics and interaction to make the past tactile."
    },
    {
      title: "Semantic Space",
      icon: "S",
      description: "Every pixel has a purpose. From the seed color that generates the theme to the typography that guides the eye."
    }
  ];

  return (
    <div className="relative min-h-screen pt-24 pb-40 px-6 sm:px-12 max-w-7xl mx-auto overflow-hidden">
      <BackgroundShapes />

      {/* Navigation */}
      <div className="fixed top-6 left-6 z-[450]">
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[rgba(var(--surface),0.8)] backdrop-blur-2xl text-[rgb(var(--text))] border border-[rgba(var(--text),0.05)] shadow-xl group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Return Home</span>
          </motion.button>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mt-12 md:mt-24 mb-16 max-w-4xl"
      >
        <span className="px-4 py-2 rounded-full bg-[var(--primary-bg)] text-[var(--primary)] text-xs font-black uppercase tracking-widest border border-[var(--primary-soft)]">
          Manifesto
        </span>
        <h1 className="mt-8 text-5xl sm:text-7xl md:text-8xl font-black text-[rgb(var(--text))] tracking-tighter leading-[0.9]">
          Designing for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-purple-500">
            The Digital Soul.
          </span>
        </h1>
        <p className="mt-8 text-lg sm:text-2xl text-[rgb(var(--text))] opacity-70 leading-relaxed max-w-2xl font-medium">
          This platform is an experiment in "Expressive Spaces"—where content isn't just consumed, but felt. It bridges the gap between static text and kinetic experience.
        </p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="group relative p-8 rounded-[2.5rem] bg-[rgba(var(--surface),0.6)] border border-[rgba(var(--text),0.05)] backdrop-blur-xl hover:bg-[rgb(var(--surface))] hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-9xl text-[var(--primary)] group-hover:scale-110 transition-transform duration-700 select-none">
              {card.icon}
            </div>
            
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="w-12 h-12 mb-6 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform duration-500">
                 <span className="font-black text-xl">{card.icon}</span>
              </div>
              <h3 className="text-2xl font-black text-[rgb(var(--text))] mb-4 tracking-tight">{card.title}</h3>
              <p className="text-[rgb(var(--text))] opacity-60 leading-relaxed font-medium">
                {card.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 mt-24 pt-12 border-t border-[rgba(var(--text),0.05)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div>
          <h4 className="font-black text-xl text-[rgb(var(--text))]">Expressive CMS</h4>
          <p className="text-sm opacity-50 mt-1">Built with React, Gemini, and Motion.</p>
        </div>
        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 rounded-full bg-[rgba(var(--text),0.05)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default About;