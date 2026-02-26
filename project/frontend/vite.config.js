import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3001,
    open: true,
    proxy: {
      "/api": "http://localhost:80", // ONLY this line
    },
  },
});
