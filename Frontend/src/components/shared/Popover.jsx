import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

function Popover({
  isOpen,
  onClose,
  children,
  className,
  align = 'left',
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div
      ref={popoverRef}
      className={cn(
        'absolute top-full mt-2 z-40 bg-surface-elevated border border-border-primary rounded-xl p-4 shadow-xl animate-modal-content',
        alignClasses[align] || alignClasses.left,
        className
      )}
    >
      {children}
    </div>
  );
}

export default Popover;
