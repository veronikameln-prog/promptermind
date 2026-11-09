/* PrompterMind (ЛР №6, Tailwind) — інтерактив сторінки.
   JS лише перемикає атрибути (aria-expanded, aria-pressed, data-*) і класи hidden;
   увесь вигляд станів описано Tailwind-варіантами в розмітці. */

/* ---------- Мобільне меню (бургер) ---------- */
(function () {
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!burger || !menu) return;

  function setOpen(isOpen) {
    menu.classList.toggle('hidden', !isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
  }

  burger.addEventListener('click', function () {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });

  // Ширина, з якої бургер ховається (index.html — 1024, intensive.html — 768)
  const breakpoint = burger.dataset.burgerBreakpoint || 768;
  window.matchMedia('(min-width: ' + breakpoint + 'px)').addEventListener('change', function (event) {
    if (event.matches) setOpen(false);
  });
})();

/* ---------- Випадне меню «Ще» ---------- */
(function () {
  document.querySelectorAll('[data-dropdown]').forEach(function (dropdown) {
    const toggle = dropdown.querySelector('[data-dropdown-toggle]');
    const menu = dropdown.querySelector('[data-dropdown-menu]');
    if (!toggle || !menu) return;

    function setOpen(isOpen) {
      menu.classList.toggle('hidden', !isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('click', function (event) {
      if (!dropdown.contains(event.target)) setOpen(false);
    });

    dropdown.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Закриваємо, коли фокус пішов за межі меню (Tab)
    dropdown.addEventListener('focusout', function (event) {
      if (!dropdown.contains(event.relatedTarget)) setOpen(false);
    });
  });
})();

/* ---------- Шапка під час прокрутки: тінь + індикатор прогресу ---------- */
(function () {
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('[data-progress]');
  if (!header) return;

  let ticking = false;

  function update() {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    header.dataset.scrolled = String(scrollTop > 8);
    if (progress) {
      progress.style.transform = 'scaleX(' + (maxScroll > 0 ? (scrollTop / maxScroll).toFixed(4) : 0) + ')';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
})();

/* ---------- Поява блоків під час прокрутки та лічильники ---------- */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const STAGGER_STEP = 0.1; // с
  const MAX_STAGGER = 5;

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      revealObserver.unobserve(el);

      // Після появи прибираємо службові класи, щоб не заважати hover-ефектам Tailwind
      el.addEventListener('transitionend', function cleanup(event) {
        if (event.target !== el || event.propertyName !== 'transform') return;
        el.classList.remove('reveal', 'reveal--zoom', 'is-visible');
        el.style.removeProperty('--reveal-delay');
        el.removeEventListener('transitionend', cleanup);
      });
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    el.classList.add('reveal');
    if (el.dataset.reveal === 'zoom') el.classList.add('reveal--zoom');
    const siblings = Array.prototype.filter.call(el.parentElement.children, function (child) {
      return child.hasAttribute('data-reveal');
    });
    const index = siblings.indexOf(el);
    if (siblings.length > 1) el.style.setProperty('--reveal-delay', (Math.min(index, MAX_STAGGER) * STAGGER_STEP) + 's');
    revealObserver.observe(el);
  });

  // «500+», «6 хв», «70%» рахують від нуля
  const DURATION = 1400; // мс

  function animateCounter(el) {
    const match = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;
    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-counter]').forEach(function (el) {
    counterObserver.observe(el);
  });
})();

/* ---------- Таймер зворотного відліку (intensive.html) ----------
   <div data-countdown="2026-11-22T10:00:00+02:00"> з полями data-countdown-days/hours/minutes/seconds */
