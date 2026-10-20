const DESIGN_ID = 'DAHYdLjF2Pw';
const CANVA_SOURCE = `https://www.canva.com/design/${DESIGN_ID}/view?embed`;
const CANVA_PUBLIC_VIEW = 'https://www.canva.com/d/tXF_6oqEOdDb1Xk';

// Canva page 15 is currently empty. The site therefore uses the 14 designed pages.
// Each page has its own motion language so the experience feels authored, not like a generic slideshow.
const PAGES = [
  { id: 'PB1ZMt04MnhDVstj', label: 'University Wrapped', transition: 'cover' },
  { id: 'PB8KNlpgcxJrvLYM', label: 'Năm nhất – năm ba', transition: 'timeline' },
  { id: 'PByKJysHmqP8GKGm', label: 'Học phí 4 năm', transition: 'zoom' },
  { id: 'PBdDPlTB6RwY8VSz', label: 'Top 5 môn buồn ngủ', transition: 'ranking' },
  { id: 'PBC4CBp8brmcwbqY', label: 'Mood 6h sáng', transition: 'wipe' },
  { id: 'PBhCm5ZBRX9BJLxC', label: 'Giao tiếp kinh doanh', transition: 'paper' },
  { id: 'PBvPFDcVb3JwyrKt', label: 'Python', transition: 'flash' },
  { id: 'PBZTJXrLCCgMkvYQ', label: 'You know?', transition: 'spotlight' },
  { id: 'PBT96kHGqgZF34lk', label: 'Cheatsheet Văn hóa', transition: 'photo' },
  { id: 'PBZfTPLwlSmzFSsH', label: 'Thầy Khánh', transition: 'push' },
  { id: 'PBxwWrMpMkDSs7NF', label: 'PGS, TS. Trần Văn Nam', transition: 'paper' },
  { id: 'PB15Dl3bkrkwQnDT', label: 'Thầy Sơn Tùng & thầy Tô Trung Thành', transition: 'split' },
  { id: 'PBnj6PFJhg7fjhQN', label: 'Sang Phan', transition: 'photo' },
  { id: 'PBlDhgXnY2PmKSy5', label: 'Chị Thỏ Non', transition: 'finale' },
];

const state = {
  index: 0,
  busy: false,
  localAssetCache: new Map(),
  firstInteraction: false,
  pointer: null,
};

const currentCard = document.getElementById('currentCard');
const incomingCard = document.getElementById('incomingCard');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');
const progressEl = document.getElementById('progress');
const hintEl = document.getElementById('hint');
const prevZone = document.getElementById('prevZone');
const nextZone = document.getElementById('nextZone');
const stage = document.getElementById('stage');

const transitionFx = document.createElement('div');
transitionFx.className = 'transition-fx';
transitionFx.setAttribute('aria-hidden', 'true');
stage.appendChild(transitionFx);

const pad = (n) => String(n).padStart(2, '0');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
totalPagesEl.textContent = pad(PAGES.length);

function buildProgress() {
  progressEl.replaceChildren();
  PAGES.forEach((page, i) => {
    const part = document.createElement('span');
    part.className = 'progress__item';
    part.dataset.index = i;
    part.title = page.label;
    progressEl.appendChild(part);
  });
}

function updateUI() {
  const page = PAGES[state.index];
  currentPageEl.textContent = pad(state.index + 1);
  document.title = `${page.label} · University Wrapped 20/10`;
  stage.dataset.page = String(state.index + 1);
  stage.dataset.transition = page.transition;

  [...progressEl.children].forEach((part, i) => {
    part.classList.toggle('is-done', i < state.index);
    part.classList.toggle('is-current', i === state.index);
  });
}

function hideHint() {
  if (state.firstInteraction) return;
  state.firstInteraction = true;
  hintEl.classList.add('is-hidden');
}

async function imageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
    setTimeout(() => finish(false), 900);
  });
}

