const DESIGN_ID = 'DAHYdLjF2Pw';
const CANVA_EMBED = `https://www.canva.com/design/${DESIGN_ID}/view?embed`;
const CANVA_WATCH = 'https://www.canva.com/design/DAHYdLjF2Pw/xvxWpVg1U-OThZSmDm5U7w/watch?utm_content=DAHYdLjF2Pw&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h11df737bf3';

const host = document.getElementById('canvaHost');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const loading = document.getElementById('loading');
const fallbackLink = document.getElementById('fallbackLink');

let started = false;
let iframe = null;
let loadTimer = null;

function buildIframe() {
  iframe = document.createElement('iframe');
  iframe.title = 'WRAPPED 20/10 — Canva';
  iframe.src = CANVA_EMBED;
  iframe.allow = 'autoplay; fullscreen; clipboard-read; clipboard-write';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('webkitallowfullscreen', '');
  iframe.setAttribute('mozallowfullscreen', '');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.setAttribute('loading', 'eager');

  iframe.addEventListener('load', () => {
    window.clearTimeout(loadTimer);
    loading.hidden = true;
    fallbackLink.hidden = true;
    iframe.focus({ preventScroll: true });
  }, { once: true });

  host.replaceChildren(iframe);
}

function startExperience() {
  if (started) return;
  started = true;

  // A deliberate user gesture is required by mobile browsers before audio can play.
  // Canva itself owns the original page animation, timing and soundtrack; the site
  // no longer recreates those from compressed screenshots.
  startButton.disabled = true;
  loading.hidden = false;
  buildIframe();

  requestAnimationFrame(() => {
    startScreen.classList.add('is-hidden');
  });

  // If Canva is blocked by a network/privacy setting, expose the exact watch link.
  loadTimer = window.setTimeout(() => {
    loading.hidden = true;
    fallbackLink.href = CANVA_WATCH;
    fallbackLink.hidden = false;
  }, 9000);
}

startButton.addEventListener('click', startExperience, { passive: true });
startButton.addEventListener('pointerup', () => {
  if (!started) startExperience();
}, { passive: true });

window.addEventListener('pageshow', () => {
  if (started && iframe) iframe.focus({ preventScroll: true });
});
