export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Antarctic light palette
        background: '#F6FAFD',
        card: '#FFFFFF',
        'ice-blue': '#E8F5FC',
        'light-blue': '#D9EFFB',
        navy: '#12304A',
        text: '#1E3448',
        muted: '#64748B',
        border: '#D8E7F0',
        primary: '#2563EB',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(18,48,74,0.06), 0 1px 2px rgba(18,48,74,0.04)',
        'card-md': '0 4px 12px rgba(18,48,74,0.08), 0 1px 4px rgba(18,48,74,0.04)',
        panel: '0 8px 32px rgba(18,48,74,0.12)',
      },
      borderRadius: {
        card: '10px',
        panel: '12px',
      },
    },
  },
  plugins: [],
}
