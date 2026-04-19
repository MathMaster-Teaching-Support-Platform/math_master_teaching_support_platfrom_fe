import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import type { ToastOptions } from '../../../context/ToastContext';
import './Toast.css';

interface ToastProps {
  toast: ToastOptions;
  onDismiss: () => void;
}

const icons = {
  success: <CheckCircle className="ud-toast__icon" size={20} />,
  error: <AlertCircle className="ud-toast__icon" size={20} />,
  info: <Info className="ud-toast__icon" size={20} />,
  warning: <AlertTriangle className="ud-toast__icon" size={20} />,
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const type = toast.type || 'info';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`ud-toast ud-toast--${type}`}
    >
      {icons[type]}
      <div className="ud-toast__content">
        <p className="ud-toast__message">{toast.message}</p>
        {toast.action && (
          <div className="ud-toast__action">
            <button 
              className="ud-toast__action-btn"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>
      <button className="ud-toast__close" onClick={onDismiss} aria-label="Close">
        <X size={16} />
      </button>

      {/* Progress bar animation */}
      <motion.div 
        className="ud-toast__progress"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
};