async function getLocalAsset(index) {
  if (state.localAssetCache.has(index)) return state.localAssetCache.get(index);

  const n = pad(index + 1);
  const candidates = [
    `./assets/pages/${n}.webp`,
    `./assets/pages/${n}.png`,
    `./assets/pages/${n}.jpg`,
  ];

  for (const url of candidates) {
    if (await imageExists(url)) {
      state.localAssetCache.set(index, url);
      return url;
    }
  }

  state.localAssetCache.set(index, null);
  return null;
}

function canvaPageUrl(index) {
  const page = PAGES[index];
  return `${CANVA_SOURCE}&ui=${encodeURIComponent(page.id)}`;
}

function createFallback(index) {
  const wrap = document.createElement('div');
  wrap.className = 'story-fallback';
  wrap.innerHTML = `
    <div class="story-fallback__box">
      <span class="story-fallback__eyebrow">PAGE ${pad(index + 1)}</span>
      <h2>${PAGES[index].label}</h2>
      <p>Canva embed chưa tải được. Bản local sẽ tự được ưu tiên ngay khi snapshot đã có trong <code>assets/pages</code>.</p>
      <a href="${CANVA_PUBLIC_VIEW}" target="_blank" rel="noopener noreferrer">Mở bản Canva</a>
    </div>`;
  return wrap;
}

async function renderPage(card, index) {
  card.classList.add('is-loading');
  card.dataset.page = String(index + 1);
  card.replaceChildren();

  const localAsset = await getLocalAsset(index);

  if (localAsset) {
    const img = document.createElement('img');
    img.alt = PAGES[index].label;
    img.decoding = 'async';
    img.fetchPriority = Math.abs(index - state.index) <= 1 ? 'high' : 'auto';
    img.draggable = false;
    img.src = localAsset;
    img.addEventListener('load', () => card.classList.remove('is-loading'), { once: true });
    img.addEventListener('error', () => {
      state.localAssetCache.delete(index);
      card.classList.remove('is-loading');
      card.replaceChildren(createFallback(index));
    }, { once: true });
    card.appendChild(img);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.title = `Trang ${index + 1}: ${PAGES[index].label}`;
  iframe.src = canvaPageUrl(index);
  iframe.loading = index === 0 ? 'eager' : 'lazy';
  iframe.scrolling = 'no';
  iframe.tabIndex = -1;
  iframe.setAttribute('allowfullscreen', 'allowfullscreen');
  iframe.setAttribute('allow', 'fullscreen');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    card.classList.remove('is-loading');
  };
  iframe.addEventListener('load', finish, { once: true });
  setTimeout(finish, 1800);
  card.appendChild(iframe);
}

function clearTransitionClasses(card) {
  card.classList.remove(
    'transition-next-out', 'transition-next-in',
    'transition-prev-out', 'transition-prev-in'
  );
  card.style.removeProperty('--drag-y');
  card.style.removeProperty('--drag-scale');
  card.classList.remove('is-dragging', 'is-snapping');
}

function playFx(name, direction) {
  transitionFx.className = 'transition-fx';
  // restart CSS animation
  void transitionFx.offsetWidth;
  transitionFx.classList.add(`fx-${name}`, direction > 0 ? 'fx-forward' : 'fx-backward');
}

