import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-indigo/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 shrink-0 hover:cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-indigo hover:bg-indigo-light text-white shadow-sm border border-transparent',
        secondary: 'bg-surface-secondary hover:bg-surface-overlay text-ink border border-border-primary',
        ghost: 'bg-transparent hover:bg-surface-secondary text-ink border border-transparent',
        outline: 'bg-transparent hover:bg-surface-secondary text-ink border border-border-primary',
        destructive: 'bg-red/15 hover:bg-red/25 text-red border border-red/30',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
        icon: 'h-10 w-10 p-0 flex items-center justify-center',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = forwardRef(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
export { buttonVariants };
