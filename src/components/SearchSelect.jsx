import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SearchSelect({ value, onValueChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.id === value);
  const filteredOptions = options.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 hover:bg-background/80 px-3 py-2 text-sm transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 text-left select-none"
      >
        <span className={selectedOption ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-border/80 bg-card text-card-foreground shadow-xl flex flex-col backdrop-blur-md animate-in fade-in-0 slide-in-from-top-1 duration-100">
          <div className="flex items-center border-b border-border px-3 py-2 gap-2 bg-muted/20 shrink-0">
            <Search className="h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-7 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0 px-2" 
              autoFocus
            />
          </div>
          <ScrollArea className="flex-1 overflow-y-auto p-1 max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">No matches found</div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredOptions.map((opt) => {
                  const isSelected = opt.id === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onValueChange(opt.id);
                        setOpen(false);
                      }}
                      className={`relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-xs outline-none hover:bg-muted/80 text-left transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </span>
                      )}
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
