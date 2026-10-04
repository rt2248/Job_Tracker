import React from 'react';
import { cn } from '../../utils/cn';

function Tabs({ value, onChange, items = [], className }) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-surface-secondary/70 border border-border-primary rounded-xl', className)}>
      {items.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange?.(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all outline-none cursor-pointer',
              isActive
                ? 'bg-surface-elevated text-ink font-semibold shadow-sm border border-border-subtle'
                : 'text-muted hover:text-ink hover:bg-surface-overlay'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
export { Tabs };
