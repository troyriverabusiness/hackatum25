import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    // Configure preview server to handle SPA routing
    // This ensures refresh works in production preview
  },
});

