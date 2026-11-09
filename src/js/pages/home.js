/* Точка входу головної сторінки (index.html).
   Тут лише список компонентів — уся логіка в components/, domain/ і store/. */

import { boot } from '../core/boot.js';
import { layoutComponents } from './layout.js';
import { initHeroScene } from '../components/hero-scene.js';
import { initHeroParallax } from '../components/hero-parallax.js';
import { initStatCounters } from '../components/stat-counters.js';
import { initTicker } from '../components/ticker.js';
import { initBenefits } from '../components/benefits.js';
import { initProjectTabs } from '../components/project-tabs.js';
import { initModulePicker } from '../components/module-picker.js';
import { initPlanner } from '../components/planner.js';
import { initPlannerDock } from '../components/planner-dock.js';
import { initLeadModal } from '../components/lead-modal.js';
import { initFeedbackForm } from '../components/feedback-form.js';
import { initWorksSlider, initGallery, initHeroTyped } from '../components/plugins.js';

boot([
  initHeroScene,
  ...layoutComponents,
  initHeroParallax,
  initHeroTyped,
  initStatCounters,
  initTicker,
  initBenefits,
  initProjectTabs,
  initModulePicker,
  initPlanner,
  initPlannerDock,
  initLeadModal,
  initFeedbackForm,
  initWorksSlider,
  initGallery
]);
