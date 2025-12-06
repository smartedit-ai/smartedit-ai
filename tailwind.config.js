/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#07C160',
          dark: '#06AD56',
          light: '#e8f8ef',
        },
        wechat: {
          green: '#07C160',
          bg: '#f5f5f5',
          border: '#e8e8e8',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
