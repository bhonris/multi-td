import react from "@vitejs/plugin-react-swc";
import path from "path"; // Add this import
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Add this section
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});
