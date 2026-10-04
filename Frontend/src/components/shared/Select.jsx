import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      children,
      className,
      id,
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;

    return (
      <div className="flex flex-col w-full gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-ink-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId}
            className={cn(
              'w-full h-10 px-3 py-2 text-sm bg-surface-secondary text-ink rounded-lg border transition-all outline-none appearance-none pr-8 cursor-pointer',
              'border-border-primary focus:border-indigo focus:ring-2 focus:ring-indigo/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red focus:border-red focus:ring-red/30',
              className
            )}
            {...props}
          >
            {children ? (
              children
            ) : (
              <>
                {placeholder && (
                  <option value="" disabled>
                    {placeholder}
                  </option>
                )}
                {options.map((opt) => (
                  <option key={opt.value || opt} value={opt.value || opt}>
                    {opt.label || opt}
                  </option>
                ))}
              </>
            )}
          </select>
          <div className="absolute right-3 pointer-events-none text-muted text-xs">
            ▼
          </div>
        </div>
        {error ? (
          <p id={errorId} className="text-xs text-red font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
