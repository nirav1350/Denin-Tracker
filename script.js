/**
 * ═══════════════════════════════════════════════
 * MEDIA SHOWCASE — Script (Images & Videos only)
 * ═══════════════════════════════════════════════
 *
 * 1. Scroll fade-in (IntersectionObserver)
 * 2. Lightbox with navigation
 * 3. Video play/pause toggle
 * 4. Back to top
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ─────────────────────────────────────────────
     1. SCROLL FADE-IN
  ───────────────────────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-in');

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  fadeEls.forEach(el => fadeObserver.observe(el));

  /* ─────────────────────────────────────────────
     2. LIGHTBOX
  ───────────────────────────────────────────── */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lbItems = document.querySelectorAll('[data-lightbox]');
  let lbIndex = 0;

  const openLB = (i) => {
    lbIndex = i;
    lightboxImg.src = lbItems[i].getAttribute('data-lightbox');
    lightboxCounter.textContent = `${i + 1} / ${lbItems.length}`;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeLB = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 350);
  };

  const navLB = (dir) => {
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = lbItems[lbIndex].getAttribute('data-lightbox');
      lightboxImg.style.opacity = '1';
      lightboxCounter.textContent = `${lbIndex + 1} / ${lbItems.length}`;
    }, 180);
  };

  lbItems.forEach((item, i) => item.addEventListener('click', () => openLB(i)));
  lightboxClose.addEventListener('click', closeLB);
  lightboxPrev.addEventListener('click', () => navLB(-1));
  lightboxNext.addEventListener('click', () => navLB(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('.lightbox-content')) closeLB();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') navLB(-1);
    if (e.key === 'ArrowRight') navLB(1);
  });

  /* ─────────────────────────────────────────────
     3. VIDEO PLAY / PAUSE
  ───────────────────────────────────────────── */
  document.querySelectorAll('.video-card-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = overlay.closest('.video-card');
      if (!card) return;

      const video = card.querySelector('video');
      const icon = overlay.querySelector('i');
      const btn = overlay.querySelector('.play-btn');

      if (!video) return;

      if (video.paused) {
        // Play and handle the returned promise to avoid errors
        video.play().then(() => {
          icon.classList.remove('fa-play');
          icon.classList.add('fa-pause');
          overlay.classList.add('is-playing');
        }).catch(err => {
          console.error("Video playback omitted:", err);
        });
      } else {
        video.pause();
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        overlay.classList.remove('is-playing');
      }
    });
  });

  /* ─────────────────────────────────────────────
     4. BACK TO TOP
  ───────────────────────────────────────────── */
  const btt = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    btt.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btt.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
