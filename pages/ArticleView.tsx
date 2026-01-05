import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { useContent } from '../context/ContentContext';

const ArticleView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { articles } = useContent();
  const article = articles.find(a => a.id === id);

  const { scrollYProgress, scrollY } = useScroll();
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Parallax and background effects
  const headerY = useTransform(scrollY, [0, 800], [0, 250]);
  const headerOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const bgShape1Y = useTransform(scrollY, [0, 2000], [0, -300]);
  const bgShape2Y = useTransform(scrollY, [0, 2000], [0, 300]);
  const bgRotation = useTransform(scrollY, [0, 3000], [0, 360]);

  const showMiniHeader = useTransform(scrollY, [400, 500], [0, 1]);
  const miniHeaderY = useTransform(scrollY, [400, 500], [-10, 0]);

  // States
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [showFactCheck, setShowFactCheck] = useState(false);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  const readingTime = useMemo(() => {
    if (!article?.content) return "0 min.";
    const words = article.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const mins = (words / 200);
    const formatted = mins.toFixed(1).replace('.', "'");
    return `${formatted} min. read`;
  }, [article?.content]);

  const toc = useMemo(() => {
    if (!article?.content) return [];
    const lines = article.content.split('\n');
    return lines
      .filter(line => line.startsWith('## '))
      .map(line => line.replace('## ', '').trim());
  }, [article?.content]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return articles
      .filter(a => a.category === article.category && a.id !== article.id)
      .slice(0, 3);
  }, [article, articles]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoadingRelated(true);
    const timer = setTimeout(() => setIsLoadingRelated(false), 1200);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleFactCheck = async () => {
    if (!article) return;
    setIsFactChecking(true);
    setShowFactCheck(true);
    setFactCheckResult(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Fact check the following article. Provide a concise verification summary highlighting accuracy and any potential discrepancies. Article content: ${article.content.substring(0, 10000)}`,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      setFactCheckResult(response.text || "No analysis available.");
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const extractedSources = groundingChunks
          .map((chunk: any) => chunk.web)
          .filter((web: any) => web && web.uri && web.title);
        setSources(extractedSources);
      }

    } catch (error) {
      console.error("Fact check failed:", error);
      setFactCheckResult("Unable to verify content at this time. Please try again later.");
    } finally {
      setIsFactChecking(false);
    }
  };

  if (!article) return <div className="p-20 text-center text-xl font-bold opacity-30 italic">Narrative lost to time.</div>;

  return (
    <div className="relative min-h-screen bg-[rgb(var(--surface))] overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          style={{ y: bgShape1Y, rotate: bgRotation }}
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[var(--primary)] opacity-[0.03] blur-[120px]"
        />
        <motion.div 
          style={{ y: bgShape2Y, rotate: bgRotation }}
          className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[var(--primary)] opacity-[0.04] blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-[var(--primary)] z-[500] origin-left shadow-lg shadow-[rgba(var(--primary),0.2)]"
        style={{ scaleX }}
      />

      <motion.div 
        style={{ opacity: showMiniHeader, y: miniHeaderY }}
        className="fixed top-6 right-6 z-[450] flex items-center gap-4 p-3 pr-4 rounded-3xl bg-[rgba(var(--surface),0.85)] backdrop-blur-3xl border border-[rgba(var(--primary),0.2)] shadow-2xl pointer-events-none"
      >
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-black uppercase text-[var(--primary)] tracking-widest leading-none mb-1">{article.category}</p>
          <h4 className="text-xs font-bold text-[rgb(var(--text))] leading-none truncate max-w-[200px]">{article.title}</h4>
        </div>
        <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[var(--primary-soft)]">
          <img src={article.coverImage} className="w-full h-full object-cover" alt="" />
        </div>
      </motion.div>

      <div className="fixed top-6 left-6 z-[450]">
        <motion.button
          whileHover={{ scale: 1.05, x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3 rounded-2xl bg-[rgba(var(--surface),0.8)] backdrop-blur-2xl text-[rgb(var(--text))] border border-[rgba(var(--text),0.05)] shadow-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline font-black text-[10px] uppercase tracking-[0.2em]">Exit</span>
        </motion.button>
      </div>

      <div className="relative h-[65vh] sm:h-[75vh] w-full overflow-hidden">
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0">
          <motion.img
            layoutId={`image-${article.id}`}
            src={article.coverImage}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--surface))] via-transparent to-transparent opacity-95" />
        </motion.div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-16 md:p-24 max-w-7xl mx-auto w-full pb-20 sm:pb-32">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
            <span className="px-3 py-1.5 sm:px-4 rounded-full bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
              {article.category}
            </span>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[rgba(var(--surface),0.4)] backdrop-blur-md border border-white/10">
                <span className="text-[rgb(var(--text))] font-black text-[10px] sm:text-xs tracking-widest uppercase">
                {article.date}
                </span>
                <span className="w-1 h-1 rounded-full bg-[rgb(var(--text))] opacity-40" />
                <span className="text-[rgb(var(--text))] font-black opacity-80 text-[10px] sm:text-xs tracking-widest uppercase">
                {readingTime}
                </span>
            </div>
            
            <button
                onClick={handleFactCheck}
                disabled={isFactChecking}
                className="px-4 py-2 sm:px-5 rounded-full bg-[rgba(var(--surface),0.4)] hover:bg-[var(--primary)] hover:text-white backdrop-blur-md border border-white/10 text-[rgb(var(--text))] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 group"
            >
                {isFactChecking ? (
                    <span className="animate-pulse">Synthesizing...</span>
                ) : (
                    <>
                        <svg className="w-3 h-3 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Fact Check
                    </>
                )}
            </button>
          </motion.div>
          
          <motion.h1
            layoutId={`title-${article.id}`}
            className="text-4xl sm:text-6xl md:text-8xl font-black text-[rgb(var(--text))] leading-[1] tracking-tighter"
          >
            {article.title}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 -mt-16 sm:-mt-24 pb-48">
        {/* Left Column: Main Content */}
        <motion.article
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="lg:col-span-8"
        >
          <div className="bg-[rgb(var(--surface))] rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-12 md:p-24 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.1)] border border-[rgba(var(--text),0.02)] overflow-hidden">
              <AnimatePresence>
                  {showFactCheck && (
                      <motion.div
                          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginBottom: 40 }}
                          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                          className="overflow-hidden"
                      >
                          <div className="rounded-[2rem] bg-[rgba(var(--primary),0.05)] border border-[rgba(var(--primary),0.2)] p-6 sm:p-10 relative overflow-hidden">
                              <div className="flex items-center gap-3 mb-6 text-[var(--primary)]">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  <h3 className="font-black uppercase tracking-widest text-xs">Verification Report</h3>
                              </div>
                              
                              {isFactChecking ? (
                                  <div className="space-y-4">
                                      <div className="h-4 bg-[var(--primary)]/10 rounded-full w-full animate-pulse skeleton-shimmer" />
                                      <div className="h-4 bg-[var(--primary)]/10 rounded-full w-5/6 animate-pulse skeleton-shimmer" />
                                      <div className="h-4 bg-[var(--primary)]/10 rounded-full w-2/3 animate-pulse skeleton-shimmer" />
                                  </div>
                              ) : (
                                  <>
                                      <div className="prose prose-sm sm:prose-base font-medium opacity-90 mb-8 text-[rgb(var(--text))] leading-relaxed">
                                          <ReactMarkdown>{factCheckResult || ''}</ReactMarkdown>
                                      </div>
                                      {sources.length > 0 && (
                                          <div className="border-t border-[rgba(var(--text),0.1)] pt-6">
                                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">Verification Sources</p>
                                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  {sources.map((source, idx) => (
                                                      <li key={idx}>
                                                          <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group p-3 rounded-2xl bg-[rgba(var(--text),0.02)] border border-transparent hover:border-[var(--primary-soft)] transition-all">
                                                              <div className="w-8 h-8 rounded-xl bg-[var(--primary-bg)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                                  <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                              </div>
                                                              <span className="text-xs font-bold text-[rgb(var(--text))] opacity-80 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-all truncate">
                                                                  {source.title}
                                                              </span>
                                                          </a>
                                                      </li>
                                                  ))}
                                              </ul>
                                          </div>
                                      )}
                                  </>
                              )}
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

            <div className="prose-expressive">
              <ReactMarkdown
                components={{
                  h1: (props) => <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-8 leading-tight text-[rgb(var(--text))]" {...props} />,
                  h2: (props) => <h2 id={String(props.children).toLowerCase().replace(/\s+/g, '-')} className="text-2xl sm:text-4xl font-black tracking-tight mt-12 mb-6 text-[rgb(var(--text))]" {...props} />,
                  p: (props) => <p className="text-lg sm:text-xl leading-relaxed mb-8 opacity-90 text-[rgb(var(--text))]" {...props} />,
                  blockquote: (props) => (
                    <blockquote className="border-l-[6px] sm:border-l-[10px] border-[var(--primary)] bg-[var(--primary-bg)] p-6 sm:p-12 rounded-r-[2rem] sm:rounded-r-[3rem] my-12 italic font-black text-xl sm:text-3xl tracking-tight shadow-inner" {...props} />
                  ),
                  strong: (props) => <strong className="font-black text-[var(--primary)]" {...props} />,
                  ul: (props) => <ul className="list-disc pl-6 mb-8 space-y-3 text-lg" {...props} />,
                  li: (props) => <li className="opacity-80 font-medium" {...props} />,
                  img: (props) => (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="my-16 rounded-[2.5rem] overflow-hidden shadow-2xl border border-[rgba(var(--text),0.05)]">
                        <img {...props} className="w-full h-auto object-cover max-h-[600px]" alt={props.alt || ''} />
                        {props.alt && <span className="block text-center text-xs font-black uppercase tracking-widest opacity-30 mt-4 px-6">{props.alt}</span>}
                    </motion.div>
                  )
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
            
            <div className="mt-20 pt-12 border-t border-[rgba(var(--text),0.05)] flex justify-center">
               <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-8 py-4 sm:px-10 rounded-full bg-[rgba(var(--text),0.03)] text-[rgb(var(--text))] font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 transition-all border border-transparent hover:border-[rgba(var(--text),0.1)]"
              >
                Return to Top
              </motion.button>
            </div>
          </div>
        </motion.article>

        {/* Right Column: Sticky Sidebar */}
        <aside className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-24 space-y-8">
            {/* Table of Contents */}
            {toc.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 rounded-[2rem] bg-[rgba(var(--surface),0.7)] backdrop-blur-3xl border border-[rgba(var(--text),0.05)] shadow-xl"
              >
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-6">In this Story</h3>
                <nav className="space-y-4">
                  {toc.map((item, idx) => (
                    <a 
                      key={idx} 
                      href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block text-sm font-bold text-[rgb(var(--text))] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all flex items-center gap-3 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </a>
                  ))}
                </nav>
              </motion.div>
            )}

            {/* Related Articles */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-[2rem] bg-[rgba(var(--surface),0.7)] backdrop-blur-3xl border border-[rgba(var(--text),0.05)] shadow-xl min-h-[300px]"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary)] mb-6">Related Narratives</h3>
              
              {isLoadingRelated ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex gap-4 items-center animate-pulse">
                      <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--text),0.05)] shrink-0 skeleton-shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-[rgba(var(--text),0.05)] rounded-full w-1/3" />
                        <div className="h-3 bg-[rgba(var(--text),0.05)] rounded-full w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : relatedArticles.length > 0 ? (
                <div className="space-y-6">
                  {relatedArticles.map((rel) => (
                    <Link key={rel.id} to={`/article/${rel.id}`} className="block group">
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[rgba(var(--text),0.1)] shadow-sm">
                          <img src={rel.coverImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] opacity-60 mb-1">{rel.category}</p>
                          <h4 className="text-sm font-bold text-[rgb(var(--text))] leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-2">{rel.title}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold opacity-30 italic text-center py-8">No similar scrolls found.</p>
              )}
            </motion.div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ArticleView;