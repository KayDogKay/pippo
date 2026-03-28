/* ============================================================
   app.js - Hausmeisterservice Philipp Dehnhardt
   Web-Agentur Praktisch KAD

   Architektur:
   1. Fetch kunde.json
   2. Update title und meta description
   3. Render Navigation (alle Seiten)
   4. Render Seiteninhalt (je nach data-page Attribut)
   5. Render Footer (alle Seiten)
   6. Render Mobile Sticky Bar (alle Seiten)
   7. IntersectionObserver: Scroll-Reveal-Effekte
   8. Nav: Scroll-Shadow + Mobile Hamburger
   ============================================================ */

(function () {
  'use strict';

  /* -- SVG Icons Library ---------------------------------- */
  const Icons = {
    leaf:   `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V4l-8-2-8 2v8c0 6 8 10 8 10z"/></svg>`,
    hammer: `<svg viewBox="0 0 24 24"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/></svg>`,
    house:  `<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    phone:  `<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.41 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    mail:   `<svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    arrow:  `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    chevron:`<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`,
    image:  `<svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    mapPin: `<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    scroll: `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
    phoneFooter: `<svg class="footer-contact-item__label" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.41 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mailFooter: `<svg class="footer-contact-item__label" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  };

  /* -- Entry Point ---------------------------------------- */
  fetch('./kunde.json')
    .then(res => {
      if (!res.ok) throw new Error('kunde.json konnte nicht geladen werden.');
      return res.json();
    })
    .then(data => {
      const page = document.body.dataset.page || 'index';

      updateMeta(data, page);
      renderNav(data, page);
      renderPage(data, page);
      renderFooter(data);
      renderMobileBar(data);

      initNavBehavior();
      initScrollReveal();
    })
    .catch(err => {
      console.error('[Praktisch KAD] Fehler beim Laden der Inhaltsdaten:', err);
    });

  /* -- Meta updater --------------------------------------- */
  function updateMeta(data, page) {
    const meta = data.meta.pages[page];
    if (!meta) return;

    document.title = meta.title;

    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.name = 'description';
      document.head.appendChild(descTag);
    }
    descTag.content = meta.description;
  }

  /* -- Navigation Renderer -------------------------------- */
  function renderNav(data, activePage) {
    const mount = document.getElementById('nav-mount');
    if (!mount) return;

    const linksHtml = data.navigation.map(item => {
      // Ermittle aktiven Zustand über Dateiname
      const itemPage = item.href.replace('./', '').replace('.html', '') || 'index';
      const isActive = itemPage === activePage;
      return `<a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label}</a>`;
    }).join('');

    // Mobile Links - identisch zu Desktop
    const mobileLinksHtml = data.navigation.map(item => {
      const itemPage = item.href.replace('./', '').replace('.html', '') || 'index';
      const isActive = itemPage === activePage;
      return `<a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label}</a>`;
    }).join('');

    mount.innerHTML = `
      <nav class="site-nav" id="site-nav">
        <div class="site-nav__inner">
          <a href="./index.html" class="site-nav__logo" aria-label="Startseite">
            <span class="site-nav__logo-name">Philipp Dehnhardt</span>
            <span class="site-nav__logo-sub">Hausmeisterservice</span>
          </a>
          <div class="site-nav__links" id="nav-links">
            ${linksHtml}
          </div>
          <a href="${data.pages.kontakt ? './kontakt.html' : '#'}" class="site-nav__cta">Kontakt</a>
          <button class="hamburger" id="hamburger" aria-label="Menü öffnen" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      <div class="mobile-nav" id="mobile-nav" role="navigation">
        ${mobileLinksHtml}
        <a href="./kontakt.html" class="btn btn--primary" style="margin-top:1.5rem;text-align:center;justify-content:center;">
          Kontakt aufnehmen
        </a>
      </div>
    `;
  }

  /* -- Page Router ---------------------------------------- */
  function renderPage(data, page) {
    const mount = document.getElementById('content-mount');
    if (!mount) return;

    const renderers = {
      index:       () => renderIndex(data),
      leistungen:  () => renderLeistungen(data),
      fotos:       () => renderFotos(data),
      kontakt:     () => renderKontakt(data),
      impressum:   () => renderLegal(data, 'impressum'),
      datenschutz: () => renderLegal(data, 'datenschutz'),
    };

    const renderer = renderers[page];
    if (renderer) {
      mount.innerHTML = renderer();
    } else {
      mount.innerHTML = `<section class="section"><div class="container"><p>Seite nicht gefunden.</p></div></section>`;
    }

    // Nach dem Render: Galerie-Filter initialisieren
    if (page === 'fotos') initGallery();
  }

  /* -- INDEX Page ----------------------------------------- */
  function renderIndex(data) {
    const p = data.pages.index;
    const f = data.firma;

    // Service Cards
    const serviceCards = p.services.items.map((item, i) => `
      <div class="service-card reveal" style="--delay:${i * 0.1}s">
        <div class="service-card__icon">${Icons[item.icon] || ''}</div>
        <h3 class="service-card__title">${item.title}</h3>
        <p class="service-card__text">${item.text}</p>
        <a href="${item.href}" class="service-card__link">Mehr erfahren</a>
      </div>
    `).join('');

    // USP Items
    const uspItems = p.usp.items.map((item, i) => `
      <div class="usp-item reveal" style="--delay:${i * 0.1}s">
        <div class="usp-item__checkmark">&#10003;</div>
        <h3 class="usp-item__title">${item.title}</h3>
        <p class="usp-item__text">${item.text}</p>
      </div>
    `).join('');

    return `
      <!-- ===== HERO ===== -->
      <section class="hero">
        <div class="container hero__inner">
          <p class="hero__tagline">${p.hero.tagline}</p>
          <h1 class="hero__headline">${p.hero.headline.replace('\n', '<br>')}</h1>
          <p class="hero__subline">${p.hero.subline}</p>
          <div class="hero__actions">
            <a href="${p.hero.cta1Href}" class="btn btn--primary">${Icons.phone} ${p.hero.cta1Label}</a>
            <a href="${p.hero.cta2Href}" class="btn btn--outline">${p.hero.cta2Label}</a>
          </div>
        </div>
        <div class="hero__scroll" aria-hidden="true">
          <span>Scroll</span>
          ${Icons.scroll}
        </div>
      </section>

      <!-- ===== ABOUT ===== -->
      <section class="section about">
        <div class="container">
          <div class="about__grid">
            <div class="about__text-side reveal">
              <span class="eyebrow">${p.about.eyebrow}</span>
              <h2 class="section-headline">${p.about.headline}</h2>
              <p class="about__text">${p.about.text}</p>
              <div class="about__badge">${p.about.badgeText}</div>
            </div>
            <div class="about__visual about__visual--placeholder reveal" style="--delay:.15s">
              <span>Ihr Foto hier</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== LEISTUNGEN VORSCHAU ===== -->
      <section class="section services">
        <div class="container">
          <div class="services__header reveal">
            <span class="eyebrow">${p.services.eyebrow}</span>
            <h2 class="section-headline">${p.services.headline}</h2>
          </div>
          <div class="services__grid">
            ${serviceCards}
          </div>
        </div>
      </section>

      <!-- ===== USP / DARK BAND ===== -->
      <section class="section usp">
        <div class="container">
          <div class="usp__header reveal">
            <span class="eyebrow">${p.usp.eyebrow}</span>
            <h2 class="section-headline section-headline--light">${p.usp.headline}</h2>
          </div>
          <div class="usp__grid">
            ${uspItems}
          </div>
        </div>
      </section>

      <!-- ===== CTA BAND ===== -->
      <section class="cta-band">
        <div class="container cta-band__inner reveal">
          <h2 class="cta-band__headline">${p.cta.headline}</h2>
          <p class="cta-band__text">${p.cta.text}</p>
          <div style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;">
            <a href="${p.cta.btnHref}" class="btn btn--dark">${Icons.arrow} ${p.cta.btnLabel}</a>
            <a href="tel:+${f.telefonRaw}" class="btn btn--outline" style="border-color:rgba(255,255,255,.5);color:#fff;">
              ${Icons.phone} ${f.telefon}
            </a>
          </div>
        </div>
      </section>
    `;
  }

  /* -- LEISTUNGEN Page ------------------------------------ */
  function renderLeistungen(data) {
    const p = data.pages.leistungen;

    const blocksHtml = p.items.map((item, i) => {
      const listItems = item.leistungen.map(l => `<li>${l}</li>`).join('');
      const isEven = i % 2 === 1;

      return `
        ${i > 0 ? '<div class="leistungen-divider"></div>' : ''}
        <div class="leistung-block reveal" id="${item.id}">
          <div class="leistung-block__visual leistung-block__visual--placeholder">
            <div class="placeholder-icon">${Icons[item.icon] || ''}</div>
            <span>Fotos folgen</span>
          </div>
          <div class="leistung-block__content">
            <span class="eyebrow">${item.id === 'garten' ? 'Außenbereich' : item.id === 'renovierung' ? 'Innenbereich' : 'Ausbau'}</span>
            <h2 class="leistung-block__title">${item.title}</h2>
            <p class="leistung-block__intro">${item.intro}</p>
            <ul class="leistung-block__list">${listItems}</ul>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!-- ===== PAGE HEADER ===== -->
      <div class="page-header">
        <div class="container page-header__inner">
          <span class="eyebrow">${p.header.eyebrow}</span>
          <h1 class="page-header__headline">${p.header.headline}</h1>
        </div>
      </div>

      <!-- ===== LEISTUNGS-BLÖCKE ===== -->
      <section class="section">
        <div class="container">
          <p class="reveal" style="max-width:640px;color:var(--clr-text-muted);margin-bottom:3.5rem;font-size:1.05rem;line-height:1.75;">${p.intro}</p>
          <div class="leistungen-items">${blocksHtml}</div>
        </div>
      </section>

      <!-- ===== CTA BAND ===== -->
      <section class="cta-band">
        <div class="container cta-band__inner reveal">
          <h2 class="cta-band__headline">${p.cta.headline}</h2>
          <p class="cta-band__text">${p.cta.text}</p>
          <a href="${p.cta.btnHref}" class="btn btn--dark">${Icons.arrow} ${p.cta.btnLabel}</a>
        </div>
      </section>
    `;
  }

  /* -- FOTOS Page ----------------------------------------- */
  function renderFotos(data) {
    const p = data.pages.fotos;

    // Kategorie-Filter Buttons
    const filterBtns = p.categories.map((cat, i) => `
      <button class="filter-btn ${i === 0 ? 'active' : ''}" data-category="${cat}">${cat}</button>
    `).join('');

    // Foto-Items - Fallback auf Platzhalter wenn Bild nicht ladbar
    const photoItems = p.photos.map(photo => `
      <div class="gallery-item reveal" data-category="${photo.category}">
        <img src="${photo.src}"
             alt="${photo.alt}"
             loading="lazy"
             onerror="this.parentElement.classList.add('gallery-item--placeholder');this.style.display='none';this.parentElement.innerHTML+='<svg viewBox=\\'0 0 24 24\\'><rect width=\\'18\\' height=\\'18\\' x=\\'3\\' y=\\'3\\' rx=\\'2\\'/><circle cx=\\'9\\' cy=\\'9\\' r=\\'2\\'/><path d=\\'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\\'/></svg><span>${photo.alt}</span>'">
        <div class="gallery-item__overlay">
          <span class="gallery-item__label">${photo.alt}</span>
        </div>
      </div>
    `).join('');

    return `
      <!-- ===== PAGE HEADER ===== -->
      <div class="page-header">
        <div class="container page-header__inner">
          <span class="eyebrow">${p.header.eyebrow}</span>
          <h1 class="page-header__headline">${p.header.headline}</h1>
        </div>
      </div>

      <!-- ===== GALERIE ===== -->
      <section class="section fotos">
        <div class="container">
          <p class="reveal" style="max-width:560px;color:var(--clr-text-muted);margin-bottom:2rem;">${p.intro}</p>
          <div class="gallery-filter reveal">${filterBtns}</div>
          <div class="gallery-grid" id="gallery-grid">${photoItems}</div>
        </div>
      </section>

      <!-- Lightbox -->
      <div class="lightbox" id="lightbox" role="dialog" aria-label="Foto-Ansicht">
        <span class="lightbox__close" id="lightbox-close" aria-label="Schließen">&times;</span>
        <img src="" alt="" id="lightbox-img">
      </div>
    `;
  }

  /* -- KONTAKT Page --------------------------------------- */
  function renderKontakt(data) {
    const p  = data.pages.kontakt;
    const f  = data.firma;

    // Kanal-Icons-Map
    const channelIconMap = { phone: 'phone', whatsapp: 'whatsapp', email: 'mail' };

    const channelsHtml = p.channels.map(ch => `
      <a href="${ch.href}" class="contact-channel" target="${ch.type === 'whatsapp' ? '_blank' : '_self'}" rel="${ch.type === 'whatsapp' ? 'noopener noreferrer' : ''}">
        <div class="contact-channel__icon contact-channel__icon--${ch.type}">
          ${Icons[channelIconMap[ch.type]] || ''}
        </div>
        <div class="contact-channel__info">
          <div class="contact-channel__label">${ch.label}</div>
          <div class="contact-channel__value">${ch.value}</div>
          <div class="contact-channel__desc">${ch.desc}</div>
        </div>
        <div style="color:var(--clr-text-muted);flex-shrink:0;">${Icons.arrow}</div>
      </a>
    `).join('');

    return `
      <!-- ===== PAGE HEADER ===== -->
      <div class="page-header">
        <div class="container page-header__inner">
          <span class="eyebrow">${p.header.eyebrow}</span>
          <h1 class="page-header__headline">${p.header.headline}</h1>
        </div>
      </div>

      <!-- ===== KONTAKT INHALT ===== -->
      <section class="section kontakt">
        <div class="container">
          <div class="kontakt__grid">
            <!-- Linke Seite: Kontaktkanäle -->
            <div>
              <span class="eyebrow reveal">Direkt &amp; persönlich</span>
              <h2 class="section-headline reveal" style="margin-bottom:0">So erreichen<br>Sie mich</h2>
              <p class="kontakt__intro reveal">${p.intro}</p>
              <div class="contact-channels reveal">
                ${channelsHtml}
              </div>
            </div>
            <!-- Rechte Seite: Google Maps -->
            <div class="reveal" style="--delay:.15s">
              <div class="map-container">
                <iframe
                  title="Standort Hausmeisterservice Philipp Dehnhardt"
                  src="${p.mapEmbedSrc}"
                  allowfullscreen=""
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade">
                </iframe>
                <div class="map-notice">
                  ${Icons.mapPin.replace('<svg', '<svg style="width:14px;height:14px;stroke:var(--clr-text-muted);fill:none;stroke-width:2;vertical-align:middle;"')}
                  ${p.mapNote}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /* -- LEGAL Pages (Impressum / Datenschutz) -------------- */
  function renderLegal(data, page) {
    const p = data.pages[page];

    const sectionsHtml = p.sections.map(sec => `
      <div class="legal-section">
        <h2 class="legal-section__title">${sec.title}</h2>
        <div class="legal-section__content">${sec.content}</div>
      </div>
    `).join('');

    return `
      <!-- ===== PAGE HEADER ===== -->
      <div class="page-header">
        <div class="container page-header__inner">
          <h1 class="page-header__headline">${p.header.headline}</h1>
        </div>
      </div>

      <!-- ===== LEGAL CONTENT ===== -->
      <section class="section legal">
        <div class="container">
          <div class="legal__body">
            ${sectionsHtml}
          </div>
        </div>
      </section>
    `;
  }

  /* -- Footer Renderer ------------------------------------ */
  function renderFooter(data) {
    const mount = document.getElementById('footer-mount');
    if (!mount) return;

    const f  = data.firma;
    const ft = data.footer;

    const navLinks = data.navigation.map(item =>
      `<a href="${item.href}">${item.label}</a>`
    ).join('');

    const legalLinks = ft.links.map(l =>
      `<a href="${l.href}">${l.label}</a>`
    ).join('');

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="site-footer__inner">

            <!-- Brand Column -->
            <div class="footer-brand">
              <div class="footer-brand__name">${f.name}</div>
              <div class="footer-brand__tagline">${ft.tagline}</div>
              <p class="footer-brand__desc">
                Professioneller Hausmeisterservice - persönlich, zuverlässig und mit vollem Einsatz für Ihr Projekt.
              </p>
            </div>

            <!-- Navigation Column -->
            <div class="footer-col">
              <div class="footer-col__title">Navigation</div>
              <div class="footer-col__links">${navLinks}</div>
            </div>

            <!-- Kontakt Column -->
            <div class="footer-col">
              <div class="footer-col__title">Kontakt</div>
              <div class="footer-contact-item">
                ${Icons.phoneFooter}
                <a href="tel:+${f.telefonRaw}">${f.telefon}</a>
              </div>
              <div class="footer-contact-item">
                ${Icons.mailFooter}
                <a href="mailto:${f.email}">${f.email}</a>
              </div>
            </div>

          </div>

          <!-- Bottom Bar -->
          <div class="site-footer__bottom">
            <span class="site-footer__copyright">${ft.copyright}</span>
            <div class="site-footer__legal">${legalLinks}</div>
          </div>
        </div>
      </footer>
    `;
  }

  /* -- Mobile Bar Renderer -------------------------------- */
  function renderMobileBar(data) {
    const mount = document.getElementById('mobile-bar-mount');
    if (!mount) return;

    const f = data.firma;

    mount.innerHTML = `
      <div class="mobile-bar" role="complementary" aria-label="Schnellkontakt">
        <div class="mobile-bar__inner">
          <a href="tel:+${f.telefonRaw}" class="mobile-bar__btn mobile-bar__btn--phone" aria-label="Jetzt anrufen">
            ${Icons.phone} Anrufen
          </a>
          <a href="https://wa.me/${f.whatsapp}" class="mobile-bar__btn mobile-bar__btn--whatsapp"
             target="_blank" rel="noopener noreferrer" aria-label="WhatsApp schreiben">
            ${Icons.whatsapp} WhatsApp
          </a>
        </div>
      </div>
    `;
  }

  /* -- Gallery Filter & Lightbox -------------------------- */
  function initGallery() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    // Filter-Logik
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const selected = btn.dataset.category;
        const items = grid.querySelectorAll('.gallery-item');

        items.forEach(item => {
          if (selected === 'Alle' || item.dataset.category === selected) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });

    // Lightbox-Logik
    const lightbox    = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    if (!lightbox || !lightboxImg) return;

    grid.querySelectorAll('.gallery-item img').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    lightboxClose && lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* -- Nav Scroll Behavior + Hamburger ------------------- */
  function initNavBehavior() {
    const nav       = document.getElementById('site-nav');
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (!nav) return;

    // Scroll Shadow
    const onScroll = () => {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Hamburger Toggle
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';

      // Animate hamburger to X
      const spans = hamburger.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity   = '';
        spans[2].style.transform = '';
      }
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', false);
        const spans = hamburger.querySelectorAll('span');
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* -- IntersectionObserver: Scroll Reveal --------------- */
  function initScrollReveal() {
    // Kurze Verzögerung damit DOM vollständig gerendert ist
    requestAnimationFrame(() => {
      const elements = document.querySelectorAll('.reveal');

      if (!elements.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el    = entry.target;
            const delay = el.style.getPropertyValue('--delay') || '0s';

            // Nur einmalig einblenden (kein Reset beim Scrollen raus)
            setTimeout(() => {
              el.classList.add('visible');
            }, parseFloat(delay) * 1000);

            observer.unobserve(el); // Einmalig - Element wird nach Einblenden nicht mehr beobachtet
          }
        });
      }, {
        threshold: 0.12,   // Element muss zu 12% sichtbar sein
        rootMargin: '0px 0px -40px 0px',
      });

      elements.forEach(el => observer.observe(el));
    });
  }

})();
