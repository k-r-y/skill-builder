import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSkill } from './lib/gemini';
import { loadState, saveState } from './lib/storage';
import { createCartItem, batchGenerate } from './lib/cart';
import skillsData from './data/skillsMatrix.json';
import CartPanel from './components/CartPanel';
import SkillPreviewModal from './components/SkillPreviewModal';
import EditItemModal from './components/EditItemModal';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Copy, Download, Loader2, Sparkles, Terminal, Info, Sun, Moon, ShoppingCart, Plus } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'skillBuilderState';
const CART_STORAGE_KEY  = 'skillBuilderCart';

/** Splits raw SKILL.md into { frontmatter: {name, description}, body: string } */
function parseSkillMd(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: raw };
  const fm = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    fm[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  });
  return { frontmatter: fm, body: match[2].trim() };
}

function App() {
  const [categories] = useState(skillsData.categories);
  const [skills]     = useState(skillsData.skills);

  const [state, setState] = useState(() => loadState(LOCAL_STORAGE_KEY, {
    categoryId: '',
    skillId: '',
    customNotes: '',
    apiKey: '',
    generatedContent: '',
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError]               = useState(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [useAI, setUseAI]               = useState(false);

  // --- Cart state ---
  const [cart, setCart]               = useState(() => loadState(CART_STORAGE_KEY, []));
  const [isBatchRunning, setIsBatch]  = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [editItem, setEditItem]       = useState(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') || 'dark';
    return 'dark';
  });

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

  const filteredSkills  = skills.filter(s => s.categoryId === state.categoryId);
  const selectedSkill   = skills.find(s => s.id === state.skillId);
  const selectedCategory = categories.find(c => c.id === state.categoryId);

  // ── Single-shot generate (Preview tab) ──────────────────────────────
  const handleGenerate = async () => {
    if (!state.categoryId || !state.skillId) {
      setError('Please select a category and a skill.');
      return;
    }
    setError(null);
    setIsQuotaError(false);
    setIsGenerating(true);

    const category = selectedCategory?.name || state.categoryId;
    try {
      const content = await generateSkill(selectedSkill, category, state.customNotes, state.apiKey, useAI);
      handleStateChange('generatedContent', content);
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

    const category = selectedCategory?.name || '';
    await batchGenerate(cart, state.apiKey, useAI, (updatedItem) => {
      setCart(prev => prev.map(i => i.cartId === updatedItem.cartId ? updatedItem : i));
    });

    setIsBatch(false);
  };

  // ── Copy / Download (single preview) ────────────────────────────────
  const handleCopy = () => {
    if (state.generatedContent) navigator.clipboard.writeText(state.generatedContent);
  };

  const handleDownload = () => {
    if (state.generatedContent) {
      const blob = new Blob([state.generatedContent], { type: 'text/markdown' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${selectedSkill?.name?.replace(/\s+/g, '-').toLowerCase() || 'skill'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const pendingCartCount = cart.filter(i => i.status === 'pending').length;
  const totalCartCount   = cart.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto py-4 md:py-6 px-4 md:px-8 border-b border-border/40 flex flex-col sm:flex-row gap-4 justify-between items-center backdrop-blur-md sticky top-0 z-10 bg-background/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Skill Builder</h1>
          <span className="ml-1 text-[10px] font-mono text-primary/60 border border-primary/20 rounded px-1.5 py-0.5 leading-none">v2</span>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          {/* AI / Offline toggle */}
          <div className="flex items-center gap-2 text-sm shrink-0">
            <span className={`text-xs font-medium transition-colors ${!useAI ? 'text-foreground' : 'text-muted-foreground'}`}>Offline</span>
            <button
              id="ai-mode-toggle"
              role="switch"
              aria-checked={useAI}
              onClick={() => setUseAI(v => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${useAI ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${useAI ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-medium transition-colors ${useAI ? 'text-foreground' : 'text-muted-foreground'}`}>AI</span>
          </div>

          <div className="relative shrink-0 max-w-[150px] xs:max-w-none">
            <Label htmlFor="apiKey" className="sr-only">Gemini API Key</Label>
            <input
              id="apiKey"
              type="password"
              placeholder="Gemini API Key"
              disabled={!useAI}
              className={`px-3 py-1.5 w-full rounded-md border border-border bg-input/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-opacity ${useAI ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}`}
              value={state.apiKey}
              onChange={(e) => handleStateChange('apiKey', e.target.value)}
            />
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-9 h-9 border border-border shrink-0">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Configure Context</h2>
            <p className="text-muted-foreground text-sm">Select the mechanical foundation and provide custom constraints.</p>
          </div>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Domain & Skill</CardTitle>
              <CardDescription>Choose the primary software domain and target concept.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={state.categoryId} onValueChange={(v) => handleStateChange('categoryId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="flex justify-between items-center">
                  <span>Skill Concept</span>
                  {state.skillId && (
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono font-medium">
                      Selected
                    </span>
                  )}
                </Label>
                {!state.categoryId ? (
                  <div className="text-xs text-muted-foreground bg-muted/5 border border-dashed border-border/60 p-4 rounded-md text-center py-6">
                    Select a category first to view available concepts.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredSkills.map(s => {
                      const isSelected = state.skillId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleStateChange('skillId', s.id)}
                          className={`px-3 py-2 rounded-md border text-xs font-medium transition-all duration-150 select-none flex items-center gap-2 grow sm:grow-0 text-left justify-start ${
                            isSelected
                              ? 'bg-primary/20 border-primary text-foreground shadow-sm shadow-primary/10 ring-1 ring-primary/20'
                              : 'bg-muted/30 border-border/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                            isSelected ? 'bg-primary' : 'bg-muted-foreground/35'
                          }`} />
                          <span className="truncate leading-none">{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedSkill && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
                  <span className="font-semibold text-foreground">Trigger:</span> {selectedSkill.trigger || selectedSkill.howItWorks}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Custom Constraints</CardTitle>
              <CardDescription>Project-specific rules, style guides, or edge-cases.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
              <Textarea
                placeholder="e.g., Must use Zustand with strict TypeScript typing, ignore Redux."
                className="flex-1 min-h-[120px] resize-none bg-input/20 focus:bg-input/40 transition-colors"
                value={state.customNotes}
                onChange={(e) => handleStateChange('customNotes', e.target.value)}
              />
            </CardContent>
          </Card>

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
        </div>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col min-h-[600px] border border-border bg-card/50 rounded-xl overflow-hidden shadow-2xl relative backdrop-blur-sm">
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
                <Button variant="outline" size="sm" onClick={handleCopy} disabled={!state.generatedContent} className="h-8 gap-2">
                  <Copy className="w-3.5 h-3.5" /> Copy
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
                  const { frontmatter, body } = parseSkillMd(state.generatedContent);
                  return (
                    <div className="flex flex-col gap-6">
                      {frontmatter && (
                        <div className="border border-border/60 bg-muted/20 rounded-lg overflow-hidden text-xs font-mono">
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b border-border/40">
                            <span className="w-2 h-2 rounded-full bg-yellow-400/80" />
                            <span className="text-muted-foreground tracking-widest uppercase text-[10px] font-semibold">Skill Metadata</span>
                          </div>
                          <div className="p-4 flex flex-col gap-2">
                            <div className="flex gap-3">
                              <span className="text-muted-foreground w-24 shrink-0">name</span>
                              <span className="text-foreground font-semibold">{frontmatter.name}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-muted-foreground w-24 shrink-0">description</span>
                              <span className="text-foreground leading-relaxed">{frontmatter.description}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="markdown-preview max-w-none">
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
        </div>
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
