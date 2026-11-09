/* Плагіни Vanilla JS, підключені з CDN у index.html (Swiper.js, Fancybox v5, Typed.js).
   Скрипти CDN мають defer і стоять перед модулями сторінки, тож тут глобальні Swiper / Fancybox / Typed
   уже доступні. Кожен плагін запускається, лише якщо на сторінці є його розмітка. */

import { qs, onceVisible } from '../core/dom.js';
import { prefersReducedMotion } from '../core/env.js';

/** Слайдер робіт учнів: 1 / 2 / 3 слайди залежно від ширини екрана.
 *  Ініціалізація відкладена, доки слайдер не наблизиться до екрана (менше роботи під час завантаження). */
export function initWorksSlider() {
  const slider = qs('.works-swiper');
  if (!slider || !window.Swiper) return;

  onceVisible(slider, () => {
    if (slider.swiper) return;
    new window.Swiper(slider, {
      loop: true,
      spaceBetween: 24,
      speed: 600,
      grabCursor: true,
      autoplay: prefersReducedMotion() ? false : { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: '.works-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '.works-swiper .swiper-button-next', prevEl: '.works-swiper .swiper-button-prev' },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { prevSlideMessage: 'Попередній проєкт', nextSlideMessage: 'Наступний проєкт', paginationBulletMessage: 'Перейти до проєкту {{index}}' },
      breakpoints: {
        320: { slidesPerView: 1 },
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    });
  }, { rootMargin: '400px 0px' });
}

/** Галерея: усі зображення з data-fancybox="student-works" — один альбом, перехід fade, зум до 3× */
export function initGallery() {
  if (!window.Fancybox) return;
  window.Fancybox.bind('[data-fancybox="student-works"]', {
    Carousel: { transition: 'fade' },
    Images: { Panzoom: { maxScale: 3 } },
    l10n: { CLOSE: 'Закрити', NEXT: 'Далі', PREV: 'Назад', TOGGLE_ZOOM: 'Збільшити', TOGGLE_SLIDESHOW: 'Слайд-шоу', TOGGLE_FULLSCREEN: 'На весь екран', TOGGLE_THUMBS: 'Мініатюри' }
  });
}

const TYPED_PHRASES = ['Створи свого Telegram-бота.', 'Навчись промптингу за 6 тижнів.', 'Збери портфоліо до 17 років.'];
const TYPED_START_DELAY = 1500; // мс після повного завантаження — спершу видно статичну першу фразу

/** Ефект друку в hero; при зменшеному русі лишається статична перша фраза */
export function initHeroTyped() {
  if (!window.Typed || !document.getElementById('typed-text') || prefersReducedMotion()) return;

  const start = () => window.setTimeout(() => {
    new window.Typed('#typed-text', {
      strings: TYPED_PHRASES,
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 1500,
      startDelay: 0,
      loop: true
    });
  }, TYPED_START_DELAY);

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
