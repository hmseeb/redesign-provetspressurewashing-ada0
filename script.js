/* =========================================================
   Pro Vets Pressure Washing LLC — site interactions
   Vanilla JS · no dependencies · no external APIs
   ========================================================= */
(function () {
  'use strict';

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
     4. Footer year
     --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------
     5. Header shadow on scroll
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

  /* ---------------------------------------------------------
     6. Lead forms → GoHighLevel
     Every .lead-form on the site posts to /api/lead, which
     creates or updates the contact in the GHL sub-account.
     --------------------------------------------------------- */
  var leadForms = Array.prototype.slice.call(document.querySelectorAll('.lead-form'));

  leadForms.forEach(function (form) {
    var submitBtn = form.querySelector('[type="submit"]');
    var errorBox = form.querySelector('.lead-form__error');
    var thanks = form.parentNode ? form.parentNode.querySelector('.lead-form__thanks') : null;
    var submitLabel = submitBtn ? submitBtn.textContent : '';

    function showError(message) {
      if (!errorBox) return;
      errorBox.textContent = message;
      errorBox.hidden = false;
    }

    function clearError() {
      if (!errorBox) return;
      errorBox.hidden = true;
      errorBox.textContent = '';
    }

    function value(name) {
      var field = form.elements[name];
      return field && field.value ? field.value.trim() : '';
    }

    function flag(name, invalid) {
      var field = form.elements[name];
      if (!field) return;
      if (invalid) {
        field.setAttribute('aria-invalid', 'true');
      } else {
        field.removeAttribute('aria-invalid');
      }
    }

    /* Clear the invalid state as soon as the visitor fixes it. */
    form.addEventListener('input', function (e) {
      if (e.target && e.target.getAttribute('aria-invalid') === 'true') {
        e.target.removeAttribute('aria-invalid');
      }
      /* The banner is re-evaluated on the next submit, so drop the
         stale message as soon as the visitor starts correcting. */
      clearError();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();

      var firstName = value('firstName');
      var phone = value('phone');
      var email = value('email');

      var invalidFirst = !firstName;
      var invalidPhone = phone.replace(/\D/g, '').length < 10;
      var invalidEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      flag('firstName', invalidFirst);
      flag('phone', invalidPhone);
      flag('email', invalidEmail);

      if (invalidFirst || invalidPhone || invalidEmail) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first && first.focus) first.focus();
        showError(
          invalidFirst
            ? 'Please enter your first name.'
            : invalidPhone
              ? 'Please enter a valid phone number.'
              : 'Please enter a valid email address.'
        );
        return;
      }

      var payload = {
        firstName: firstName,
        lastName: value('lastName'),
        phone: phone,
        email: email,
        message: value('message'),
        company: value('company'),
        formName: form.getAttribute('data-form-name') || form.id || 'Website Form'
      };

      if (submitBtn) {
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      function restore() {
        if (!submitBtn) return;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }

      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok && body && body.ok !== false, body: body || {} };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            restore();
            showError(
              result.body.error ||
              'We could not submit your request. Please call or text (904) 533-6762.'
            );
            return;
          }

          form.reset();
          form.hidden = true;
          form.style.display = 'none';

          if (thanks) {
            thanks.hidden = false;
            if (thanks.focus) thanks.focus();
          }
        })
        .catch(function () {
          restore();
          showError('Network error — please call or text (904) 533-6762.');
        });
    });
  });
})();
