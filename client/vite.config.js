import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5173,
    strictPort: false, // If port is in use, try the next available
    open: false, // Don't auto-open browser
    cors: true, // Enable CORS
    // Allows mobile devices on same network to access
    hmr: {
      host: "localhost", // Use your actual IP if needed
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: false,
    cors: true,
  },
});
