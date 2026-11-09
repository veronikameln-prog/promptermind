/* Спільний каркас обох сторінок: шапка, меню, поява блоків, футер */

import { initBurgerMenu } from '../components/burger-menu.js';
import { initDropdowns } from '../components/dropdown.js';
import { initScrollHeader } from '../components/scroll-header.js';
import { initReveal } from '../components/reveal.js';
import { initFooterGlow } from '../components/footer-glow.js';

export const layoutComponents = [
  initBurgerMenu,
  initDropdowns,
  initScrollHeader,
  initReveal,
  initFooterGlow
];
