
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  index: number;
  isLoggedIn: boolean;
  onEdit?: (article: Article) => void;
  onDelete?: (id: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, index, isLoggedIn, onEdit, onDelete }) => {
  const readingTime = useMemo(() => {
    const content = article.content || "";
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const mins = (words / 200);
    const formatted = mins.toFixed(1).replace('.', "'");
    return `${formatted} min. read`;
  }, [article.content]);

  return (
    <motion.div
      layout
      layoutId={`card-container-${article.id}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ y: -5 }}
      className="group relative h-[320px] sm:h-[380px] md:h-[480px] w-full overflow-hidden rounded-[2.5rem] bg-[rgba(var(--surface),0.2)] shadow-xl transition-all duration-500 hover:shadow-2xl"
    >
      {/* 1. Background Visuals (Z-Index 0) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.img
          layoutId={`image-${article.id}`}
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        {/* Dark overlay to ensure text is always white and readable, regardless of theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
      </div>

      {/* 2. Content Info Layer (Z-Index 10) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-8 md:p-10 pointer-events-none">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[var(--primary)] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
              {article.category}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="text-white text-[10px] sm:text-xs font-bold opacity-70 uppercase tracking-tighter">
                {readingTime}
              </span>
            </div>
          </div>
          
          <motion.h2
            layoutId={`title-${article.id}`}
            className="text-2xl sm:text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter pr-4 sm:pr-8 line-clamp-2"
          >
            {article.title}
          </motion.h2>
          
          <p className="text-[10px] sm:text-xs font-black text-white opacity-40 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-3 h-px bg-white opacity-20" />
            {article.date}
          </p>
        </div>
      </div>

      {/* 3. Primary Navigation Link (Z-Index 20) */}
      <Link 
        to={`/article/${article.id}`} 
        className="absolute inset-0 z-20"
        aria-label={`Read ${article.title}`}
      />

      {/* 4. Admin Buttons HUD (Z-Index 30) */}
      {isLoggedIn && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 ease-out z-30">
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              onEdit?.(article);
            }}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[var(--primary)] text-white shadow-xl hover:scale-110 active:scale-90 transition-all border border-white/20 pointer-events-auto"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              if (window.confirm('Delete this narrative?')) onDelete?.(article.id);
            }}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-red-500 text-white shadow-xl hover:scale-110 active:scale-90 transition-all border border-white/20 pointer-events-auto"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ArticleCard;