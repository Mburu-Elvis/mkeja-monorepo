module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'saf-green': '#4caf50',
        'mpesa-red': '#E61E26',
        'kcb-blue': '#1565c0',
      },
      fontFamily: {
        'mono': ['"SF Mono"', '"Nothing Dot"', 'monospace'],
        'sans': ['"SF Pro Display"', 'Inter', 'sans-serif'],
      },
    },
  },
}