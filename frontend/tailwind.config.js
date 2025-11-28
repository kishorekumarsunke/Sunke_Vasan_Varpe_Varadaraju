/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1D7E99',
                secondary: '#C3C7CA',
                background: '#000000',
                textPrimary: '#ffffff',
                textSecondary: '#a0a0a0',
            },
            fontFamily: {
                sans: ['Segoe UI', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #1D7E99 0%, #C3C7CA 100%)',
            },
            boxShadow: {
                'elevation': '0 4px 12px rgba(29, 126, 153, 0.15)',
                'elevation-hover': '0 8px 24px rgba(29, 126, 153, 0.25)',
            },
        },
    },
    plugins: [],
}