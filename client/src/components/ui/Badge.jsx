import React from "react";

export const Badge = ({
  children,
  variant = "neutral", // 'present' | 'absent' | 'late' | 'brand' | 'neutral'
  size = "md", // 'sm' | 'md'
  className = "",
  style = {},
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "present":
        return {
          backgroundColor: "var(--status-present-bg, #ecfdf5)",
          color: "var(--status-present, #059669)",
          border: "1px solid var(--status-present-border, #a7f3d0)",
        };
      case "absent":
        return {
          backgroundColor: "var(--status-absent-bg, #fef2f2)",
          color: "var(--status-absent, #dc2626)",
          border: "1px solid var(--status-absent-border, #fecaca)",
        };
      case "late":
        return {
          backgroundColor: "var(--status-late-bg, #fffbeb)",
          color: "var(--status-late, #d97706)",
          border: "1px solid var(--status-late-border, #fde68a)",
        };
      case "brand":
        return {
          backgroundColor: "var(--brand-primary-light, #eff6ff)",
          color: "var(--brand-primary, #2563eb)",
          border: "1px solid var(--status-info-border, #bfdbfe)",
        };
      default:
        return {
          backgroundColor: "var(--bg-surface-subtle, #f1f5f9)",
          color: "var(--text-secondary, #475569)",
          border: "1px solid var(--border-subtle, #e2e8f0)",
        };
    }
  };

  const isSmall = size === "sm";

  return (
    <span
      className={`erp-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: isSmall ? "1px 6px" : "3px 8px",
        fontSize: isSmall ? "0.6875rem" : "0.75rem",
        fontWeight: 600,
        lineHeight: 1.2,
        borderRadius: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        ...getVariantStyles(),
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;

