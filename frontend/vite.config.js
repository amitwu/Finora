import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // הגדרת alias ל-`@` כדי להתאים ל-`createPageUrl from "@/utils";`
  // אם אתה משתמש ב-`createPageUrl from "./utils";` אז אין צורך בזה
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});