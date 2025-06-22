import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  
  if (mode === 'development') {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn('lovable-tagger не загружен:', error);
    }
  }

  return {
    server: {
      host: "::",
      port: 8081,
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    plugins,
    optimizeDeps: {
      include: ['react-imask'],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});