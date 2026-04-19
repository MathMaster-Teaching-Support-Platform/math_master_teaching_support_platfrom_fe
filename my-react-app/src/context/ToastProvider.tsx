import React, { useState, useCallback, useMemo } from 'react';
import { ToastContext, type ToastOptions } from './ToastContext';
import { Toast } from '../components/common/Toast/Toast';
import { AnimatePresence } from 'framer-motion';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions | string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toastOptions: ToastOptions = typeof options === 'string' 
      ? { message: options, id } 
      : { ...options, id: options.id || id };

    setToasts((prev) => [...prev, toastOptions]);

    // Auto dismiss
    const duration = toastOptions.duration || 5000;
    if (duration !== Infinity) {
      setTimeout(() => hideToast(id), duration);
    }
  }, [hideToast]);

  const contextValue = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={() => hideToast(toast.id!)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
