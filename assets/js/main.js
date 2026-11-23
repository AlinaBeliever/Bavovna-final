/* Бавовна — ванільний JS: шапка, розріз, маніфест, акти, меню, відео, форма */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var vh = function () { return window.innerHeight || 800; };

  /* ---------- шапка, док, меню ---------- */
  var hdr = $('#hdr'), dock = $('#dock'), hero = $('.hero');
  var burger = $('#burger');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    d.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- розріз ---------- */
  var split = $('#split'), stick = split && $('.split__stick', split);
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
    if (hero) dock.classList.toggle('on', y > hero.offsetHeight * .7);

    if (split && stick) {
      var top = split.offsetTop, len = split.offsetHeight - h;
      var p = clamp((y - top) / len, 0, 1);
      var q = reduce ? .5 : ease(clamp((p - .12) / .72, 0, 1));
      stick.style.setProperty('--cut', ((1 - q) * 100).toFixed(2) + '%');
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
          if (!v.paused && v.currentTime === last) { if (++still >= 2) { v.currentTime = 0; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); still = 0; } } else still = 0;
          last = v.currentTime;
        }, 1000);
      });
      always.forEach(function (v) { v.addEventListener('pause', function () { if (!d.hidden && !v.ended) setTimeout(kick, 200); }); });
    }

    /* підсвітка пункту навігації */
    var links = $$('.nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href')] = a; });
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = map['#' + e.target.id]; if (!a) return;
        if (e.isIntersecting) { links.forEach(function (l) { l.classList.remove('is-on'); }); a.classList.add('is-on'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['menu-vrazhen', 'carte', 'chef', 'events', 'gift', 'visit'].forEach(function (id) { var s = d.getElementById(id); if (s) nio.observe(s); });
  } else {
    $$('[data-r]').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- липка кнопка: ховаємо, поки видно #book (CSS діє лише <768px) ---------- */
  var bookSec = $('#book');
  if (bookSec && dock && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { dock.classList.toggle('is-off', e.isIntersecting); });
    }, { threshold: 0.05 }).observe(bookSec);
  }

  /* ---------- «Придбати»: посилання на оплату з data-pay-url ---------- */
  $$('[data-pay-url]').forEach(function (a) {
    var u = a.getAttribute('data-pay-url');
    if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; }
  });

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
  /* посилання з графіка відкривають потрібну вкладку меню */
  $$('[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () {
      tabs.forEach(function (t, i) { if (t.dataset.key === a.dataset.tab) openTab(i); });
    });
  });

  /* ---------- графік: розкривні колонки ---------- */
  var slots = $$('#slots .slot');
  function setSlot(s) { slots.forEach(function (x) { x.classList.toggle('on', x === s); }); }
  slots.forEach(function (s) {
    s.addEventListener('mouseenter', function () { setSlot(s); });
    s.addEventListener('focus', function () { setSlot(s); });
    s.addEventListener('click', function () { setSlot(s); });
  });

  /* ---------- список страв: фото змінюються кожні 2 с, наведення зупиняє ---------- */
  $$('[data-show]').forEach(function (box) {
    var items = $$('.sd', box), frames = $('.show__frames', box), cap = $('.show__cap', box);
    items.forEach(function (li) {
      var im = d.createElement('img');
      im.src = li.dataset.img || 'assets/img/interior.webp'; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      frames.appendChild(im);
    });
    var imgs = $$('img', frames), cur = -1, held = false, seen = true, holdTimer = null, capTimer = null;
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
    function hold(i, ms) {
      held = true; clearTimeout(holdTimer); show(i);
      if (ms) holdTimer = setTimeout(function () { held = false; }, ms);
    }
    items.forEach(function (li, i) {
      li.addEventListener('mouseenter', function () { hold(i); });
      li.addEventListener('focus', function () { hold(i); });
      li.addEventListener('mouseleave', function () { held = false; });
      li.addEventListener('blur', function () { held = false; });
      li.addEventListener('click', function () { hold(i, 6000); });
    });
    show(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: .15 }).observe(box);
    }
    if (!reduce) setInterval(function () { if (!held && seen && !d.hidden && box.offsetParent) show((cur + 1) % items.length); }, 2000);
  });

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
  if (form) {
    var date = $('#f-date'), time = $('#f-time'), fmt = $('#f-format');
    var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = today.toISOString().slice(0, 10);
    date.value = date.min;
    var opts = '';
    for (var hh = 11; hh <= 21; hh++) { ['00', '30'].forEach(function (m) { if (hh === 21 && m === '30') return; var t = hh + ':' + m; opts += '<option' + (t === '19:00' ? ' selected' : '') + '>' + t + '</option>'; }); }
    time.innerHTML = opts;

    var g = 2, gOut = $('#g-out'), gVal = $('#g-val');
    function setG(v) { g = clamp(v, 1, 20); gOut.textContent = g; gVal.value = g; }
    $('#g-minus').addEventListener('click', function () { setG(g - 1); });
    $('#g-plus').addEventListener('click', function () { setG(g + 1); });

    $$('[data-format]').forEach(function (a) {
      a.addEventListener('click', function () {
        var f = a.getAttribute('data-format');
        Array.prototype.forEach.call(fmt.options, function (o, i) { if (o.text === f) fmt.selectedIndex = i; });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#f-name'), phone = $('#f-phone'), ok = true;
      [name, phone].forEach(function (el) { el.classList.remove('bad'); });
      if (name.value.trim().length < 2) { name.classList.add('bad'); ok = false; }
      if (phone.value.replace(/\D/g, '').length < 9) { phone.classList.add('bad'); ok = false; }
      if (!ok) { ($('.bad', form) || name).focus(); return; }

      var done = $('#formDone');
      var summary = fmt.value + ', ' + date.value + ', ' + time.value + ', гостей: ' + g;
      var note = $('#f-note').value.trim();
      var msg = 'Нова заявка на бронювання\n' +
        'Формат: ' + fmt.value + '\nДата: ' + date.value + '\nЧас: ' + time.value + '\nГостей: ' + g + '\n' +
        'Ім\'я: ' + name.value.trim() + '\nТелефон: ' + phone.value.trim() +
        (note ? '\nПобажання: ' + note : '');
      var tg = 'https://t.me/BavovnaRest?text=' + encodeURIComponent(msg);

      /* відкриваємо Telegram одразу (у межах кліку), щоб не заблокував браузер */
      window.open(tg, '_blank', 'noopener');

      var safe = name.value.trim().replace(/[<>&]/g, '');
      done.innerHTML = '<h3>Майже готово, ' + safe + '.</h3><p>У Telegram відкрилося повідомлення до @BavovnaRest з вашою заявкою (' + summary + '). Натисніть там «Надіслати», і ми передзвонимо, щоб підтвердити час.</p>' +
        '<p style="margin-top:18px"><a class="btn btn--primary" href="' + tg + '" target="_blank" rel="noopener">Відкрити Telegram ще раз</a></p>' +
        '<p style="margin-top:14px">Не виходить? Зателефонуйте <a class="link" href="tel:+380988222222">+380 98 822 22 22</a>.</p>';
      form.classList.add('is-done');
    });
  }
})();
