/* =========================================================
   Pro Vets Pressure Washing LLC — site interactions
   Vanilla JS · no dependencies · no external APIs
   ========================================================= */
(function () {
  'use strict';

  var BUSINESS_PHONE = '+19045336762';

  /* ---------------------------------------------------------
     1. Mobile navigation
     --------------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('primaryNav');

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
  }

  function openMenu() {
    if (!menu || !toggle) return;
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menu.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (link) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---------------------------------------------------------
     2. Scroll reveal
     --------------------------------------------------------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Math.min(i * 70, 280);
        window.setTimeout(function () { el.classList.add('is-visible'); }, delay);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     3. Active nav link on scroll (scroll spy)
     --------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('#primaryNav ul a[href^="#"]'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------------------------------------------------------
     4. Estimate form — client-side validation only.
        No backend, no third-party API: on success we build a
        prefilled SMS link to the business number.
     --------------------------------------------------------- */
  var form = document.getElementById('estimateForm');

  function fieldOf(input) {
    return input.closest('.field');
  }

  function setError(input, message) {
    var field = fieldOf(input);
    var box = document.querySelector('[data-error-for="' + input.id + '"]');
    if (field) field.classList.toggle('is-invalid', Boolean(message));
    if (box) box.textContent = message || '';
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim());
  }

  function digits(value) {
    return value.replace(/\D+/g, '');
  }

  function isValidPhone(value) {
    var d = digits(value);
    return d.length >= 10 && d.length <= 15;
  }

  function formatPhone(value) {
    var d = digits(value).slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }

  if (form) {
    var firstName = form.querySelector('#firstName');
    var lastName = form.querySelector('#lastName');
    var email = form.querySelector('#email');
    var phone = form.querySelector('#phone');
    var service = form.querySelector('#service');
    var message = form.querySelector('#message');
    var success = document.getElementById('formSuccess');
    var successMsg = document.getElementById('formSuccessMsg');
    var smsLink = document.getElementById('smsLink');

    phone.addEventListener('input', function () {
      var d = digits(phone.value);
      // Only auto-format plain 10-digit US style input.
      if (d.length <= 10 && !/[+]/.test(phone.value)) {
        phone.value = formatPhone(phone.value);
      }
      if (phone.getAttribute('aria-invalid') && isValidPhone(phone.value)) setError(phone, '');
    });

    [email, firstName, lastName].forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input === email && email.value.trim() && !isValidEmail(email.value)) {
          setError(email, 'Please enter a valid email address.');
        } else {
          setError(input, '');
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = true;

      if (!email.value.trim()) {
        setError(email, 'Email is required so Devante can send your estimate.');
        valid = false;
      } else if (!isValidEmail(email.value)) {
        setError(email, 'Please enter a valid email address.');
        valid = false;
      } else {
        setError(email, '');
      }

      if (!phone.value.trim()) {
        setError(phone, 'Phone is required — it is the fastest way to reach you.');
        valid = false;
      } else if (!isValidPhone(phone.value)) {
        setError(phone, 'Please enter a valid phone number.');
        valid = false;
      } else {
        setError(phone, '');
      }

      if (!valid) {
        var firstBad = form.querySelector('.field.is-invalid input');
        if (firstBad) firstBad.focus();
        if (success) success.hidden = true;
        return;
      }

      var name = [firstName.value.trim(), lastName.value.trim()].filter(Boolean).join(' ');
      var lines = [];
      lines.push('Free estimate request for Pro Vets Pressure Washing.');
      if (name) lines.push('Name: ' + name);
      lines.push('Email: ' + email.value.trim());
      lines.push('Phone: ' + phone.value.trim());
      if (service && service.value) lines.push('Service: ' + service.value);
      if (message && message.value.trim()) lines.push('Details: ' + message.value.trim());

      var body = lines.join('\n');

      if (smsLink) {
        smsLink.setAttribute('href', 'sms:' + BUSINESS_PHONE + '?&body=' + encodeURIComponent(body));
      }
      if (successMsg) {
        successMsg.textContent = name
          ? 'Thanks ' + name.split(' ')[0] + ' — this site doesn’t store submissions, so send your details straight to Devante with one tap:'
          : 'This site doesn’t store submissions, so send your details straight to Devante with one tap:';
      }
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }

  /* ---------------------------------------------------------
     5. Footer year
     --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------
     6. Header shadow on scroll
     --------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var lastState = false;
    var onScroll = function () {
      var scrolled = window.scrollY > 8;
      if (scrolled === lastState) return;
      lastState = scrolled;
      header.style.boxShadow = scrolled ? '0 10px 30px rgba(6,15,28,.10)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
