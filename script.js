// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Theme utilities
const rootEl = document.documentElement;
function getVar(name) {
  return getComputedStyle(rootEl).getPropertyValue(name).trim();
}
function setTheme(theme) {
  rootEl.setAttribute('data-theme', theme);
  localStorage.setItem('gjk-theme', theme);
  // trigger custom event so charts can re-read variables
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  // update toggle a11y
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
  }
}
function initTheme() {
  const stored = localStorage.getItem('gjk-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = stored || (prefersDark ? 'dark' : 'light');
  setTheme(initial);
}
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = rootEl.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
    // ensure label matches on load
    const current = rootEl.getAttribute('data-theme') || 'dark';
    const label = current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-checked', current === 'dark' ? 'true' : 'false');
  }
  // init mobile nav
  initMobileNav();
});

// Smooth scroll for internal links
for (const a of document.querySelectorAll('a[href^="#"]')) {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      e.preventDefault();
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// Intersection Observer reveal
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  }
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Motion preferences and visibility helpers
const mqlReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
function canAnimate() { return !(mqlReduce && mqlReduce.matches) && !document.hidden; }
document.addEventListener('visibilitychange', () => {
  // noop: individual animations check canAnimate each frame and will auto-resume
});
mqlReduce && mqlReduce.addEventListener && mqlReduce.addEventListener('change', () => {
  // noop: frames read canAnimate and will adapt next tick
});

// Mobile nav interactions
function initMobileNav() {
  const menuBtn = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  if (!menuBtn || !nav) return;
  const openClass = 'nav-open';
  const bp = 800; // sync with CSS breakpoint

  function isOpen() { return document.documentElement.classList.contains(openClass); }
  function open() {
    document.documentElement.classList.add(openClass);
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
  }
  function close() {
    document.documentElement.classList.remove(openClass);
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
  }

  menuBtn.addEventListener('click', () => {
    isOpen() ? close() : open();
  });

  // close on nav link click
  nav.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.tagName === 'A') close();
  });

  // close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  // close when resizing to desktop
  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      if (window.innerWidth > bp && isOpen()) close();
    }, 120);
  });
}

