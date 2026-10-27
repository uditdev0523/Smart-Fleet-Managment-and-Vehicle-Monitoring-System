/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#F5F3ED',
          light: '#FAF9F5',
          dark: '#EBE8DE',
        },
        forest: {
          DEFAULT: '#203C35',
          dark: '#172C27',
          light: '#2B4E45',
        },
        terracotta: {
          DEFAULT: '#B9674B',
          hover: '#A5583E',
          light: '#F5EBE7',
        },
        sage: {
          DEFAULT: '#A9B9A5',
          light: '#EBF0EA',
          dark: '#879A83',
        },
        charcoal: {
          DEFAULT: '#252A28',
          light: '#3D4441',
        },
        slate: {
          DEFAULT: '#737A75',
          light: '#949B96',
        },
        warmgrey: {
          DEFAULT: '#E3E0D8',
          light: '#EFECE5',
          dark: '#D4D0C6',
        },
        operational: {
          success: '#39765A',
          warning: '#C18A37',
          critical: '#B54E43',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
