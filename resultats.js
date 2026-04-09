/* BWIX — Results page logic */
(function () {
  'use strict';

  var API = 'https://bwix-api.onrender.com';
  var params = new URLSearchParams(window.location.search);
  var token = params.get('token');

  if (!token) { window.location.href = '/'; return; }

  document.getElementById('loading').hidden = false;
  setProgress(10, 'Chargement de l\u2019analyse...');

  fetch(API + '/api/analyse/' + token)
    .then(function (res) {
      if (!res.ok) throw new Error();
      setProgress(80, 'Affichage des r\u00e9sultats...');
      return res.json();
    })
    .then(function (data) {
      setProgress(100, 'Termin\u00e9');
      setTimeout(function () {
        document.getElementById('loading').hidden = true;
        // If not unlocked and free slots available → show email modal
        if (!data.unlocked) {
          showEmailModal(data);
        } else {
          render(data);
        }
      }, 300);
    })
    .catch(function () { window.location.href = '/'; });

  function setProgress(pct, label) {
    var f = document.getElementById('progress-fill');
    var l = document.getElementById('progress-label');
    var p = document.getElementById('progress-pct');
    if (f) f.style.width = pct + '%';
    if (l) l.textContent = label;
    if (p) p.textContent = pct + '%';
  }

  // ── Email capture modal (free slots) ──────────────────────────────────────
  function showEmailModal(data) {
    // Check if free slots remain
    fetch(API + '/api/free-slots').then(function(r){return r.json();}).then(function(d){
      if (d.free_slots > 0) {
        // Show email modal
        var modal = document.getElementById('email-modal');
        modal.hidden = false;
        var input = document.getElementById('free-email');
        var btn = document.getElementById('free-email-btn');
        var msg = document.getElementById('free-email-msg');
        input.focus();

        btn.onclick = function() {
          var email = input.value.trim();
          if (!email || email.indexOf('@') < 0) { msg.hidden = false; msg.style.color = '#ff6b6b'; msg.textContent = 'Email invalide.'; return; }
          btn.disabled = true;
          btn.textContent = 'V\u00e9rification...';
          msg.hidden = true;

          fetch(API + '/api/claim-free', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: email, token: token}),
          })
            .then(function(r){ return r.json().then(function(j){ j._status = r.status; return j; }); })
            .then(function(j){
              if (j.already_used && j.previous_token) {
                msg.hidden = false; msg.style.color = '#ffb432';
                msg.textContent = 'Cet email a d\u00e9j\u00e0 utilis\u00e9 son analyse gratuite.';
                setTimeout(function(){ window.location.href = '/resultats?token=' + j.previous_token; }, 1500);
                return;
              }
              if (j._status >= 400) {
                throw new Error(j.detail || 'Erreur');
              }
              // Success — reload to show unlocked results
              modal.hidden = true;
              window.location.reload();
            })
            .catch(function(err){
              btn.disabled = false;
              btn.textContent = 'Acc\u00e9der \u00e0 mon analyse gratuite \u2192';
              msg.hidden = false; msg.style.color = '#ff6b6b';
              msg.textContent = err.message || 'Erreur.';
            });
        };

        // Also allow Enter key
        input.onkeydown = function(e){ if (e.key === 'Enter') { e.preventDefault(); btn.click(); } };

        // Code access in email modal
        var showCode = document.getElementById('modal-show-code');
        var codeSection = document.getElementById('modal-code-section');
        var codeInput = document.getElementById('modal-promo-code');
        var codeBtn = document.getElementById('modal-redeem-btn');
        var codeMsg2 = document.getElementById('modal-code-msg');

        if (showCode) showCode.onclick = function(e) {
          e.preventDefault();
          codeSection.hidden = false;
          showCode.parentElement.hidden = true;
          codeInput.focus();
        };

        if (codeBtn) codeBtn.onclick = function() {
          var code = codeInput.value.trim();
          if (!code) return;
          codeBtn.disabled = true;
          codeBtn.textContent = 'V\u00e9rification...';
          codeMsg2.hidden = true;

          fetch(API + '/api/redeem-code', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({code: code, token: token}),
          })
            .then(function(r) {
              if (!r.ok) return r.json().then(function(d) { throw new Error(d.detail || 'Code invalide'); });
              return r.json();
            })
            .then(function() {
              codeMsg2.hidden = false;
              codeMsg2.style.color = '#00c896';
              codeMsg2.textContent = 'Analyse d\u00e9bloqu\u00e9e !';
              setTimeout(function() { window.location.reload(); }, 800);
            })
            .catch(function(err) {
              codeBtn.disabled = false;
              codeBtn.textContent = 'Valider';
              codeMsg2.hidden = false;
              codeMsg2.style.color = '#ff6b6b';
              codeMsg2.textContent = err.message;
            });
        };

        if (codeInput) codeInput.onkeydown = function(e) { if (e.key === 'Enter') { e.preventDefault(); codeBtn.click(); } };
      } else {
        // No free slots — render normally with paywall
        render(data);
      }
    }).catch(function(){
      // API error — fallback to normal render
      render(data);
    });
  }

  // ── Main render ──────────────────────────────────────────────────────────
  function render(data) {
    var unlocked = data.unlocked;
    var ratios = (data.full || {}).ratios || {};
    var secteur = (data.full || {}).secteur || '';
    var results = document.getElementById('results-section');
    results.hidden = false;

    if (data.is_consolidated) document.getElementById('consolidated-notice').hidden = false;

    // CORRECTION 4a: dynamic header
    var sub = document.getElementById('results-sub');
    var annees = data.annees_disponibles || [data.annee];
    sub.textContent = 'Bas\u00e9e sur : ' + annees.filter(Boolean).join(', ');
    if (annees.length < 3) {
      sub.textContent += ' \u2014 \u26a1 3 \u00e0 5 exercices recommand\u00e9s pour une valorisation fiable';
    }

    animateScore(data.score_sante || 50);
    renderDeductions(data.score_deductions || []);
    renderMultiInfo(data);

    // Structure particulière
    var sp = document.getElementById('structure-notice');
    if (sp && data.is_structure_particuliere) sp.hidden = false;

    // Valuation — handle negative EBITDA
    var vf = data.valorisation_floue || {};
    var vr = (data.full || {}).valorisation_resume || vf;
    var ebitda = (data.freemium || {}).ebitda || (data.ebitda_n) || 0;
    var valCard = document.querySelector('.valuation-card');
    var valLow = document.getElementById('val-low');
    var valHigh = document.getElementById('val-high');

    if (ebitda < 0) {
      // Negative EBITDA — show asset-based valuation only
      var cp = unlocked ? (vr.capitaux_propres_comptables || 0) : null;
      valCard.innerHTML = '<h3>Valorisation de l\u2019entreprise</h3>'
        + '<div class="disclaimer-box disclaimer-box--warning" style="margin:16px 0;text-align:left">'
        + '<strong>\u26a0\ufe0f Soci\u00e9t\u00e9 en difficult\u00e9 financi\u00e8re</strong>'
        + '<p>Valorisation par les b\u00e9n\u00e9fices non applicable (EBITDA n\u00e9gatif). '
        + 'Valorisation bas\u00e9e sur les actifs nets uniquement.</p></div>'
        + '<div class="valuation-range"><span class="valuation-label">Valeur plancher estim\u00e9e : capitaux propres</span>'
        + '<span class="valuation-amount' + (unlocked ? '' : ' blurred') + '">' + (cp != null ? fmtEurRaw(cp) : '---') + '</span>'
        + '<span class="valuation-currency">\u20ac</span></div>';
    } else if (unlocked) {
      valLow.textContent = fmtEurRaw(vr.fourchette_equity_low);
      valHigh.textContent = fmtEurRaw(vr.fourchette_equity_high);
    } else {
      valLow.textContent = fmtEurRaw(vf.fourchette_low);
      valHigh.textContent = fmtEurRaw(vf.fourchette_high);
      valLow.classList.add('blurred');
      valHigh.classList.add('blurred');
    }

    // ── Build ratio grid ─────────────────────────────────────────────────
    var grid = document.getElementById('ratio-grid');
    grid.innerHTML = '';
    var lockedCount = 0;

    // Map ratio keys to badge keys
    var BADGE_MAP = {
      'roe': 'roe', 'liquidite_generale': 'liquidite', 'solvabilite': 'solvabilite',
      'gearing': 'gearing', 'dettes_ebitda': 'dette_ebitda', 'couverture_interets': 'couverture'
    };
    var BADGE_COLORS = { 'vert': '#00c896', 'jaune': '#f59e0b', 'rouge': '#ef4444', 'gris': '#5a7fa0' };
    var allBadges = data.badges || ratios.badges || {};

    RATIOS_ORDER.forEach(function (key) {
      var def = RATIOS_DATA[key];
      if (!def) return;
      var val = unlocked ? def.path(ratios) : (def.free ? def.path(data.freemium || {}) : def.path(ratios));
      if (!unlocked && def.free && key === 'ebitda') val = (data.freemium || {}).ebitda;
      var isFree = def.free;
      var isLocked = !unlocked && !isFree;
      if (isLocked) lockedCount++;

      // Get badge for this ratio
      var badgeKey = BADGE_MAP[key];
      var badge = badgeKey ? allBadges[badgeKey] : null;
      var badgeColor = badge ? (BADGE_COLORS[badge.badge] || '') : '';

      var card = document.createElement('div');
      card.className = 'ratio-card' + (isLocked ? ' ratio-card--locked' : '');
      card.setAttribute('data-ratio', key);
      if (badgeColor && !isLocked) card.style.borderTop = '3px solid ' + badgeColor;

      var formatted;
      var override = def.formatOverride ? def.formatOverride(val) : null;
      if (override && !isLocked) {
        formatted = override;
      } else if (isLocked) {
        formatted = def.unit === 'eur' ? '---' : def.unit === 'pct' ? '--%' : '--';
        if (val != null) formatted = formatVal(val, def.unit);
      } else {
        formatted = val != null ? formatVal(val, def.unit) : 'N/A';
      }

      // N-1 secondary value
      var n1Html = '';
      if (unlocked && data.annee_precedente && !isLocked && def.path_n1) {
        var valN1 = def.path_n1(ratios, data);
        if (valN1 != null) {
          var fmtN1 = def.formatOverride ? def.formatOverride(valN1) : null;
          n1Html = '<span class="ratio-card__n1">' + data.annee_precedente + ' : ' + (fmtN1 || formatVal(valN1, def.unit)) + '</span>';
        }
      }
      var yearLabel = data.annee ? '<span class="ratio-card__year">' + data.annee + '</span>' : '';

      // Badge pill HTML
      var badgeHtml = '';
      if (badge && !isLocked) {
        badgeHtml = '<span class="ratio-card__badge" style="background:' + badgeColor + '15;color:' + badgeColor + '">' + badge.label + '</span>';
      }

      card.innerHTML = '<span class="ratio-card__info">\u24d8</span>'
        + '<span class="ratio-card__label">' + def.label + '</span>'
        + '<span class="ratio-card__value">' + formatted + '</span>'
        + yearLabel + n1Html + badgeHtml
        + (isLocked ? '<span class="ratio-card__hover">D\u00e9bloquer</span>' : '');

      card.onclick = function () { openModal(key, val, isLocked, unlocked, secteur, data); };
      grid.appendChild(card);
    });

    // FOMO counter
    if (!unlocked && lockedCount > 0) {
      var fomo = document.getElementById('fomo-counter');
      fomo.hidden = false;
      fomo.innerHTML = '\uD83D\uDD12 <strong>' + lockedCount + ' indicateurs masqu\u00e9s</strong> \u2014 d\u00e9bloquez l\u2019analyse compl\u00e8te pour 19,99\u00a0\u20ac';
    }

    // Onboarding tooltip (once)
    if (!localStorage.getItem('bwix_ratio_tip')) {
      var tip = document.createElement('div');
      tip.className = 'ratio-onboarding';
      tip.id = 'ratio-tip';
      tip.innerHTML = '\u24d8 Cliquez sur un ratio pour l\u2019explication d\u00e9taill\u00e9e et les benchmarks sectoriels';
      grid.parentNode.insertBefore(tip, grid.nextSibling);
      setTimeout(function(){ var t = document.getElementById('ratio-tip'); if(t) t.style.opacity='0'; setTimeout(function(){if(t)t.remove();},300); }, 5000);
      // Dismiss on first card click
      grid.addEventListener('click', function dismissTip() {
        localStorage.setItem('bwix_ratio_tip','1');
        var t = document.getElementById('ratio-tip'); if(t) t.remove();
        grid.removeEventListener('click', dismissTip);
      });
    }

    // Paywall
    if (unlocked) {
      document.getElementById('paywall').hidden = true;
      document.getElementById('full-results').hidden = false;
      var ai = (data.full || {}).ai_analysis || {};
      document.getElementById('ai-synthese').textContent = ai.synthese || '';
      fillList('ai-forts', ai.points_forts);
      fillList('ai-attention', ai.points_attention);
      fillList('ai-risques', ai.risques);
      fillList('ai-reco', ai.recommandations);
      document.getElementById('ai-valo').textContent = ai.valorisation_commentaire || '';

      // Add exercises upsell
      renderAddExercises(data);
    } else {
      document.getElementById('paywall').hidden = false;
      document.getElementById('full-results').hidden = true;
      setupPaywall(data);
    }
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  function openModal(key, val, isLocked, unlocked, secteur, fullData) {
    var def = RATIOS_DATA[key];
    if (!def) return;
    var modal = document.getElementById('ratio-modal');
    document.getElementById('modal-title').textContent = def.title;

    var valEl = document.getElementById('modal-value');
    var modalOverride = def.formatOverride ? def.formatOverride(val) : null;
    if (isLocked) {
      valEl.textContent = '\uD83D\uDD12 Valeur masqu\u00e9e';
      valEl.className = 'modal__value locked';
    } else if (modalOverride) {
      valEl.textContent = modalOverride;
      valEl.className = 'modal__value';
    } else {
      valEl.textContent = val != null ? formatVal(val, def.unit) : 'N/A';
      valEl.className = 'modal__value';
    }

    document.getElementById('modal-explain').textContent = def.explain;

    // Benchmark from backend badges
    var benchEl = document.getElementById('modal-benchmark');
    if (!benchEl) {
      benchEl = document.createElement('p');
      benchEl.id = 'modal-benchmark';
      benchEl.className = 'modal__benchmark';
      document.getElementById('modal-value').parentNode.insertBefore(benchEl, document.getElementById('modal-explain'));
    }
    var badgeKey2 = {roe:'roe',liquidite_generale:'liquidite',solvabilite:'solvabilite',gearing:'gearing',dettes_ebitda:'dette_ebitda',couverture_interets:'couverture'}[key];
    var allB = fullData ? (fullData.badges || ((fullData.full || {}).ratios || {}).badges || {}) : {};
    var b2 = badgeKey2 ? allB[badgeKey2] : null;
    if (b2 && b2.benchmark && !isLocked) {
      benchEl.textContent = b2.benchmark;
      benchEl.hidden = false;
    } else {
      benchEl.hidden = true;
    }

    var interp = document.getElementById('modal-interpret');
    var extra = fullData ? (fullData.valorisation || {}) : {};
    if (isLocked) {
      interp.textContent = 'D\u00e9bloquez l\u2019analyse pour voir la valeur et l\u2019interpr\u00e9tation contextualis\u00e9e.';
    } else if (def.interpret) {
      interp.textContent = def.interpret(val, secteur, extra);
    } else {
      interp.textContent = '';
    }

    var cta = document.getElementById('modal-cta');
    cta.hidden = !isLocked;
    if (isLocked) {
      document.getElementById('modal-unlock-btn').onclick = function () {
        modal.hidden = true;
        document.getElementById('pay-btn').scrollIntoView({ behavior: 'smooth' });
      };
    }

    modal.hidden = false;
  }

  // Close modal
  document.getElementById('modal-close').onclick = function () {
    document.getElementById('ratio-modal').hidden = true;
  };
  document.getElementById('ratio-modal').onclick = function (e) {
    if (e.target === this) this.hidden = true;
  };

  // ── Score deductions ──────────────────────────────────────────────────────
  function renderDeductions(deductions) {
    var el = document.getElementById('score-deductions');
    if (!el || !deductions || deductions.length === 0) return;
    el.hidden = false;
    var html = '<p class="score-deductions__title">Pourquoi ce score ?</p><ul class="score-deductions__list">';
    deductions.forEach(function (d) {
      html += '<li>' + d.motif + ' <span>' + d.points + ' pts</span></li>';
    });
    html += '</ul>';
    el.innerHTML = html;
  }

  // ── Multi-exercise info ──────────────────────────────────────────────────
  function renderMultiInfo(data) {
    var nb = data.nb_exercices || 1;
    var info = document.getElementById('multi-info');
    if (info && nb >= 2) {
      info.hidden = false;
      info.innerHTML = '\uD83D\uDCCA Analyse bas\u00e9e sur ' + nb + ' exercices (' + data.annee + ' + ' + data.annee_precedente + ')<br><a href="#add-exercises" style="color:#00c896;text-decoration:none">\u26A1 3 \u00e0 5 exercices recommand\u00e9s pour une valorisation fiable \u2192</a>';
    }
    var bd = document.getElementById('ebitda-breakdown');
    if (bd && data.ebitda_n != null) {
      bd.hidden = false;
      var parts = ['EBITDA ' + data.annee + ' : <strong>' + fmtEur(data.ebitda_n) + '</strong>'];
      if (data.ebitda_n1 != null) parts.push('EBITDA ' + data.annee_precedente + ' : <strong>' + fmtEur(data.ebitda_n1) + '</strong>');
      if (data.ebitda_moyenne != null && nb >= 2) parts.push('Moyenne : <strong>' + fmtEur(data.ebitda_moyenne) + '</strong> \u2190 valorisation');
      bd.innerHTML = parts.join(' &nbsp;|&nbsp; ');
    }
    var warn = document.getElementById('ebitda-warning');
    if (warn && data.ebitda_variation != null && data.ebitda_variation > 0.30) {
      warn.hidden = false;
      if (data.is_structure_particuliere) {
        warn.querySelector('p').textContent = 'Variation EBITDA importante \u2014 fr\u00e9quent pour ce type de structure. La valorisation reste indicative.';
      }
    }
  }

  // ── Paywall setup ────────────────────────────────────────────────────────
  function setupPaywall(data) {
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

  // ── Add exercises upsell ──────────────────────────────────────────────────
  function renderAddExercises(data) {
    var el = document.getElementById('add-exercises');
    if (!el) return;
    var nb = data.nb_exercices || 1;
    if (nb >= 5) return; // Already have 5 years

    el.hidden = false;
    var sub = document.getElementById('add-exercises-sub');
    sub.textContent = 'Bas\u00e9e sur ' + nb + ' exercice' + (nb > 1 ? 's' : '') + '. Les experts recommandent 3 \u00e0 5 ans pour une valorisation fiable.';

    var btns = document.getElementById('add-exercises-btns');
    btns.innerHTML = '';
    var baseYear = data.annee_precedente || (data.annee - 1);
    var yearsToPropose = [];
    for (var y = baseYear - 1; y >= baseYear - 3 && yearsToPropose.length < 3; y--) {
      yearsToPropose.push(y);
    }

    yearsToPropose.forEach(function(year) {
      var btn = document.createElement('button');
      btn.className = 'add-exercises__btn';
      btn.innerHTML = '+ Ajouter ' + year + ' <span>19,99\u00a0\u20ac</span>';
      btn.onclick = function() {
        // Redirect to home with prefilled year context
        window.location.href = '/#analyse';
      };
      btns.appendChild(btn);
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function formatVal(v, unit) {
    if (v == null) return 'N/A';
    if (unit === 'eur') return Math.round(v).toLocaleString('fr-BE') + ' \u20ac';
    if (unit === 'pct') return (v * 100).toFixed(1) + '%';
    if (unit === 'ratio') return v.toFixed(2);
    if (unit === 'days') return Math.round(v) + 'j';
    return String(v);
  }
  function fmtEur(v) { return v == null ? 'N/A' : Math.round(v).toLocaleString('fr-BE') + ' \u20ac'; }
  function fmtEurRaw(v) { return v == null ? '---' : Math.round(v).toLocaleString('fr-BE'); }
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
    arc.style.transition = 'stroke-dashoffset 1.5s ease-out';
    arc.style.strokeDashoffset = 327 - (target / 100) * 327;
    var color = target >= 70 ? '#00c896' : target >= 50 ? '#ffb432' : target >= 30 ? '#ff8c00' : '#ff6b6b';
    arc.style.stroke = color;
    var cur = 0, step = Math.ceil(target / 30);
    var iv = setInterval(function () { cur += step; if (cur >= target) { cur = target; clearInterval(iv); } val.textContent = cur; }, 40);
    // Score context label
    var label = document.getElementById('score-context');
    if (!label) {
      label = document.createElement('span');
      label.id = 'score-context';
      label.className = 'score-context';
      var scoreLabel = document.querySelector('.score-label');
      if (scoreLabel) scoreLabel.parentNode.insertBefore(label, scoreLabel.nextSibling);
    }
    var text, cls;
    if (target < 30) { text = 'Situation financi\u00e8re critique'; cls = 'score-context--red'; }
    else if (target < 50) { text = 'Situation financi\u00e8re fragile'; cls = 'score-context--orange'; }
    else if (target < 70) { text = 'Situation financi\u00e8re correcte'; cls = 'score-context--yellow'; }
    else { text = 'Bonne sant\u00e9 financi\u00e8re'; cls = 'score-context--green'; }
    label.textContent = text;
    label.className = 'score-context ' + cls;
  }
})();