// Animated background grid
(function bgGrid() {
  const c = document.getElementById('bg-grid');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    c.width = innerWidth * dpr;
    c.height = innerHeight * dpr;
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  let t = 0, rafId = null;
  function draw() {
    if (!canAnimate()) { rafId = null; return; }
    t += 0.006;
    ctx.clearRect(0, 0, c.width, c.height);

    // Subtle gradient backdrop
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, 'rgba(21,255,239,0.03)');
    g.addColorStop(1, 'rgba(138,43,226,0.03)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);

    // Moving grid lines
    ctx.strokeStyle = getVar('--chart-grid') || 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const gap = 40;
    const offset = (Math.sin(t) * gap) % gap;
    for (let x = -gap + offset; x < innerWidth + gap; x += gap) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, innerHeight); ctx.stroke();
    }
    for (let y = -gap + offset; y < innerHeight + gap; y += gap) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(innerWidth, y); ctx.stroke();
    }

    // Pulsing nodes
    for (let i = 0; i < 40; i++) {
      const px = (i * 97) % innerWidth;
      const py = (i * 53) % innerHeight;
      const r = 1.2 + Math.sin(t * 2 + i) * 0.8;
      const hue = (i * 9 + t * 120) % 360;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.25)`;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  }
  if (canAnimate()) draw();
  document.addEventListener('visibilitychange', () => { if (!rafId && canAnimate()) draw(); });
  mqlReduce && mqlReduce.addEventListener && mqlReduce.addEventListener('change', () => { if (!rafId && canAnimate()) draw(); });
})();

// Robust image loading for QR and gifs with retry
(function robustImages(){
  function addRetry(img){
    if (!img) return;
    let tried = false;
    img.addEventListener('error', () => {
      if (tried) return; tried = true;
      const src = img.getAttribute('src');
      if (!src) return;
      const bust = (src.includes('?') ? '&' : '?') + 'cb=' + Date.now();
      img.src = src + bust;
    }, { once: true });
  }
  addRetry(document.querySelector('.qr-img'));
  document.querySelectorAll('.gif-card img').forEach(addRetry);
})();

// Simple animated line chart
(function lineChart() {
  const canvas = document.getElementById('lineChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width, h = canvas.height;

  // responsive sizing
  const dpr = window.devicePixelRatio || 1;
  let lastCssW = 0;
  function size() {
    const cssWidth = Math.max(260, (canvas.parentElement ? canvas.parentElement.clientWidth : canvas.getBoundingClientRect().width) || 0);
    if (Math.abs(cssWidth - lastCssW) < 1) return; // prevent RO feedback loops
    lastCssW = cssWidth;
    const cssHeight = Math.round(cssWidth * 0.48);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = cssWidth; h = cssHeight;
  }
  size();
  const ro1 = new ResizeObserver(() => { requestAnimationFrame(size); });
  ro1.observe(canvas.parentElement || canvas);

  const points = Array.from({ length: 60 }, (_, i) => (
    0.5 + 0.45 * Math.sin(i * 0.25) + (Math.random() - 0.5) * 0.08
  ));
  let t = 0, rafId = null;

  function draw() {
    if (!canAnimate()) { rafId = null; return; }
    t += 0.02;
    ctx.clearRect(0, 0, w, h);

    // frame
    ctx.fillStyle = getVar('--chart-pane') || 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = getVar('--chart-frame') || 'rgba(255,255,255,0.08)';
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // grid
    ctx.strokeStyle = getVar('--chart-grid') || 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // line
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const v = points[(i + Math.floor(t * 5)) % points.length];
      const x = (i / (points.length - 1)) * (w - 20) + 10;
      const y = h - (v * (h - 20)) - 10;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, getVar('--chart-line-1') || 'rgba(21,255,239,0.8)');
    gradient.addColorStop(1, getVar('--chart-line-2') || 'rgba(138,43,226,0.8)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.shadowColor = getVar('--chart-line-2') || 'rgba(138,43,226,0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
  }
  draw();

  // Repaint on theme change
  window.addEventListener('themechange', () => {
    // nothing special, next frame will read new vars
  });
})();

// Simple animated candlestick chart
(function candleChart() {
  const canvas = document.getElementById('candleChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width, h = canvas.height;

  // responsive sizing
  const dpr = window.devicePixelRatio || 1;
  let lastCssW2 = 0;
  function size() {
    const cssWidth = Math.max(260, (canvas.parentElement ? canvas.parentElement.clientWidth : canvas.getBoundingClientRect().width) || 0);
    if (Math.abs(cssWidth - lastCssW2) < 1) return;
    lastCssW2 = cssWidth;
    const cssHeight = Math.round(cssWidth * 0.48);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = cssWidth; h = cssHeight;
  }
  size();
  const ro2 = new ResizeObserver(() => { requestAnimationFrame(size); });
  ro2.observe(canvas.parentElement || canvas);

  let candles = Array.from({ length: 28 }, (_, i) => genCandle(i));
  let t = 0, rafId = null;

  function genCandle(i) {
    const base = h * 0.5 + Math.sin(i * 0.5) * 20;
    const high = base - (10 + Math.random() * 20);
    const low = base + (10 + Math.random() * 20);
    const open = base + (Math.random() * 20 - 10);
    const close = base + (Math.random() * 20 - 10);
    return { open, close, high, low };
  }

  function draw() {
    t += 0.02;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getVar('--chart-pane') || 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = getVar('--chart-frame') || 'rgba(255,255,255,0.08)'; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const cw = (w - 20) / candles.length;
    for (let i = 0; i < candles.length; i++) {
      const x = 10 + i * cw + cw * 0.1;
      const c = candles[i];
      const color = c.close >= c.open ? (getVar('--chart-green') || 'rgba(0,255,133,0.85)') : (getVar('--chart-red') || 'rgba(255,80,80,0.85)');
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      // wick
      ctx.beginPath();
      ctx.moveTo(x + cw * 0.4, c.high);
      ctx.lineTo(x + cw * 0.4, c.low);
      ctx.stroke();
      // body
      // derive translucent body color
      try {
        const body = color.replace('0.85','0.25');
        ctx.fillStyle = body;
      } catch { ctx.fillStyle = color; }
      const y = Math.min(c.open, c.close);
      const hgt = Math.max(4, Math.abs(c.open - c.close));
      ctx.fillRect(x, y, cw * 0.6, hgt);
      ctx.strokeRect(x, y, cw * 0.6, hgt);
    }

    if (Math.random() < 0.06) {
      candles.shift();
      candles.push(genCandle(candles.length));
    }
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('themechange', () => {
    // repaint will pick up new variables on next frame
  });
})();
