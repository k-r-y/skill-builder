import React, { useState, useRef } from 'react';
import {
  Eye, Pencil, Trash2, Download, Loader2,
  CheckCircle2, AlertCircle, Clock, Package, Zap, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { batchDownload } from '../lib/cart';

const STATUS_CONFIG = {
  pending:    { label: 'pending',    className: 'status-pending' },
  generating: { label: 'generating', className: 'status-generating' },
  done:       { label: 'done',       className: 'status-done' },
  error:      { label: 'error',      className: 'status-error' },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className={`status-pill ${cfg.className}`}>{cfg.label}</span>;
}

function StatusIcon({ status }) {
  const cls = 'w-4 h-4 shrink-0';
  if (status === 'generating') return <Loader2 className={`${cls} text-blue-400 animate-spin`} />;
  if (status === 'done')       return <CheckCircle2 className={`${cls} text-emerald-400`} />;
  if (status === 'error')      return <AlertCircle className={`${cls} text-destructive`} />;
  return <Clock className={`${cls} text-muted-foreground/50`} />;
}

function CartItemRow({ item, onPreview, onEdit, onDelete, isRunning }) {
  const [exiting, setExiting] = useState(false);

  const handleDelete = () => {
    setExiting(true);
    setTimeout(() => onDelete(item.cartId), 220);
  };

  return (
    <div className={`cart-item ${exiting ? 'cart-item-exit' : 'cart-item-enter'} border-l-2 ${
      item.status === 'done'       ? 'border-emerald-500/60' :
      item.status === 'generating' ? 'border-blue-500/80 cart-item-glow' :
      item.status === 'error'      ? 'border-destructive/60' :
      'border-border/40'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon status={item.status} />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{item.skill.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">{item.categoryName}</span>
            {item.errorMessage && item.status === 'done' && (
              <span className="text-[10px] text-amber-400/70 italic">· offline fallback</span>
            )}
            {item.status === 'error' && item.errorMessage && (
              <span className="text-[10px] text-destructive/80 italic truncate">· {item.errorMessage}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <StatusPill status={item.status} />
        <button
          title="Preview"
          onClick={() => onPreview(item)}
          className="cart-action-btn"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          title="Edit constraints"
          onClick={() => onEdit(item)}
          disabled={isRunning && item.status === 'generating'}
          className="cart-action-btn"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          title="Remove"
          onClick={handleDelete}
          disabled={isRunning && item.status === 'generating'}
          className="cart-action-btn cart-action-btn-danger"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function CartPanel({
  cart,
  isRunning,
  onPreview,
  onEdit,
  onDelete,
  onGenerateAll,
  onClearDone,
}) {
  const doneCount    = cart.filter(i => i.status === 'done').length;
  const pendingCount = cart.filter(i => i.status === 'pending').length;
  const totalCount   = cart.length;

  if (totalCount === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40 space-y-4 p-8">
        <ShoppingCart className="w-12 h-12" />
        <p className="text-sm text-center leading-relaxed">
          Your queue is empty.<br />
          Select a skill and click <strong className="text-foreground opacity-70">Add to Queue</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Queue header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/10 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{totalCount} skill{totalCount !== 1 ? 's' : ''}</span>
          {doneCount > 0 && (
            <span className="text-xs text-emerald-400/80">· {doneCount} ready</span>
          )}
          {pendingCount > 0 && (
            <span className="text-xs text-muted-foreground/60">· {pendingCount} pending</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => batchDownload(cart)}
            >
              <Download className="w-3.5 h-3.5" />
              Download ZIP
            </Button>
          )}
          {pendingCount > 0 && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              disabled={isRunning}
              onClick={onGenerateAll}
            >
              {isRunning
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
                : <><Zap className="w-3.5 h-3.5" /> Generate All</>
              }
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 flex flex-col gap-2">
          {cart.map(item => (
            <CartItemRow
              key={item.cartId}
              item={item}
              isRunning={isRunning}
              onPreview={onPreview}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {doneCount > 0 && (
        <div className="px-4 py-2.5 border-t border-border/30 bg-muted/5 shrink-0">
          <button
            onClick={onClearDone}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear completed ({doneCount})
          </button>
        </div>
      )}
    </div>
  );
}
