import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// base './' permite abrir o build em qualquer pasta/servidor estático.
export default defineConfig({
  base: './',
  plugins: [react(), ...(process.env.HTTPS ? [basicSsl()] : [])],
  server: { host: true },
});