(function () {
  const box = document.querySelector('[data-countdown]');
  if (!box) return;

  const target = new Date(box.dataset.countdown).getTime();
  const parts = {
    days: box.querySelector('[data-countdown-days]'),
    hours: box.querySelector('[data-countdown-hours]'),
    minutes: box.querySelector('[data-countdown-minutes]'),
    seconds: box.querySelector('[data-countdown-seconds]')
  };
  const pad = function (n) { return String(n).padStart(2, '0'); };
  let timer;

  function tick() {
    const left = Math.max(0, target - Date.now());
    const s = Math.floor(left / 1000);
    parts.days.textContent = pad(Math.floor(s / 86400));
    parts.hours.textContent = pad(Math.floor(s / 3600) % 24);
    parts.minutes.textContent = pad(Math.floor(s / 60) % 60);
    parts.seconds.textContent = pad(s % 60);
    if (left === 0) clearInterval(timer);
  }

  tick();
  timer = setInterval(tick, 1000);
})();

/* ---------- Інформер погоди у Львові (intensive.html, API Open-Meteo без ключа, запасне — MET Norway) ----------
   Прогноз Open-Meteo доступний лише на 16 днів уперед. Якщо до інтенсиву ще далі —
   показуємо поточну погоду і пояснюємо, коли з'явиться прогноз на день події. */
(function () {
  const box = document.querySelector('[data-weather]');
  if (!box) return;

  const EVENT_DAY = '2026-11-22';
  const FORECAST_DAYS = 16;
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=49.8397&longitude=24.0297' +
    '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min' +
    '&timezone=Europe%2FKyiv&forecast_days=' + FORECAST_DAYS;

  const el = {
    temp: box.querySelector('[data-weather-temp]'),
    desc: box.querySelector('[data-weather-desc]'),
    note: box.querySelector('[data-weather-note]')
  };

  // Коди погоди WMO → опис українською
  function describe(code) {
    if (code === 0) return 'Ясно';
    if (code <= 2) return 'Мінлива хмарність';
    if (code === 3) return 'Хмарно';
    if (code <= 48) return 'Туман';
    if (code <= 57) return 'Мряка';
    if (code <= 67) return 'Дощ';
    if (code <= 77) return 'Сніг';
    if (code <= 82) return 'Злива';
    if (code <= 86) return 'Снігопад';
    return 'Гроза';
  }

  const round = function (t) { return Math.round(t) + '°'; };

  const getJson = function (address) {
    return fetch(address).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    });
  };

  // Запасне джерело — MET Norway (теж без ключа), якщо Open-Meteo недоступний (наприклад, 503 «overloaded»).
  // Його symbol_code ('cloudy', 'lightrain_day'…) → опис українською
  const MET_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=49.84&lon=24.03';
  function describeMet(symbol) {
    const s = symbol.replace(/_(day|night|polartwilight)$/, '');
    if (s === 'clearsky') return 'Ясно';
    if (s === 'fair' || s === 'partlycloudy') return 'Мінлива хмарність';
    if (s === 'cloudy') return 'Хмарно';
    if (s === 'fog') return 'Туман';
    if (s.includes('thunder')) return 'Гроза';
    if (s.includes('sleet')) return 'Мокрий сніг';
    if (s.includes('snow')) return 'Сніг';
    if (s.includes('showers')) return 'Злива';
    return 'Дощ';
  }

  function showMet() {
    return getJson(MET_URL).then(function (data) {
      const now = data.properties.timeseries[0].data;
      el.temp.textContent = round(now.instant.details.air_temperature);
      el.desc.textContent = describeMet(now.next_1_hours.summary.symbol_code) + ' зараз';
      el.note.textContent = 'Прогноз на 22 листопада з\'явиться ближче до інтенсиву.';
      const source = box.querySelector('a[href*="open-meteo"]');
      if (source) {
        source.href = 'https://api.met.no/';
        source.firstChild.textContent = 'MET Norway';
      }
    });
  }

  getJson(url)
    .then(function (data) {
      const day = data.daily.time.indexOf(EVENT_DAY);
      if (day !== -1) {
        el.temp.textContent = round(data.daily.temperature_2m_max[day]);
        el.desc.textContent = describe(data.daily.weather_code[day]) + ', вночі ' + round(data.daily.temperature_2m_min[day]);
        el.note.textContent = 'Прогноз на 22 листопада — день інтенсиву.';
      } else {
        el.temp.textContent = round(data.current.temperature_2m);
        el.desc.textContent = describe(data.current.weather_code) + ' зараз';
        el.note.textContent = 'Прогноз на 22 листопада з\'явиться за ' + FORECAST_DAYS + ' днів до інтенсиву.';
      }
    })
    .catch(showMet)
    .catch(function () {
      el.desc.textContent = 'Не вдалося завантажити погоду.';
      el.note.textContent = 'Спробуй оновити сторінку пізніше.';
    });
})();

