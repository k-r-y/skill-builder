import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSkill } from './lib/gemini';
import { loadState, saveState } from './lib/storage';

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
import skillsData from './data/skillsMatrix.json';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Copy, Download, Loader2, Sparkles, Terminal, Info, Sun, Moon } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'skillBuilderState';

function App() {
  const [categories] = useState(skillsData.categories);
  const [skills] = useState(skillsData.skills);
  
  const [state, setState] = useState(() => loadState(LOCAL_STORAGE_KEY, {
    categoryId: '',
    skillId: '',
    customNotes: '',
    apiKey: '',
    generatedContent: ''
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [useAI, setUseAI] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    saveState(LOCAL_STORAGE_KEY, state);
  }, [state]);

  const handleStateChange = (key, value) => {
    setState(prev => {
      // Reset skillId if category changes
      if (key === 'categoryId') {
        return { ...prev, [key]: value, skillId: '' };
      }
      return { ...prev, [key]: value };
    });
  };

  const filteredSkills = skills.filter(s => s.categoryId === state.categoryId);
  const selectedSkill = skills.find(s => s.id === state.skillId);

  const handleGenerate = async () => {
    if (!state.categoryId || !state.skillId) {
      setError("Please select a category and a skill.");
      return;
    }

    setError(null);
    setIsQuotaError(false);
    setIsGenerating(true);

    const category = categories.find(c => c.id === state.categoryId)?.name || state.categoryId;
    const skillName = selectedSkill?.name || 'Custom Skill';
    const mechanics = selectedSkill?.howItWorks || '';
    const why = selectedSkill?.whyItMatters || '';

    try {
      const content = await generateSkill(selectedSkill, category, state.customNotes, state.apiKey, useAI);
      handleStateChange('generatedContent', content);
    } catch (err) {
      let message = err.message || 'An error occurred during generation.';
      try {
        const parsed = JSON.parse(message);
        message = parsed?.error?.message || message;
      } catch {
        // not JSON, use as-is
      }
      if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED') || message.includes('billing')) {
        setIsQuotaError(true);
        setError('Free-tier quota reached for today.');
      } else if (message.includes('no longer available') || message.includes('NOT_FOUND')) {
        setError('No compatible Gemini model found for this API key.');
      } else {
        const firstSentence = message.split(/\. /)[0];
        setError(firstSentence.length < message.length ? firstSentence + '.' : message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (state.generatedContent) {
      navigator.clipboard.writeText(state.generatedContent);
    }
  };

  const handleDownload = () => {
    if (state.generatedContent) {
      const blob = new Blob([state.generatedContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedSkill?.name?.replace(/\\s+/g, '-').toLowerCase() || 'skill'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <header className="w-full max-w-7xl mx-auto py-6 px-4 md:px-8 border-b border-border/40 flex justify-between items-center backdrop-blur-md sticky top-0 z-10 bg-background/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Skill Builder</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* AI / Offline toggle */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`text-xs font-medium transition-colors ${!useAI ? 'text-foreground' : 'text-muted-foreground'}`}>Offline</span>
            <button
              id="ai-mode-toggle"
              role="switch"
              aria-checked={useAI}
              onClick={() => setUseAI(v => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                useAI ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${
                  useAI ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-medium transition-colors ${useAI ? 'text-foreground' : 'text-muted-foreground'}`}>AI</span>
          </div>

          {/* API Key input — only active in AI mode */}
          <div className="relative">
            <Label htmlFor="apiKey" className="sr-only">Gemini API Key</Label>
            <input
              id="apiKey"
              type="password"
              placeholder="Gemini API Key"
              disabled={!useAI}
              className={`px-3 py-1.5 rounded-md border border-border bg-input/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-opacity ${
                useAI ? 'opacity-100' : 'opacity-30 cursor-not-allowed'
              }`}
              value={state.apiKey}
              onChange={(e) => handleStateChange('apiKey', e.target.value)}
            />
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-9 h-9 border border-border">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Control Center */}
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label>Skill Concept</Label>
                <Select disabled={!state.categoryId} value={state.skillId} onValueChange={(v) => handleStateChange('skillId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a concept" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSkills.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSkill && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
                  <span className="font-semibold text-foreground">Mechanic:</span> {selectedSkill.howItWorks}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Custom Constraints</CardTitle>
              <CardDescription>Add project-specific rules, style guides, or edge-cases.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
              <Textarea 
                placeholder="e.g., Must use Zustand with strict TypeScript typing, ignore Redux. Avoid writing boilerplate reducers."
                className="flex-1 min-h-[150px] resize-none bg-input/20 focus:bg-input/40 transition-colors"
                value={state.customNotes}
                onChange={(e) => handleStateChange('customNotes', e.target.value)}
              />
            </CardContent>
          </Card>

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

          <Button 
            className="w-full h-12 text-base font-semibold group relative overflow-hidden transition-all"
            size="lg"
            disabled={isGenerating || !state.categoryId || !state.skillId}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Synthesizing...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2 text-primary-foreground group-hover:animate-pulse" /> Generate Skill</>
            )}
          </Button>
        </div>

        {/* Right Column: Playground */}
        <div className="lg:col-span-8 flex flex-col min-h-[600px] border border-border bg-card/50 rounded-xl overflow-hidden shadow-2xl relative backdrop-blur-sm">
          <Tabs defaultValue="preview" className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <TabsList className="bg-transparent gap-2 h-auto p-0">
                <TabsTrigger value="preview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-1.5 text-xs font-medium transition-all">Preview</TabsTrigger>
                <TabsTrigger value="code" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-1.5 text-xs font-medium transition-all">Raw Markdown</TabsTrigger>
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

            <TabsContent value="preview" className="flex-1 p-0 m-0 relative">
              <ScrollArea className="h-full w-full absolute inset-0 p-6 md:p-8">
                {state.generatedContent ? (() => {
                  const { frontmatter, body } = parseSkillMd(state.generatedContent);
                  return (
                    <div className="flex flex-col gap-6">
                      {/* Frontmatter metadata card */}
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

                      {/* Markdown body */}
                      <div className="markdown-preview max-w-none">
                        <ReactMarkdown>{body}</ReactMarkdown>
                      </div>

                      {/* Usage note */}
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

            <TabsContent value="code" className="flex-1 p-0 m-0">
              <Textarea 
                value={state.generatedContent}
                onChange={(e) => handleStateChange('generatedContent', e.target.value)}
                className="h-full w-full border-0 focus-visible:ring-0 rounded-none resize-none p-6 md:p-8 font-mono text-sm leading-relaxed bg-transparent"
                placeholder="# Your markdown will appear here..."
              />
            </TabsContent>
          </Tabs>
        </div>

      </main>
    </div>
  );
}

export default App;
