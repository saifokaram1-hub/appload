import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative Basis: funktioniert auf GitHub Pages (Unterpfad) UND in der
// Capacitor-App (file://). Zusammen mit HashRouter keine 404-Probleme.
export default defineConfig({
  base: './',
  plugins: [react()],
});