/* Карусель відгуків (intensive.html): кнопки «назад/вперед» і автопрокрутка.
   <div data-carousel> з <ul data-carousel-track> та кнопками data-carousel-prev/next */
(function () {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('[data-carousel-track]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduceMotion ? 'auto' : 'smooth';
  const AUTOPLAY_MS = 5000;
  let timer = null;

  // Крок прокрутки — ширина однієї картки + проміжок між картками
  function step() {
    const card = track.firstElementChild;
    return card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
  }

  // Після останньої картки повертаємось на початок (і навпаки)
  function go(direction) {
    const max = track.scrollWidth - track.clientWidth;
    if (direction > 0 && track.scrollLeft >= max - 4) {
      track.scrollTo({ left: 0, behavior: behavior });
    } else if (direction < 0 && track.scrollLeft <= 4) {
      track.scrollTo({ left: max, behavior: behavior });
    } else {
      track.scrollBy({ left: direction * step(), behavior: behavior });
    }
  }

  function start() {
    if (reduceMotion || timer) return;
    timer = setInterval(function () { go(1); }, AUTOPLAY_MS);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  carousel.querySelector('[data-carousel-prev]').addEventListener('click', function () { go(-1); });
  carousel.querySelector('[data-carousel-next]').addEventListener('click', function () { go(1); });

  // Пауза, поки користувач наводить мишку, гортає пальцем або перебуває фокусом у каруселі
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', function (event) {
    if (!carousel.contains(event.relatedTarget)) start();
  });
  track.addEventListener('touchstart', stop, { passive: true });

  start();
})();

/* ==========================================================================
   Конвертер тривалості та вартості + промокоди
   Ціна й тривалість — у data-атрибутах картки модуля:
   <article data-module data-title="…" data-price="1490" data-weeks="4">
   ========================================================================== */
