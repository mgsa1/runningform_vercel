import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        progress: {
          '0%': { transform: 'translateX(-100%) scaleX(0.5)' },
          '50%': { transform: 'translateX(50%) scaleX(0.6)' },
          '100%': { transform: 'translateX(200%) scaleX(0.5)' },
        },
      },
      animation: {
        progress: 'progress 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
