/* BWIX — Analyse page logic */
(function () {
  'use strict';

  var API = window.BWIX_API || 'https://bwix-api.onrender.com';

  // Wake up backend on page load (Render free tier cold start)
  fetch(API + '/api/health').catch(function () {});

  var params = new URLSearchParams(window.location.search);
  var tokenFromUrl = params.get('token');
  var isSuccess = params.get('success') === '1';
  var adminCode = params.get('admin') || '';

  // If returning from Stripe or accessing existing analysis
  if (tokenFromUrl) {
    loadAnalysis(tokenFromUrl);
  }

  // ── Drop zone ────────────────────────────────────────────────────────────
  var dropZone = document.getElementById('drop-zone');
  var fileInput = document.getElementById('pdf');
  var fileDisplay = dropZone ? dropZone.querySelector('.drop-zone__file') : null;
  var prompt = dropZone ? dropZone.querySelector('.drop-zone__prompt') : null;

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
    });
    dropZone.addEventListener('drop', function (e) {
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        showFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length) showFile(fileInput.files[0]);
    });
  }

  function showFile(file) {
    if (prompt) prompt.hidden = true;
    if (fileDisplay) {
      fileDisplay.hidden = false;
      fileDisplay.textContent = '\uD83D\uDCC4 ' + file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
    }
  }

  // ── Form submit ──────────────────────────────────────────────────────────
  var form = document.getElementById('analyse-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var file = fileInput.files[0];
      if (!file) return;
      submitAnalysis(file);
    });
  }

  function submitAnalysis(file) {
    var email = document.getElementById('email').value.trim();
    var secteur = document.getElementById('secteur').value;
    var msgEl = document.getElementById('upload-msg');
    var loading = document.getElementById('loading');

    var uploadSection = document.getElementById('upload-section');
    var heroUpload = document.getElementById('hero');
    var formEl = document.querySelector('.upload-form');
    if (formEl) formEl.hidden = true;
    if (heroUpload && !uploadSection) {
      // On index.html — hide non-upload sections
      var sections = document.querySelectorAll('.section, .hero');
      sections.forEach(function(s) { if (s.id !== 'results-section') s.style.display = 'none'; });
      heroUpload.style.display = 'block';
    }
    loading.hidden = false;
    msgEl.hidden = true;

    // Animate loading steps
    var steps = loading.querySelectorAll('.loading-step');
    setTimeout(function () { steps[1].classList.add('active'); }, 3000);
    setTimeout(function () { steps[2].classList.add('active'); }, 8000);

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
        // Push token to URL without reload
        history.replaceState(null, '', '?token=' + data.token);
        if (data.unlocked) {
          renderFull(data);
        } else {
          renderPreview(data);
        }
      })
      .catch(function (err) {
        loading.hidden = true;
        var formEl2 = document.querySelector('.upload-form');
        if (formEl2) formEl2.hidden = false;
        // Restore hidden sections on index.html
        var allSections = document.querySelectorAll('.section, .hero');
        allSections.forEach(function(s) { s.style.display = ''; });
        msgEl.hidden = false;
        msgEl.textContent = err.message || 'Erreur lors de l\u2019analyse.';
      });
  }

  // ── Load existing analysis ───────────────────────────────────────────────
  function loadAnalysis(token) {
    // Hide all page content, show loading
    var allSections = document.querySelectorAll('.section, .hero, footer');
    allSections.forEach(function(s) { if (s.id !== 'results-section') s.style.display = 'none'; });
    var loading = document.getElementById('loading');
    if (loading) loading.hidden = false;

    fetch(API + '/api/analyse/' + token)
      .then(function (res) {
        if (!res.ok) throw new Error('Analyse introuvable');
        return res.json();
      })
      .then(function (data) {
        if (loading) loading.hidden = true;
        if (data.unlocked) {
          renderFull(data);
        } else {
          renderPreview(data);
        }
      })
      .catch(function () {
        if (loading) loading.hidden = true;
        allSections.forEach(function(s) { s.style.display = ''; });
      });
  }

  // ── Render freemium preview ──────────────────────────────────────────────
  function renderPreview(data) {
    var _up = document.getElementById('upload-section');
    if (_up) _up.hidden = true;
    document.getElementById('loading').hidden = true;
    var results = document.getElementById('results-section');
    results.hidden = false;

    if (data.is_consolidated) {
      document.getElementById('consolidated-notice').hidden = false;
    }

    document.getElementById('result-year').textContent = data.annee ? '(' + data.annee + ')' : '';
    animateScore(data.score_sante || 50);

    var f = data.freemium || {};
    document.getElementById('m-ebitda').textContent = formatEur(f.ebitda);
    document.getElementById('m-roe').textContent = formatPct(f.roe);
    document.getElementById('m-liquidite').textContent = formatRatio(f.liquidite_generale);
    document.getElementById('m-solvabilite').textContent = formatPct(f.solvabilite);

    // Paywall
    document.getElementById('paywall').hidden = false;
    document.getElementById('full-results').hidden = true;

    // Pay button
    document.getElementById('pay-btn').onclick = function () {
      var token = data.token;
      this.disabled = true;
      this.textContent = 'Redirection vers Stripe...';
      fetch(API + '/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.checkout_url) window.location.href = d.checkout_url;
        })
        .catch(function () {
          document.getElementById('pay-btn').disabled = false;
          document.getElementById('pay-btn').textContent = 'D\u00e9bloquer l\u2019analyse compl\u00e8te \u2014 19,99 \u20ac';
        });
    };
  }

  // ── Render full (unlocked) results ───────────────────────────────────────
  function renderFull(data) {
    var _up = document.getElementById('upload-section');
    if (_up) _up.hidden = true;
    document.getElementById('loading').hidden = true;
    var results = document.getElementById('results-section');
    results.hidden = false;

    if (data.is_consolidated) {
      document.getElementById('consolidated-notice').hidden = false;
    }

    document.getElementById('result-year').textContent = data.annee ? '(' + data.annee + ')' : '';
    animateScore(data.score_sante || 50);

    var f = data.freemium || {};
    document.getElementById('m-ebitda').textContent = formatEur(f.ebitda);
    document.getElementById('m-roe').textContent = formatPct(f.roe);
    document.getElementById('m-liquidite').textContent = formatRatio(f.liquidite_generale);
    document.getElementById('m-solvabilite').textContent = formatPct(f.solvabilite);

    // Show real valuation
    var full = data.full || {};
    var vr = full.valorisation_resume || {};
    document.getElementById('valuation-blurred').hidden = true;
    document.getElementById('valuation-clear').hidden = false;
    document.getElementById('val-low-clear').textContent = formatEur(vr.fourchette_equity_low);
    document.getElementById('val-high-clear').textContent = formatEur(vr.fourchette_equity_high);

    // Hide paywall, show full
    document.getElementById('paywall').hidden = true;
    document.getElementById('full-results').hidden = false;

    // Valuation details
    var valoGrid = document.getElementById('valo-details');
    valoGrid.innerHTML = '';
    var valoItems = [
      { label: 'EBITDA \u00d7 Multiple', value: formatEur(vr.ev_ebitda) },
      { label: 'Capitaux propres', value: formatEur(vr.capitaux_propres_comptables) },
      { label: 'Equity (EBITDA)', value: formatEur(vr.equity_ev_ebitda) },
      { label: 'DCF (Equity)', value: vr.dcf_equity ? formatEur(vr.dcf_equity) : 'N/A' },
      { label: 'Dette nette', value: formatEur(vr.dette_nette) },
      { label: 'Multiple', value: vr.multiple ? vr.multiple + 'x' : 'N/A' },
    ];
    valoItems.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = '<span class="metric-label">' + item.label + '</span><span class="metric-value">' + item.value + '</span>';
      valoGrid.appendChild(card);
    });

    // Ratios table
    var ratios = full.ratios || {};
    var table = document.getElementById('ratios-table');
    table.innerHTML = '';
    var groups = [
      { title: 'Rentabilit\u00e9', data: ratios.rentabilite || {}, fmt: { ebitda: 'eur', ebit: 'eur', marge_ebitda: 'pct', marge_nette: 'pct', roe: 'pct', roa: 'pct' } },
      { title: 'Structure', data: ratios.structure || {}, fmt: { dette_nette: 'eur', gearing: 'ratio', solvabilite: 'pct', dettes_ebitda: 'ratio', couverture_interets: 'ratio' } },
      { title: 'Liquidit\u00e9', data: ratios.liquidite || {}, fmt: { liquidite_generale: 'ratio', liquidite_reduite: 'ratio', bfr: 'eur', bfr_jours_ca: 'days' } },
    ];
    groups.forEach(function (g) {
      var header = document.createElement('div');
      header.className = 'ratio-group';
      header.textContent = g.title;
      table.appendChild(header);
      Object.keys(g.data).forEach(function (key) {
        var row = document.createElement('div');
        row.className = 'ratio-row';
        var fmt = g.fmt[key] || 'raw';
        var val = g.data[key];
        var formatted = fmt === 'eur' ? formatEur(val) : fmt === 'pct' ? formatPct(val) : fmt === 'ratio' ? formatRatio(val) : fmt === 'days' ? (val != null ? Math.round(val) + 'j' : 'N/A') : (val != null ? val : 'N/A');
        row.innerHTML = '<span class="ratio-name">' + humanize(key) + '</span><span class="ratio-val">' + formatted + '</span>';
        table.appendChild(row);
      });
    });

    // AI analysis
    var ai = full.ai_analysis || {};
    document.getElementById('ai-synthese').textContent = ai.synthese || '';
    fillList('ai-forts', ai.points_forts);
    fillList('ai-attention', ai.points_attention);
    fillList('ai-risques', ai.risques);
    fillList('ai-reco', ai.recommandations);
    document.getElementById('ai-valo').textContent = ai.valorisation_commentaire || '';
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function formatEur(v) {
    if (v == null) return 'N/A';
    return Math.round(v).toLocaleString('fr-BE') + ' \u20ac';
  }
  function formatPct(v) {
    if (v == null) return 'N/A';
    return (v * 100).toFixed(1) + '%';
  }
  function formatRatio(v) {
    if (v == null) return 'N/A';
    return v.toFixed(2);
  }
  function humanize(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function fillList(id, items) {
    var ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = '';
    (items || []).forEach(function (txt) {
      var li = document.createElement('li');
      li.textContent = txt;
      ul.appendChild(li);
    });
  }
  function animateScore(target) {
    var arc = document.getElementById('score-arc');
    var val = document.getElementById('score-val');
    if (!arc || !val) return;
    var circumference = 327;
    var offset = circumference - (target / 100) * circumference;
    arc.style.transition = 'stroke-dashoffset 1.5s ease-out';
    arc.style.strokeDashoffset = offset;
    // Color based on score
    if (target >= 70) arc.style.stroke = '#00c896';
    else if (target >= 40) arc.style.stroke = '#ffb432';
    else arc.style.stroke = '#ff6b6b';
    // Animate number
    var current = 0;
    var step = Math.ceil(target / 30);
    var interval = setInterval(function () {
      current += step;
      if (current >= target) { current = target; clearInterval(interval); }
      val.textContent = current;
    }, 40);
  }
})();
