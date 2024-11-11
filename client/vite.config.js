import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true, // This enables global functions like describe, it, etc.
    environment: "jsdom", // Set the environment for running tests
  },
  
});
