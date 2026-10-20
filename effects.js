(() => {
  const stage = document.getElementById('stage');
  const incoming = document.getElementById('incomingCard');
  if (!stage || !incoming || !('animate' in Element.prototype)) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const supported = new Set(['timeline', 'ranking', 'wipe', 'split', 'finale', 'photo']);
  let activeOverlay = null;
  let runToken = 0;

  const patterns = {
    timeline: [
      { x: 0, y: 0, w: 1, h: 0.34 },
      { x: 0, y: 0.34, w: 1, h: 0.33 },
      { x: 0, y: 0.67, w: 1, h: 0.33 },
    ],
    ranking: Array.from({ length: 5 }, (_, i) => ({ x: 0, y: i / 5, w: 1, h: 1 / 5 })),
    wipe: Array.from({ length: 6 }, (_, i) => ({ x: i / 6, y: 0, w: 1 / 6, h: 1 })),
    split: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    finale: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    photo: [
      { x: 0, y: 0, w: 1, h: 0.25 },
      { x: 0, y: 0.25, w: 1, h: 0.25 },
      { x: 0, y: 0.5, w: 1, h: 0.25 },
      { x: 0, y: 0.75, w: 1, h: 0.25 },
    ],
  };

  function clearOverlay() {
    if (activeOverlay) activeOverlay.remove();
    activeOverlay = null;
  }

  function createFragment(rect, src, bounds) {
    const wrapper = document.createElement('div');
    const left = rect.x * bounds.width;
    const top = rect.y * bounds.height;
    const width = rect.w * bounds.width;
    const height = rect.h * bounds.height;

    Object.assign(wrapper.style, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width + 0.6}px`,
      height: `${height + 0.6}px`,
      overflow: 'hidden',
      pointerEvents: 'none',
      willChange: 'transform, opacity, filter',
      backfaceVisibility: 'hidden',
    });

    const image = document.createElement('img');
    image.src = src;
    image.alt = '';
    image.draggable = false;
    Object.assign(image.style, {
      position: 'absolute',
      left: `${-left}px`,
      top: `${-top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      maxWidth: 'none',
      objectFit: 'fill',
      pointerEvents: 'none',
      userSelect: 'none',
    });

    wrapper.appendChild(image);
    return wrapper;
  }

  function framesFor(type, index, direction, bounds) {
    const sign = direction > 0 ? 1 : -1;
    const px = Math.min(130, bounds.width * 0.32);
    const py = Math.min(120, bounds.height * 0.14);

    if (type === 'timeline') {
      const side = index % 2 === 0 ? 1 : -1;
      return [
        { opacity: 0, transform: `translate3d(${side * px}px, ${sign * 24}px, 0) scale(.985)`, filter: 'blur(5px)' },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)', filter: 'blur(0)' },
      ];
    }
    if (type === 'ranking') {
      const side = index % 2 === 0 ? 1 : -1;
      return [
        { opacity: 0, transform: `translate3d(${side * px}px,0,0) scale(.96)` },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' },
      ];
    }
    if (type === 'wipe') {
      const vertical = index % 2 === 0 ? 1 : -1;
      return [
        { opacity: .25, transform: `translate3d(0,${vertical * py}px,0) scaleY(.92)`, filter: 'blur(3px)' },
        { opacity: 1, transform: 'translate3d(0,0,0) scaleY(1)', filter: 'blur(0)' },
      ];
    }
    if (type === 'split') {
      const side = index === 0 ? -1 : 1;
      return [
        { opacity: 0, transform: `translate3d(${side * px}px,0,0) rotateY(${side * -7}deg)` },
        { opacity: 1, transform: 'translate3d(0,0,0) rotateY(0deg)' },
      ];
    }
    if (type === 'finale') {
      const x = index % 2 === 0 ? -1 : 1;
      const y = index < 2 ? -1 : 1;
      return [
        { opacity: 0, transform: `translate3d(${x * 44}px,${y * 44}px,0) scale(.82) rotate(${x * y * 2.5}deg)`, filter: 'blur(5px) brightness(1.3)' },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', filter: 'blur(0) brightness(1)' },
      ];
    }
    return [
      { opacity: 0, transform: `translate3d(0,${sign * (24 + index * 4)}px,0) scale(1.045)`, filter: 'blur(4px) saturate(1.2)' },
      { opacity: 1, transform: 'translate3d(0,0,0) scale(1)', filter: 'blur(0) saturate(1)' },
    ];
  }

  function runFragments() {
    const isNext = incoming.classList.contains('transition-next-in');
    const isPrev = incoming.classList.contains('transition-prev-in');
    if (!isNext && !isPrev) return;

    const type = stage.dataset.transition;
    if (!supported.has(type)) return;

    const image = incoming.querySelector('img');
    if (!image?.src) return;

    const token = ++runToken;
    clearOverlay();

    const bounds = stage.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = `fragment-overlay fragment-overlay--${type}`;
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '7',
      overflow: 'hidden',
      pointerEvents: 'none',
      perspective: '1400px',
      contain: 'layout paint',
    });
    stage.appendChild(overlay);
    activeOverlay = overlay;

    const direction = isNext ? 1 : -1;
    const rects = patterns[type];
    const duration = type === 'finale' ? 760 : type === 'split' ? 650 : 560;

    const animations = rects.map((rect, index) => {
      const fragment = createFragment(rect, image.currentSrc || image.src, bounds);
      overlay.appendChild(fragment);
      const delay = type === 'ranking' ? index * 46
        : type === 'timeline' ? index * 70
        : type === 'wipe' ? index * 26
        : type === 'finale' ? index * 48
        : index * 28;
      return fragment.animate(framesFor(type, index, direction, bounds), {
        duration,
        delay,
        fill: 'both',
        easing: 'cubic-bezier(.22,1,.36,1)',
      });
    });

    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (token === runToken) clearOverlay();
    });

    setTimeout(() => {
      if (token === runToken) clearOverlay();
    }, duration + rects.length * 75 + 160);
  }

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.type === 'attributes' && m.attributeName === 'class')) {
      runFragments();
    }
  });
  observer.observe(incoming, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('resize', clearOverlay, { passive: true });
  window.addEventListener('orientationchange', clearOverlay, { passive: true });
})();
