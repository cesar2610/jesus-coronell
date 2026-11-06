import { ALBUM, POPULAR } from './data_catalog.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const externalAttrs = 'target="_blank" rel="noopener noreferrer"';

const ICON = { youtube:'youtube.svg', spotify:'spotify.svg', apple:'apple-music.svg' };
const icon = name => `<img src="/public/images/platforms/${ICON[name]}" alt="" aria-hidden="true">`;
const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';

/* Fuente de reproducción de cada canción: YouTube > Spotify (si hay spotifyId) > Apple Music */
function sourceFor(track) {
  const yt = track.youtube.includes('watch?v=') ? new URL(track.youtube).searchParams.get('v') : null;
  if (yt) return { type: 'youtube', id: yt };
  if (track.spotifyId) return { type: 'spotify', id: track.spotifyId };
  const m = track.apple.match(/\/album\/[^/]+\/(\d+)\?i=(\d+)/);
  return { type: 'apple', album: m ? m[1] : ALBUM.appleId, track: m ? m[2] : null };
}
function embedUrl(src) {
  if (src.type === 'youtube') return `https://www.youtube.com/embed/${encodeURIComponent(src.id)}?rel=0&playsinline=1&autoplay=1&origin=${encodeURIComponent(location.origin)}`;
  if (src.type === 'spotify') return `https://open.spotify.com/embed/track/${src.id}?utm_source=generator`;
  return `https://embed.music.apple.com/us/album/${src.album}${src.track ? `?i=${src.track}` : ''}`;
}

function renderTracks() {
  const target = $('#track-list');
  if (!target) return;
  target.innerHTML = ALBUM.tracks.map((track, i) => `
    <article class="track-row ${track.featured ? 'is-featured' : ''}" data-index="${i}">
      <span class="track-number">${track.n}</span>
      <div class="track-meta"><strong>${track.title}</strong><small>${track.subtitle || 'CONFIANDO'}</small></div>
      <time datetime="PT${track.duration.replace(':', 'M')}S">${track.duration}</time>
      <div class="track-actions" aria-label="Acciones para ${track.title}">
        <button class="track-play" type="button" data-play="${i}" aria-label="Reproducir ${track.title} aquí mismo">${PLAY_SVG}<span>Reproducir</span></button>
        <a class="track-action track-icon" href="${track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : track.spotify}" ${externalAttrs} aria-label="${track.title} en Spotify (nueva pestaña)" title="Abrir en Spotify">${icon('spotify')}</a>
        <a class="track-action track-icon" href="${track.apple}" ${externalAttrs} aria-label="${track.title} en Apple Music (nueva pestaña)" title="Abrir en Apple Music">${icon('apple')}</a>
      </div>
    </article>`).join('');
}

function renderPopular() {
  const target = $('#popular-list');
  if (!target) return;
  target.innerHTML = POPULAR.map(([n, title, plays]) => `<div><span>${n}</span><strong>${title}</strong>${plays && plays !== '—' ? `<b>${plays}</b>` : '<b></b>'}</div>`).join('');
}

function bindMediaStation() {
  const frame = $('#youtube-player');
  const title = $('#player-title');
  const meta = $('#player-meta');
  const station = $('#media-station');
  const holder = $('.youtube-frame');
  if (!frame || !title || !meta || !station) return;
  let current = '';

  /* Un solo reproductor reutilizado: cambia la fuente, no abre pestañas ni acumula iframes */
  const load = (url, t, m, audio, scroll) => {
    holder.classList.toggle('is-audio', audio);
    if (url !== current) { current = url; frame.src = url; }
    title.textContent = t; meta.textContent = m;
    frame.title = `Jesús Coronell — ${t}`;
    if (scroll) station.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  $('#track-list')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-play]');
    if (!btn) return;
    const track = ALBUM.tracks[Number(btn.dataset.play)];
    const src = sourceFor(track);
    $$('.track-row').forEach(r => r.classList.remove('is-playing'));
    btn.closest('.track-row').classList.add('is-playing');
    load(embedUrl(src), track.title, `Confiando · 2025${src.type === 'youtube' ? '' : ' · Apple Music'}`, src.type !== 'youtube', true);
  });

  $$('.video-selector').forEach(button => button.addEventListener('click', () => {
    $$('.video-selector').forEach(i => i.classList.remove('is-active'));
    button.classList.add('is-active');
    load(embedUrl({ type: 'youtube', id: button.dataset.videoId }), button.dataset.videoTitle, button.dataset.videoMeta, false, false);
  }));

  const first = $('.video-selector.is-active');
  if (first) load(embedUrl({ type: 'youtube', id: first.dataset.videoId }).replace('autoplay=1', 'autoplay=0'), first.dataset.videoTitle, first.dataset.videoMeta, false, false);
}

