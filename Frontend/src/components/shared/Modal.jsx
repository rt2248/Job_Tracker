import React, { useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

function useModalLock(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
}

function Modal({
  isOpen,
  onClose,
  children,
  className,
  size = 'md',
  closeOnOverlayClick = true,
}) {
  useModalLock(isOpen, onClose);

  const handleOverlayClick = useCallback(
    (e) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-modal-backdrop"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'bg-surface border border-border-primary rounded-2xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl animate-modal-content',
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ className, children, onClose }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 pb-4 border-b border-border-subtle mb-4', className)}>
      <div className={cn('flex flex-col gap-1', onClose ? 'min-w-0' : 'w-full items-center text-center')}>
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-ink text-xl leading-none p-1 rounded-lg hover:bg-surface-secondary transition-colors hover:cursor-pointer shrink-0"
          aria-label="Close dialog"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function ModalTitle({ className, children }) {
  return (
    <h2 className={cn('font-display text-ink text-lg sm:text-xl font-semibold', className)}>
      {children}
    </h2>
  );
}

function ModalContent({ className, children }) {
  return <div className={cn('py-2', className)}>{children}</div>;
}

function ModalFooter({ className, children }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 pt-4 border-t border-border-subtle mt-6', className)}>
      {children}
    </div>
  );
}

export default Modal;
export { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter };
