import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useContent } from '../context/ContentContext';
import { Article } from '../types';
import { GoogleGenAI } from "@google/genai";

interface MarkdownEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingArticle?: Article | null;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ isOpen, onClose, editingArticle }) => {
  const { addArticle, updateArticle, runSyncSequence, notify } = useContent();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('History');
  const [coverImage, setCoverImage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiTool, setShowAiTool] = useState(false);
  const [showImageAssistant, setShowImageAssistant] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [imgAltInput, setImgAltInput] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingArticle) {
        setTitle(editingArticle.title);
        setContent(editingArticle.content);
        setCategory(editingArticle.category);
        setCoverImage(editingArticle.coverImage);
      } else {
        setTitle('');
        setContent('');
        setCategory('History');
        setCoverImage(`https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=1200`);
      }
      setIsSaving(false);
    }
  }, [editingArticle, isOpen]);

  const handleSubmit = async (shouldCommit = false) => {
    if (!title.trim() || !content.trim()) {
      notify('Manuscript lacks substance', 'error');
      return;
    }

    setIsSaving(true);
    try {
        if (editingArticle) {
            await updateArticle(editingArticle.id, { title, content, category, coverImage });
        } else {
            await addArticle({ title, content, category, coverImage });
        }
        
        onClose(); // Exit editor view first

        // Delay sync slightly to allow editor exit animation to initiate, ensuring UI stability
        if (shouldCommit) {
          setTimeout(() => {
            runSyncSequence();
          }, 400);
        }
    } catch (e) {
        notify('Save failed', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const insertStyle = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setContent(newText);
    
    setTimeout(() => {
        textarea.focus();
        const newPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleInsertImage = () => {
    if (!imgUrlInput) return;
    const md = `\n![${imgAltInput || 'Article Image'}](${imgUrlInput})\n`;
    insertStyle(md);
    setImgUrlInput('');
    setImgAltInput('');
    setShowImageAssistant(false);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write a historical narrative in Markdown. Context: "${aiPrompt}". Use evocative imagery. At the end, after "---", list 3 Unsplash keywords for a cover image.`,
        config: { thinkingConfig: { thinkingBudget: 4000 } }
      });
      
      const fullText = response.text || "";
      const parts = fullText.split('---');
      const generatedContent = parts[0]?.trim();
      const keywords = parts[1]?.trim();
      
      if (generatedContent) setContent(prev => prev ? `${prev}\n\n${generatedContent}` : generatedContent);
      if (keywords) {
        const primaryKeyword = keywords.split(',')[0].trim().replace(/\s+/g, '-');
        setCoverImage(`https://images.unsplash.com/featured/?${primaryKeyword}`);
      }

      setAiPrompt('');
      setShowAiTool(false);
      notify('Oracle synthesis complete', 'success');
    } catch (error) {
      notify("Oracle is silent.", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const readingTime = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const mins = (words / 200);
    return `${mins.toFixed(1).replace('.', "'")} min. read`;
  }, [content]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed inset-0 z-[600] bg-[rgb(var(--surface))] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-[rgba(var(--text),0.05)] bg-[rgba(var(--surface),0.9)] backdrop-blur-3xl shrink-0 z-[800]">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose} 
                className="p-3 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter">Manuscript Forge</h2>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setShowAiTool(!showAiTool)}
                className={`p-3 rounded-2xl transition-all ${showAiTool ? 'bg-[var(--primary)] text-white shadow-xl scale-110' : 'hover:bg-[var(--primary-bg)] text-[var(--primary)]'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>

              <button 
                onClick={() => setShowPreview(!showPreview)}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${showPreview ? 'bg-[var(--primary)] text-white shadow-lg' : 'bg-[rgba(var(--text),0.05)] text-[rgb(var(--text))] opacity-60 hover:opacity-100'}`}
              >
                {showPreview ? 'Exit Preview' : 'Full Preview'}
              </button>
              
              <button
                disabled={isSaving}
                onClick={() => handleSubmit(true)}
                className="hidden lg:flex px-6 py-3 rounded-2xl border-2 border-[var(--primary)] text-[var(--primary)] font-black uppercase tracking-widest text-[10px] items-center gap-3 transition-all hover:bg-[var(--primary)] hover:text-white"
              >
                Commit Changes
              </button>

              <button
                disabled={isSaving}
                onClick={() => handleSubmit(false)}
                className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white font-black uppercase tracking-widest shadow-xl text-[10px] disabled:opacity-50 transition-all active:scale-95"
              >
                {isSaving ? 'Saving...' : 'Publish Session'}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            {/* Main Editing Area */}
            {!showPreview && (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
                {/* Left: Input */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-10 no-scrollbar">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="The Narrative Title..."
                    className="w-full text-4xl sm:text-7xl font-black bg-transparent border-none outline-none placeholder:opacity-10 text-[rgb(var(--text))] tracking-tighter"
                  />

                  {/* Enhanced Toolbar */}
                  <div className="flex flex-wrap items-center gap-3 border-y border-[rgba(var(--text),0.05)] py-6">
                    <div className="flex gap-1.5 p-1 bg-[rgba(var(--text),0.02)] rounded-2xl border border-[rgba(var(--text),0.03)]">
                        <button onClick={() => insertStyle('**', '**')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm font-black text-sm flex items-center justify-center transition-all" title="Bold">B</button>
                        <button onClick={() => insertStyle('_', '_')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm italic font-black text-sm flex items-center justify-center transition-all" title="Italic">I</button>
                    </div>
                    
                    <div className="flex gap-1.5 p-1 bg-[rgba(var(--text),0.02)] rounded-2xl border border-[rgba(var(--text),0.03)]">
                        <button onClick={() => insertStyle('# ')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm font-black text-xs flex items-center justify-center transition-all" title="H1">H1</button>
                        <button onClick={() => insertStyle('## ')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm font-black text-xs flex items-center justify-center transition-all" title="H2">H2</button>
                        <button onClick={() => insertStyle('### ')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm font-black text-xs flex items-center justify-center transition-all" title="H3">H3</button>
                    </div>

                    <div className="flex gap-1.5 p-1 bg-[rgba(var(--text),0.02)] rounded-2xl border border-[rgba(var(--text),0.03)]">
                        <button onClick={() => insertStyle('> ')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center transition-all" title="Quote">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.89543 14.9124 3 16.017 3H19.017C21.2261 3 23.017 4.79086 23.017 7V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1 21L1 18C1 16.8954 1.89543 16 3 16H6C6.55228 16 7 15.5523 7 15V9C7 8.44772 6.55228 8 6 8H3C1.89543 8 1 7.10457 1 6V5C1 3.89543 1.89543 3 3 3H6C8.20914 3 10 4.79086 10 7V15C10 18.3137 7.31371 21 4 21H1Z" /></svg>
                        </button>
                        <button onClick={() => insertStyle('- ')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center transition-all" title="List">•</button>
                        <button onClick={() => insertStyle('1. ')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center transition-all" title="Numbered List">1.</button>
                    </div>

                    <button 
                        onClick={() => setShowImageAssistant(true)}
                        className="px-4 h-12 rounded-2xl bg-[var(--primary-bg)] text-[var(--primary)] font-black text-[10px] uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Add Image
                    </button>

                    <div className="flex-1" />
                    <button onClick={() => setContent('')} className="p-2.5 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all hover:bg-red-50">Purge</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">Category</span>
                      <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] bg-[rgba(var(--text),0.04)] outline-none font-black text-xs tracking-[0.2em] uppercase focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)] transition-all" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">Article Identity Image</span>
                      <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] bg-[rgba(var(--text),0.04)] outline-none font-mono text-[10px] focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)] transition-all" />
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Transcribe the chronicles here..."
                    className="w-full h-[600px] p-8 sm:p-16 rounded-[3rem] bg-[rgba(var(--text),0.02)] border-2 border-transparent outline-none font-medium text-lg sm:text-2xl leading-[1.6] resize-none focus:bg-white focus:border-[var(--primary-soft)] transition-all shadow-inner"
                  />
                </div>

                {/* Right: Forge Sidebar */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[rgba(var(--text),0.05)] bg-[rgba(var(--surface),0.5)] p-10 space-y-12 overflow-y-auto no-scrollbar">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                        Quick Logic
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Insert Separator', code: '\n---\n', icon: '—' },
                        { label: 'Cite Source', code: '\n> "Veritas vos liberabit."\n', icon: '“' },
                        { label: 'Mark Important', code: ' **[EMPHASIS]** ', icon: '★' },
                        { label: 'Code Block', code: '\n```\nSnippet here\n```\n', icon: '</>' }
                      ].map((helper, i) => (
                        <button 
                          key={i}
                          onClick={() => insertStyle(helper.code)}
                          className="group w-full text-left p-5 rounded-3xl bg-white border border-[rgba(var(--text),0.05)] hover:border-[var(--primary)] transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl flex items-center gap-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[rgba(var(--text),0.02)] group-hover:bg-[var(--primary-bg)] flex items-center justify-center font-black text-[var(--primary)] transition-colors">
                            {helper.icon}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 group-hover:text-[var(--primary)]">{helper.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-[var(--primary)] text-white shadow-2xl space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h5 className="font-black text-xs uppercase tracking-widest">Scribe Tip</h5>
                    <p className="text-[11px] font-bold leading-relaxed opacity-80">
                      Markdown allows for deep hierarchical structure. Use H1 for main headers and H2 for sub-sections to help readers navigate.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Immersive 1:1 Preview Mode */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-y-auto no-scrollbar bg-[rgb(var(--surface))]"
                    >
                        {/* Immersive Background Sim */}
                        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[var(--primary)] opacity-[0.03] blur-[120px]" />
                            <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[var(--primary)] opacity-[0.04] blur-[100px]" />
                        </div>

                        {/* Immersive Header Simulation */}
                        <div className="relative h-[65vh] w-full overflow-hidden z-10">
                            <img src={coverImage} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--surface))] via-transparent to-transparent opacity-95" />
                            <div className="absolute inset-0 flex flex-col justify-end p-10 sm:p-20 max-w-7xl mx-auto w-full pb-20">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-3 py-1.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest">{category}</span>
                                    <span className="text-[rgb(var(--text))] font-black text-[10px] uppercase tracking-widest opacity-60">{readingTime}</span>
                                </div>
                                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-[rgb(var(--text))] leading-[1] tracking-tighter">
                                    {title || 'Untitled Narrative'}
                                </h1>
                            </div>
                        </div>

                        {/* Content Simulation */}
                        <div className="max-w-4xl mx-auto px-6 pb-48 -mt-16 sm:-mt-24 relative z-20">
                            <div className="bg-[rgb(var(--surface))] rounded-[3rem] sm:rounded-[4rem] p-10 sm:p-24 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.1)] border border-[rgba(var(--text),0.02)] prose-expressive">
                                <ReactMarkdown
                                    components={{
                                        h1: (p) => <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-10 leading-tight text-[rgb(var(--text))]" {...p} />,
                                        h2: (p) => <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-16 mb-8 text-[rgb(var(--text))]" {...p} />,
                                        p: (p) => <p className="text-lg sm:text-2xl leading-[1.7] mb-10 opacity-90 text-[rgb(var(--text))]" {...p} />,
                                        blockquote: (p) => (
                                            <blockquote className="border-l-[10px] border-[var(--primary)] bg-[var(--primary-bg)] p-10 sm:p-16 rounded-r-[3rem] italic font-black text-xl sm:text-4xl my-16 shadow-inner tracking-tight" {...p} />
                                        ),
                                        img: (p) => (
                                            <div className="my-16 rounded-[3rem] overflow-hidden shadow-2xl border border-[rgba(var(--text),0.05)]">
                                                <img {...p} className="w-full h-auto object-cover max-h-[600px]" alt={p.alt || ''} />
                                                {p.alt && <span className="block text-center text-xs font-black uppercase tracking-widest opacity-30 mt-4 px-6">{p.alt}</span>}
                                            </div>
                                        )
                                    }}
                                >
                                    {content || '*Transcribe your journey to see it rendered here.*'}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Modal */}
            <AnimatePresence>
              {showAiTool && (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="absolute top-24 left-10 z-[1000] w-[450px] bg-[rgba(var(--surface),0.98)] border border-[rgba(var(--primary),0.2)] shadow-4xl rounded-[3.5rem] p-12 space-y-8 backdrop-blur-3xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-[0.2em] text-[var(--primary)]">Scribe's Oracle</h4>
                        <p className="text-[10px] font-bold opacity-40">Synthesizing history through logic.</p>
                    </div>
                  </div>
                  <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="A chronicle of the Great Library..." className="w-full h-40 p-8 rounded-[2rem] bg-[rgba(var(--text),0.03)] border border-transparent outline-none font-medium text-sm resize-none focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)] transition-all" />
                  <button onClick={handleAiGenerate} disabled={isGenerating || !aiPrompt.trim()} className="w-full py-6 rounded-full bg-[var(--primary)] text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl disabled:opacity-30 active:scale-95 transition-all">
                    {isGenerating ? 'Synthesizing Path...' : 'Ignite Generation'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Assistant Modal */}
            <AnimatePresence>
              {showImageAssistant && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 z-[1100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                   <div className="w-full max-w-lg bg-[rgb(var(--surface))] rounded-[3.5rem] p-12 shadow-4xl border border-[rgba(var(--primary),0.1)] space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-xl tracking-tight">Image Integration</h4>
                            <button onClick={() => setShowImageAssistant(false)} className="text-red-500 opacity-40 hover:opacity-100 transition-opacity">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Source URL</span>
                                <input value={imgUrlInput} onChange={(e) => setImgUrlInput(e.target.value)} placeholder="https://..." className="w-full px-8 py-5 rounded-[2rem] bg-[rgba(var(--text),0.04)] outline-none font-mono text-xs focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)] transition-all" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Description (Alt)</span>
                                <input value={imgAltInput} onChange={(e) => setImgAltInput(e.target.value)} placeholder="A view of..." className="w-full px-8 py-5 rounded-[2rem] bg-[rgba(var(--text),0.04)] outline-none font-bold text-xs focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)] transition-all" />
                            </div>
                        </div>

                        <button onClick={handleInsertImage} className="w-full py-6 rounded-full bg-[var(--primary)] text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:shadow-2xl transition-all">
                            Integrate into Draft
                        </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MarkdownEditor;