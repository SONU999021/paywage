import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'production' && !process.env.VITE_API_URL) {
    console.warn(
      '[PayWager] VITE_API_URL is not set for this build. ' +
        'The app will use the Railway production API fallback. ' +
        'Set VITE_API_URL in Vercel for explicit configuration.',
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
