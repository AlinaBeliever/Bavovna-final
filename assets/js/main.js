/* Бавовна — ванільний JS: шапка, розріз, маніфест, акти, меню, відео, форма */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var vh = function () { return window.innerHeight || 800; };

  /* завжди починаємо з hero, а не з відновленої позиції (футер) */
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'reload' && location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (!location.hash) { history.scrollRestoration = 'manual'; window.scrollTo(0, 0); }
  } catch (e) {}

  /* ---------- плавний скрол (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: .95 });
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname !== location.pathname || !u.hash || u.hash === '#') return;
      var el = d.getElementById(decodeURIComponent(u.hash.slice(1)));
      if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -88 }); history.pushState(null, '', u.hash);
    });
    var lraf = function (t) { lenis.raf(t); requestAnimationFrame(lraf); };
    requestAnimationFrame(lraf);
  }

  /* ---------- шапка, док, меню ---------- */
  var hdr = $('#hdr'), dock = $('#dock'), hero = $('.hero');
  var burger = $('#burger');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    d.body.style.overflow = open ? 'hidden' : '';
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- розріз ---------- */
  var heroVid = $('#heroVid'), heroIn = $('.hero__in'), heroMedia = $('.hero__media'), heroEnd = $('#heroEnd');
  var target = 0, shown = 0;
  /* розріз лише на десктопі: на мобільному лишається статичне фото (poster) і кнопки */
  var desk = { matches: true };
  function initHeroVideo() {
    if (!heroVid || !desk.matches || reduce || heroVid.dataset.ready) return;
    heroVid.dataset.ready = '1';
    var src = d.createElement('source'); src.src = '/assets/video/hero-scrub.mp4'; src.type = 'video/mp4';
    heroVid.appendChild(src); heroVid.preload = 'auto'; heroVid.load();
  }
  initHeroVideo();
  function paintHero() {
    if (!heroVid || !heroVid.duration) return;
    shown += (target - shown) * .25;
    if (Math.abs(target - shown) < .002) shown = target;
    heroVid.currentTime = shown * (heroVid.duration - .05);
    if (shown !== target) requestAnimationFrame(paintHero);
  }
  var words = $$('.manifest__txt .w');
  var manifest = $('[data-words]');
  if (manifest) {
    var txt = manifest.textContent.trim().split(/\s+/);
    manifest.innerHTML = txt.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    words = $$('.w', manifest);
  }
  var parallaxImg = $('[data-parallax]');
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  function onScroll() {
    var y = window.scrollY, h = vh();
    hdr.classList.toggle('is-solid', y > 40);
    if (hero) dock.classList.toggle('on', y > vh() * .7); else dock.classList.add('on');

    if (hero && heroVid && desk.matches) {
      var hp = clamp(y / (hero.offsetHeight - h), 0, 1);
      if (!reduce) { target = clamp((hp - .04) / .86, 0, 1); requestAnimationFrame(paintHero); }
      var f = clamp(hp / .22, 0, 1);
      heroIn.style.opacity = (1 - f).toFixed(3);
      heroIn.style.transform = 'translateY(' + (-f * 60).toFixed(1) + 'px)';
      var e = clamp((hp - .72) / .2, 0, 1);
      heroEnd.style.opacity = e.toFixed(3);
      heroEnd.style.transform = 'translateY(' + ((1 - e) * 40).toFixed(1) + 'px)';
      heroIn.style.pointerEvents = f > .9 ? 'none' : '';
    } else if (hero && heroIn) {
      heroIn.style.opacity = ''; heroIn.style.transform = ''; heroIn.style.pointerEvents = '';
    }
    if (manifest && !reduce) {
      var r = manifest.getBoundingClientRect();
      var pr = clamp((h * .82 - r.top) / (h * .55 + r.height * .6), 0, 1);
      var n = Math.round(pr * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    }
    if (parallaxImg && !reduce) {
      var box = parallaxImg.parentElement.getBoundingClientRect();
      var k = clamp((box.top + box.height / 2 - h / 2) / h, -1, 1);
      parallaxImg.style.transform = 'translate3d(0,' + (k * -6).toFixed(2) + '%,0) scale(1.08)';
    }
  }
  if (heroVid) heroVid.addEventListener('loadedmetadata', onScroll);
  var tick = false;
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; onScroll(); }); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduce) words.forEach(function (w) { w.classList.add('on'); });
  onScroll();

  /* ---------- поява ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('[data-r]').forEach(function (el) { io.observe(el); });

    /* відео граємо лише у вʼюпорті */
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: .25 });
    $$('video[data-lazyplay]').forEach(function (v) { if (!reduce) vio.observe(v); else { v.removeAttribute('autoplay'); v.pause(); } });
    /* hero і відео нагороди граємо безперервно, без пауз поза вʼюпортом */
    var always = $$('video[data-always]');
    if (reduce) { always.forEach(function (v) { v.pause(); }); }
    else {
      var kick = function () { always.forEach(function (v) { if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } }); };
      always.forEach(function (v) { v.muted = true; v.addEventListener('loadeddata', kick); v.addEventListener('canplay', kick); });
      kick();
      ['touchstart', 'click', 'scroll', 'keydown'].forEach(function (ev) { window.addEventListener(ev, kick, { passive: true, once: true }); });
      d.addEventListener('visibilitychange', function () { if (!d.hidden) kick(); });
      /* страхівка від зупинки циклу: якщо відео застигло або завершилось — перезапуск */
      always.forEach(function (v) {
        var last = -1, still = 0;
        v.addEventListener('ended', function () { v.currentTime = 0; kick(); });
        setInterval(function () {
          if (d.hidden) return;
          /* перезапуск лише для справді застиглого кадру; буферизацію (readyState<3) не чіпаємо, щоб не смикати відео */
          if (!v.paused && v.readyState >= 3 && v.currentTime === last) { if (++still >= 3) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); still = 0; } } else still = 0;
          last = v.currentTime;
        }, 1000);
      });
      always.forEach(function (v) { v.addEventListener('pause', function () { if (!d.hidden && !v.ended) setTimeout(kick, 200); }); });
    }

    /* карта Google: вантажимо заздалегідь, ще до підходу до секції */
    $$('iframe[data-src]').forEach(function (f) {
      var go = function () { if (!f.src) f.src = f.getAttribute('data-src'); };
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { go(); o.disconnect(); } }, { rootMargin: '2500px 0px' }).observe(f);
      window.addEventListener('load', function () { setTimeout(go, 2500); });
    });
  } else {
    $$('[data-r]').forEach(function (el) { el.classList.add('in'); });
    $$('iframe[data-src]').forEach(function (f) { f.src = f.getAttribute('data-src'); });
  }
  /* на внутрішніх сторінках поточний пункт позначає aria-current */
  $$('.nav a').forEach(function (a) {
    if (a.getAttribute('href') === location.pathname) { a.classList.add('is-on'); a.setAttribute('aria-current', 'page'); }
  });

  /* ---------- липка кнопка: ховаємо, поки видно #book (CSS діє лише <768px) ---------- */
  var bookSec = $('#book');
  if (bookSec && dock && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { dock.classList.toggle('is-off', e.isIntersecting); });
    }, { threshold: 0.05 }).observe(bookSec);
  }

  /* ---------- вкладки меню ---------- */
  var tabs = $$('.tab'), panels = $$('.panel');
  function openTab(i) {
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
    panels.forEach(function (p, j) { p.classList.toggle('on', j === i); });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { openTab(i); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      n = (n + tabs.length) % tabs.length; openTab(n); tabs[n].focus(); e.preventDefault();
    });
  });
  if (tabs.length) openTab(0);
  /* ---------- тизери: автоматична ротація фото своєї категорії ---------- */
  $$('[data-rot]').forEach(function (box, n) {
    var ims = $$('img', box), k = 0;
    if (ims.length < 2 || reduce) return;
    var ms = parseInt(box.getAttribute('data-rot'), 10) || 4200;
    var held = false, hover = false, focus = false;
    box.addEventListener('mouseenter', function () { hover = true; });
    box.addEventListener('mouseleave', function () { hover = false; });
    box.addEventListener('focusin', function () { focus = true; });
    box.addEventListener('focusout', function () { focus = false; });
    setTimeout(function () {
      setInterval(function () {
        if (d.hidden || held || hover || focus) return;
        ims[k].classList.remove('on'); k = (k + 1) % ims.length; ims[k].classList.add('on');
      }, ms);
    }, n * 500);
  });
  /* ---------- графік: розкривні колонки ---------- */
  var slots = $$('#slots .slot');
  var narrow = window.matchMedia('(max-width: 860px)');
  function setSlot(s) {
    slots.forEach(function (x) {
      var on = x === s;
      x.classList.toggle('on', on);
      var b = $('.slot__btn', x); if (b) b.setAttribute('aria-expanded', (on || narrow.matches) ? 'true' : 'false');
    });
  }
  slots.forEach(function (s) {
    s.addEventListener('mouseenter', function () { setSlot(s); });
    s.addEventListener('focusin', function () { setSlot(s); });
    s.addEventListener('click', function () { setSlot(s); });
  });
  if (narrow.addEventListener) narrow.addEventListener('change', function () { setSlot($('#slots .slot.on')); });
  if (slots.length) setSlot($('#slots .slot.on'));

  /* ---------- список страв: фото змінюється лише при наведенні чи торканні (без авторотації) ---------- */
  $$('[data-show]').forEach(function (box) {
    var items = $$('.sd', box), frames = $('.show__frames', box), cap = $('.show__cap', box);
    items.forEach(function (li) {
      var im = d.createElement('img');
      var name = $('h3', li).textContent;
      im.src = li.dataset.img || '/assets/img/interior.webp'; im.alt = name; im.loading = 'lazy'; im.decoding = 'async';
      /* фото без фону «плавають» на сторінці, решта — з м'яко розчиненими краями */
      im.className = im.src.indexOf('/cut/') > -1 ? 'cut' : 'full';
      frames.appendChild(im);
    });
    var imgs = $$('img', frames), cur = -1, capTimer = null;
    function show(i) {
      if (i === cur) return;
      var first = cur === -1;
      cur = i;
      items.forEach(function (li, k) { li.classList.toggle('on', k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      clearTimeout(capTimer);
      if (first) { cap.textContent = $('h3', items[i]).textContent; return; }
      cap.classList.add('swap');
      capTimer = setTimeout(function () { cap.textContent = $('h3', items[i]).textContent; cap.classList.remove('swap'); }, 160);
    }
    var auto = null, idle = false;
    function startAuto() {
      if (reduce || auto) return;
      auto = setInterval(function () { if (!d.hidden && !idle) show((cur + 1) % items.length); }, 2000);
    }
    function pick(i) { idle = true; show(i); clearTimeout(box._t); box._t = setTimeout(function () { idle = false; }, 2000); }
    items.forEach(function (li, i) {
      li.addEventListener('mouseenter', function () { pick(i); });
      li.addEventListener('click', function () { pick(i); });
    });
    show(0);
    startAuto();
  });

  /* ---------- сертифікати: перемикач «Онлайн / Подарункова картка» ---------- */
  var gtog = $$('.gtoggle button');
  function setGift(kind) {
    gtog.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.kind === kind ? 'true' : 'false'); });
    $$('.gcard[data-gift-card]').forEach(function (c) {
      var img = $('img', c), price = $('.gcard__price', c), lbl = $('.gcard__kind', c), btn = $('.btn', c);
      var fmt = c.dataset.product + ' (' + (kind === 'online' ? 'онлайн' : 'подарункова картка') + ')';
      img.src = c.dataset[kind + 'Img']; img.alt = c.dataset[kind + 'Alt'];
      price.textContent = c.dataset[kind + 'Price'];
      lbl.textContent = kind === 'online' ? 'Онлайн' : 'Подарункова картка';
      btn.setAttribute('data-format', 'Сертифікат: ' + fmt);
      btn.href = '/?format=' + encodeURIComponent('Сертифікат: ' + fmt) + '#book';
    });
  }
  gtog.forEach(function (b) { b.addEventListener('click', function () { setGift(b.dataset.kind); }); });

  /* ---------- потрійний клік виділяє лише свій рядок, а не сусідній великий заголовок ---------- */
  d.addEventListener('mousedown', function (e) {
    if (e.detail !== 3 || !e.target.closest) return;
    var el = e.target.closest('.mono, p, h1, h2, h3, li, figcaption, small, b, strong');
    if (!el) return;
    var r = d.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.empty(); s.addRange(r);
    e.preventDefault();
  });

  /* ---------- форма ---------- */
  var form = $('#bookForm');
  function pickFormat(f) {
    var sel = $('#f-format'); if (!sel || !f) return false;
    var hit = false;
    Array.prototype.forEach.call(sel.options, function (o, i) { if (o.text === f) { sel.selectedIndex = i; hit = true; } });
    return hit;
  }
  if (form) {
    var date = $('#f-date'), time = $('#f-time'), fmt = $('#f-format');
    var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = today.toISOString().slice(0, 10);
    date.value = date.min;
    /* правила за форматом: дні тижня (0=нд…5=пт), фіксований час або останній сідінг */
    function ruleFor(f) {
      if (f === 'Шефський стіл') return { days: [5], times: ['18:30'], hint: 'Шефський стіл відбувається щоп’ятниці о 18:30.' };
      if (f === 'Дегустаційне меню') return { last: '19:30' };
      return null;
    }
    function allTimes(last) {
      var out = [];
      for (var hh = 11; hh <= 21; hh++) ['00', '30'].forEach(function (m) {
        var t = hh + ':' + m; if (hh === 21 && m === '30') return;
        if (!last || t <= last) out.push(t);
      });
      return out;
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function nowHM() { var n = new Date(); return pad(n.getHours()) + ':' + pad(n.getMinutes()); }
    function ymd(v) { var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function localISO(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
    var dateHint = d.createElement('small'); dateHint.className = 'hint'; dateHint.id = 'f-hint';
    time.parentNode.parentNode.insertBefore(dateHint, time.parentNode.nextSibling);
    date.setAttribute('aria-describedby', 'f-hint e-date');
    function rule() { return ruleFor(fmt.value); }
    function dateOK(v) { var r = rule(); return !!v && v >= date.min && (!r || !r.days || r.days.indexOf(ymd(v).getDay()) > -1); }
    function nextAllowed(from) {
      var r = rule(); if (!r || !r.days) return from;
      var dt = ymd(from);
      /* сьогоднішня п’ятниця вже минула за часом — беремо наступну */
      if (from === date.min && r.times && r.times[r.times.length - 1] <= nowHM()) dt.setDate(dt.getDate() + 1);
      for (var i = 0; i < 8; i++) { if (r.days.indexOf(dt.getDay()) > -1) return localISO(dt); dt.setDate(dt.getDate() + 1); }
      return from;
    }
    function fillTimes() {
      var r = rule(), keep = time.value;
      var list = r && r.times ? r.times.slice() : allTimes(r && r.last);
      if (date.value === date.min) { var hm = nowHM(); list = list.filter(function (t) { return pad(+t.split(':')[0]) + ':' + t.split(':')[1] > hm; }); }
      if (!list.length) { time.innerHTML = '<option value="">Сьогодні вільного часу немає</option>'; time.disabled = true; return; }
      time.disabled = false;
      var pick = list.indexOf(keep) > -1 ? keep : (list.indexOf('19:00') > -1 ? '19:00' : list[0]);
      time.innerHTML = list.map(function (t) { return '<option' + (t === pick ? ' selected' : '') + '>' + t + '</option>'; }).join('');
    }
    function applyRules() {
      var r = rule();
      dateHint.textContent = r ? r.hint : '';
      if (!dateOK(date.value)) date.value = nextAllowed(date.min);
      fillTimes();
    }
    fmt.addEventListener('change', function () { applyRules(); setErr(date, ''); });
    date.addEventListener('change', fillTimes);
    applyRules();

    /* формат із посилання: /?format=...#book */
    if (pickFormat(new URLSearchParams(location.search).get('format'))) applyRules();

    var g = 2, gOut = $('#g-out'), gVal = $('#g-val');
    function setG(v) { g = clamp(v, 1, 20); gOut.textContent = g; gVal.value = g; }
    $('#g-minus').addEventListener('click', function () { setG(g - 1); });
    $('#g-plus').addEventListener('click', function () { setG(g + 1); });

    /* кнопки зі сторінки обирають формат і ведуть до форми */
    $$('[data-format]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!pickFormat(a.getAttribute('data-format'))) return;
        var h = a.getAttribute('href') || '';
        if (h.indexOf('format=') > -1) { e.preventDefault(); if (lenis) lenis.scrollTo('#book', { offset: -88 }); else $('#book').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
      });
    });

    function setErr(el, msg) {
      var box = el.closest('.field'), out = $('.err', box);
      if (msg) { el.setAttribute('aria-invalid', 'true'); box.classList.add('has-err'); out.textContent = msg; }
      else { el.removeAttribute('aria-invalid'); box.classList.remove('has-err'); out.textContent = ''; }
    }
    var nameEl = $('#f-name'), phoneEl = $('#f-phone');
    function checkName() { var bad = nameEl.value.trim().length < 2; setErr(nameEl, bad ? 'Вкажіть ім\'я' : ''); return !bad; }
    function checkPhone() { var bad = phoneEl.value.replace(/\D/g, '').length < 9; setErr(phoneEl, bad ? 'Вкажіть номер телефону' : ''); return !bad; }
    function checkDate() { var bad = !dateOK(date.value); setErr(date, bad ? (rule() && rule().days ? 'Шефський стіл відбувається щоп’ятниці, оберіть п’ятницю' : 'Оберіть дату не раніше сьогодні') : ''); return !bad; }
    nameEl.addEventListener('blur', function () { if (nameEl.value) checkName(); });
    phoneEl.addEventListener('blur', function () { if (phoneEl.value) checkPhone(); });
    date.addEventListener('change', checkDate);
    [nameEl, phoneEl].forEach(function (el) { el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) (el === nameEl ? checkName : checkPhone)(); }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = [checkDate(), checkName(), checkPhone()].every(Boolean);
      if (ok && !time.value) { setErr(date, 'На сьогодні вільного часу немає, оберіть іншу дату'); ok = false; }
      if (!ok) { ($('[aria-invalid="true"]', form) || nameEl).focus(); return; }

      var done = $('#formDone'), btn = $('button[type="submit"]', form);
      var note = $('#f-note').value.trim();
      var payload = {
        format: fmt.value, date: date.value, time: time.value, guests: g,
        name: nameEl.value.trim(), phone: phoneEl.value.trim(), note: note,
        'bot-field': $('[name="bot-field"]', form).value
      };
      btn.disabled = true;
      var tel = '<a class="link" href="tel:+380988222222">+380 98 822 22 22</a>';
      function finish(html) { done.innerHTML = html; form.classList.add('is-done'); done.focus(); }
      fetch('/.netlify/functions/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          var safe = d.createElement('span'); safe.textContent = payload.name;
          finish('<h3>Дякуємо, ' + safe.innerHTML + '.</h3><p>Заявку отримано (' + fmt.value + ', ' + date.value + ', ' + time.value + ', гостей: ' + g + '). Ми зателефонуємо, щоб підтвердити час.</p>');
        })
        .catch(function () {
          btn.disabled = false;
          finish('<h3>Не вдалося надіслати</h3><p>Зателефонуйте нам: ' + tel + ' або напишіть на bavovna.rest@gmail.com.</p>');
        });
    });
  }

  /* ---------- найближча п’ятниця (шефський стіл 18:30) ---------- */
  (function () {
    var n = new Date(), dt = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    var late = n.getHours() * 60 + n.getMinutes() >= 18 * 60 + 30;
    var add = (5 - dt.getDay() + 7) % 7;
    if (add === 0 && late) add = 7;
    dt.setDate(dt.getDate() + add);
    var label = dt.getDate() + ' ' + ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'][dt.getMonth()];
    $$('[data-next-fri]').forEach(function (el) { el.textContent = label; });
  })();

  /* ---------- заголовки по рядках ---------- */
  var heads = $$('h1.h-xl, h2.h-xl, h2.h-l, h1.h-l').filter(function (h) {
    if (h.closest('.hero__end, .manifest') || h.hasAttribute('data-words')) return false;
    return Array.prototype.every.call(h.children, function (c) { return c.tagName === 'BR'; });
  });
  var lineIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); lineIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .2 }) : null;
  function splitLines(h) {
    if (!h._orig) { h._orig = h.innerHTML; h._label = h.textContent.replace(/\s+/g, ' ').trim(); }
    var tokens = [];
    Array.prototype.forEach.call(h.childNodes, function (n) {
      if (n.nodeType === 3) n.textContent.split(/\s+/).forEach(function (w) { if (w) tokens.push(w); });
      else if (n.tagName === 'BR') tokens.push('\n');
    });
    h.innerHTML = tokens.map(function (w) { return w === '\n' ? '<br>' : '<span class="lw">' + w + '</span>'; }).join(' ');
    var lines = [], last = null, top = null;
    Array.prototype.forEach.call(h.childNodes, function (n) {
      if (n.nodeType !== 1 || n.tagName === 'BR') { if (n.tagName === 'BR') top = null; return; }
      if (top === null || Math.abs(n.offsetTop - top) > 4) { last = []; lines.push(last); top = n.offsetTop; }
      last.push(n.textContent);
    });
    h.innerHTML = lines.map(function (l, i) {
      return '<span class="ln"><span class="ln__i" style="--li:' + i + '">' + l.join(' ') + '</span></span>';
    }).join(' ');
    h.setAttribute('aria-label', h._label);
    Array.prototype.forEach.call(h.children, function (c) { c.setAttribute('aria-hidden', 'true'); });
    h.classList.add('split');
  }
  if (!reduce && lineIO) {
    var splitAll = function () { heads.forEach(function (h) { var was = h.classList.contains('in'); if (h._orig) h.innerHTML = h._orig; splitLines(h); if (was) h.classList.add('in'); }); };
    var run = function () { splitAll(); heads.forEach(function (h) { if (!h.classList.contains('in')) lineIO.observe(h); }); };
    (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(run);
    var rw = window.innerWidth, rt;
    window.addEventListener('resize', function () {
      if (window.innerWidth === rw) return; rw = window.innerWidth;
      clearTimeout(rt); rt = setTimeout(splitAll, 200);
    });
  }

  /* ---------- магнітні кнопки ---------- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.btn--primary:not(.dock .btn)').forEach(function (b) {
      var pad = 36;
      function move(e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.translate = (dx * .22).toFixed(1) + 'px ' + (dy * .3).toFixed(1) + 'px';
      }
      function leave() { b.style.translate = ''; window.removeEventListener('mousemove', track); b._on = false; }
      function track(e) {
        var r = b.getBoundingClientRect();
        if (e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad || e.clientY > r.bottom + pad) leave(); else move(e);
      }
      d.addEventListener('mousemove', function (e) {
        if (b._on) return;
        var r = b.getBoundingClientRect();
        if (e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad) { b._on = true; window.addEventListener('mousemove', track); }
      }, { passive: true });
    });
  }

  /* ---------- завантажувальний екран ---------- */
  (function () {
    var ld = $('#loader'); if (!ld) return;
    var fin = false;
    function done() {
      if (fin) return; fin = true;
      root.classList.remove('loading');
      ld.classList.add('is-open');
      toTop();
      onScroll();
      setTimeout(function () { ld.remove(); }, 1900);
    }
    if (!root.classList.contains('loading')) { ld.remove(); return; }
    var toTop = function () { try { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); } catch (e) {} };
    toTop();
    try { sessionStorage.setItem('bv-seen', '1'); } catch (e) {}
    var t0 = Date.now();
    var go = function () { setTimeout(done, Math.max(0, 1500 - (Date.now() - t0))); };
    if (d.readyState === 'complete') go(); else window.addEventListener('load', go);
    setTimeout(done, 4000);
  })();
  /* звук вогнища: вмикається лише за кліком, стан запам'ятовується */
  (function () {
    var b = $('#ambient'), a = $('#fireAudio');
    if (!b || !a) return;
    a.volume = 0.5;
    var set = function (on) {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Вимкнути атмосферу' : 'Додайте атмосфери: увімкнути звук вогнища');
      try { localStorage.setItem('bv-fire', on ? '1' : '0'); } catch (e) {}
    };
    b.addEventListener('click', function () {
      if (a.paused) { var p = a.play(); if (p && p.then) p.then(function () { set(true); }, function () { set(false); }); else set(true); }
      else { a.pause(); set(false); }
    });
    d.addEventListener('visibilitychange', function () { if (d.hidden && !a.paused) { a.pause(); set(false); } });
  })();
  /* сторінки без форми ведуть на неї через /?format=... */
})();
