import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SearchSelect({ value, onValueChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (open && containerRef.current) {
      const updateCoords = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setCoords({
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
  }, [open]);

  const selectedOption = options.find(o => o.id === value);
  const filteredOptions = options.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
        role="combobox"
        aria-expanded={open}
        aria-label={placeholder || "Select option"}
        onClick={() => setOpen(!open)}
        className="flex min-h-[42px] h-auto w-full items-center justify-between gap-2 rounded-md border border-input bg-background/50 hover:bg-background/80 px-3 py-2 text-sm transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 text-left select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 flex-1 min-w-0 py-0.5">
          <span className={`break-words leading-snug ${selectedOption ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          {selectedOption && selectedOption.count !== undefined && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono shrink-0 w-fit">
              {selectedOption.count} {selectedOption.count === 1 ? 'skill' : 'skills'}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 opacity-60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && coords && createPortal(
        <div 
          ref={dropdownRef}
          role="listbox"
          style={{ top: coords.top + 4, left: coords.left, width: coords.width }}
          className="fixed z-[9999] max-h-72 overflow-hidden rounded-lg border border-border/80 bg-card text-card-foreground shadow-2xl flex flex-col backdrop-blur-md animate-in fade-in-0 slide-in-from-top-1 duration-100"
        >
          <div className="flex items-center border-b border-border px-3 py-2 gap-2 bg-muted/20 shrink-0">
            <Search className="h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              aria-label="Search categories"
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-7 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0 px-2" 
              autoFocus
            />
          </div>
          <ScrollArea className="flex-1 overflow-y-auto p-1.5 max-h-56">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">No matches found</div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredOptions.map((opt) => {
                  const isSelected = opt.id === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onValueChange(opt.id);
                        setOpen(false);
                      }}
                      className={`flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-md text-xs transition-colors select-none text-left ${
                        isSelected 
                          ? 'bg-primary/15 text-primary font-semibold' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="break-words leading-snug flex-1 min-w-0">{opt.name}</span>
                      {opt.count !== undefined && (
                        <span className="text-[10px] opacity-80 bg-muted/80 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {opt.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>,
        document.body
      )}
    </div>
  );
}
