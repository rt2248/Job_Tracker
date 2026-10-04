import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-mono font-medium transition-colors shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-surface-secondary text-ink border border-border-primary',
        subtle: 'bg-surface-overlay text-ink-secondary border border-transparent',
        outline: 'bg-transparent text-ink border border-border-primary',
        
        // Evolexa Signature Brand Colors
        indigo: 'bg-indigo/15 text-indigo border border-indigo/30',
        cyan: 'bg-cyan/15 text-cyan border border-cyan/30',
        amber: 'bg-amber/15 text-amber border border-amber/30',
        emerald: 'bg-green/15 text-green border border-green/30',
        rose: 'bg-red/15 text-red border border-red/30',
        violet: 'bg-violet/15 text-violet border border-violet/30',

        // Semantic Application Status Variants
        wishlist: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
        applied: 'bg-indigo/15 text-indigo border border-indigo/30',
        interview: 'bg-amber/15 text-amber border border-amber/30',
        offer: 'bg-green/15 text-green border border-green/30',
        rejected: 'bg-red/15 text-red border border-red/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px] gap-1',
        md: 'px-2.5 py-1 text-xs gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

function Badge({
  className,
  variant,
  size,
  dot = false,
  children,
  ...props
}) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
export { badgeVariants };
