const DESIGN_ID = 'DAHYdLjF2Pw';
const CANVA_SOURCE = `https://www.canva.com/design/${DESIGN_ID}/view?embed`;
const CANVA_PUBLIC_VIEW = 'https://www.canva.com/d/tXF_6oqEOdDb1Xk';

// Trang 15 trong Canva hiện đang trống, nên website dùng 14 trang có nội dung.
const PAGES = [
  { id: 'PB1ZMt04MnhDVstj', label: 'University Wrapped' },
  { id: 'PB8KNlpgcxJrvLYM', label: 'Năm nhất – năm ba' },
  { id: 'PByKJysHmqP8GKGm', label: 'Học phí 4 năm' },
  { id: 'PBdDPlTB6RwY8VSz', label: 'Top 5 môn buồn ngủ' },
  { id: 'PBC4CBp8brmcwbqY', label: 'Mood 6h sáng' },
  { id: 'PBhCm5ZBRX9BJLxC', label: 'Giao tiếp kinh doanh' },
  { id: 'PBvPFDcVb3JwyrKt', label: 'Python' },
  { id: 'PBZTJXrLCCgMkvYQ', label: 'You know?' },
  { id: 'PBT96kHGqgZF34lk', label: 'Cheatsheet Văn hóa' },
  { id: 'PBZfTPLwlSmzFSsH', label: 'Thầy Khánh' },
  { id: 'PBxwWrMpMkDSs7NF', label: 'PGS, TS. Trần Văn Nam' },
  { id: 'PB15Dl3bkrkwQnDT', label: 'Thầy Sơn Tùng & thầy Tô Trung Thành' },
  { id: 'PBnj6PFJhg7fjhQN', label: 'Sang Phan' },
  { id: 'PBlDhgXnY2PmKSy5', label: 'Chị Thỏ Non' },
];

const state = {
  index: 0,
  busy: false,
  localAssetCache: new Map(),
  firstInteraction: false,
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

const pad = (n) => String(n).padStart(2, '0');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

totalPagesEl.textContent = pad(PAGES.length);

function buildProgress() {
  progressEl.replaceChildren();
  PAGES.forEach((_, i) => {
    const part = document.createElement('span');
    part.className = 'progress__item';
    part.dataset.index = i;
    progressEl.appendChild(part);
  });
}

function updateUI() {
  currentPageEl.textContent = pad(state.index + 1);
  document.title = `${PAGES[state.index].label} · University Wrapped 20/10`;

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
    setTimeout(() => finish(false), 700);
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
    // Nếu người dùng upload ảnh export từ Canva vào repo, web tự ưu tiên ảnh local.
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
  // Canva dùng ui=<page id> để deep-link đến đúng page trong design.
  return `${CANVA_SOURCE}&ui=${encodeURIComponent(page.id)}`;
}

function createFallback() {
  const wrap = document.createElement('div');
  wrap.className = 'story-fallback';
  wrap.innerHTML = `
    <div class="story-fallback__box">
      <h2>Chưa tải được trang Canva</h2>
      <p>Nếu Canva chưa bật Embed, hãy mở thiết kế → Share → See all → Embed → Embed một lần. Website sẽ giữ nguyên thiết kế và tự cập nhật theo Canva.</p>
      <a href="${CANVA_PUBLIC_VIEW}" target="_blank" rel="noopener noreferrer">Mở bản Canva</a>
    </div>`;
  return wrap;
}

async function renderPage(card, index) {
  card.classList.add('is-loading');
  card.replaceChildren();

  const localAsset = await getLocalAsset(index);

  if (localAsset) {
    const img = document.createElement('img');
    img.alt = PAGES[index].label;
    img.decoding = 'async';
    img.draggable = false;
    img.src = localAsset;
    img.addEventListener('load', () => card.classList.remove('is-loading'), { once: true });
    img.addEventListener('error', () => {
      card.classList.remove('is-loading');
      card.replaceChildren(createFallback());
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
  setTimeout(finish, 1500);

  card.appendChild(iframe);
}

function clearTransitionClasses(card) {
  card.classList.remove(
    'transition-next-out',
    'transition-next-in',
    'transition-prev-out',
    'transition-prev-in'
  );
}

function softBoundary(direction) {
  if (!stage.animate) return;
  stage.animate(
    direction > 0
      ? [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }]
      : [{ transform: 'translateY(0)' }, { transform: 'translateY(8px)' }, { transform: 'translateY(0)' }],
    { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }
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

  await Promise.race([renderPage(incomingCard, targetIndex), sleep(180)]);

  clearTransitionClasses(currentCard);
  clearTransitionClasses(incomingCard);

  incomingCard.style.opacity = '';
  incomingCard.classList.add(direction > 0 ? 'transition-next-in' : 'transition-prev-in');
  currentCard.classList.add(direction > 0 ? 'transition-next-out' : 'transition-prev-out');

  if (navigator.vibrate) navigator.vibrate(7);

  await sleep(700);

  // Giữ iframe/ảnh đã load, chỉ chuyển node sang card chính để tránh flash trắng.
  currentCard.replaceChildren(...incomingCard.childNodes);
  incomingCard.replaceChildren();
  clearTransitionClasses(currentCard);
  clearTransitionClasses(incomingCard);
  currentCard.classList.remove('is-loading');
  incomingCard.classList.remove('is-loading');
  incomingCard.style.opacity = '';

  state.index = targetIndex;
  updateUI();
  state.busy = false;

  // Hâm nóng ảnh local trang kế tiếp nếu có.
  const next = targetIndex + direction;
  if (next >= 0 && next < PAGES.length) getLocalAsset(next);
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
  setTimeout(() => { wheelLocked = false; }, 800);
}, { passive: true });

let pointerStartY = null;
let pointerStartX = null;
let pointerId = null;

stage.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse') return;
  pointerId = event.pointerId;
  pointerStartY = event.clientY;
  pointerStartX = event.clientX;
  stage.setPointerCapture?.(pointerId);
});

stage.addEventListener('pointerup', (event) => {
  if (pointerStartY == null || pointerStartX == null) return;
  const dy = event.clientY - pointerStartY;
  const dx = event.clientX - pointerStartX;

  pointerStartY = null;
  pointerStartX = null;

  if (Math.abs(dy) < 46 || Math.abs(dy) < Math.abs(dx) * 1.1) return;
  dy < 0 ? next() : prev();
});

stage.addEventListener('pointercancel', () => {
  pointerStartY = null;
  pointerStartX = null;
});

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
