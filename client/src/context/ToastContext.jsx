import React, { createContext, useContext, useState, useCallback } from "react";
import ToastContainer from "../components/ui/Toast";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title = "", message = "", duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    show: addToast,
    success: (message, title = "Success") =>
      addToast({ type: "success", title, message }),
    error: (message, title = "Error") =>
      addToast({ type: "error", title, message: message || "An unexpected error occurred" }),
    info: (message, title = "Notice") =>
      addToast({ type: "info", title, message }),
    warning: (message, title = "Warning") =>
      addToast({ type: "warning", title, message }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;

