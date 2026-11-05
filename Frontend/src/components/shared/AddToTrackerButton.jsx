import React, { forwardRef } from 'react';
import Button from './Button';
import { cn } from '../../utils/cn';

/**
 * Standardized Add to Tracker Button component.
 *
 * Guarantees high-contrast #FFFFFF (white) text in Light Mode across all
 * interaction states (default, hover, active, focus) against the existing
 * blue button background, while perfectly preserving Dark Mode appearance
 * and existing layout/dimensions.
 */
const AddToTrackerButton = forwardRef(
  (
    {
      inFlight = false,
      disabled = false,
      className,
      size = 'sm',
      variant = 'primary',
      onClick,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        size={size}
        disabled={disabled || inFlight}
        onClick={onClick}
        className={cn(
          'add-to-tracker-btn flex items-center gap-1.5 transition-colors',
          className
        )}
        {...props}
      >
        {inFlight ? (
          <>
            <span
              className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-950 border-t-transparent animate-spin shrink-0"
              aria-hidden="true"
            />
            <span>Adding...</span>
          </>
        ) : (
          children || '+ Add to Tracker'
        )}
      </Button>
    );
  }
);

AddToTrackerButton.displayName = 'AddToTrackerButton';

export default AddToTrackerButton;