(function () {
  const calc = document.querySelector('[data-calc]');
  const cards = Array.from(document.querySelectorAll('[data-module]'));
  if (!calc || !cards.length) return;

  /* Персональні знижки. На статичному сайті коди видно у вихідному коді —
     у продакшені їх треба перевіряти на сервері. */
  const PROMO_CODES = {
    START10: { type: 'percent', value: 10, description: '−10% на будь-які модулі' },
    FRIEND15: { type: 'percent', value: 15, description: '−15% за запрошенням друга' },
    DUO20: { type: 'percent', value: 20, minModules: 2, description: '−20% при виборі від 2 модулів' },
    MINUS500: { type: 'fixed', value: 500, minSubtotal: 2000, description: '−500 ₴ при замовленні від 2 000 ₴' }
  };

  const el = {
    list: calc.querySelector('[data-calc-list]'),
    empty: calc.querySelector('[data-calc-empty]'),
    duration: calc.querySelector('[data-calc-duration]'),
    subtotal: calc.querySelector('[data-calc-subtotal]'),
    discountRow: calc.querySelector('[data-calc-discount-row]'),
    discount: calc.querySelector('[data-calc-discount]'),
    code: calc.querySelector('[data-calc-code]'),
    oldPrice: calc.querySelector('[data-calc-old-price]'),
    total: calc.querySelector('[data-calc-total]'),
    totalWrap: calc.querySelector('[data-calc-total-wrap]'),
    announce: calc.querySelector('[data-calc-announce]'),
    form: calc.querySelector('[data-promo-form]'),
    input: calc.querySelector('#promo-code'),
    apply: calc.querySelector('[data-promo-apply]'),
    remove: calc.querySelector('[data-promo-remove]'),
    message: calc.querySelector('[data-promo-message]'),
    submit: document.querySelector('[data-calc-submit]')
  };

  const modules = cards.map(function (card) {
    return {
      card: card,
      toggle: card.querySelector('[data-module-toggle]'),
      title: card.dataset.title,
      price: Number(card.dataset.price),
      weeks: Number(card.dataset.weeks),
      selected: card.dataset.selected === 'true'
    };
  });

  const state = { promo: null };

  const money = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });

  function formatPrice(value) {
    return money.format(value) + ' ₴';
  }

  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function formatWeeks(n) {
    return n + ' ' + plural(n, 'тиждень', 'тижні', 'тижнів');
  }

  function getDiscount(promo, subtotal, count) {
    if (!promo) return { amount: 0, reason: '' };
    if (promo.minModules && count < promo.minModules) {
      return { amount: 0, reason: 'діє від ' + promo.minModules + ' ' + plural(promo.minModules, 'модуля', 'модулів', 'модулів') + ' — додай ще.' };
    }
    if (promo.minSubtotal && subtotal < promo.minSubtotal) {
      return { amount: 0, reason: 'діє від ' + formatPrice(promo.minSubtotal) + ' — додай модуль.' };
    }
    const amount = promo.type === 'percent'
      ? Math.round(subtotal * promo.value / 100)
      : Math.min(promo.value, subtotal);
    return { amount: amount, reason: '' };
  }

  function bump(node) {
    node.classList.remove('bump');
    void node.offsetWidth; // перезапуск анімації
    node.classList.add('bump');
  }

  function setPromoMessage(type, text) {
    if (type) el.form.dataset.state = type;
    else delete el.form.dataset.state;
    el.message.textContent = text;
  }

  function render() {
    const selected = modules.filter(function (m) { return m.selected; });
    const count = selected.length;
    const subtotal = selected.reduce(function (sum, m) { return sum + m.price; }, 0);
    const weeks = selected.reduce(function (sum, m) { return sum + m.weeks; }, 0);
    const promo = state.promo ? PROMO_CODES[state.promo] : null;
    const discount = getDiscount(promo, subtotal, count);
    const total = subtotal - discount.amount;

    modules.forEach(function (m) {
      m.card.dataset.selected = String(m.selected);
      if (m.toggle) {
        m.toggle.setAttribute('aria-pressed', String(m.selected));
        m.toggle.querySelector('[data-toggle-text]').textContent = m.selected ? 'Обрано' : 'Обрати';
      }
    });

    el.list.innerHTML = '';
    selected.forEach(function (m) {
      const li = document.createElement('li');
      li.className = 'flex items-baseline justify-between gap-4 rounded-xl bg-white/[0.12] px-4 py-3 font-heading text-[15px] font-semibold';
      const name = document.createElement('span');
      name.textContent = m.title;
      const price = document.createElement('span');
      price.className = 'whitespace-nowrap';
      price.textContent = formatPrice(m.price);
      li.append(name, price);
      el.list.append(li);
    });
    el.list.hidden = count === 0;
    el.empty.hidden = count > 0;

    const previousTotal = el.total.textContent;
    el.duration.textContent = count ? formatWeeks(weeks) : '—';
    el.subtotal.textContent = formatPrice(subtotal);
    el.discountRow.hidden = discount.amount === 0;
    el.discount.textContent = '−' + formatPrice(discount.amount);
    el.code.textContent = state.promo || '';
    el.oldPrice.hidden = discount.amount === 0;
    el.oldPrice.textContent = formatPrice(subtotal);
    el.total.textContent = formatPrice(total);
    if (el.total.textContent !== previousTotal) bump(el.totalWrap);

    if (promo) {
      const active = discount.amount > 0;
      setPromoMessage(active ? 'success' : 'error',
        active ? 'Промокод ' + state.promo + ' застосовано: ' + promo.description + '.' : 'Промокод ' + state.promo + ': ' + discount.reason);
    }

    if (el.submit) {
      el.submit.setAttribute('aria-disabled', String(count === 0));
      if (count === 0) el.submit.setAttribute('tabindex', '-1');
      else el.submit.removeAttribute('tabindex');
    }

    return { count: count, weeks: weeks, total: total };
  }

  function announce(result) {
    el.announce.textContent = result.count
      ? 'Обрано ' + result.count + ' ' + plural(result.count, 'модуль', 'модулі', 'модулів') +
        '. Тривалість ' + formatWeeks(result.weeks) + '. До сплати ' + formatPrice(result.total) + '.'
      : 'Жодного модуля не обрано.';
  }

  function lockPromo(isLocked) {
    el.input.readOnly = isLocked;
    el.apply.hidden = isLocked;
    el.remove.hidden = !isLocked;
  }

  el.form.addEventListener('submit', function (event) {
    event.preventDefault();
    const code = el.input.value.trim().toUpperCase();

    if (!code) {
      setPromoMessage('error', 'Введи промокод.');
      el.input.focus();
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(PROMO_CODES, code)) {
      setPromoMessage('error', 'Промокод «' + code + '» не знайдено. Перевір написання.');
      el.input.select();
      return;
    }

    state.promo = code;
    el.input.value = code;
    lockPromo(true);
    render();
    el.remove.focus();
  });

  el.remove.addEventListener('click', function () {
    state.promo = null;
    el.input.value = '';
    lockPromo(false);
    setPromoMessage(null, '');
    render();
    el.input.focus();
  });

  el.input.addEventListener('input', function () {
    if (!state.promo) setPromoMessage(null, '');
  });

  modules.forEach(function (m) {
    if (!m.toggle) return;
    m.toggle.addEventListener('click', function () {
      m.selected = !m.selected;
      announce(render());
    });
  });

  render();
})();

