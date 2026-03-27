/* ============================================================
   PITTSBURGH CHARITY CUP 2026 — Main JavaScript
   ============================================================ */

// =============================================
// CONFIG — All editable values live here
// =============================================
const CONFIG = {
  tournamentDate: new Date('2026-06-26T09:00:00'),
  goalAmount: 1000,
  raisedAmount: 0,       // UPDATE RAISED AMOUNT HERE
  donorCount: 0,         // UPDATE DONOR COUNT HERE
  venue: 'Fairview Park, 288 Recreation Rd, Bridgeville, PA 15017',
  email: 'pittsburghcharitycricket@gmail.com',
  phone: '412-292-9572',
  instagram: '@pittsburghcharitycup',
};

const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONFIG.email}`;

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
// NEXT PAGE CTA
// =============================================
(function initNextPageCta() {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const nextMap = {
    'about.html': { href: 'tournament.html', label: 'Next: Tournament Details' },
    'tournament.html': { href: 'register.html', label: 'Next: Player Registration' },
    'register.html': { href: 'donate.html', label: 'Next: Donations' },
    'donate.html': { href: 'sponsors.html', label: 'Next: Sponsorships' },
    'sponsors.html': { href: 'gallery.html', label: 'Next: Gallery' },
    'gallery.html': { href: 'contact.html', label: 'Next: Contact Us' },
    'contact.html': { href: 'about.html', label: 'Next: About The Team' },
    'thank-you.html': { href: 'index.html', label: 'Back to Home' }
  };

  const next = nextMap[currentPage];
  if (!next) return;

  const section = document.createElement('section');
  section.className = 'next-page-cta';
  section.innerHTML = `
    <div class="next-page-cta-inner">
      <div class="next-page-cta-copy">Continue through the tournament site:</div>
      <a href="${next.href}" class="btn btn-primary">${next.label} <i class="fa-solid fa-arrow-right"></i></a>
    </div>
  `;

  footer.parentNode.insertBefore(section, footer);
})();

async function submitToEmailBackend(subject, fields) {
  const body = new URLSearchParams();
  body.append('_subject', subject);
  body.append('_template', 'table');
  body.append('_captcha', 'false');

  Object.entries(fields).forEach(([key, value]) => {
    body.append(key, String(value || ''));
  });

  const response = await fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error('Form backend request failed');
  }

  return response.json();
}

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
// CONTACT FORM
// =============================================
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const subject = form.querySelector('[name="subject"]')?.value || '';
    const message = form.querySelector('[name="message"]')?.value || '';

    try {
      await submitToEmailBackend(subject, {
        formType: 'Contact Form',
        name,
        email,
        subject,
        message
      });

      alert('Message sent successfully.');
      form.reset();
    } catch (_err) {
      const mailtoLink = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
      window.location.href = mailtoLink;
    }
  });
})();

// =============================================
// REGISTRATION FORM
// =============================================
(function initRegForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = form.querySelector('[name="firstName"]')?.value || '';
    const lastName = form.querySelector('[name="lastName"]')?.value || '';
    const dob = form.querySelector('[name="dob"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const phone = form.querySelector('[name="phone"]')?.value || '';
    const waiverAgreement = form.querySelector('[name="waiverAgreement"]')?.checked ? 'Yes' : 'No';

    try {
      await submitToEmailBackend(`Pittsburgh Charity Cup 2026 Registration: ${firstName} ${lastName}`, {
        formType: 'Player Registration',
        firstName,
        lastName,
        dob,
        email,
        phone,
        waiverAgreement
      });

      alert('Registration submitted successfully.');
      form.reset();
    } catch (_err) {
      const mailtoLink = `mailto:${CONFIG.email}?subject=${encodeURIComponent(`Pittsburgh Charity Cup 2026 Registration: ${firstName} ${lastName}`)}&body=${encodeURIComponent(`Registration for: ${firstName} ${lastName}\nDOB: ${dob}\nEmail: ${email}\nPhone: ${phone}\nWaiver agreed: ${waiverAgreement}`)}`;
      window.location.href = mailtoLink;
    }
  });
})();

// =============================================
// DONATION FORM
// =============================================
(function initDonateForm() {
  const form = document.getElementById('donate-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const message = form.querySelector('[name="message"]')?.value || '';

    // Get selected amount
    const activeBtn = document.querySelector('.amount-btn.active');
    const customInput = document.querySelector('.custom-amount-input');
    let amount = 25;
    if (activeBtn && activeBtn.dataset.amount !== 'custom') {
      amount = parseInt(activeBtn.dataset.amount);
    } else if (customInput && parseInt(customInput.value) > 0) {
      amount = parseInt(customInput.value);
    }

    try {
      await submitToEmailBackend('New Donation Intent', {
        formType: 'Donation Form',
        name,
        email,
        amount,
        message
      });
    } catch (_err) {
      // Fallback still continues to thank-you page.
    }

    const params = new URLSearchParams({ amount: amount, email: email });
    window.location.href = 'thank-you.html?' + params.toString();
  });
})();
