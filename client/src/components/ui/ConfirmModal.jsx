import React from "react";
import Icons from "./Icons";

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // 'danger' | 'primary' | 'warning'
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Icons.AlertTriangle size={24} style={{ color: "var(--status-absent, #dc2626)" }} />,
          btnClass: "erp-btn erp-btn-danger",
        };
      case "warning":
        return {
          icon: <Icons.AlertTriangle size={24} style={{ color: "var(--status-late, #d97706)" }} />,
          btnClass: "erp-btn erp-btn-warning",
        };
      default:
        return {
          icon: <Icons.Info size={24} style={{ color: "var(--brand-primary, #2563eb)" }} />,
          btnClass: "erp-btn erp-btn-primary",
        };
    }
  };

  const { icon, btnClass } = getVariantStyles();

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
        padding: "16px",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-subtle, #e2e8f0)",
          borderRadius: "var(--radius-lg, 10px)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "modalZoomIn 150ms ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-surface-subtle, #f8fafc)",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              id="modal-title"
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--text-primary, #0f172a)",
                margin: "0 0 6px 0",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary, #475569)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          <button
            type="button"
            className="erp-btn erp-btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