/* ---------- Модальне вікно заявки ----------
   Кнопки з data-lead відкривають <dialog> замість переходу до #contact.
   data-lead-module / data-lead-project підставляють вибір у форму, data-lead="order" — модулі й суму з калькулятора.
   На статичному сайті заявка нікуди не надсилається — у продакшені тут буде fetch на сервер або Google Form. */
(function () {
  const modal = document.querySelector('[data-lead-modal]');
  if (!modal || typeof modal.showModal !== 'function') return;

  const form = modal.querySelector('[data-lead-form]');
  const el = {
    badge: modal.querySelector('[data-lead-badge]'),
    title: modal.querySelector('[data-lead-title]'),
    text: modal.querySelector('[data-lead-text]'),
    summary: modal.querySelector('[data-lead-summary]'),
    fields: modal.querySelector('[data-lead-fields]'),
    success: modal.querySelector('[data-lead-success]'),
    error: modal.querySelector('[data-lead-error]'),
    name: form.elements.name,
    contact: form.elements.contact,
    module: form.elements.module,
    consent: form.elements.consent
  };

  const COPY = {
    trial: { badge: 'Безкоштовно', title: 'Запис на пробний урок', text: 'Наставник напише протягом робочого дня й підбере зручний час.' },
    consult: { badge: 'Консультація', title: 'Поставити питання наставнику', text: 'Розкажи, що цікавить, — наставник відповість і допоможе обрати модуль.' },
    project: { badge: 'Проєкт', title: 'Хочу такий проєкт', text: 'Почнемо з безкоштовного пробного уроку в модулі, де створюють цей проєкт.' },
    order: { badge: 'Заявка на курс', title: 'Оформлення курсу', text: 'Перевір свій вибір — наставник підтвердить розклад і надішле реквізити.' }
  };

  let opener = null;

  function setSummary(rows) {
    el.summary.innerHTML = '';
    rows.forEach(function (row) {
      const line = document.createElement('p');
      line.className = 'flex items-baseline justify-between gap-4';
      const label = document.createElement('span');
      label.className = 'text-gray-600';
      label.textContent = row[0];
      const value = document.createElement('span');
      value.className = 'text-right font-bold';
      value.textContent = row[1];
      line.append(label, value);
      el.summary.append(line);
    });
    el.summary.hidden = rows.length === 0;
  }

  function selectModule(title) {
    const option = Array.prototype.find.call(el.module.options, function (o) { return o.text === title; });
    el.module.selectedIndex = option ? option.index : 0;
  }

  function open(trigger) {
    const type = COPY[trigger.dataset.lead] ? trigger.dataset.lead : 'trial';
    const copy = COPY[type];
    el.badge.textContent = copy.badge;
    el.title.textContent = copy.title;
    el.text.textContent = copy.text;

    const rows = [];
    if (type === 'project') {
      rows.push(['Проєкт', trigger.dataset.leadProject], ['Модуль', trigger.dataset.leadModule]);
      selectModule(trigger.dataset.leadModule);
    } else if (type === 'order') {
      const picked = Array.from(document.querySelectorAll('[data-calc-list] li > span:first-child')).map(function (s) { return s.textContent; });
      rows.push(['Модулі', picked.join(', ')]);
      rows.push(['Тривалість', document.querySelector('[data-calc-duration]').textContent]);
      rows.push(['До сплати', document.querySelector('[data-calc-total]').textContent]);
      selectModule(picked.length === 1 ? picked[0] : '');
    } else {
      selectModule('');
    }
    setSummary(rows);
    el.module.parentElement.classList.toggle('hidden', type === 'order');

    el.fields.hidden = false;
    el.success.hidden = true;
    el.error.textContent = '';
    opener = trigger;
    modal.showModal();
    el.name.focus();
  }

  function close() {
    modal.close();
  }

  function fail(field, message) {
    el.error.textContent = message;
    if (field.setAttribute) field.setAttribute('aria-invalid', 'true');
    field.focus();
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-lead]');
    if (!trigger || trigger.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    open(trigger);
  });

  modal.querySelectorAll('[data-lead-close]').forEach(function (btn) {
    btn.addEventListener('click', close);
  });

  // Клік по затемненню поза вікном теж закриває
  modal.addEventListener('click', function (event) {
    if (event.target === modal) close();
  });

  modal.addEventListener('close', function () {
    if (opener) opener.focus();
  });

  [el.name, el.contact].forEach(function (input) {
    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      el.error.textContent = '';
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    // Ті самі правила, що й у формі зворотного зв'язку (js/validation.js)
    const V = window.PMValidation;
    const nameError = V.rules.name(el.name.value);
    if (nameError) return fail(el.name, nameError);
    const contactError = V.rules.contact(el.contact.value);
    if (contactError) return fail(el.contact, contactError);
    if (!el.contact.value.trim().startsWith('@')) el.contact.value = V.normalizePhone(el.contact.value);
    el.name.removeAttribute('aria-invalid');
    el.contact.removeAttribute('aria-invalid');
    if (!el.consent.checked) return fail(el.consent, 'Потрібна згода на обробку контактних даних.');

    el.fields.hidden = true;
    el.summary.hidden = true;
    el.success.hidden = false;
    form.reset();
    el.success.querySelector('[data-lead-close]').focus();
  });
})();

