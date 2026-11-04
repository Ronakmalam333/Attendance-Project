import React from "react";
import Icons from "./Icons";

const EmptyState = ({
  icon: IconComponent = Icons.Info,
  title = "No data found",
  description = "There are no records matching your criteria.",
  action = null,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        borderRadius: "var(--radius-lg, 8px)",
        border: "1px dashed var(--border-subtle, #e2e8f0)",
        backgroundColor: "var(--bg-surface-subtle, #f8fafc)",
        margin: "16px 0",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-subtle, #e2e8f0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted, #94a3b8)",
          marginBottom: "14px",
        }}
      >
        <IconComponent size={24} />
      </div>
      <h4
        style={{
          margin: "0 0 6px 0",
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text-primary, #0f172a)",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: "0.875rem",
          color: "var(--text-secondary, #64748b)",
          maxWidth: "380px",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;

