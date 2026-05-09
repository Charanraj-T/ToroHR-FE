import React from 'react';
import { useToastStore, type ToastType } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastItem: React.FC<{ id: string; message: string; type: ToastType }> = ({ id, message, type }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  const icons = {
    success: <CheckCircle2 className="toast-icon success" size={20} />,
    error: <AlertCircle className="toast-icon error" size={20} />,
    info: <Info className="toast-icon info" size={20} />,
  };

  return (
    <div className={`toast-item ${type}`}>
      {icons[type]}
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => removeToast(id)}>
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
};
