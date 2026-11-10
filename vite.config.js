import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// GitHub Pages（/oomiko-umi-app/ 配下）でも Vercel でも動くよう相対パスで出力する
export default defineConfig({ base: './', plugins: [react()] });
