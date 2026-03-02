import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                auth: resolve(__dirname, 'auth.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                terms: resolve(__dirname, 'terms.html'),
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});
