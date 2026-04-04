import { animate, spring } from 'motion';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const certDocs = document.querySelectorAll('.cert-doc');
const certDetailTitle = document.querySelector('[data-cert-detail-title]');
const certDetailIssuer = document.querySelector('[data-cert-detail-issuer]');
const certDetailSummary = document.querySelector('[data-cert-detail-summary]');
const certDetailLink = document.querySelector('[data-cert-detail-link]');
const certDetailImage = document.querySelector('[data-cert-detail-image]');
const certDetail = document.querySelector('[data-cert-detail]');
let activeCertDoc = null;

const renderCertificateDetail = (doc) => {
  if (!doc) {
    return;
  }

  if (certDetailTitle) {
    certDetailTitle.textContent = doc.dataset.certTitle || '';
  }

  if (certDetailIssuer) {
    certDetailIssuer.textContent = doc.dataset.certIssuer ? `Issuer: ${doc.dataset.certIssuer}` : '';
  }

  if (certDetailSummary) {
    certDetailSummary.textContent = doc.dataset.certSummary || '';
  }

  if (certDetailLink && doc.dataset.certLink) {
    certDetailLink.setAttribute('href', doc.dataset.certLink);
  }

  if (certDetailImage) {
    const thumbImage = doc.querySelector('img');
    if (thumbImage && thumbImage.getAttribute('src')) {
      certDetailImage.setAttribute('src', thumbImage.getAttribute('src'));
    } else if (doc.dataset.certImage) {
      certDetailImage.setAttribute('src', doc.dataset.certImage);
    }
  }

  if (!prefersReducedMotion && certDetail) {
    animate(certDetail, { opacity: [0.82, 1], transform: ['translateX(10px)', 'translateX(0px)'] }, { duration: 0.32, easing: 'ease-out' });
  }
};

const activateCertificate = (targetDoc) => {
  if (!targetDoc) {
    return;
  }

  certDocs.forEach((doc) => {
    const isActive = doc === targetDoc;
    doc.classList.toggle('is-active', isActive);
    doc.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  activeCertDoc = targetDoc;
  renderCertificateDetail(targetDoc);
};

certDocs.forEach((doc) => {
  doc.addEventListener('click', () => activateCertificate(doc));
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const musicToggleButton = document.querySelector('[data-music-toggle]');

const initMusicToggle = () => {
  if (!musicToggleButton) {
    return;
  }
  const audioEl = document.getElementById('bg-audio');
  let isPlaying = false;

  const setMusicState = (playing) => {
    isPlaying = playing;
    musicToggleButton.classList.toggle('is-playing', playing);
    musicToggleButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
    const labelEl = musicToggleButton.querySelector('.music-label');
    if (labelEl) {
      labelEl.textContent = playing ? 'Pause Music' : 'Play Music';
    }
    musicToggleButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  };

  const playAudio = async () => {
    if (audioEl) {
      try {
        await audioEl.play();
        setMusicState(true);
      } catch {
        setMusicState(false);
      }
      return;
    }

    // No audio element available — keep UI toggle but don't attempt fallback audio generation
    setMusicState(false);
  };

  const pauseAudio = () => {
    if (audioEl) {
      audioEl.pause();
    }
    setMusicState(false);
  };

  musicToggleButton.addEventListener('click', async () => {
    if (isPlaying) {
      pauseAudio();
      return;
    }

    await playAudio();
  });
};

const initSmoothScrollStack = () => {
  if (prefersReducedMotion) {
    return null;
  }

  document.documentElement.classList.add('has-scroll-stack');

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const lenis = new Lenis({
    duration: isCoarsePointer ? 0.95 : 1.15,
    smoothWheel: true,
    syncTouch: true,
    touchMultiplier: 1.05,
    wheelMultiplier: isCoarsePointer ? 0.9 : 1,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') {
        return;
      }

      const target = document.querySelector(hash);
      if (!target) {
        return;
      }

      event.preventDefault();
      lenis.scrollTo(target, {
        offset: -14,
        duration: isCoarsePointer ? 0.9 : 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
    });
  });

  return lenis;
};

const initScrollReveal = () => {
  const revealBlocks = gsap.utils.toArray('.reveal');
  if (revealBlocks.length === 0) {
    return;
  }

  if (prefersReducedMotion) {
    revealBlocks.forEach((block) => block.classList.add('is-inview'));
    return;
  }

  revealBlocks.forEach((block) => {
    ScrollTrigger.create({
      trigger: block,
      start: 'top 84%',
      end: 'bottom 16%',
      onEnter: () => block.classList.add('is-inview'),
      onLeave: () => block.classList.remove('is-inview'),
      onEnterBack: () => block.classList.add('is-inview'),
      onLeaveBack: () => block.classList.remove('is-inview'),
    });
  });
};

const initiallyActiveDoc = document.querySelector('.cert-doc.is-active') || certDocs[0];
if (initiallyActiveDoc) {
  activateCertificate(initiallyActiveDoc);
}

const initSkillsScrollReveal = () => {
  const skillCards = document.querySelectorAll('#skills .skill-card');

  if (skillCards.length === 0) {
    return;
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    skillCards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -12% 0px',
    }
  );

  skillCards.forEach((card, index) => {
    const revealDelay = Math.min(index * 70, 280);
    card.classList.add('is-observed');
    card.style.setProperty('--reveal-delay', `${revealDelay}ms`);
    observer.observe(card);
  });
};

const runAfterAssetsReady = (callback) => {
  const start = () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.finally(callback);
      return;
    }

    callback();
  };

  if (document.readyState === 'complete') {
    start();
    return;
  }

  window.addEventListener('load', start, { once: true });
};

