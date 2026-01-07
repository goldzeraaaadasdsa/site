import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// DisCloud production configuration
const DISCLOUD_URL = 'https://brasilsimracing.discloud.app';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: "/",
    server: {
      host: "0.0.0.0",
      port: Number(process.env.PORT || 8080),
      strictPort: false,
      // Allow both localhost (for development) and Discloud domain (for production)
      allowedHosts: ["brasilsimracing.discloud.app"],
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
