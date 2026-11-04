import React from "react";

export const Skeleton = ({ width = "100%", height = "20px", borderRadius = "4px", className = "" }) => {
  return (
    <div
      className={`erp-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--border-subtle, #e2e8f0)",
        animation: "erpSkeletonPulse 1.5s ease-in-out infinite",
      }}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", padding: "12px 0" }}>
      <Skeleton height="36px" borderRadius="6px" />
      {[...Array(rows)].map((_, r) => (
        <div key={r} style={{ display: "flex", gap: "12px", width: "100%" }}>
          {[...Array(cols)].map((_, c) => (
            <Skeleton key={c} height="32px" borderRadius="4px" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;

