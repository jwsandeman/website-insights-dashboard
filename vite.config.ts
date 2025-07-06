import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    remix({
      // Configure Remix dev server
    })
  ],
  server: {
    port: 3000,
    host: true,
    strictPort: true, // Fail if port 3000 is occupied instead of using random port
  },
});
