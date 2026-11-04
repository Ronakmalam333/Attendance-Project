import React from "react";
import Icons from "./Icons";
import "./toast.css";

const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <Icons.CheckCircle size={18} className="toast-icon-svg" />;
      case "error":
        return <Icons.XCircle size={18} className="toast-icon-svg" />;
      case "warning":
        return <Icons.AlertTriangle size={18} className="toast-icon-svg" />;
      default:
        return <Icons.Info size={18} className="toast-icon-svg" />;
    }
  };

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((item) => (
        <div key={item.id} className={`toast-card toast-${item.type}`} role="alert">
          <div className="toast-icon-wrapper">{getIcon(item.type)}</div>
          <div className="toast-content">
            {item.title && <div className="toast-title">{item.title}</div>}
            {item.message && <div className="toast-message">{item.message}</div>}
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => onClose(item.id)}
            aria-label="Dismiss notification"
          >
            <Icons.X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