const runHeroAnimations = () => {
  if (prefersReducedMotion) {
    return;
  }

  const heroCopy = document.querySelector('[data-hero-copy]');
  const heroTitle = document.querySelector('[data-hero-title]');
  const heroCard = document.querySelector('[data-hero-card]');
  const heroAvatarWrap = document.querySelector('[data-hero-avatar-wrap]');
  const heroStage = document.querySelector('.hero-stage');
  const orbits = document.querySelectorAll('.hero-orbit');

  if (heroCopy) {
    animate(heroCopy, { opacity: [0, 1], transform: ['translateY(26px)', 'translateY(0px)'] }, { duration: 0.7, easing: 'ease-out' });
  }

  if (heroCard) {
    animate(
      heroCard,
      { opacity: [0, 1], transform: ['translateY(24px) scale(0.95)', 'translateY(0px) scale(1)'] },
      { duration: 0.85, delay: 0.2, easing: 'ease-out' }
    );
  }

  if (heroAvatarWrap) {
    animate(
      heroAvatarWrap,
      { opacity: [0, 1], transform: ['translateY(30px) scale(0.95)', 'translateY(0px) scale(1)'] },
      { duration: 0.9, delay: 0.16, easing: 'ease-out' }
    );
  }

  if (heroTitle) {
    const titleText = heroTitle.textContent ? heroTitle.textContent.trim() : '';
    if (titleText.length > 0) {
      const titleParts = titleText.split(/\s+/);
      const secondLine = titleParts.pop() || '';
      const firstLine = titleParts.join(' ');

      const renderLine = (lineText, offset) =>
        lineText
          .split('')
          .map((character, index) => {
            const safeCharacter = character === ' ' ? '&nbsp;' : character;
            return `<span class="hero-letter" style="--i:${offset + index}">${safeCharacter}</span>`;
          })
          .join('');

      heroTitle.classList.add('is-typing');
      heroTitle.innerHTML = `<span class="hero-name" aria-label="${titleText}"><span class="hero-line">${renderLine(firstLine, 0)}</span><span class="hero-line">${renderLine(secondLine, firstLine.length + 2)}<span class="hero-cursor" aria-hidden="true">I</span></span></span>`;

      window.setTimeout(() => {
        heroTitle.classList.remove('is-typing');
        heroTitle.classList.add('is-typed');
      }, 1200 + titleText.length * 85);
    }

    animate(heroTitle, { letterSpacing: ['0.08em', '0em'] }, { duration: 0.8, delay: 0.25, easing: 'ease-out' });
  }

  orbits.forEach((orbit, index) => {
    animate(
      orbit,
      { rotate: [0, index % 2 === 0 ? 360 : -360] },
      { duration: index % 2 === 0 ? 20 : 24, repeat: Infinity, easing: 'linear' }
    );
  });

  if (heroStage && heroCard && heroAvatarWrap) {
    heroStage.addEventListener('pointermove', (event) => {
      const bounds = heroStage.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width - 0.5;
      const py = (event.clientY - bounds.top) / bounds.height - 0.5;

      animate(
        heroCard,
        {
          transform: `translate(${px * 10}px, ${py * 8}px) rotateX(${py * -5}deg) rotateY(${px * 7}deg)`,
        },
        { duration: 0.35, easing: spring({ stiffness: 260, damping: 20 }) }
      );

      animate(
        heroAvatarWrap,
        {
          transform: `translate(${px * -8}px, ${py * -5}px) rotateY(${px * -8}deg)`,
        },
        { duration: 0.35, easing: spring({ stiffness: 240, damping: 22 }) }
      );
    });

    heroStage.addEventListener('pointerleave', () => {
      animate(heroCard, { transform: 'translate(0px, 0px) rotateX(0deg) rotateY(0deg)' }, { duration: 0.5, easing: 'ease-out' });
      animate(heroAvatarWrap, { transform: 'translate(0px, 0px) rotateY(0deg)' }, { duration: 0.5, easing: 'ease-out' });
    });
  }
};

runAfterAssetsReady(() => {
  initSmoothScrollStack();
  initScrollReveal();
  initMusicToggle();
  runHeroAnimations();
  initSkillsScrollReveal();
});