function softBoundary(direction) {
  if (!stage.animate) return;
  stage.animate(
    direction > 0
      ? [{ transform: 'translateY(0)' }, { transform: 'translateY(-9px)' }, { transform: 'translateY(0)' }]
      : [{ transform: 'translateY(0)' }, { transform: 'translateY(9px)' }, { transform: 'translateY(0)' }],
    { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' }
  );
}

async function goTo(targetIndex, direction) {
  if (state.busy) return;
  if (targetIndex < 0 || targetIndex >= PAGES.length) {
    softBoundary(direction);
    return;
  }

  state.busy = true;
  hideHint();

  const target = PAGES[targetIndex];
  stage.dataset.transition = target.transition;
  await Promise.race([renderPage(incomingCard, targetIndex), sleep(220)]);

  clearTransitionClasses(currentCard);
  clearTransitionClasses(incomingCard);

  incomingCard.classList.add(direction > 0 ? 'transition-next-in' : 'transition-prev-in');
  currentCard.classList.add(direction > 0 ? 'transition-next-out' : 'transition-prev-out');
  playFx(target.transition, direction);

  if (navigator.vibrate) navigator.vibrate(7);

  const duration = ['paper', 'split', 'finale'].includes(target.transition) ? 820 : 700;
  await sleep(duration);

  currentCard.replaceChildren(...incomingCard.childNodes);
  incomingCard.replaceChildren();
  clearTransitionClasses(currentCard);
  clearTransitionClasses(incomingCard);
  currentCard.classList.remove('is-loading');
  incomingCard.classList.remove('is-loading');

  state.index = targetIndex;
  updateUI();
  state.busy = false;

  // Warm both adjacent pages so swipe feels instantaneous.
  for (const nextIndex of [targetIndex - 1, targetIndex + 1]) {
    if (nextIndex >= 0 && nextIndex < PAGES.length) getLocalAsset(nextIndex);
  }
}

const next = () => goTo(state.index + 1, 1);
const prev = () => goTo(state.index - 1, -1);

prevZone.addEventListener('click', prev);
nextZone.addEventListener('click', next);

window.addEventListener('keydown', (event) => {
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) {
    event.preventDefault();
    next();
  } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    prev();
  } else if (event.key === 'Home') {
    event.preventDefault();
    goTo(0, -1);
  } else if (event.key === 'End') {
    event.preventDefault();
    goTo(PAGES.length - 1, 1);
  }
});

let wheelLocked = false;
window.addEventListener('wheel', (event) => {
  if (wheelLocked || Math.abs(event.deltaY) < 18) return;
  wheelLocked = true;
  event.deltaY > 0 ? next() : prev();
  setTimeout(() => { wheelLocked = false; }, 820);
}, { passive: true });

stage.addEventListener('pointerdown', (event) => {
  if (state.busy || event.pointerType === 'mouse') return;
  state.pointer = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    lastY: event.clientY,
  };
  stage.setPointerCapture?.(event.pointerId);
  currentCard.classList.add('is-dragging');
});

stage.addEventListener('pointermove', (event) => {
  if (!state.pointer || event.pointerId !== state.pointer.id || state.busy) return;
  const dy = event.clientY - state.pointer.y;
  state.pointer.lastY = event.clientY;
  const resisted = Math.sign(dy) * Math.min(Math.abs(dy) * 0.72, window.innerHeight * 0.18);
  const scale = 1 - Math.min(Math.abs(dy) / window.innerHeight, 0.022);
  currentCard.style.setProperty('--drag-y', `${resisted}px`);
  currentCard.style.setProperty('--drag-scale', scale.toFixed(4));
});

function finishPointer(event, cancelled = false) {
  if (!state.pointer || event.pointerId !== state.pointer.id) return;
  const dy = event.clientY - state.pointer.y;
  const dx = event.clientX - state.pointer.x;
  state.pointer = null;

  currentCard.classList.remove('is-dragging');
  currentCard.classList.add('is-snapping');
  currentCard.style.setProperty('--drag-y', '0px');
  currentCard.style.setProperty('--drag-scale', '1');
  setTimeout(() => currentCard.classList.remove('is-snapping'), 260);

  if (cancelled || Math.abs(dy) < 52 || Math.abs(dy) < Math.abs(dx) * 1.05) return;
  dy < 0 ? next() : prev();
}

stage.addEventListener('pointerup', (event) => finishPointer(event));
stage.addEventListener('pointercancel', (event) => finishPointer(event, true));

function syncViewport() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
window.addEventListener('resize', syncViewport, { passive: true });
window.addEventListener('orientationchange', syncViewport, { passive: true });
syncViewport();

buildProgress();
updateUI();
renderPage(currentCard, 0);
getLocalAsset(1);
