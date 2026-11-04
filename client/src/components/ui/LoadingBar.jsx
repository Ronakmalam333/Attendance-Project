import React from "react";

const LoadingBar = ({ progress, visible }) => {
  if (!visible && progress === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "3px",
        zIndex: 10000,
        pointerEvents: "none",
        backgroundColor: "transparent",
      }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          backgroundColor: "var(--brand-primary, #2563eb)",
          boxShadow: "0 0 10px rgba(37, 99, 235, 0.5)",
          transition: progress === 100 ? "width 150ms ease-out, opacity 250ms ease" : "width 200ms ease",
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
};

export default LoadingBar;