/* ---------- ЛР №10: плагіни Vanilla JS через CDN (Swiper.js, Fancybox v5, Typed.js) ----------
   Бібліотеки підключено в index.html перед </body> з defer, тож тут вони вже доступні.
   Ініціалізація — у DOMContentLoaded; кожен плагін запускається лише якщо є його розмітка
   (main.js підключено й на intensive.html, де цих секцій немає). */
document.addEventListener('DOMContentLoaded', function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Слайдер робіт учнів: 1 / 2 / 3 слайди залежно від ширини екрана.
  // ЛР №12: ініціалізація відкладена, доки слайдер не наблизиться до екрана (менше роботи під час завантаження)
  const worksEl = document.querySelector('.works-swiper');
  function initWorksSwiper() {
    if (!window.Swiper || !worksEl || worksEl.swiper) return;
    new Swiper(worksEl, {
      loop: true,
      spaceBetween: 24,
      speed: 600,
      grabCursor: true,
      autoplay: reduceMotion ? false : { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true },
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
  }
  if (worksEl && 'IntersectionObserver' in window) {
    const swiperObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        swiperObserver.disconnect();
        initWorksSwiper();
      }
    }, { rootMargin: '400px 0px' });
    swiperObserver.observe(worksEl);
  } else {
    initWorksSwiper();
  }

  // Галерея: усі зображення з data-fancybox="student-works" — один альбом, перехід fade, зум до 3×
  if (window.Fancybox) {
    Fancybox.bind('[data-fancybox="student-works"]', {
      Carousel: { transition: 'fade' },
      Images: { Panzoom: { maxScale: 3 } },
      l10n: { CLOSE: 'Закрити', NEXT: 'Далі', PREV: 'Назад', TOGGLE_ZOOM: 'Збільшити', TOGGLE_SLIDESHOW: 'Слайд-шоу', TOGGLE_FULLSCREEN: 'На весь екран', TOGGLE_THUMBS: 'Мініатюри' }
    });
  }

  // Ефект друку в Hero; при зменшеному русі лишається статична перша фраза
  const typedTarget = document.getElementById('typed-text');
  if (window.Typed && typedTarget && !reduceMotion) {
    // ЛР №12: анімація стартує після повного завантаження — спершу видно статичну першу фразу
    const startTyped = function () {
      window.setTimeout(function () {
        new Typed('#typed-text', {
          strings: ['Створи свого Telegram-бота.', 'Навчись промптингу за 6 тижнів.', 'Збери портфоліо до 17 років.'],
          typeSpeed: 50,
          backSpeed: 30,
          backDelay: 1500,
          startDelay: 0,
          loop: true
        });
      }, 1500);
    };
    if (document.readyState === 'complete') startTyped();
    else window.addEventListener('load', startTyped, { once: true });
  }
});

