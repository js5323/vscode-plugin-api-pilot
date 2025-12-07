import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Ensure relative paths for assets
    server: {
        port: 5173,
        strictPort: true,
        cors: true,
        hmr: {
            host: 'localhost'
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    }
});
