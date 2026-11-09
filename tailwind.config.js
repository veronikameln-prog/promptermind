/** Tailwind CSS (CLI). Замість Play CDN, що генерував стилі в браузері користувача,
 *  CSS збирається заздалегідь: npm run build:css: src/styles/main.css → css/main.css (лише використані класи, мініфіковано).
 *  Дизайн-токени — ті самі, що були в tailwind.config у <head> (ЛР №4–№6). */
module.exports = {
  content: ['./index.html', './intensive.html', './src/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6b2fff',
          light: '#7b3ff5',
          50: '#faf7ff',
          100: '#f8f5ff',
          200: '#e0d4ff'
        },
        accent: '#3b82f6',
        // Соковитий лайм лише для головних дій (заявка, пробний урок). Текст на ньому — тільки темний ink (контраст 9.7:1)
        cta: {
          DEFAULT: '#a3e635',
          hover: '#8fd424',
          100: '#ecfccb',
          ink: '#1a2e05',
          deep: '#3f6212'
        }
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 24px rgba(107, 47, 255, 0.08)',
        soft: '0 4px 12px rgba(107, 47, 255, 0.08)',
        featured: '0 8px 32px rgba(107, 47, 255, 0.2)',
        btn: '0 8px 12px rgba(107, 47, 255, 0.25)',
        lift: '0 18px 40px rgba(107, 47, 255, 0.16)',
        'cta-btn': '0 8px 16px rgba(101, 163, 13, 0.3)'
      },
      maxWidth: {
        container: '1280px'
      }
    }
  }
};
