import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import ArticleCard from '../components/ArticleCard';
import MarkdownEditor from '../components/MarkdownEditor';
import BackgroundShapes from '../components/BackgroundShapes';
import { Article } from '../types';

const Home: React.FC = () => {
  const { articles, deleteArticle, resetToSource, isLoggedIn, setIsLoggedIn, notify, runSyncSequence } = useContent();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            article.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [articles, searchQuery]);

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  return (
    <div className="relative min-h-screen pt-8 sm:pt-12 md:pt-24 pb-40 sm:pb-80 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto">
      <BackgroundShapes />

      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <motion.h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter leading-[0.95] text-[rgb(var(--text))]">
            Expressive <br />
            <span className="text-[var(--primary)]">Spaces.</span>
          </motion.h1>
          <p className="mt-8 text-sm sm:text-lg md:text-2xl text-[rgb(var(--text))] opacity-60 font-medium leading-relaxed max-w-lg">
            A minimalist sanctuary for historical narratives and digital chronicles.
          </p>
        </div>

        <div className="flex gap-3">
           <Link to="/about" className="px-8 py-4 rounded-2xl bg-[rgba(var(--text),0.05)] text-[10px] font-black uppercase tracking-widest text-[rgb(var(--text))] hover:bg-[var(--primary)] hover:text-white transition-all backdrop-blur-md">About</Link>
          {!isLoggedIn ? (
            <button onClick={() => { setIsLoggedIn(true); notify('Admin Mode Active', 'info'); }} className="px-8 py-4 rounded-2xl bg-[rgba(var(--text),0.05)] text-[10px] font-black uppercase tracking-widest text-[rgb(var(--text))] hover:bg-[var(--primary)] hover:text-white transition-all backdrop-blur-md">Admin</button>
          ) : (
            <button onClick={() => setIsLoggedIn(false)} className="px-8 py-4 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all">Logout</button>
          )}
        </div>
      </motion.header>

      {/* Query Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 mb-20 max-w-2xl group">
        <div className="relative shadow-2xl rounded-[3rem] overflow-hidden backdrop-blur-3xl bg-[rgba(var(--surface),0.6)] transition-all">
          <input 
            type="text" 
            placeholder="Query Archives..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-16 pr-8 py-7 bg-transparent text-[rgb(var(--text))] font-bold outline-none border-none text-sm placeholder:opacity-20 placeholder:font-black placeholder:uppercase tracking-[0.3em] focus:ring-0" 
          />
          <div className="absolute left-7 top-1/2 -translate-y-1/2 text-[var(--primary)] opacity-40 group-focus-within:opacity-100 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isLoggedIn && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="fixed top-24 left-12 z-[380] hidden xl:block">
            <div className="bg-[rgba(var(--surface),0.9)] backdrop-blur-3xl border border-[rgba(var(--primary),0.2)] p-10 rounded-[2.5rem] shadow-4xl space-y-8 min-w-[280px]">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[rgb(var(--text))]">CMS Console</span>
              <div className="space-y-4">
                <span className="text-5xl font-black text-[var(--primary)] tracking-tighter">{articles.length}</span>
                <p className="text-[9px] font-mono opacity-50 uppercase tracking-widest text-[rgb(var(--text))]">Session Entries Ready</p>
              </div>
              <button onClick={runSyncSequence} className="w-full py-5 rounded-2xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20">Commit Changes</button>
              <button onClick={resetToSource} className="w-full py-4 rounded-2xl bg-[rgba(var(--text),0.05)] text-[rgb(var(--text))] text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Reset Sync</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        <AnimatePresence mode='popLayout'>
          {filteredArticles.length > 0 ? filteredArticles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} isLoggedIn={isLoggedIn} onEdit={handleEdit} onDelete={deleteArticle} />
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-40 text-center">
              <h3 className="text-5xl font-black opacity-10 tracking-tighter text-[rgb(var(--text))] italic">The archives are silent.</h3>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isLoggedIn && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileHover={{ scale: 1.1, rotate: 90 }} onClick={handleCreate} className="fixed bottom-24 right-12 w-20 h-20 rounded-full bg-[var(--primary)] text-white shadow-3xl flex items-center justify-center z-[500] border-8 border-[rgb(var(--surface))] transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" /></svg>
          </motion.button>
        )}
      </AnimatePresence>

      <MarkdownEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} editingArticle={editingArticle} />
    </div>
  );
};

export default Home;