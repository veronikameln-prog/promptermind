/* Точка входу сторінки ШІ-інтенсиву (intensive.html) */

import { boot } from '../core/boot.js';
import { layoutComponents } from './layout.js';
import { initCountdown } from '../components/countdown.js';
import { initWeatherWidget } from '../components/weather-widget.js';
import { initReviewsCarousel } from '../components/reviews-carousel.js';

boot([
  ...layoutComponents,
  initCountdown,
  initWeatherWidget,
  initReviewsCarousel
]);
