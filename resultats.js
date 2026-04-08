/* BWIX — Results page logic */
(function () {
  'use strict';

  var API = 'https://bwix-api.onrender.com';
  var params = new URLSearchParams(window.location.search);
  var token = params.get('token');

  if (!token) {
    window.location.href = '/';
    return;
  }

  document.getElementById('loading').hidden = false;
  setProgress(10, 'Chargement de l\u2019analyse...');

  fetch(API + '/api/analyse/' + token)
    .then(function (res) {
      if (!res.ok) throw new Error('Analyse introuvable');
      setProgress(80, 'Affichage des r\u00e9sultats...');
      return res.json();
    })
    .then(function (data) {
      setProgress(100, 'Termin\u00e9');
      setTimeout(function () {
        document.getElementById('loading').hidden = true;
        if (data.unlocked) {
          renderFull(data);
        } else {
          renderPreview(data);
        }
      }, 300);
    })
    .catch(function () {
      window.location.href = '/';
    });

  // ── Progress bar ──
  function setProgress(pct, label) {
    var fill = document.getElementById('progress-fill');
    var lbl = document.getElementById('progress-label');
    var pctEl = document.getElementById('progress-pct');
    if (fill) fill.style.width = pct + '%';
    if (lbl) lbl.textContent = label;
    if (pctEl) pctEl.textContent = pct + '%';
  }

  // ── Shared: render multi-exercise info ──
  function renderMultiInfo(data) {
    var nb = data.nb_exercices || 1;
    var info = document.getElementById('multi-info');
    if (info && nb >= 2) {
      info.hidden = false;
      info.innerHTML = '\uD83D\uDCCA Analyse bas\u00e9e sur ' + nb + ' exercices (' + data.annee + ' + ' + data.annee_precedente + ' inclus dans ce bilan)<br>\u26A1 3 \u00e0 5 exercices recommand\u00e9s pour une valorisation fiable';
    }
    // EBITDA breakdown
    var bd = document.getElementById('ebitda-breakdown');
    if (bd && data.ebitda_n != null) {
      bd.hidden = false;
      var parts = ['EBITDA ' + data.annee + ' : <strong>' + fmtEur(data.ebitda_n) + '</strong>'];
      if (data.ebitda_n1 != null) parts.push('EBITDA ' + data.annee_precedente + ' : <strong>' + fmtEur(data.ebitda_n1) + '</strong>');
      if (data.ebitda_moyenne != null && nb >= 2) parts.push('Moyenne : <strong>' + fmtEur(data.ebitda_moyenne) + '</strong> \u2190 utilis\u00e9e pour la valorisation');
      bd.innerHTML = parts.join(' &nbsp;|&nbsp; ');
    }
    // EBITDA variation warning (warning-only for structures particulières)
    var warn = document.getElementById('ebitda-warning');
    if (warn && data.ebitda_variation != null && data.ebitda_variation > 0.30) {
      warn.hidden = false;
      if (data.is_structure_particuliere) {
        warn.querySelector('p').textContent = 'Variation EBITDA importante \u2014 fr\u00e9quent pour ce type de structure (management fees, dividendes, op\u00e9rations ponctuelles). La valorisation reste indicative.';
      }
    }
    // Structure particulière notice
    var sp = document.getElementById('structure-notice');
    if (sp && data.is_structure_particuliere) {
      sp.hidden = false;
    }
  }

  // ── Preview (freemium) ──
  function renderPreview(data) {
    var results = document.getElementById('results-section');
    results.hidden = false;

    if (data.is_consolidated) document.getElementById('consolidated-notice').hidden = false;
    document.getElementById('result-year').textContent = data.annee ? '(' + data.annee + ')' : '';
    animateScore(data.score_sante || 50);
    renderMultiInfo(data);

    var f = data.freemium || {};
    document.getElementById('m-ebitda').textContent = fmtEur(f.ebitda);
    document.getElementById('m-roe').textContent = fmtPct(f.roe);
    document.getElementById('m-liquidite').textContent = fmtRatio(f.liquidite_generale);
    document.getElementById('m-solvabilite').textContent = fmtPct(f.solvabilite);

    // Blurred valuation with real numbers
    var vf = data.valorisation_floue || {};
    var valLow = document.getElementById('val-low');
    var valHigh = document.getElementById('val-high');
    if (vf.fourchette_low != null) valLow.textContent = fmtEurRaw(vf.fourchette_low);
    if (vf.fourchette_high != null) valHigh.textContent = fmtEurRaw(vf.fourchette_high);
    valLow.classList.add('blurred');
    valHigh.classList.add('blurred');

    // Show locked add-exercise button
    var addLocked = document.getElementById('add-exercise-locked');
    if (addLocked) addLocked.hidden = false;

    document.getElementById('paywall').hidden = false;
    document.getElementById('full-results').hidden = true;

    document.getElementById('pay-btn').onclick = function () {
      this.disabled = true;
      this.textContent = 'Redirection vers Stripe...';
      fetch(API + '/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d.checkout_url) window.location.href = d.checkout_url; })
        .catch(function () {
          document.getElementById('pay-btn').disabled = false;
          document.getElementById('pay-btn').textContent = 'D\u00e9bloquer maintenant \u2014 19,99 \u20ac';
        });
    };

    // Promo code
    var showLink = document.getElementById('show-code-input');
    var codeSection = document.getElementById('code-section');
    var redeemBtn = document.getElementById('redeem-btn');
    var codeMsg = document.getElementById('code-msg');

    if (showLink) showLink.onclick = function (e) {
      e.preventDefault();
      codeSection.hidden = false;
      showLink.parentElement.hidden = true;
      document.getElementById('promo-code').focus();
    };

    if (redeemBtn) redeemBtn.onclick = function () {
      var code = document.getElementById('promo-code').value.trim();
      if (!code) return;
      redeemBtn.disabled = true;
      redeemBtn.textContent = 'V\u00e9rification...';
      codeMsg.hidden = true;

      fetch(API + '/api/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, token: token }),
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (d) { throw new Error(d.detail || 'Code invalide'); });
          return r.json();
        })
        .then(function () {
          codeMsg.hidden = false;
          codeMsg.className = 'paywall__code-msg';
          codeMsg.textContent = 'Analyse d\u00e9bloqu\u00e9e !';
          setTimeout(function () { window.location.reload(); }, 800);
        })
        .catch(function (err) {
          redeemBtn.disabled = false;
          redeemBtn.textContent = 'Valider';
          codeMsg.hidden = false;
          codeMsg.className = 'paywall__code-msg error';
          codeMsg.textContent = err.message;
        });
    };
  }

  // ── Full (unlocked) ──
  function renderFull(data) {
    var results = document.getElementById('results-section');
    results.hidden = false;

    if (data.is_consolidated) document.getElementById('consolidated-notice').hidden = false;
    document.getElementById('result-year').textContent = data.annee ? '(' + data.annee + ')' : '';
    animateScore(data.score_sante || 50);
    renderMultiInfo(data);

    // Hide locked button
    var addLocked = document.getElementById('add-exercise-locked');
    if (addLocked) addLocked.hidden = true;

    var f = data.freemium || {};
    document.getElementById('m-ebitda').textContent = fmtEur(f.ebitda);
    document.getElementById('m-roe').textContent = fmtPct(f.roe);
    document.getElementById('m-liquidite').textContent = fmtRatio(f.liquidite_generale);
    document.getElementById('m-solvabilite').textContent = fmtPct(f.solvabilite);

    var full = data.full || {};
    var vr = full.valorisation_resume || {};
    var valLow = document.getElementById('val-low');
    var valHigh = document.getElementById('val-high');
    valLow.textContent = fmtEurRaw(vr.fourchette_equity_low);
    valHigh.textContent = fmtEurRaw(vr.fourchette_equity_high);
    valLow.classList.remove('blurred');
    valHigh.classList.remove('blurred');

    document.getElementById('paywall').hidden = true;
    document.getElementById('full-results').hidden = false;

    // Valuation details
    var valoGrid = document.getElementById('valo-details');
    valoGrid.innerHTML = '';
    [
      { label: 'EBITDA \u00d7 Multiple', value: fmtEur(vr.ev_ebitda) },
      { label: 'Capitaux propres', value: fmtEur(vr.capitaux_propres_comptables) },
      { label: 'Equity (EBITDA)', value: fmtEur(vr.equity_ev_ebitda) },
      { label: 'DCF (Equity)', value: vr.dcf_equity ? fmtEur(vr.dcf_equity) : 'N/A' },
      { label: 'Dette nette', value: fmtEur(vr.dette_nette) },
      { label: 'Multiple', value: vr.multiple ? vr.multiple + 'x' : 'N/A' },
    ].forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = '<span class="metric-label">' + item.label + '</span><span class="metric-value">' + item.value + '</span>';
      valoGrid.appendChild(card);
    });

    // Ratios table
    var ratios = full.ratios || {};
    var table = document.getElementById('ratios-table');
    table.innerHTML = '';
    [
      { title: 'Rentabilit\u00e9', data: ratios.rentabilite || {}, fmt: { ebitda: 'eur', ebit: 'eur', marge_ebitda: 'pct', marge_nette: 'pct', roe: 'pct', roa: 'pct' } },
      { title: 'Structure', data: ratios.structure || {}, fmt: { dette_nette: 'eur', gearing: 'ratio', solvabilite: 'pct', dettes_ebitda: 'ratio', couverture_interets: 'ratio' } },
      { title: 'Liquidit\u00e9', data: ratios.liquidite || {}, fmt: { liquidite_generale: 'ratio', liquidite_reduite: 'ratio', bfr: 'eur', bfr_jours_ca: 'days' } },
    ].forEach(function (g) {
      var header = document.createElement('div');
      header.className = 'ratio-group';
      header.textContent = g.title;
      table.appendChild(header);
      Object.keys(g.data).forEach(function (key) {
        var row = document.createElement('div');
        row.className = 'ratio-row';
        var f2 = g.fmt[key] || 'raw';
        var val = g.data[key];
        var txt = f2 === 'eur' ? fmtEur(val) : f2 === 'pct' ? fmtPct(val) : f2 === 'ratio' ? fmtRatio(val) : f2 === 'days' ? (val != null ? Math.round(val) + 'j' : 'N/A') : (val != null ? val : 'N/A');
        row.innerHTML = '<span class="ratio-name">' + humanize(key) + '</span><span class="ratio-val">' + txt + '</span>';
        table.appendChild(row);
      });
    });

    // AI
    var ai = full.ai_analysis || {};
    document.getElementById('ai-synthese').textContent = ai.synthese || '';
    fillList('ai-forts', ai.points_forts);
    fillList('ai-attention', ai.points_attention);
    fillList('ai-risques', ai.risques);
    fillList('ai-reco', ai.recommandations);
    document.getElementById('ai-valo').textContent = ai.valorisation_commentaire || '';
  }

  // ── Helpers ──
  function fmtEur(v) { return v == null ? 'N/A' : Math.round(v).toLocaleString('fr-BE') + ' \u20ac'; }
  function fmtEurRaw(v) { return v == null ? '---' : Math.round(v).toLocaleString('fr-BE'); }
  function fmtPct(v) { return v == null ? 'N/A' : (v * 100).toFixed(1) + '%'; }
  function fmtRatio(v) { return v == null ? 'N/A' : v.toFixed(2); }
  function humanize(k) { return k.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function fillList(id, items) {
    var ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = '';
    (items || []).forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
  }
  function animateScore(target) {
    var arc = document.getElementById('score-arc');
    var val = document.getElementById('score-val');
    if (!arc || !val) return;
    var offset = 327 - (target / 100) * 327;
    arc.style.transition = 'stroke-dashoffset 1.5s ease-out';
    arc.style.strokeDashoffset = offset;
    arc.style.stroke = target >= 70 ? '#00c896' : target >= 40 ? '#ffb432' : '#ff6b6b';
    var cur = 0, step = Math.ceil(target / 30);
    var iv = setInterval(function () { cur += step; if (cur >= target) { cur = target; clearInterval(iv); } val.textContent = cur; }, 40);
  }
})();
