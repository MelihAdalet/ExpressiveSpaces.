
import React, { useLayoutEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { ContentProvider } from './context/ContentContext';
import Home from './pages/Home';
import ArticleView from './pages/ArticleView';
import About from './pages/About';
import ThemeDock from './components/ThemeDock';

// Expressive Motion Variants
// Added explicit Variants type and used 'as const' on easing arrays to fix TypeScript assignment errors where number[] was being inferred instead of an easing tuple.
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: 'blur(8px)',
    transformOrigin: 'center top'
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.2, 0.8, 0.2, 1] as const, // Expressive ease-out (fixed with as const for correct tuple typing)
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    filter: 'blur(10px)',
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const, // Quick expressive ease-in (fixed with as const for correct tuple typing)
    }
  }
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure scroll resets when a new page mounts, before the animation starts
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/article/:id" element={<PageWrapper><ArticleView /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ContentProvider>
        <Router>
          <div className="relative min-h-screen overflow-x-hidden selection:bg-[var(--primary)] selection:text-white bg-[rgb(var(--surface))]">
            {/* Grainy Texture Overlay */}
            <div className="fixed inset-0 z-[999] pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            
            <AnimatedRoutes />
            <ThemeDock />
            
            {/* Subtle Aesthetic Background Elements */}
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.06, 0.09, 0.06]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)] rounded-full blur-[140px] pointer-events-none z-0" 
            />
            <motion.div 
              animate={{ 
                scale: [1.1, 1, 1.1],
                opacity: [0.06, 0.09, 0.06]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--primary)] rounded-full blur-[140px] pointer-events-none z-0" 
            />
          </div>
        </Router>
      </ContentProvider>
    </ThemeProvider>
  );
};

export default App;
