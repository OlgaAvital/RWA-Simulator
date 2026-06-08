import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use a relative asset base so static builds work both at the site root
// and under GitHub Pages repository paths such as /RWA-Simulator/.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
