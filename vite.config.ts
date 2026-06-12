import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const isDisableHmr = typeof process !== 'undefined' && process.env && process.env.DISABLE_HMR === 'true';

  return {
    // Relative base paths ensure the application bundles can be loaded as static pages
    // anywhere (e.g. root domain, subdirectories, Cloudflare Pages, GitHub Pages)
    base: './',
    plugins: [react(), tailwindcss()],
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: !isDisableHmr,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: isDisableHmr ? null : {},
    },
  };
});
