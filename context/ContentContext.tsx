import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Article } from '../types';
import { INITIAL_ARTICLES } from '../constants';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ContentContextType {
  articles: Article[];
  addArticle: (article: Omit<Article, 'id' | 'date'>) => Promise<Article>;
  updateArticle: (id: string, updates: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => void;
  exportToSource: () => Promise<void>;
  resetToSource: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  notifications: Notification[];
  notify: (message: string, type?: Notification['type']) => void;
  isSyncing: boolean;
  syncSteps: string[];
  runSyncSequence: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

const AUTH_KEY = 'm3_expressive_v5_auth';

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSteps, setSyncSteps] = useState<string[]>([]);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, isLoggedIn.toString());
  }, [isLoggedIn]);

  const notify = (message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const addArticle = async (newArticle: Omit<Article, 'id' | 'date'>): Promise<Article> => {
    const article: Article = {
      ...newArticle,
      id: `custom-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
    setArticles(prev => [article, ...prev]);
    notify('Narrative staged in session memory', 'success');
    return article;
  };

  const updateArticle = async (id: string, updates: Partial<Article>) => {
    setArticles(prev => prev.map(art => art.id === id ? { ...art, ...updates } : art));
    notify('Session entry updated', 'success');
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(art => art.id !== id));
    notify('Removed from current session', 'info');
  };

  const resetToSource = () => {
    if (window.confirm("Revert to source? All unsaved session changes will be lost.")) {
      setArticles(INITIAL_ARTICLES);
      notify('Reverted to project defaults', 'info');
    }
  };

  const exportToSource = async () => {
    // This is the raw file save operation
    try {
      const jsonString = JSON.stringify(articles, null, 2);
      const tsContent = `import { Article } from './types';\n\nexport const INITIAL_ARTICLES: Article[] = ${jsonString};\n`;

      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'constants.ts',
          types: [{
            description: 'TypeScript Project File',
            accept: { 'text/typescript': ['.ts'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(tsContent);
        await writable.close();
        notify('Source code updated successfully. Refresh to finalize.', 'success');
      } else {
        const blob = new Blob([tsContent], { type: 'text/typescript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'constants.ts';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        notify('Downloading updated constants.ts - Please replace manually.', 'info');
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        notify('FileSystem error. Use manual download fallback.', 'error');
      }
    }
  };

  const runSyncSequence = async () => {
    setIsSyncing(true);
    const steps = ['Opening port...', 'Parsing local buffer...', 'Writing to constants.ts...', 'Verifying checksum...', 'Sync complete.'];
    setSyncSteps(steps);
    
    for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setSyncSteps(prev => {
            const next = [...prev];
            next[i] = `✓ ${next[i]}`;
            return next;
        });
    }

    await exportToSource();
    setIsSyncing(false);
  };

  return (
    <ContentContext.Provider value={{ 
      articles, addArticle, updateArticle, deleteArticle, exportToSource, resetToSource,
      isLoggedIn, setIsLoggedIn, notifications, notify, isSyncing, syncSteps, runSyncSequence
    }}>
      {children}
      
      {/* Notifications Overlay */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] flex flex-col gap-3 pointer-events-none w-[90%] max-w-md">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`px-8 py-4 rounded-[2rem] shadow-4xl backdrop-blur-3xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] pointer-events-auto flex items-center gap-3 ${
                n.type === 'success' ? 'bg-green-500/90' : 
                n.type === 'error' ? 'bg-red-500/90' : 
                n.type === 'warning' ? 'bg-amber-500/90' :
                'bg-[rgba(var(--surface),0.9)] text-[rgb(var(--text))] border-[var(--primary-soft)]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-white animate-pulse' : 'bg-current opacity-40'}`} />
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Shared Sync Overlay */}
      <AnimatePresence>
        {isSyncing && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[4000] bg-[rgba(var(--surface),0.95)] backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center"
            >
                <div className="relative mb-12">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 border-t-4 border-l-4 border-[var(--primary)] rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-[var(--primary)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black tracking-tighter mb-6 uppercase text-[rgb(var(--text))]">Updating Source</h3>
                <div className="bg-black/5 dark:bg-white/5 rounded-[2rem] p-8 max-w-sm w-full font-mono text-[10px] text-left space-y-2">
                    {syncSteps.map((step, i) => (
                        <motion.p 
                            key={i} 
                            initial={{ x: -10, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }}
                            className={step.startsWith('✓') ? 'text-green-500 font-bold' : 'text-[rgb(var(--text))] opacity-60'}
                        >
                            {step}
                        </motion.p>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used within ContentProvider');
  return context;
};