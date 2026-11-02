import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center font-sans font-medium transition-colors shrink-0',
  {
    variants: {
      variant: {
        default: 'text-ink-secondary',
        subtle: 'text-muted',
        outline: 'text-ink',
        
        // Evolexa Signature Brand Colors
        indigo: 'text-indigo',
        cyan: 'text-cyan',
        amber: 'text-amber',
        emerald: 'text-green',
        rose: 'text-red',
        violet: 'text-violet',

        // Semantic Application Status Variants
        wishlist: 'text-muted',
        applied: 'text-cyan',
        interview: 'text-amber',
        offer: 'text-green',
        rejected: 'text-red',
      },
      size: {
        sm: 'text-xs gap-1.5',
        md: 'text-xs sm:text-sm gap-1.5',
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