/* Videos de la sección "La fe también se vive": se reproducen dentro de la página */
function bindVideos() {
  const stage = $('#live-stage');
  if (!stage) return;
  $$('[data-yt]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.yt;
    stage.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&autoplay=1&origin=${encodeURIComponent(location.origin)}" title="${btn.dataset.ytTitle}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    $('#live-title').textContent = btn.dataset.ytTitle;
    $('#live-text').textContent = btn.dataset.ytText;
    $('#live-link').href = `https://www.youtube.com/watch?v=${id}`;
    $('#live-feature').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
}

function bindNavigation() {
  const menu = $('.menu-button');
  const nav = $('#main-navigation');
  if (!menu || !nav) return;
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    menu.setAttribute('aria-label', !open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('nav-open', !open);
  });
  $$('#main-navigation a').forEach(link => link.addEventListener('click', () => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('nav-open');
  }));
}

function bindGallery() {
  const dialog = $('#gallery-dialog');
  const image = $('#gallery-dialog-image');
  const caption = $('#gallery-dialog-caption');
  const close = $('.gallery-dialog-close');
  if (!dialog || !image || !caption || !close) return;

  const hide = () => dialog.close();
  $$('[data-gallery-image]').forEach(item => item.addEventListener('click', () => {
    image.src = item.dataset.galleryImage;
    image.alt = item.dataset.galleryAlt;
    caption.textContent = item.dataset.galleryAlt;
    dialog.showModal();
    close.focus();
  }));
  close.addEventListener('click', hide);
  dialog.addEventListener('click', event => { if (event.target === dialog) hide(); });
}

function bindReveal() {
  const items = $$('.reveal, .reveal-scale');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => observer.observe(el));
}

function bindHeader() {
  const header = $('#site-header');
  const progress = $('.scroll-progress span');
  const intro = $('#site-intro');
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max ? y / max : 0})`;
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  const introLogo = intro?.querySelector('.intro-logo-stage');
  const finishIntro = () => {
    if (!intro || intro.dataset.finished === '1') return;
    intro.dataset.finished = '1';
    introLogo?.classList.add('is-moving');
    window.setTimeout(() => intro.classList.add('is-hidden'), 1120);
  };

  window.addEventListener('load', () => {
    window.setTimeout(finishIntro, 520);
  }, { once: true });
  window.setTimeout(finishIntro, 1500);
  update();
}

function bindMotion() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('reduced-motion');

  const heroImage = $('.hero-photo img');
  if (!reduce && heroImage) {
    window.addEventListener('scroll', () => {
      const offset = Math.min(window.scrollY * 0.08, 55);
      heroImage.style.transform = `translate3d(0, ${offset}px, 0) scale(1.02)`;
    }, { passive: true });
  }
}

function bindCurrentSection() {
  const links = $$('#main-navigation a');
  const sections = links.map(link => $(link.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
}

/* Medición: cuántas personas pasan de la página a cada plataforma */
function trackEvent(name, params) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    else if (typeof window.plausible === 'function') window.plausible(name, { props: params });
    else (window.dataLayer = window.dataLayer || []).push({ event: name, ...params });
  } catch (_) { /* la medición nunca debe romper la página */ }
}
function platformOf(href) {
  if (href.startsWith('mailto:')) return 'correo';
  if (href.startsWith('tel:')) return 'telefono';
  let host = '';
  try { host = new URL(href, location.href).hostname; } catch (_) { return 'otro'; }
  if (host.includes('spotify')) return 'spotify';
  if (host.includes('apple')) return 'apple_music';
  if (host.includes('youtube') || host === 'youtu.be') return 'youtube';
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('tiktok')) return 'tiktok';
  return 'otro';
}
function bindExternalTracking() {
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (link && (link.target === '_blank' || /^(mailto|tel):/.test(link.getAttribute('href')))) {
      trackEvent('click_plataforma', {
        plataforma: platformOf(link.getAttribute('href')),
        lugar: link.closest('[id]')?.id || link.closest('header,footer,section')?.className?.split(' ')[0] || 'pagina',
        destino: link.getAttribute('href').slice(0, 120)
      });
    }
    const play = event.target.closest('[data-play],[data-yt],.video-selector');
    if (play) trackEvent('reproducir_en_pagina', { contenido: play.dataset.ytTitle || play.dataset.videoTitle || ALBUM.tracks[Number(play.dataset.play)]?.title || '' });
  });
}

/* Barra "Escúchalo en…" para móvil: aparece al bajar del inicio */
function bindListenBar() {
  const bar = $('#listen-bar');
  if (!bar) return;
  const update = () => bar.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.7);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

renderTracks();
renderPopular();
bindMediaStation();
bindVideos();
bindNavigation();
bindGallery();
bindHeader();
bindMotion();
bindReveal();
bindCurrentSection();
bindExternalTracking();
bindListenBar();
