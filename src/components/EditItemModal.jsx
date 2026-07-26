import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function EditItemModal({ item, onSave, onClose }) {
  const [notes, setNotes] = useState(item?.customNotes ?? '');

  if (!item) return null;

  const isDirty = notes !== item.customNotes;
  const wasGenerated = item.status === 'done';

  const handleSave = () => {
    onSave(item.cartId, notes);
    onClose();
  };

  const displayName = item.skill?.metadata?.name || item.skill?.name || item.skill?.id || 'Skill';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div>
            <h2 className="text-base font-semibold text-foreground">Edit Constraints</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{displayName} · {item.categoryName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {wasGenerated && isDirty && (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>This skill was already generated. Saving changes will mark it as pending — regenerate to update the output.</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Project-specific constraints</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Must use Zustand, avoid Redux, no TypeScript."
              className="min-h-[140px] resize-none bg-input/20 focus:bg-input/40 transition-colors font-mono text-sm"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Leave empty to use the standard offline template with no extra constraints.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>
            {wasGenerated && isDirty ? 'Save & Mark Pending' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
