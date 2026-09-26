import daisyui from 'daisyui';
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'sylvan-blue': '#1a365d',
        'sylvan-gold': '#d4af37',
      },
    },
  },
  plugins: [daisyui],
}
