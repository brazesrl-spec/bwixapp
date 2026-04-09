/* BWIX — Upload form logic (index.html) */
(function () {
  'use strict';

  var API = 'https://bwix-api.onrender.com';

  // Pre-warm backend + load free slots
  fetch(API + '/api/health').catch(function () {});
  fetch(API + '/api/free-slots').then(function(r){return r.json();}).then(function(d){
    var n = d.free_slots || 0;
    var el = document.getElementById('free-slots-banner');
    if (!el) return;
    if (n <= 0) { el.hidden = true; return; }
    el.hidden = false;
    var bar = el.querySelector('.free-bar__fill');
    var txt = el.querySelector('.free-slots__text');
    if (bar) bar.style.width = Math.max(5, (n / 17) * 100) + '%';
    if (bar && n <= 5) bar.style.background = '#ff6b6b';
    if (txt) txt.innerHTML = n <= 5
      ? '\uD83C\uDF81 Plus que <strong>' + n + '</strong> analyse' + (n>1?'s':'') + ' gratuite' + (n>1?'s':'') + ' !'
      : '\uD83C\uDF81 Cadeau de lancement \u2014 encore <strong>' + n + '</strong> analyses offertes';
  }).catch(function(){});

  var adminCode = new URLSearchParams(window.location.search).get('admin') || '';

  // ── Drop zone ──
  var dropZone = document.getElementById('drop-zone');
  var fileInput = document.getElementById('pdf');
  if (!dropZone || !fileInput) return;

  var fileDisplay = dropZone.querySelector('.drop-zone__file');
  var promptEl = dropZone.querySelector('.drop-zone__prompt');

  ['dragenter', 'dragover'].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
  });
  dropZone.addEventListener('drop', function (e) {
    if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; showFile(e.dataTransfer.files[0]); }
  });
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) showFile(fileInput.files[0]);
  });

  function showFile(file) {
    if (promptEl) promptEl.hidden = true;
    if (fileDisplay) { fileDisplay.hidden = false; fileDisplay.textContent = '\uD83D\uDCC4 ' + file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)'; }
  }

  // ── Form submit ──
  var form = document.getElementById('analyse-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!fileInput.files[0]) return;
      submitAnalysis(fileInput.files[0]);
    });
  }

  function submitAnalysis(file) {
    var email = document.getElementById('email').value.trim();
    var secteur = document.getElementById('secteur').value;
    var msgEl = document.getElementById('upload-msg');
    var loading = document.getElementById('loading');
    var formEl = document.querySelector('.upload-form');

    if (formEl) formEl.hidden = true;
    if (loading) loading.hidden = false;
    if (msgEl) msgEl.hidden = true;

    // Animate progress
    setProgress(5, 'Envoi du PDF...');
    setTimeout(function () { setProgress(20, 'Extraction des donn\u00e9es comptables...'); }, 1500);
    setTimeout(function () { setProgress(45, 'Calcul des ratios financiers...'); }, 5000);
    setTimeout(function () { setProgress(70, 'Analyse en cours...'); }, 10000);
    setTimeout(function () { setProgress(85, 'Finalisation...'); }, 18000);

    var fd = new FormData();
    fd.append('file', file);
    fd.append('email', email);
    fd.append('secteur', secteur);
    if (adminCode) fd.append('admin', adminCode);

    fetch(API + '/api/analyse', { method: 'POST', body: fd })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (d) { throw new Error(d.detail || 'Erreur'); });
        return res.json();
      })
      .then(function (data) {
        setProgress(100, 'Termin\u00e9 !');
        setTimeout(function () {
          window.location.href = '/resultats?token=' + data.token;
        }, 500);
      })
      .catch(function (err) {
        if (loading) loading.hidden = true;
        if (formEl) formEl.hidden = false;
        if (msgEl) { msgEl.hidden = false; msgEl.textContent = err.message || 'Erreur lors de l\u2019analyse.'; }
      });
  }

  function setProgress(pct, label) {
    var fill = document.getElementById('progress-fill');
    var lbl = document.getElementById('progress-label');
    var pctEl = document.getElementById('progress-pct');
    if (fill) fill.style.width = pct + '%';
    if (lbl) lbl.textContent = label;
    if (pctEl) pctEl.textContent = pct + '%';
  }
})();