/* ---------- Hero: легкий паралакс ілюстрації за курсором ----------
   Лише для миші (pointer: fine) і якщо користувач не просив зменшити рух.
   Зсув до 10 px; запис у CSS-змінні раз на кадр (requestAnimationFrame). */
(function () {
  const art = document.querySelector('[data-hero-art]');
  const hero = art && art.closest('section');
  if (!hero) return;
  if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;

  let frame = 0;
  hero.addEventListener('pointermove', function (event) {
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      art.style.setProperty('--px', (x * -20).toFixed(1) + 'px');
      art.style.setProperty('--py', (y * -12).toFixed(1) + 'px');
    });
  });
  hero.addEventListener('pointerleave', function () {
    art.style.setProperty('--px', '0px');
    art.style.setProperty('--py', '0px');
  });
})();

/* ---------- Бігучі стрічки: рух без CSS-анімації, щоб текст на нахилених стрічках був чітким ----------
   CSS-анімація transform передає рух відеокарті, яка повертає вже готову (рівну) картинку тексту — літери розмиваються.
   Тут зсув задається з JS раз на кадр: браузер щоразу малює текст одразу під нахилом, тож він чіткий.
   Рух лише поки стрічки видно на екрані; пауза при наведенні; при prefers-reduced-motion — без руху. */
(function () {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Передня стрічка — 40 с на коло вліво, задня — 55 с на коло вправо (як було в CSS)
  const tracks = Array.prototype.map.call(ticker.querySelectorAll('.ticker-track'), function (track) {
    const back = !!track.closest('.ticker-band--back');
    return { el: track, duration: back ? 55000 : 40000, reverse: back, half: 0 };
  });

  function measure() {
    tracks.forEach(function (t) { t.half = t.el.scrollWidth / 2; });
  }

  let visible = false;
  let paused = false;
  let frame = 0;
  let last = 0;
  let elapsed = 0;

  function tick(now) {
    frame = 0;
    if (!visible) return;
    if (!paused && last) elapsed += now - last;
    last = now;
    tracks.forEach(function (t) {
      const p = (elapsed / t.duration) % 1;
      const x = t.reverse ? -(1 - p) * t.half : -p * t.half;
      t.el.style.translate = x.toFixed(2) + 'px 0';
    });
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame) return;
    last = 0;
    frame = requestAnimationFrame(tick);
  }

  measure();
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(ticker);

  ticker.addEventListener('mouseenter', function () { paused = true; });
  ticker.addEventListener('mouseleave', function () { paused = false; });
})();
