/* ============================================================
   PITT CHARITY CUP 2026 — Main JavaScript
   ============================================================ */

// =============================================
// CONFIG — All editable values live here
// =============================================
const CONFIG = {
  tournamentDate: new Date('2026-06-01T09:00:00'),
  goalAmount: 1000,
  raisedAmount: 0,       // UPDATE RAISED AMOUNT HERE
  donorCount: 0,         // UPDATE DONOR COUNT HERE
  venue: 'Fairview Park, Bridgeville, PA 15017',
  email: 'pittsburghcharitycricket@gmail.com',
  phone: '412-292-9572',
  instagram: '@Instagram account name', // TODO: Replace with real Instagram handle
};

// =============================================
// CUSTOM CURSOR (desktop only)
// =============================================
(function initCustomCursor() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const cursor = document.querySelector('.custom-cursor');
  if (!cursor) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.transform = `translate(${cursorX - 18}px, ${cursorY - 18}px)`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  // Cursor hover state — scale up & change color on interactive elements
  const interactiveSelectors = 'a, button, input, textarea, select, .btn, .btn-donate-nav, .amount-btn, .glass-card, .sponsor-tier-card, .rule-card, .info-card, .donate-tier, .contact-item, .money-card, [role="button"]';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelectors)) {
      cursor.classList.add('hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelectors)) {
      cursor.classList.remove('hovering');
    }
  });
})();

// =============================================
// NAVBAR — Shrink on scroll, active page
// =============================================
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // Set active link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// =============================================
// MOBILE NAV TOGGLE
// =============================================
(function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

// =============================================
// SCROLL REVEAL ANIMATIONS (Intersection Observer)
// =============================================
(function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-stagger');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
})();

// =============================================
// COUNT-UP ANIMATION
// =============================================
function animateCountUp(el) {
  const target = el.getAttribute('data-count');
  const suffix = el.getAttribute('data-suffix') || '';
  const isPercent = target.includes('%');
  const numTarget = parseInt(target.replace('%', ''));
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(eased * numTarget);
    el.textContent = current + (isPercent ? '%' : '') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

(function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCountUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

// =============================================
// COUNTDOWN TIMER
// =============================================
(function initCountdown() {
  const countdownEl = document.querySelector('.countdown-boxes');
  if (!countdownEl) return;

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  if (!daysEl) return;

  let prevValues = { d: '', h: '', m: '', s: '' };

  function updateCountdown() {
    const now = new Date();
    const diff = CONFIG.tournamentDate - now;

    if (diff <= 0) {
      daysEl.textContent = '0';
      hoursEl.textContent = '0';
      minsEl.textContent = '0';
      secsEl.textContent = '0';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    // Flip animation on change
    if (prevValues.d !== String(d)) { daysEl.classList.add('flip'); setTimeout(() => daysEl.classList.remove('flip'), 400); }
    if (prevValues.h !== String(h)) { hoursEl.classList.add('flip'); setTimeout(() => hoursEl.classList.remove('flip'), 400); }
    if (prevValues.m !== String(m)) { minsEl.classList.add('flip'); setTimeout(() => minsEl.classList.remove('flip'), 400); }
    if (prevValues.s !== String(s)) { secsEl.classList.add('flip'); setTimeout(() => secsEl.classList.remove('flip'), 400); }

    daysEl.textContent = d;
    hoursEl.textContent = h;
    minsEl.textContent = m;
    secsEl.textContent = s;

    prevValues = { d: String(d), h: String(h), m: String(m), s: String(s) };
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
})();

// =============================================
// PARALLAX (Hero background)
// =============================================
(function initParallax() {
  const parallaxBg = document.querySelector('.parallax-bg');
  if (!parallaxBg) return;

  window.addEventListener('scroll', () => {
    const scroll = window.pageYOffset;
    parallaxBg.style.transform = `translateY(${scroll * 0.3}px)`;
  }, { passive: true });
})();

// =============================================
// SCROLL-TO-TOP BUTTON
// =============================================
(function initScrollTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// =============================================
// DONATION AMOUNT SELECTOR
// =============================================
(function initDonation() {
  const amountBtns = document.querySelectorAll('.amount-btn');
  const customInput = document.querySelector('.custom-amount-input');
  const donateBtn = document.querySelector('.btn-donate-amount');

  if (!amountBtns.length) return;

  let selectedAmount = 25;

  function updateDonateButton() {
    if (donateBtn) {
      donateBtn.innerHTML = `Donate $${selectedAmount} <i class="fa-solid fa-heart"></i>`;
    }
  }

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset.amount === 'custom') {
        if (customInput) {
          customInput.classList.add('show');
          customInput.focus();
        }
      } else {
        if (customInput) customInput.classList.remove('show');
        selectedAmount = parseInt(btn.dataset.amount);
        updateDonateButton();
      }
    });
  });

  if (customInput) {
    customInput.addEventListener('input', () => {
      const val = parseInt(customInput.value);
      if (val > 0) {
        selectedAmount = val;
        updateDonateButton();
      }
    });
  }

  // Set initial active
  if (amountBtns[0]) amountBtns[0].classList.add('active');
  updateDonateButton();
})();

// =============================================
// PROGRESS BAR ANIMATION
// =============================================
(function initProgressBar() {
  const fill = document.querySelector('.progress-fill');
  if (!fill) return;

  const percent = Math.min((CONFIG.raisedAmount / CONFIG.goalAmount) * 100, 100);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          fill.style.width = percent + '%';
        }, 300);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(fill.parentElement);

  // Update display values
  const raisedEl = document.querySelector('.progress-raised');
  const donorsEl = document.querySelector('.progress-donors');
  if (raisedEl) raisedEl.textContent = `$${CONFIG.raisedAmount.toLocaleString()}`;
  if (donorsEl) donorsEl.textContent = `${CONFIG.donorCount} donor${CONFIG.donorCount !== 1 ? 's' : ''} so far`;
})();

// =============================================
// CONTACT FORM (mailto fallback)
// =============================================
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const subject = form.querySelector('[name="subject"]')?.value || '';
    const message = form.querySelector('[name="message"]')?.value || '';

    // Open mailto with pre-filled fields
    // TODO: Replace with Formspree or Netlify Forms endpoint for server-side handling
    // Example: form.action = "https://formspree.io/f/YOUR_FORM_ID"; form.method = "POST"; form.submit();
    const mailtoLink = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
    window.location.href = mailtoLink;
  });
})();

// =============================================
// REGISTRATION FORM
// =============================================
(function initRegForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = form.querySelector('[name="firstName"]')?.value || '';
    const lastName = form.querySelector('[name="lastName"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';

    // TODO: Connect to a backend or form service (Formspree, Google Forms, etc.)
    const mailtoLink = `mailto:${CONFIG.email}?subject=${encodeURIComponent(`PCC 2026 Registration: ${firstName} ${lastName}`)}&body=${encodeURIComponent(`Registration for: ${firstName} ${lastName}\nEmail: ${email}`)}`;
    window.location.href = mailtoLink;
  });
})();

// =============================================
// DONATION FORM
// =============================================
(function initDonateForm() {
  const form = document.getElementById('donate-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const message = form.querySelector('[name="message"]')?.value || '';

    // TODO: Connect to a payment processor (Stripe, PayPal, etc.)
    const mailtoLink = `mailto:${CONFIG.email}?subject=${encodeURIComponent('PCC 2026 Donation')}&body=${encodeURIComponent(`Donation from: ${name}\nEmail: ${email}\nMessage: ${message}`)}`;
    window.location.href = mailtoLink;
  });
})();
