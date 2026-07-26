import { useState, useEffect, createContext, useContext } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const ToastItem = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <FiCheckCircle className="text-emerald-400 shrink-0" size={18} />,
    error: <FiAlertCircle className="text-rose-400 shrink-0" size={18} />,
    info: <FiInfo className="text-cyan-400 shrink-0" size={18} />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100',
    error: 'border-rose-500/30 bg-rose-950/90 text-rose-100',
    info: 'border-cyan-500/30 bg-slate-900/95 text-slate-100',
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl animate-slide-in-right ${borders[toast.type] || borders.info}`}>
      {icons[toast.type] || icons.info}
      <p className="flex-1 text-xs font-semibold">{toast.message}</p>
      <button onClick={onClose} className="rounded-full p-1 opacity-70 hover:opacity-100">
        <FiX size={14} />
      </button>
    </div>
  );
};
