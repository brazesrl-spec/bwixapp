/* BWIX — Waitlist frontend logic */
(function () {
  'use strict';

  var API = '/api/waitlist';

  /* ---------- Waitlist form handler ---------- */
  function handleSubmit(form, msgEl) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]').value.trim();
      if (!email) return;

      var btn = form.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Envoi…';

      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          msgEl.hidden = false;
          if (data.ok) {
            msgEl.textContent = 'Merci ! Vous \u00eates sur la liste. Nous vous contacterons en priorit\u00e9.';
            msgEl.classList.remove('error');
            form.reset();
            fetchCount();
          } else {
            msgEl.textContent = data.message || 'Une erreur est survenue.';
            msgEl.classList.add('error');
          }
        })
        .catch(function () {
          msgEl.hidden = false;
          msgEl.textContent = 'Erreur de connexion. R\u00e9essayez.';
          msgEl.classList.add('error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Rejoindre la liste d\u2019attente';
        });
    });
  }

  /* ---------- Waitlist counter ---------- */
  function fetchCount() {
    fetch(API + '/count')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var el = document.getElementById('waitlist-count');
        if (el && typeof data.count === 'number') {
          el.textContent = data.count;
        }
      })
      .catch(function () { /* silent */ });
  }

  /* ---------- Init ---------- */
  var heroForm = document.getElementById('waitlist-hero');
  var heroMsg = document.getElementById('waitlist-hero-msg');
  var bottomForm = document.getElementById('waitlist-bottom-form');
  var bottomMsg = document.getElementById('waitlist-bottom-msg');

  if (heroForm && heroMsg) handleSubmit(heroForm, heroMsg);
  if (bottomForm && bottomMsg) handleSubmit(bottomForm, bottomMsg);

  fetchCount();
})();
