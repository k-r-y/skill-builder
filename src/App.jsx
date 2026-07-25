import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { generateSkill } from './lib/gemini';
import { loadState, saveState } from './lib/storage';
import { createCartItem, batchGenerate, downloadSingleSkill } from './lib/cart';
import { getStoredSkills, saveSkill, seedDefaultSkills } from './lib/skillsManager';
import { parseSkillMd } from './utils/skillParser';
import CartPanel from './components/CartPanel';
import SkillPreviewModal from './components/SkillPreviewModal';
import EditItemModal from './components/EditItemModal';
import BorderGlow from './components/BorderGlow';
import SearchSelect from './components/SearchSelect';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Copy, Download, Loader2, Sparkles, Terminal, Info, Sun, Moon, Plus, Check, Search, X, ChevronDown, Settings, CornerDownLeft, Code } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'skillBuilderState';
const CART_STORAGE_KEY  = 'skillBuilderCart';

function App() {
  const [storedSkills, setStoredSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const [state, setState] = useState(() => loadState(LOCAL_STORAGE_KEY, {
    categoryId: '',
    skillId: '',
    customNotes: '',
    apiKey: '',
    generatedContent: '',
    customSkillName: '',
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError]               = useState(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [useAI, setUseAI]               = useState(false);
  const [copied, setCopied]             = useState(false);

  // --- Cart state ---
  const [cart, setCart]               = useState(() => loadState(CART_STORAGE_KEY, []));
  const [isBatchRunning, setIsBatch]  = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [editItem, setEditItem]       = useState(null);

  // --- Global Search & Settings state ---
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const searchInputRef = React.useRef(null);
  const searchContainerRef = React.useRef(null);
  const searchDropdownRef = React.useRef(null);
  const [searchCoords, setSearchCoords] = useState(null);

  useEffect(() => {
    if (isSearchOpen && searchContainerRef.current) {
      const updateCoords = () => {
        if (searchContainerRef.current) {
          const rect = searchContainerRef.current.getBoundingClientRect();
          setSearchCoords({
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
          });
        }
      };
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isSearchOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target) &&
        (!searchDropdownRef.current || !searchDropdownRef.current.contains(e.target))
      ) {
        setIsSearchOpen(false);
      }
    }
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        if (isSearchOpen || isSettingsOpen) {
          e.preventDefault();
          setIsSearchOpen(false);
          setIsSettingsOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') || 'dark';
    return 'dark';
  });

  // Seeding and loading skills
  useEffect(() => {
    let active = true;
    const init = async () => {
      await seedDefaultSkills();
      const loaded = getStoredSkills();
      if (active) {
        setStoredSkills(loaded);
        setLoading(false);
      }
    };
    init();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => { saveState(LOCAL_STORAGE_KEY, state); }, [state]);
  useEffect(() => { saveState(CART_STORAGE_KEY, cart); }, [cart]);

  const handleStateChange = (key, value) => {
    setState(prev => {
      if (key === 'categoryId') return { ...prev, [key]: value, skillId: '' };
      return { ...prev, [key]: value };
    });
  };

  const categories = React.useMemo(() => {
    const cats = new Map();
    storedSkills.forEach(s => {
      const catName = s.metadata?.category || 'General';
      const catId = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (!cats.has(catId)) {
        cats.set(catId, { id: catId, name: catName, count: 1 });
      } else {
        cats.get(catId).count += 1;
      }
    });
    return Array.from(cats.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [storedSkills]);

  const globalSearchResults = React.useMemo(() => {
    if (!globalSearch.trim()) return [];
    const query = globalSearch.toLowerCase().trim();
    return storedSkills.filter(s => {
      const name = (s.metadata?.name || s.name || s.id || '').toLowerCase();
      const desc = (s.metadata?.description || s.body || s.trigger || '').toLowerCase();
      const cat = (s.metadata?.category || '').toLowerCase();
      const id = (s.id || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || cat.includes(query) || id.includes(query);
    });
  }, [storedSkills, globalSearch]);

  const handleSelectSkillFromSearch = (skill) => {
    const catName = skill.metadata?.category || 'General';
    const catId = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setState(prev => ({
      ...prev,
      categoryId: catId,
      skillId: skill.id
    }));
    setGlobalSearch('');
    setIsSearchOpen(false);
  };

  const filteredSkills = React.useMemo(() => {
    if (!state.categoryId) return [];
    return storedSkills.filter(s => {
      const catId = (s.metadata?.category || 'General').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return catId === state.categoryId;
    });
  }, [storedSkills, state.categoryId]);

  const selectedSkill = React.useMemo(() => {
    if (state.skillId === 'custom-skill') {
      return {
        id: 'custom-skill',
        name: state.customSkillName || 'Custom Skill',
        raw: '',
        metadata: {
          name: state.customSkillName || 'Custom Skill',
          description: state.customNotes || 'Custom skill generated from notes.',
          category: categories.find(c => c.id === state.categoryId)?.name || 'General',
          version: '1.0.0'
        },
        body: ''
      };
    }
    return storedSkills.find(s => s.id === state.skillId);
  }, [storedSkills, state.skillId, state.customSkillName, state.customNotes, categories, state.categoryId]);

  const selectedCategory = categories.find(c => c.id === state.categoryId);

  // ── Single-shot generate (Preview tab) ──────────────────────────────
  const handleGenerate = async () => {
    if (!state.categoryId || !state.skillId) {
      setError('Please select a category and a skill.');
      return;
    }
    if (state.skillId === 'custom-skill' && !state.customSkillName?.trim()) {
      setError('Please enter a name for your custom skill.');
      return;
    }
    setError(null);
    setIsQuotaError(false);
    setIsGenerating(true);

    const category = selectedCategory?.name || 'General';
    try {
      const content = await generateSkill(selectedSkill, category, state.customNotes, state.apiKey, useAI);
      
      let savedSkill = null;
      // If we are in AI mode (with a valid API key), parse and save the generated skill to localStorage
      if (useAI && state.apiKey && state.apiKey.trim()) {
        try {
          const parsed = parseSkillMd(content);
          if (parsed && parsed.metadata && parsed.metadata.name) {
            // Overwrite or ensure category matches to group correctly
            parsed.metadata.category = category;
            
            // Build raw SKILL.md
            const slug = parsed.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const rawContent = `---
name: ${slug}
description: "${parsed.metadata.description || ''}"
category: ${category}
version: ${parsed.metadata.version || '1.0.0'}
---

${parsed.body}`;

            savedSkill = saveSkill(rawContent);
            
            // Reload skills list in local React state
            const updated = getStoredSkills();
            setStoredSkills(updated);
          }
        } catch (parseErr) {
          console.warn('Failed to parse/save generated skill:', parseErr);
        }
      }

      handleStateChange('generatedContent', content);

      // Auto-select the newly generated skill
      if (savedSkill) {
        setState(prev => ({
          ...prev,
          skillId: savedSkill.id,
          customSkillName: '' // clear custom input
        }));
      }
    } catch (err) {
      let message = err.message || 'An error occurred during generation.';
      try { const p = JSON.parse(message); message = p?.error?.message || message; } catch {}
      if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED') || message.includes('billing')) {
        setIsQuotaError(true);
        setError('Free-tier quota reached for today.');
      } else if (message.includes('no longer available') || message.includes('NOT_FOUND')) {
        setError('No compatible Gemini model found for this API key.');
      } else {
        const first = message.split(/\. /)[0];
        setError(first.length < message.length ? first + '.' : message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Add to Cart ─────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!selectedSkill || !selectedCategory) return;
    const item = createCartItem(selectedSkill, selectedCategory.name, state.customNotes);
    setCart(prev => [item, ...prev]);
  };

  // ── Cart: update item (from edit modal) ─────────────────────────────
  const handleSaveEdit = useCallback((cartId, newNotes) => {
    setCart(prev => prev.map(item =>
      item.cartId === cartId
        ? { ...item, customNotes: newNotes, status: 'pending', generatedContent: null, errorMessage: null }
        : item
    ));
  }, []);

  // ── Cart: delete ─────────────────────────────────────────────────────
  const handleDeleteItem = useCallback((cartId) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  // ── Cart: clear done ─────────────────────────────────────────────────
  const handleClearDone = () => {
    setCart(prev => prev.filter(i => i.status !== 'done'));
  };

  // ── Cart: batch generate ─────────────────────────────────────────────
  const handleGenerateAll = async () => {
    if (isBatchRunning) return;
    setIsBatch(true);

    await batchGenerate(cart, state.apiKey, useAI, (updatedItem) => {
      setCart(prev => prev.map(i => i.cartId === updatedItem.cartId ? updatedItem : i));
    });

    setIsBatch(false);
  };

  // ── Copy / Download (single preview) ────────────────────────────────
  const handleCopy = () => {
    if (state.generatedContent) {
      navigator.clipboard.writeText(state.generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (state.generatedContent || selectedSkill) {
      await downloadSingleSkill(selectedSkill, state.generatedContent);
    }
  };

  const totalCartCount   = cart.length;

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090B] text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] mb-4" />
        <p className="text-sm font-mono text-muted-foreground animate-pulse">Initializing Agent Skills Catalog...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground flex flex-col items-center">
      {/* Header with macOS Spotlight Search Bar */}
      <header className="w-full max-w-7xl mx-auto py-3 md:py-4 px-4 md:px-8 border-b border-border/40 flex items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-30 bg-background/80">
        {/* Left Brand Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Terminal className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight hidden sm:inline-block">Skill Builder</h1>
          <span className="text-[10px] font-mono text-primary/70 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 leading-none">v2</span>
        </div>

        {/* Center: ReactBits-Style Spotlight Search Trigger Button */}
        <div className="flex-1 max-w-md mx-2 flex justify-center">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between gap-3 w-full px-3.5 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground text-xs font-medium transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 text-muted-foreground opacity-60 group-hover:text-foreground transition-colors shrink-0" />
              <span className="truncate">Search skills...</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] text-muted-foreground/80 bg-background/60 border border-border/80 px-1.5 py-0.5 rounded-md font-mono shrink-0 select-none">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Settings Button & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-xl h-9 px-3 border-border text-xs font-medium"
          >
            <Settings className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Settings</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono ml-0.5">
              {useAI ? 'AI' : 'System'}
            </span>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-9 h-9 border border-border shrink-0">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* ── ReactBits Style Spotlight Search Modal Portal ───────────────── */}
      {isSearchOpen && createPortal(
        <div 
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-start justify-center pt-[10vh] sm:pt-[14vh] px-4 animate-in fade-in-0 duration-150"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            ref={searchDropdownRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121118]/95 text-foreground border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col backdrop-blur-2xl p-3 sm:p-4 gap-3 animate-in zoom-in-95 duration-150"
          >
            {/* Search Input Top Bar with rounded-xl pill container */}
            <div className="flex items-center px-3.5 py-2.5 gap-3 rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-primary/50 transition-all">
              <Search className="w-4 h-4 text-muted-foreground/70 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search skills or categories..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 border-0 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 shadow-none font-medium p-0 !outline-none !ring-0 !border-none"
                autoFocus
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              
            </div>

            {/* Results List */}
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {!globalSearch.trim() ? (
                <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground/60">
                  <Sparkles className="w-6 h-6 text-primary/70 animate-pulse" />
                  <p className="text-xs font-medium">Type a skill name or category (e.g. "frontend", "branding", "firebase")...</p>
                </div>
              ) : globalSearchResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground/60">
                  No skills found matching "{globalSearch}"
                </div>
              ) : (
                globalSearchResults.map((s) => {
                  const isSelected = state.skillId === s.id;
                  const rawName = s.metadata?.name || s.name;
                  const skillName = (rawName && rawName !== 'Unnamed Skill') ? rawName : s.id;
                  const categoryName = s.metadata?.category || 'General';

                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectSkillFromSearch(s)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all select-none group ${
                        isSelected
                          ? 'bg-primary/20 border-primary/40 text-foreground shadow-md'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                          <Code className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className="font-semibold text-sm text-foreground tracking-tight break-words group-hover:text-primary transition-colors">
                            {skillName}
                          </span>
                          <span className="text-xs text-muted-foreground/70 font-mono flex items-center gap-1">
                            in <span className="text-muted-foreground font-sans">{categoryName}</span>
                          </span>
                        </div>
                      </div>

                      <CornerDownLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0 ml-3" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Settings Modal */}
      {isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/50 pb-3.5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight">Generation Engine Settings</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Response Generation Mode
              </Label>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setUseAI(false)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    !useAI 
                      ? 'bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/30' 
                      : 'bg-muted/30 border-border/60 hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span>System Default Mode</span>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">Offline</span>
                    </span>
                    {!useAI && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground/90 leading-snug">
                    Deterministic, instant skill structure code generated from local templates and offline fallbacks. Zero API latency.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setUseAI(true)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    useAI 
                      ? 'bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/30' 
                      : 'bg-muted/30 border-border/60 hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span>AI Generated Mode</span>
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">Gemini AI</span>
                    </span>
                    {useAI && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground/90 leading-snug">
                    Dynamic LLM-generated skill structures powered by Google Gemini API.
                  </p>
                </button>
              </div>

              {useAI && (
                <div className="flex flex-col gap-2 pt-3 border-t border-border/40 mt-1">
                  <Label htmlFor="settingsApiKey" className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Gemini API Key</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Stored locally</span>
                  </Label>
                  <input
                    id="settingsApiKey"
                    type="password"
                    placeholder="Paste Gemini API key..."
                    className="px-3.5 py-2 w-full rounded-xl border border-input bg-background/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    value={state.apiKey}
                    onChange={(e) => handleStateChange('apiKey', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/50">
              <Button 
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-xl px-5 font-semibold text-xs"
              >
                Save & Close
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <main className="w-full max-w-7xl mx-auto flex-1 p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* ── Left Column ─────────────────────────────────────────────── */}
        <aside className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6" aria-label="Skill configuration options">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Configure Context</h2>
            <p className="text-muted-foreground text-sm">Select the mechanical foundation and provide custom constraints.</p>
          </div>

          <BorderGlow
            edgeSensitivity={30}
            glowColor="240 5 75"
            backgroundColor="hsl(var(--card))"
            borderRadius={12}
            glowRadius={40}
            glowIntensity={1.0}
            coneSpread={25}
            colors={['#ffffff', '#cbd5e1', '#64748b']}
            fillOpacity={0.0}
          >
            <Card className="bg-transparent border-0 shadow-none w-full h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Domain & Skill</CardTitle>
                  <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded font-mono">
                    130 Skills Available
                  </span>
                </div>
                <CardDescription>Filter by domain category or browse concepts below.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">

                {/* ── Category Select ──────────────────────────────── */}
                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <SearchSelect
                    value={state.categoryId}
                    onValueChange={(v) => {
                      handleStateChange('categoryId', v);
                      setGlobalSearch('');
                      setIsSkillsExpanded(false);
                    }}
                    options={categories}
                    placeholder="Select a category"
                  />
                </div>

                {/* ── Skill Concept Grid (Collapsible & Max-Height Scrollable) ───── */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <Label>Skill Concept</Label>
                    <div className="flex items-center gap-2">
                      {filteredSkills.length > 10 && (
                        <button
                          type="button"
                          onClick={() => setIsSkillsExpanded(v => !v)}
                          className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 select-none"
                        >
                          {isSkillsExpanded ? 'Collapse ↑' : `Show all ${filteredSkills.length} ↓`}
                        </button>
                      )}
                      {state.skillId && (
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>

                  {!state.categoryId ? (
                    <div className="text-xs text-muted-foreground bg-muted/5 border border-dashed border-border/60 p-4 rounded-md text-center py-6">
                      Select a domain category or use Spotlight search (⌘K) to pick a skill.
                    </div>
                  ) : filteredSkills.length === 0 ? (
                    <div className="text-xs text-muted-foreground bg-muted/5 border border-dashed border-border/60 p-4 rounded-md text-center py-6">
                      No matching skills found.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border/70 flex flex-col gap-1.5">
                        {(isSkillsExpanded ? filteredSkills : filteredSkills.slice(0, 10)).map(s => {
                          const isSelected = state.skillId === s.id;
                          const rawName = s.metadata?.name || s.name;
                          const skillName = (rawName && rawName !== 'Unnamed Skill') ? rawName : (s.id || 'Custom Skill');
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectSkillFromSearch(s)}
                              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 select-none flex items-center justify-between gap-2 w-full text-left ${
                                isSelected
                                  ? 'bg-primary/20 border-primary text-foreground shadow-sm ring-1 ring-primary/30'
                                  : 'bg-muted/30 border-border/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className="font-semibold text-foreground break-words leading-snug flex-1">{skillName}</span>
                              {s.files && s.files.length > 0 && (
                                <span 
                                  title={`${s.files.length} supporting files included (scripts/templates)`}
                                  className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md font-mono font-bold tracking-tight shrink-0"
                                >
                                  +{s.files.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                        
                        <button
                          type="button"
                          onClick={() => {
                            handleStateChange('skillId', 'custom-skill');
                            handleStateChange('customSkillName', '');
                          }}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 select-none flex items-center gap-2 w-full text-left justify-start ${
                            state.skillId === 'custom-skill'
                              ? 'bg-primary/20 border-primary text-foreground shadow-sm ring-1 ring-primary/30'
                              : 'bg-muted/30 border-dashed border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <span className="break-words leading-none">Custom Skill...</span>
                        </button>
                      </div>

                      {!isSkillsExpanded && filteredSkills.length > 10 && (
                        <button
                          type="button"
                          onClick={() => setIsSkillsExpanded(true)}
                          className="w-full py-1 text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border/60 hover:bg-muted/40 rounded-md transition-colors font-medium flex items-center justify-center gap-1"
                        >
                          <span>Show {filteredSkills.length - 10} more skills in this category</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {state.skillId === 'custom-skill' && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <Label htmlFor="customSkillName" className="text-xs text-muted-foreground">Skill Name</Label>
                      <input
                        id="customSkillName"
                        type="text"
                        placeholder="e.g., Stripe Payments Integration"
                        className="px-3 py-2 rounded-md border border-border bg-input/40 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
                        value={state.customSkillName || ''}
                        onChange={(e) => handleStateChange('customSkillName', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {selectedSkill && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
                    <span className="font-semibold text-foreground">Trigger:</span> {selectedSkill.metadata?.description || selectedSkill.trigger || selectedSkill.howItWorks}
                  </div>
                )}
              </CardContent>
            </Card>
          </BorderGlow>

          <BorderGlow
            className="flex flex-col shrink-0"
            edgeSensitivity={30}
            glowColor="240 5 75"
            backgroundColor="hsl(var(--card))"
            borderRadius={12}
            glowRadius={40}
            glowIntensity={1.0}
            coneSpread={25}
            colors={['#ffffff', '#cbd5e1', '#64748b']}
            fillOpacity={0.0}
          >
            <Card className="bg-transparent border-0 shadow-none flex flex-col w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Custom Constraints</CardTitle>
                <CardDescription>Project-specific rules, style guides, or edge-cases.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col">
                <Textarea
                  placeholder="e.g., Must use Zustand with strict TypeScript typing, ignore Redux."
                  className="w-full min-h-[120px] max-h-[250px] resize-y bg-input/20 focus:bg-input/40 transition-colors"
                  value={state.customNotes}
                  onChange={(e) => handleStateChange('customNotes', e.target.value)}
                />
              </CardContent>
            </Card>
          </BorderGlow>

          {/* Error display */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="text-destructive font-semibold text-sm shrink-0">Error:</span>
                <span className="text-sm text-destructive break-words">{error}</span>
              </div>
              {isQuotaError && (
                <button
                  onClick={() => { setUseAI(false); setError(null); setIsQuotaError(false); }}
                  className="self-start text-xs font-semibold bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
                >
                  Switch to Offline mode
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full h-12 text-base font-semibold group relative overflow-hidden transition-all"
              size="lg"
              disabled={isGenerating || !state.categoryId || !state.skillId}
              onClick={handleGenerate}
            >
              {isGenerating
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Synthesizing...</>
                : <><Sparkles className="w-5 h-5 mr-2 text-primary-foreground group-hover:animate-pulse" /> Generate Skill</>
              }
            </Button>

            <Button
              variant="outline"
              className="w-full h-11 text-sm font-medium gap-2 relative"
              disabled={!state.categoryId || !state.skillId}
              onClick={handleAddToCart}
            >
              <Plus className="w-4 h-4" />
              Add to Queue
              {totalCartCount > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 cart-badge-pulse">
                  {totalCartCount}
                </span>
              )}
            </Button>
          </div>
        </aside>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <BorderGlow
          className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[600px] shadow-sm backdrop-blur-sm"
          edgeSensitivity={30}
          glowColor="240 5 75"
          backgroundColor="hsl(var(--card) / 0.5)"
          borderRadius={12}
          glowRadius={60}
          glowIntensity={1.2}
          coneSpread={30}
          colors={['#ffffff', '#cbd5e1', '#64748b']}
          fillOpacity={0.0}
        >
          <Card className="dark:bg-black border-0 shadow-none flex-1 flex flex-col w-full h-full">
            <Tabs defaultValue="preview" className="flex flex-col h-full w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
              <TabsList className="bg-transparent gap-2 h-auto p-0 flex-wrap">
                <TabsTrigger value="preview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-1.5 text-xs font-medium transition-all">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="raw" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-1.5 text-xs font-medium transition-all">
                  Raw Markdown
                </TabsTrigger>
                <TabsTrigger value="queue" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-1.5 text-xs font-medium transition-all relative">
                  Queue
                  {totalCartCount > 0 && (
                    <span className="ml-1.5 min-w-[18px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center px-1 cart-badge-pulse">
                      {totalCartCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} disabled={!state.generatedContent} className="h-8 gap-2 transition-all">
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                      <span className="text-emerald-400 font-medium animate-pulse">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </Button>
                <Button variant="default" size="sm" onClick={handleDownload} disabled={!state.generatedContent} className="h-8 gap-2">
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
            </div>

            {/* Preview tab */}
            <TabsContent value="preview" className="flex-1 p-0 m-0 relative">
              <ScrollArea className="h-full w-full absolute inset-0 p-6 md:p-8">
                {state.generatedContent ? (() => {
                  const { metadata, body } = parseSkillMd(state.generatedContent);
                  return (
                    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
                      {metadata && (
                        <div className="border border-border/60 bg-muted/20 rounded-lg overflow-hidden text-xs font-mono w-full max-w-full">
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b border-border/40">
                            <span className="w-2 h-2 rounded-full bg-yellow-400/80 shrink-0" />
                            <span className="text-muted-foreground tracking-widest uppercase text-[10px] font-semibold">Skill Metadata</span>
                          </div>
                          <div className="p-4 flex flex-col gap-2.5 w-full">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 w-full">
                              <span className="text-muted-foreground w-24 shrink-0 font-medium">name</span>
                              <span className="text-foreground font-semibold break-words min-w-0 flex-1">{metadata.name}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 w-full">
                              <span className="text-muted-foreground w-24 shrink-0 font-medium">description</span>
                              <span className="text-foreground leading-relaxed break-words min-w-0 flex-1">{metadata.description}</span>
                            </div>
                            {metadata.category && (
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 w-full">
                                <span className="text-muted-foreground w-24 shrink-0 font-medium">category</span>
                                <span className="text-foreground break-words min-w-0 flex-1">{metadata.category}</span>
                              </div>
                            )}
                            {metadata.version && (
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 w-full">
                                <span className="text-muted-foreground w-24 shrink-0 font-medium">version</span>
                                <span className="text-foreground break-words min-w-0 flex-1">{metadata.version}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="markdown-preview max-w-full w-full overflow-hidden">
                        <ReactMarkdown>{body}</ReactMarkdown>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <h4 className="font-semibold mb-1 text-foreground">How to deploy this skill</h4>
                          <p className="text-muted-foreground">Copy the raw markdown (Raw Markdown tab → Copy) and save it as a <code className="bg-primary/20 text-primary px-1 rounded">.md</code> file in your agent's skills directory, or paste it into your system prompt.</p>
                          {!useAI && <p className="mt-2 text-xs opacity-75 italic text-muted-foreground">Enable AI mode (toggle in header) and add a Gemini API Key to generate dynamic content.</p>}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                    <Sparkles className="w-12 h-12" />
                    <p>Select a skill and click Generate to build the output.</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Raw Markdown tab */}
            <TabsContent value="raw" className="flex-1 p-0 m-0">
              <Textarea
                value={state.generatedContent}
                onChange={(e) => handleStateChange('generatedContent', e.target.value)}
                className="h-full w-full border-0 focus-visible:ring-0 rounded-none resize-none p-6 md:p-8 font-mono text-sm leading-relaxed bg-transparent"
                placeholder="# Your markdown will appear here..."
              />
            </TabsContent>

            {/* Queue tab */}
            <TabsContent value="queue" className="flex-1 p-0 m-0 relative overflow-hidden">
              <CartPanel
                cart={cart}
                isRunning={isBatchRunning}
                onPreview={setPreviewItem}
                onEdit={setEditItem}
                onDelete={handleDeleteItem}
                onGenerateAll={handleGenerateAll}
                onClearDone={handleClearDone}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </BorderGlow>
      </main>

      {/* Modals */}
      {previewItem && (
        <SkillPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onSave={handleSaveEdit}
          onClose={() => setEditItem(null)}
        />
      )}
      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 mt-2 border-t border-border/30 flex items-center justify-center">
        <p className="text-xs text-muted-foreground/50 tracking-wide">
          © {new Date().getFullYear()} <span className="font-mono font-medium text-muted-foreground/70">k-r-y</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
