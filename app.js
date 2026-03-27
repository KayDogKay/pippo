/**
 * app.js – Praktisch KAD
 * Hausmeisterservice Philipp Dehnhardt
 *
 * Responsibilities:
 *  1. Fetch data from kunde.json
 *  2. Inject content into DOM mount points
 *  3. IntersectionObserver reveal-on-scroll with stagger
 *  4. Sticky header on scroll
 *  5. Mobile nav burger toggle
 *  6. Loader dismiss
 */

/* ═══════════════════════════════════════════════════════════════
   1.  BOOTSTRAP
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fetchData()
    .then(data => {
      renderAll(data);
      initScrollReveal();
      initStickyHeader();
      initMobileNav();
      initAnchorLinks();
      hideLoader();
    })
    .catch(err => {
      console.error('[KAD] Fehler beim Laden der Daten:', err);
      hideLoader(); // hide loader even on error so page isn't frozen
      showErrorBanner();
    });
});

/* ═══════════════════════════════════════════════════════════════
   2.  DATA LAYER
   ═══════════════════════════════════════════════════════════════ */
async function fetchData() {
  const response = await fetch('kunde.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}: kunde.json konnte nicht geladen werden.`);
  return response.json();
}

/* ═══════════════════════════════════════════════════════════════
   3.  RENDER ORCHESTRATOR
   ═══════════════════════════════════════════════════════════════ */
function renderAll(d) {
  renderMeta(d.meta, d.firma);
  renderNav(d.firma, d.kontakt);
  renderHero(d.hero, d.kontakt);
  renderLeistungen(d.leistungen);
  renderUeber(d.ueber);
  renderGalerie(d.galerie);
  renderEinsatzgebiet(d.einsatzgebiet);
  renderFooter(d.footer, d.kontakt);
  renderStickyBar(d.kontakt);
}

/* ═══════════════════════════════════════════════════════════════
   4.  SECTION RENDERERS
   ═══════════════════════════════════════════════════════════════ */

/** 4.1 META / HEAD */
function renderMeta(meta, firma) {
  setTitle('page-title', meta.siteTitle);
  setAttr('meta-description', 'content', meta.siteDescription);
  setAttr('og-title', 'content', meta.siteTitle);
  setAttr('og-description', 'content', meta.siteDescription);
  document.documentElement.setAttribute('lang', meta.lang || 'de');
}

/** 4.2 NAVIGATION */
function renderNav(firma, kontakt) {
  setText('nav-brand-label', firma.name);
  const ctaBtn = document.getElementById('nav-cta-btn');
  if (ctaBtn) {
    ctaBtn.href = kontakt.whatsappLink;
    ctaBtn.setAttribute('target', '_blank');
    ctaBtn.setAttribute('rel', 'noopener noreferrer');
  }
}

/** 4.3 HERO */
function renderHero(hero, kontakt) {
  setText('hero-badge', hero.badge);

  // Parse headline – wrap text in <em> if it contains a marker (*..*)
  const hl = document.getElementById('hero-headline');
  if (hl) hl.innerHTML = parseEmphasis(hero.headline);

  setText('hero-subline', hero.subline);

  const actions = document.getElementById('hero-actions');
  if (actions) {
    const primaryHref = hero.ctaPrimary.action === 'whatsapp'
      ? kontakt.whatsappLink
      : `tel:${kontakt.telefon}`;

    actions.innerHTML = `
      <a href="${esc(primaryHref)}"
         class="btn btn--accent"
         target="_blank"
         rel="noopener noreferrer">
        ${esc(hero.ctaPrimary.label)}
      </a>
      <a href="${esc(hero.ctaSecondary.anchor)}" class="btn btn--ghost">
        ${esc(hero.ctaSecondary.label)}
      </a>
    `;
  }

  const stats = document.getElementById('hero-stats');
  if (stats && hero.statBadges?.length) {
    stats.innerHTML = hero.statBadges.map(s => `
      <div class="hero__stat">
        <span class="hero__stat-val">${esc(s.wert)}</span>
        <span class="hero__stat-label">${esc(s.label)}</span>
      </div>
    `).join('');
  }
}

/** 4.4 LEISTUNGEN (Bento Grid) */
function renderLeistungen(leistungen) {
  setText('leistungen-headline', leistungen.headline);
  setText('leistungen-subline', leistungen.subline);

  const grid = document.getElementById('leistungen-grid');
  if (!grid) return;

  grid.innerHTML = leistungen.kacheln.map((k, i) => {
    const delay = i * 80; // stagger base – refined by JS observer
    const isWide = k.size === 'wide';

    const highlightsHTML = k.highlights?.length
      ? `<div class="bento-tile__highlights" role="list">
          ${k.highlights.map(h => `<span class="bento-tag" role="listitem">${esc(h)}</span>`).join('')}
         </div>`
      : '';

    if (isWide) {
      return `
        <article class="bento-tile bento-tile--wide glass-card reveal" 
                 data-delay="${delay}" 
                 role="listitem"
                 aria-label="${esc(k.titel)}">
          <span class="bento-tile__icon" aria-hidden="true">${k.icon}</span>
          <div class="bento-tile__content">
            <h3 class="bento-tile__title">${esc(k.titel)}</h3>
            <p class="bento-tile__desc">${esc(k.beschreibung)}</p>
          </div>
          <div class="bento-tile__highlights" role="list">
            ${(k.highlights || []).map(h => `<span class="bento-tag" role="listitem">${esc(h)}</span>`).join('')}
          </div>
        </article>`;
    }

    return `
      <article class="bento-tile bento-tile--${k.size} glass-card reveal"
               data-delay="${delay}"
               role="listitem"
               aria-label="${esc(k.titel)}">
        <span class="bento-tile__icon" aria-hidden="true">${k.icon}</span>
        <h3 class="bento-tile__title">${esc(k.titel)}</h3>
        <p class="bento-tile__desc">${esc(k.beschreibung)}</p>
        ${highlightsHTML}
      </article>`;
  }).join('');
}

/** 4.5 ÜBER MICH */
function renderUeber(ueber) {
  setText('ueber-headline', ueber.headline);
  setText('ueber-subline', ueber.subline);
  setText('ueber-absatz1', ueber.absatz1);
  setText('ueber-absatz2', ueber.absatz2);

  const werteList = document.getElementById('ueber-werte');
  if (werteList && ueber.werte?.length) {
    werteList.innerHTML = ueber.werte.map(w => `
      <li class="ueber__wert">
        <span class="ueber__wert-icon" aria-hidden="true">${esc(w.icon)}</span>
        <span>${esc(w.label)}</span>
      </li>
    `).join('');
  }
}

/** 4.6 GALERIE */
function renderGalerie(galerie) {
  setText('galerie-headline', galerie.headline);
  setText('galerie-subline', galerie.subline);

  const grid = document.getElementById('galerie-grid');
  if (!grid) return;

  grid.innerHTML = Array.from({ length: galerie.platzhalterAnzahl }, (_, i) => `
    <div class="galerie__item reveal" 
         data-delay="${i * 60}"
         role="listitem" 
         aria-label="Projektbild ${i + 1} – Platzhalter">
      <span class="galerie__placeholder-icon" aria-hidden="true">📷</span>
      <span class="galerie__placeholder-text">Foto ${i + 1}</span>
    </div>
  `).join('');
}

/** 4.7 EINSATZGEBIET */
function renderEinsatzgebiet(einsatz) {
  setText('einsatz-headline', einsatz.headline);
  setText('einsatz-subline', einsatz.beschreibung);
}

/** 4.8 FOOTER */
function renderFooter(footer, kontakt) {
  setText('footer-tagline', footer.tagline);
  setText('footer-copyright', footer.copyright);

  // Impressum
  setText('impressum-headline', footer.impressum.headline);
  const impressumBody = document.getElementById('impressum-body');
  if (impressumBody) {
    impressumBody.innerHTML = footer.impressum.inhalt
      .map(line => `<p>${esc(line)}</p>`)
      .join('');
  }

  // Datenschutz
  setText('datenschutz-headline', footer.datenschutz.headline);
  const datenschutzBody = document.getElementById('datenschutz-body');
  if (datenschutzBody) {
    datenschutzBody.innerHTML = footer.datenschutz.inhalt
      .map(line => `<p>${esc(line)}</p>`)
      .join('');
  }

  // Contact buttons in footer
  const socials = document.getElementById('footer-socials');
  if (socials) {
    socials.innerHTML = `
      <a href="${esc(kontakt.whatsappLink)}"
         class="footer__social-btn"
         target="_blank" rel="noopener noreferrer"
         aria-label="Per WhatsApp kontaktieren">
        WhatsApp
      </a>
      <a href="tel:${esc(kontakt.telefon)}"
         class="footer__social-btn"
         aria-label="Jetzt anrufen ${esc(kontakt.telefonAnzeige)}">
        ${esc(kontakt.telefonAnzeige)}
      </a>
    `;
  }
}

/** 4.9 STICKY ACTION BAR */
function renderStickyBar(kontakt) {
  const callBtn = document.getElementById('sticky-call-btn');
  const waBtn = document.getElementById('sticky-whatsapp-btn');

  if (callBtn) callBtn.href = `tel:${kontakt.telefon}`;
  if (waBtn) {
    waBtn.href = kontakt.whatsappLink;
  }
}

/* ═══════════════════════════════════════════════════════════════
   5.  SCROLL REVEAL  (IntersectionObserver)
   ═══════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);

        setTimeout(() => {
          el.classList.add('is-visible');
        }, delay);

        // Unobserve after revealing – no repeated resets
        observer.unobserve(el);
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -60px 0px', // trigger slightly before bottom of viewport
      threshold: 0.12,
    }
  );

  // Observe all .reveal elements with auto-stagger by section
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    const revealEls = section.querySelectorAll('.reveal');
    revealEls.forEach((el, index) => {
      // If element has no explicit delay, apply sequential stagger
      if (!el.dataset.delay) {
        el.dataset.delay = String(index * 90);
      }
      observer.observe(el);
    });
  });

  // Also observe elements outside sections (hero already has reveal classes)
  document.querySelectorAll('.reveal:not(section .reveal)').forEach((el, i) => {
    if (!el.dataset.delay) el.dataset.delay = String(i * 80);
    observer.observe(el);
  });
}

/* ═══════════════════════════════════════════════════════════════
   6.  STICKY HEADER ON SCROLL
   ═══════════════════════════════════════════════════════════════ */
function initStickyHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ═══════════════════════════════════════════════════════════════
   7.  MOBILE NAV BURGER
   ═══════════════════════════════════════════════════════════════ */
function initMobileNav() {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('mobile-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('open', !isOpen);
    menu.setAttribute('aria-hidden', String(isOpen));
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !menu.contains(e.target)) {
      burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   8.  SMOOTH ANCHOR LINKS
   ═══════════════════════════════════════════════════════════════ */
function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   9.  LOADER
   ═══════════════════════════════════════════════════════════════ */
function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  // Small delay so the first render paint is complete
  requestAnimationFrame(() => {
    setTimeout(() => loader.classList.add('hidden'), 200);
  });
}

/* ═══════════════════════════════════════════════════════════════
   10. ERROR BANNER
   ═══════════════════════════════════════════════════════════════ */
function showErrorBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    padding: 1rem; background: #7f1d1d; color: #fca5a5;
    font-family: monospace; font-size: 0.85rem; text-align: center;
  `;
  banner.textContent = 'Fehler: kunde.json konnte nicht geladen werden. Bitte stelle sicher, dass die Datei im selben Verzeichnis liegt wie index.html.';
  document.body.prepend(banner);
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Set textContent safely */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text !== undefined) el.textContent = text;
}

/** Set title tag via id */
function setTitle(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
  document.title = text;
}

/** Set an attribute on an element */
function setAttr(id, attr, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined) el.setAttribute(attr, value);
}

/**
 * Escape HTML special characters to prevent XSS.
 * Used when injecting data-driven content via innerHTML.
 */
function esc(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Parse *word* or _word_ markers into <em> tags.
 * Intentionally minimal – only used for controlled CMS content.
 */
function parseEmphasis(str) {
  if (typeof str !== 'string') return '';
  return esc(str)
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}
