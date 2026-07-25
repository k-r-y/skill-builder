import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Copy, Download, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { downloadSingleSkill } from '../lib/cart';
import { parseSkillMd } from '../utils/skillParser';

export default function SkillPreviewModal({ item, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const hasPending = item.status === 'pending' || !item.generatedContent;
  const { metadata, body } = hasPending ? { metadata: null, body: '' } : parseSkillMd(item.generatedContent);

  const handleCopy = () => {
    if (item.generatedContent) {
      navigator.clipboard.writeText(item.generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-foreground">{item.skill.name}</h2>
            <span className="text-xs text-muted-foreground">{item.categoryName}</span>
          </div>
          <div className="flex items-center gap-2">
            {!hasPending && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-1.5 text-xs transition-all">
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
                <Button variant="default" size="sm" onClick={() => downloadSingleSkill(item)} className="h-8 gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 md:p-8">
            {hasPending ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                <FileText className="w-10 h-10 opacity-30" />
                <p className="text-sm">This skill hasn't been generated yet.</p>
                <p className="text-xs opacity-60">Generate it from the Queue view.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Frontmatter card */}
                {metadata && (
                  <div className="border border-border/60 bg-muted/20 rounded-lg overflow-hidden text-xs font-mono">
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b border-border/40">
                      <span className="w-2 h-2 rounded-full bg-yellow-400/80" />
                      <span className="text-muted-foreground tracking-widest uppercase text-[10px] font-semibold">Skill Metadata</span>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex gap-3">
                        <span className="text-muted-foreground w-24 shrink-0">name</span>
                        <span className="text-foreground font-semibold">{metadata.name}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-muted-foreground w-24 shrink-0">description</span>
                        <span className="text-foreground leading-relaxed">{metadata.description}</span>
                      </div>
                      {metadata.category && (
                        <div className="flex gap-3">
                          <span className="text-muted-foreground w-24 shrink-0">category</span>
                          <span className="text-foreground">{metadata.category}</span>
                        </div>
                      )}
                      {metadata.version && (
                        <div className="flex gap-3">
                          <span className="text-muted-foreground w-24 shrink-0">version</span>
                          <span className="text-foreground">{metadata.version}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Markdown body */}
                <div className="markdown-preview max-w-none">
                  <ReactMarkdown>{body}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
