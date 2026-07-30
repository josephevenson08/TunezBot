/* ═══════════════════════════════════════════════════════════
   TUNEZBOT — site behaviour
   No dependencies. Everything degrades to a readable page.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ═══════════ NAV ═══════════ */
  function initNav() {
    var nav = $('#nav');
    var toggle = $('#navToggle');
    var links = $('.nav__links');
    if (!nav) return;

    var stuck = false;
    function onScroll() {
      var should = window.scrollY > 24;
      if (should !== stuck) { stuck = should; nav.classList.toggle('is-stuck', stuck); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', links).forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ═══════════ HERO DOT MATRIX ═══════════
     Renders the wordmark as an LED grid: text is drawn to an
     offscreen canvas, sampled on a lattice, and each lit cell
     becomes a dot driven by a travelling wave + pointer proximity. */
  function initMatrix() {
    var cvs = $('#matrix');
    if (!cvs || !cvs.getContext) { document.documentElement.classList.add('no-canvas'); return; }

    var ctx = cvs.getContext('2d');
    var off = document.createElement('canvas');
    var octx = off.getContext('2d');
    if (!ctx || !octx) { document.documentElement.classList.add('no-canvas'); return; }

    var WORD = 'TUNEZBOT';
    var MONO = '700 %spx ui-monospace, "Cascadia Mono", "SFMono-Regular", Consolas, monospace';

    var pts = [], W = 0, H = 0, gap = 7, dotR = 2.1;
    var pointer = { x: -9999, y: -9999, on: false };

    // 8 brightness buckets, blurple → teal, so a frame is 8 fills not 2000
    var RAMP = [];
    (function buildRamp() {
      var a = [88, 101, 242], b = [62, 214, 196];
      for (var i = 0; i < 8; i++) {
        var t = i / 7;
        var r = Math.round(a[0] + (b[0] - a[0]) * t * 0.85);
        var g = Math.round(a[1] + (b[1] - a[1]) * t * 0.85);
        var bl = Math.round(a[2] + (b[2] - a[2]) * t * 0.85);
        RAMP.push('rgba(' + r + ',' + g + ',' + bl + ',' + (0.30 + t * 0.70).toFixed(3) + ')');
      }
    })();

    function sample() {
      var rect = cvs.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      if (!W || !H) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = W * dpr; cvs.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      off.width = W; off.height = H;
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.clearRect(0, 0, W, H);

      // fit the word to the box
      var size = H * 0.92;
      octx.font = MONO.replace('%s', size);
      var measured = octx.measureText(WORD).width || 1;
      size = Math.min(size, size * ((W * 0.97) / measured));
      octx.font = MONO.replace('%s', size);
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillStyle = '#fff';
      octx.fillText(WORD, W / 2, H / 2 + size * 0.03);

      // Derive the lattice from the glyph size, not the canvas width — on narrow screens
      // the word is width-constrained, so a width-based gap leaves barely one dot per stroke.
      gap = Math.max(4, Math.round(size / 24));
      dotR = Math.max(1.15, gap * 0.31);

      var data;
      try { data = octx.getImageData(0, 0, W, H).data; }
      catch (e) { document.documentElement.classList.add('no-canvas'); return; }

      pts = [];
      for (var y = gap; y < H - 1; y += gap) {
        for (var x = gap; x < W - 1; x += gap) {
          if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x: x, y: y });
        }
      }
    }

    var TAU = Math.PI * 2;
    function draw(time) {
      if (!W || !H) return;
      var t = time / 1000;
      ctx.clearRect(0, 0, W, H);

      var buckets = [];
      for (var b = 0; b < 8; b++) buckets.push([]);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        // travelling wave across x, with a slow vertical shimmer
        var wave = Math.sin(p.x * 0.013 - t * 2.0) * 0.5 + 0.5;
        wave = wave * 0.75 + (Math.sin(p.y * 0.05 + t * 0.9) * 0.5 + 0.5) * 0.25;

        if (pointer.on) {
          var dx = p.x - pointer.x, dy = p.y - pointer.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 15000) wave = Math.min(1, wave + (1 - d2 / 15000) * 0.85);
        }

        var idx = wave * 7 | 0;
        if (idx < 0) idx = 0; else if (idx > 7) idx = 7;
        buckets[idx].push(p, dotR * (0.45 + wave * 0.62));
      }

      for (var k = 0; k < 8; k++) {
        var arr = buckets[k];
        if (!arr.length) continue;
        ctx.fillStyle = RAMP[k];
        ctx.beginPath();
        for (var j = 0; j < arr.length; j += 2) {
          var pt = arr[j], r = arr[j + 1];
          ctx.moveTo(pt.x + r, pt.y);
          ctx.arc(pt.x, pt.y, r, 0, TAU);
        }
        ctx.fill();
      }
    }

    var raf = null, visible = true;
    function loop(ts) { draw(ts); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !REDUCED) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    sample();
    if (REDUCED) { draw(0); }
    else { start(); }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { sample(); if (REDUCED) draw(0); }, 160);
    });

    var hero = $('.hero');
    if (hero && !REDUCED) {
      hero.addEventListener('pointermove', function (e) {
        var r = cvs.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        pointer.on = true;
      });
      hero.addEventListener('pointerleave', function () { pointer.on = false; });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start(); else stop();
        }, { threshold: 0 }).observe(cvs);
      }
    }
  }

  /* ═══════════ TICKER ═══════════ */
  function initTicker() {
    var track = $('#tickerTrack');
    if (!track) return;
    var set = $('.ticker__set', track);
    if (set) track.appendChild(set.cloneNode(true)); // duplicate for a seamless -50% loop
  }

  /* ═══════════ REVEAL ON SCROLL ═══════════ */
  function initReveal() {
    if (REDUCED || !('IntersectionObserver' in window)) return;
    var targets = $$('.sec__head, .booth, .booth__foot, .cmds__bar, .cmd, .chain__node, .note, .vs, .finding, .cf, .step, .spec__col, .spec__foot, .cta .wrap');
    if (!targets.length) return;

    targets.forEach(function (el) { el.classList.add('reveal'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? $$('.reveal', el.parentElement) : [];
        var i = siblings.indexOf(el);
        el.style.transitionDelay = (i > 0 ? Math.min(i, 6) * 55 : 0) + 'ms';
        el.classList.add('is-in');
        if (el.classList.contains('chain__node')) el.classList.add('is-lit');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ═══════════ COMMAND FILTER ═══════════ */
  function initCommands() {
    var grid = $('#cmdGrid');
    var input = $('#cmdSearch');
    var empty = $('#cmdEmpty');
    if (!grid) return;

    var cards = $$('.cmd', grid);
    var filter = 'all';
    var term = '';

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var okCat = filter === 'all' || card.getAttribute('data-cat') === filter;
        var okTerm = !term || (card.getAttribute('data-key') || '').indexOf(term) !== -1;
        var show = okCat && okTerm;
        card.classList.toggle('is-hidden', !show);
        if (show) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }

    $$('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('.chip').forEach(function (c) { c.classList.remove('is-on'); });
        chip.classList.add('is-on');
        filter = chip.getAttribute('data-filter');
        apply();
      });
    });

    if (input) {
      input.addEventListener('input', function () {
        term = input.value.trim().toLowerCase().replace(/^\//, '');
        apply();
      });
    }
  }

  /* ═══════════ COPY BUTTONS ═══════════ */
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy unavailable'));
    });
  }

  // The async Clipboard API is blocked in sandboxed frames and on insecure origins,
  // so a rejection is a reason to try the old path, not to give up.
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  function initCopy() {
    $$('.copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy') || '';
        copyText(text).then(function () {
          btn.textContent = 'COPIED';
          btn.classList.add('is-done');
          setTimeout(function () { btn.textContent = 'COPY'; btn.classList.remove('is-done'); }, 1600);
        }).catch(function () {
          btn.textContent = 'CTRL+C';
          setTimeout(function () { btn.textContent = 'COPY'; }, 1600);
        });
      });
    });
  }

  /* ═══════════ THE BOOTH — simulated Discord session ═══════════ */
  function initBooth() {
    var log = $('#log');
    var typedEl = $('#typed');
    if (!log || !typedEl) return;

    var nowPanel = $('#nowPanel'), nowTitle = $('#nowTitle'), nowBar = $('#nowBar');
    var tCur = $('#tCur'), tTot = $('#tTot'), nowModes = $('#nowModes'), presence = $('#presence');

    var SCRIPT = [
      {
        cmd: 'tplay daft punk one more time',
        reply: 'Playing: <b>Daft Punk &mdash; One More Time</b>',
        track: { title: 'Daft Punk — One More Time', dur: 320, at: 71 },
        modes: []
      },
      {
        cmd: 'tqueue justice genesis',
        reply: 'Queued: <b>Justice &mdash; Genesis</b>',
        modes: ['1 QUEUED']
      },
      {
        cmd: 'tnowplaying',
        reply: 'Now playing: <b>Daft Punk &mdash; One More Time</b> (requested by @joseph)',
        list: '▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬\n1 song queued next.'
      },
      {
        cmd: 'tartist daft punk',
        reply: 'Artist mode started for <b>Daft Punk</b>. Added: <b>Around the World</b>',
        modes: ['2 QUEUED', 'ARTIST · DAFT PUNK']
      },
      {
        cmd: 'tskip',
        reply: 'Skipped. Artist mode: <b>Harder, Better, Faster, Stronger</b>',
        track: { title: 'Harder, Better, Faster, Stronger', dur: 224, at: 0 },
        modes: ['1 QUEUED', 'ARTIST · DAFT PUNK']
      },
      {
        cmd: 'thistory',
        reply: 'Session history &mdash; newest first:',
        list: '1. Harder, Better, Faster, Stronger <b>(now playing)</b>\n2. Around the World\n3. Justice — Genesis\n4. Daft Punk — One More Time'
      },
      {
        cmd: 'tstopartist',
        reply: 'Artist mode stopped.',
        modes: ['1 QUEUED']
      }
    ];

    var MODE_CLASS = { 'ARTIST': 'mode--amber', 'QUEUED': 'mode--blurple', 'LOOP': 'mode--teal' };

    var track = { title: '—', dur: 0, at: 0 };
    var step = 0, timers = [], running = false, clockTimer = null, presenceTimer = null;
    // Bumped on every start/stop. A chain that was suspended across a stop resumes with a
    // stale token and bails — without this, scrolling away and back starts a second
    // concurrent chain that posts duplicate messages.
    var gen = 0;

    function fmt(s) {
      s = Math.max(0, Math.floor(s));
      var m = Math.floor(s / 60), sec = s % 60;
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function wait(ms) {
      return new Promise(function (resolve) { timers.push(setTimeout(resolve, ms)); });
    }

    function addMsg(who, isBot, html, list) {
      var msg = document.createElement('div');
      msg.className = 'msg ' + (isBot ? 'msg--bot' : 'msg--you');

      var av = document.createElement('div');
      av.className = 'msg__av';
      av.textContent = isBot ? 'T' : 'J';

      var body = document.createElement('div');
      body.className = 'msg__body';

      var name = document.createElement('div');
      name.className = 'msg__who';
      name.textContent = who;
      if (isBot) { var tag = document.createElement('i'); tag.textContent = 'APP'; name.appendChild(tag); }

      var text = document.createElement('div');
      text.className = 'msg__text';
      text.innerHTML = html;

      body.appendChild(name);
      body.appendChild(text);

      if (list) {
        var l = document.createElement('div');
        l.className = 'msg__list';
        l.innerHTML = list.split('\n').join('<br/>');
        body.appendChild(l);
      }

      msg.appendChild(av);
      msg.appendChild(body);
      log.appendChild(msg);
      log.scrollTop = log.scrollHeight;

      while (log.children.length > 14) log.removeChild(log.firstChild);
    }

    function setModes(list) {
      nowModes.innerHTML = '';
      (list || []).forEach(function (m) {
        var el = document.createElement('span');
        var key = m.indexOf('ARTIST') === 0 ? 'ARTIST' : (m.indexOf('LOOP') === 0 ? 'LOOP' : 'QUEUED');
        el.className = 'mode ' + MODE_CLASS[key];
        el.textContent = m;
        nowModes.appendChild(el);
      });
    }

    function paintClock() {
      if (!track.dur) return;
      tCur.textContent = fmt(track.at);
      tTot.textContent = fmt(track.dur);
      nowBar.style.width = Math.min(100, (track.at / track.dur) * 100).toFixed(2) + '%';
    }

    function paintPresence() {
      presence.textContent = track.dur
        ? 'Listening to ' + track.title + ' ' + fmt(track.at) + ' / ' + fmt(track.dur)
        : 'Listening to —';
    }

    function setTrack(t) {
      track = { title: t.title, dur: t.dur, at: t.at || 0 };
      nowTitle.textContent = t.title;
      nowPanel.setAttribute('data-active', 'true');
      paintClock();
      paintPresence();
    }

    // booth timestamp ticks every second; the bot's Discord presence every 3 — as it really does
    function startClocks() {
      if (clockTimer || REDUCED) return;
      clockTimer = setInterval(function () {
        if (!track.dur) return;
        track.at = track.at + 1 >= track.dur ? 0 : track.at + 1;
        paintClock();
      }, 1000);
      presenceTimer = setInterval(paintPresence, 3000);
    }
    function stopClocks() {
      clearInterval(clockTimer); clockTimer = null;
      clearInterval(presenceTimer); presenceTimer = null;
    }

    function typeCmd(text) {
      return new Promise(function (resolve) {
        if (REDUCED) { typedEl.textContent = text; resolve(); return; }
        var i = 0;
        typedEl.textContent = '';
        (function tick() {
          if (i >= text.length) { resolve(); return; }
          typedEl.textContent = text.slice(0, ++i);
          timers.push(setTimeout(tick, 34 + Math.random() * 46));
        })();
      });
    }

    function alive(myGen) { return running && myGen === gen; }

    function run(myGen) {
      if (!alive(myGen)) return Promise.resolve();
      var s = SCRIPT[step % SCRIPT.length];

      return typeCmd(s.cmd)
        .then(function () { return wait(520); })
        .then(function () {
          if (!alive(myGen)) return;
          typedEl.textContent = '';
          addMsg('joseph', false, '<span class="msg__cmd">/' + s.cmd + '</span>');
          return wait(760);
        })
        .then(function () {
          if (!alive(myGen)) return;
          addMsg('TunezBot', true, s.reply, s.list);
          if (s.track) setTrack(s.track);
          if (s.modes) setModes(s.modes);
          startClocks();
          return wait(2900);
        })
        .then(function () {
          if (!alive(myGen)) return;
          step++;
          if (step % SCRIPT.length === 0) {
            return wait(1400).then(function () {
              if (!alive(myGen)) return;
              log.innerHTML = '';
              setModes([]);
              nowPanel.setAttribute('data-active', 'false');
              return wait(700);
            }).then(function () { return run(myGen); });
          }
          return run(myGen);
        });
    }

    function start() {
      if (running) return;
      running = true;
      gen++;
      run(gen);
    }
    function stop() {
      running = false;
      gen++;
      timers.forEach(clearTimeout);
      timers = [];
      stopClocks();
    }

    // Reduced motion: no typing, no ticking clock, no auto-advancing log. Render the whole
    // session at once so every line is readable without anything moving.
    function renderStatic() {
      SCRIPT.forEach(function (s) {
        addMsg('joseph', false, '<span class="msg__cmd">/' + s.cmd + '</span>');
        addMsg('TunezBot', true, s.reply, s.list);
        if (s.track) setTrack(s.track);
        if (s.modes) setModes(s.modes);
      });
      log.scrollTop = 0;
      var caret = $('#caret');
      if (caret) caret.style.display = 'none';
      typedEl.textContent = 'tplay …';
    }

    if (REDUCED) {
      renderStatic();
      return;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start(); else stop();
      }, { threshold: 0.25 }).observe(log);
    } else {
      start();
    }
  }

  /* ═══════════ SCROLLSPY ═══════════ */
  function initSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.nav__links a');
    if (!links.length) return;

    var map = {};
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      var sec = id && document.getElementById(id);
      if (sec) map[id] = a;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = map[entry.target.id];
        if (a) a.style.color = entry.isIntersecting ? 'var(--txt)' : '';
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ═══════════ BOOT ═══════════ */
  function boot() {
    initNav();
    initMatrix();
    initTicker();
    initReveal();
    initCommands();
    initCopy();
    initBooth();
    initSpy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
