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

    // Denomination
    var denomEl = document.getElementById('results-denom');
    if (denomEl && data.denomination) denomEl.textContent = data.denomination;

    // Tabs (if 2+ exercises)
    var tabsEl = document.getElementById('analyse-tabs');
    var nbEx = data.exercices_count || data.nb_exercices || 1;
    var annees = data.annees_disponibles || [data.annee];
    if (nbEx >= 2 && tabsEl) {
      tabsEl.hidden = false;
      tabsEl.innerHTML = '<button class="tab active" data-tab="synthese">Synth\u00e8se ' + annees.filter(Boolean).join('-') + '</button>';
      annees.filter(Boolean).sort(function(a,b){return b-a;}).forEach(function(y){
        tabsEl.innerHTML += '<button class="tab" data-tab="' + y + '">' + y + '</button>';
      });
      tabsEl.innerHTML += '<button class="tab tab-add" data-tab="add">+ Ajouter</button>';
    } else if (tabsEl) {
      tabsEl.hidden = false;
      tabsEl.innerHTML = '<button class="tab active" data-tab="' + data.annee + '">' + data.annee + '</button>';
      tabsEl.innerHTML += '<button class="tab tab-add" data-tab="add">+ Ajouter</button>';
    }

    // Tab switching
    if (tabsEl) {
      var mainContent = document.querySelectorAll('.results-header,.score-deductions,.valuation-card,.ebitda-breakdown,.productivite-card,.add-exercises,.ratio-grid,.fomo-counter,#full-results,#paywall');
      var addPanel = document.getElementById('tab-add-panel');

      tabsEl.addEventListener('click', function(e) {
        var btn = e.target.closest('.tab');
        if (!btn) return;
        var tabId = btn.getAttribute('data-tab');

        // Update active tab
        tabsEl.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
        btn.classList.add('active');

        if (tabId === 'add') {
          // Hide main content, show add panel
          mainContent.forEach(function(el){ el.style.display = 'none'; });
          if (addPanel) {
            addPanel.hidden = false;
            addPanel.style.display = '';
            // Show paywall or upload based on unlock status
            var addTitle = document.getElementById('tab-add-title');
            var addDesc = document.getElementById('tab-add-desc');
            var addDrop = document.getElementById('add-drop-zone');
            if (unlocked) {
              addTitle.textContent = 'Ajoutez un exercice suppl\u00e9mentaire';
              addDesc.textContent = 'Les donn\u00e9es seront fusionn\u00e9es automatiquement dans la synth\u00e8se.';
              addDrop.style.display = '';
            } else {
              addTitle.textContent = 'D\u00e9bloquez l\u2019analyse compl\u00e8te';
              addDesc.innerHTML = 'Acc\u00e9dez \u00e0 la valorisation d\u00e9taill\u00e9e + ajoutez autant d\u2019exercices que vous voulez \u2014 19,99\u00a0\u20ac<br><br><a href="#" class="btn btn--large" onclick="document.getElementById(\'pay-btn\').scrollIntoView({behavior:\'smooth\'});return false;">D\u00e9bloquer \u2014 19,99 \u20ac</a>';
              addDrop.style.display = 'none';
            }
          }
        } else {
          // Show main content, hide add panel
          mainContent.forEach(function(el){ el.style.display = ''; });
          if (addPanel) addPanel.hidden = true;

          // Render correct data for this tab
          var exercicesList = (data.full || {}).exercices || data.exercices || [];
          if (tabId === 'synthese') {
            // Re-render with synthese data (default view)
            renderTabContent(data, ratios, secteur, unlocked);
          } else {
            // Find the exercice for this year
            var yearNum = parseInt(tabId);
            var ex = exercicesList.find(function(e){ return e.annee === yearNum; });
            if (ex) {
              // Per-year fourchette: EBITDA × multiples sectoriels
              var exValo = ex.valorisation || {};
              var exMultiple = exValo.multiple_sectoriel || 5;
              var exEbitda = ex.ebitda || 0;
              // Approximate low/high using ±20% of central (backend has exact multiples)
              var exFLow = exEbitda > 0 ? Math.round(exEbitda * exMultiple * 0.8) : 0;
              var exFHigh = exEbitda > 0 ? Math.round(exEbitda * exMultiple * 1.2) : 0;

              renderTabContent({
                annee: ex.annee,
                score_sante: data.score_sante,
                freemium: {
                  ebitda: (ex.ratios || {}).rentabilite ? ex.ratios.rentabilite.ebitda : null,
                  roe: (ex.ratios || {}).rentabilite ? ex.ratios.rentabilite.roe : null,
                  liquidite_generale: (ex.ratios || {}).liquidite ? ex.ratios.liquidite.liquidite_generale : null,
                  solvabilite: (ex.ratios || {}).structure ? ex.ratios.structure.solvabilite : null,
                },
                badges: ex.badges || {},
                valorisation_floue: {
                  fourchette_low: exFLow,
                  fourchette_high: exFHigh,
                },
                valorisation: exValo,
                productivite: ex.productivite || null,
                ebitda_n: ex.ebitda,
                ebitda_reference: ex.ebitda,
                ebitda_reference_label: String(ex.annee),
                nb_exercices: 1,
                unlocked: data.unlocked,
                full: data.unlocked ? { ratios: ex.ratios || {}, ai_analysis: (data.full || {}).ai_analysis || {} } : null,
                _isYearTab: true,
              }, ex.ratios || {}, secteur, unlocked);
            }
          }

          document.getElementById('results-section').scrollIntoView({behavior: 'smooth'});
        }
      });
    }

    // Upload handler for "+" tab
    var addPdfInput = document.getElementById('add-pdf');
    if (addPdfInput) {
      addPdfInput.addEventListener('change', function() {
        var file = addPdfInput.files[0];
        if (!file) return;
        var addDesc = document.getElementById('tab-add-desc');
        addDesc.innerHTML = '<div class="spinner" style="width:32px;height:32px;margin:12px auto"></div><p>Extraction en cours...</p>';

        var fd = new FormData();
        fd.append('file', file);
        fd.append('token', token);
        fd.append('secteur', secteur);

        fetch(API + '/api/analyse/add-exercice', { method: 'POST', body: fd })
          .then(function(r) {
            if (!r.ok) return r.json().then(function(d) { throw new Error(d.detail || 'Erreur'); });
            return r.json();
          })
          .then(function(result) {
            if (result.warning === 'doublon') {
              addDesc.innerHTML = '\u26a0\ufe0f Ann\u00e9e(s) d\u00e9j\u00e0 pr\u00e9sente(s) : ' + result.annees_deja_presentes.join(', ') + '. Aucun nouvel exercice ajout\u00e9.';
            } else {
              addDesc.innerHTML = '\u2705 Exercice(s) ' + result.annees_nouvelles.join(', ') + ' ajout\u00e9(s). Rechargement...';
              setTimeout(function() { window.location.reload(); }, 1000);
            }
          })
          .catch(function(err) {
            addDesc.innerHTML = '<span style="color:#ff6b6b">' + err.message + '</span>';
          });
      });
    }

    // Productivity card
    var prod = data.productivite;
    var prodCard = document.getElementById('productivite-card');
    if (prod && prod.etp && prod.etp > 0 && prodCard) {
      prodCard.hidden = false;
      var badgeColor2 = {'vert':'#00c896','jaune':'#f59e0b','rouge':'#ef4444','gris':'#5a7fa0'}[prod.badge_ebitda_etp] || '#5a7fa0';
      prodCard.style.borderTop = '3px solid ' + badgeColor2;
      var items = '<div class="productivite-card__item"><span class="productivite-card__label">EBITDA / ETP</span><span class="productivite-card__val" style="color:' + badgeColor2 + '">' + (prod.ebitda_par_etp ? Math.round(prod.ebitda_par_etp).toLocaleString('fr-BE') + ' \u20ac' : 'N/A') + '</span></div>';
      if (prod.marge_par_etp) items += '<div class="productivite-card__item"><span class="productivite-card__label">Marge brute / ETP</span><span class="productivite-card__val">' + Math.round(prod.marge_par_etp).toLocaleString('fr-BE') + ' \u20ac</span><span style="display:block;font-size:.68rem;color:#5a7fa0;margin-top:2px">(R\u00e9sultat d\u2019exploitation avant charges de personnel)</span></div>';
      if (prod.ca_par_etp) items += '<div class="productivite-card__item"><span class="productivite-card__label">CA / ETP</span><span class="productivite-card__val">' + Math.round(prod.ca_par_etp).toLocaleString('fr-BE') + ' \u20ac</span></div>';
      prodCard.innerHTML = '<div class="productivite-card__header"><span class="productivite-card__title">Productivit\u00e9 par employ\u00e9</span><span class="productivite-card__etp">' + prod.etp + ' ETP</span></div>'
        + '<div class="productivite-card__grid">' + items + '</div>'
        + (prod.benchmark ? '<p class="productivite-card__bench">' + prod.benchmark + '</p>' : '');
    }

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
        var bgMap = {'#00c896':'rgba(0,200,150,.15)','#f59e0b':'rgba(245,158,11,.15)','#ef4444':'rgba(239,68,68,.15)','#5a7fa0':'rgba(90,127,160,.15)'};
        var bgColor = bgMap[badgeColor] || 'rgba(255,255,255,.1)';
        badgeHtml = '<span class="ratio-card__badge" style="background:' + bgColor + ';color:' + badgeColor + ';border:1px solid ' + badgeColor + '44">' + badge.label + '</span>';
      }

      var ctaText = isLocked ? '<span class="ratio-card__hover">D\u00e9bloquer</span>' : '<span class="ratio-card__cta">Voir analyse \u2192</span>';

      card.innerHTML = '<span class="ratio-card__info">\u24d8</span>'
        + '<span class="ratio-card__label">' + def.label + '</span>'
        + '<span class="ratio-card__value">' + formatted + '</span>'
        + yearLabel + n1Html + badgeHtml + ctaText;

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

      renderAddExercises(data, true);
    } else {
      document.getElementById('paywall').hidden = false;
      document.getElementById('full-results').hidden = true;
      renderAddExercises(data, false);
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

  // ── Tab content renderer (re-renders dynamic parts) ──────────────────────
  function renderTabContent(tabData, tabRatios, secteur, unlocked) {
    // Score
    var scoreVal = tabData.score_sante || 50;
    var arc = document.getElementById('score-arc');
    var val = document.getElementById('score-val');
    if (arc && val) {
      arc.style.strokeDashoffset = 327 - (scoreVal / 100) * 327;
      arc.style.stroke = scoreVal >= 70 ? '#00c896' : scoreVal >= 50 ? '#ffb432' : scoreVal >= 30 ? '#ff8c00' : '#ff6b6b';
      val.textContent = scoreVal;
    }
    // Score context
    var ctx = document.getElementById('score-context');
    if (ctx) {
      if (scoreVal < 30) { ctx.textContent = 'Situation financi\u00e8re critique'; ctx.className = 'score-context score-context--red'; }
      else if (scoreVal < 50) { ctx.textContent = 'Situation financi\u00e8re fragile'; ctx.className = 'score-context score-context--orange'; }
      else if (scoreVal < 70) { ctx.textContent = 'Situation financi\u00e8re correcte'; ctx.className = 'score-context score-context--yellow'; }
      else { ctx.textContent = 'Bonne sant\u00e9 financi\u00e8re'; ctx.className = 'score-context score-context--green'; }
    }

    // Valuation
    var valLow = document.getElementById('val-low');
    var valHigh = document.getElementById('val-high');
    var vf = tabData.valorisation_floue || tabData.valorisation || {};
    if (valLow && valHigh) {
      valLow.className = 'valuation-amount';
      valHigh.className = 'valuation-amount';
      if (unlocked || tabData._isYearTab) {
        valLow.textContent = fmtEurRaw(vf.fourchette_low || vf.fourchette_basse || vf.ev_ebitda);
        valHigh.textContent = fmtEurRaw(vf.fourchette_high || vf.fourchette_haute || vf.ev_ebitda);
      } else {
        valLow.textContent = fmtEurRaw(vf.fourchette_low);
        valHigh.textContent = fmtEurRaw(vf.fourchette_high);
        valLow.classList.add('blurred');
        valHigh.classList.add('blurred');
      }
    }

    // EBITDA breakdown
    var bd = document.getElementById('ebitda-breakdown');
    if (bd) {
      if (tabData._isYearTab) {
        bd.hidden = false;
        bd.innerHTML = 'EBITDA ' + tabData.annee + ' : <strong>' + fmtEur(tabData.ebitda_n) + '</strong>';
      } else if (tabData.ebitda_n != null) {
        bd.hidden = false;
        var parts = ['EBITDA ' + tabData.annee + ' : <strong>' + fmtEur(tabData.ebitda_n) + '</strong>'];
        if (tabData.ebitda_n1 != null) parts.push('EBITDA ' + tabData.annee_precedente + ' : <strong>' + fmtEur(tabData.ebitda_n1) + '</strong>');
        if (tabData.ebitda_reference != null && (tabData.nb_exercices || 1) >= 2) parts.push('Moyenne : <strong>' + fmtEur(tabData.ebitda_reference) + '</strong> \u2190 valorisation');
        bd.innerHTML = parts.join(' &nbsp;|&nbsp; ');
      }
    }

    // Ratio grid (rebuild)
    var grid = document.getElementById('ratio-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var allBadges = tabData.badges || tabRatios.badges || {};
    var BADGE_MAP2 = {'roe':'roe','liquidite_generale':'liquidite','solvabilite':'solvabilite','gearing':'gearing','dettes_ebitda':'dette_ebitda','couverture_interets':'couverture'};
    var BADGE_COLORS2 = {'vert':'#00c896','jaune':'#f59e0b','rouge':'#ef4444','gris':'#5a7fa0'};

    RATIOS_ORDER.forEach(function(key) {
      var def = RATIOS_DATA[key];
      if (!def) return;
      var valR = unlocked || tabData._isYearTab ? def.path(tabRatios) : (def.free ? (tabData.freemium || {})[key === 'ebitda' ? 'ebitda' : key] : def.path(tabRatios));
      if (!unlocked && !tabData._isYearTab && def.free && key === 'ebitda') valR = (tabData.freemium || {}).ebitda;
      var isFree = def.free;
      var isLocked = !unlocked && !tabData._isYearTab && !isFree;

      var badgeKey = BADGE_MAP2[key];
      var badge = badgeKey ? allBadges[badgeKey] : null;
      var badgeColor = badge ? (BADGE_COLORS2[badge.badge] || '') : '';

      var card = document.createElement('div');
      card.className = 'ratio-card' + (isLocked ? ' ratio-card--locked' : '');
      if (badgeColor && !isLocked) card.style.borderTop = '3px solid ' + badgeColor;

      var override = def.formatOverride ? def.formatOverride(valR) : null;
      var formatted;
      if (override && !isLocked) formatted = override;
      else if (isLocked) { formatted = def.unit === 'eur' ? '---' : def.unit === 'pct' ? '--%' : '--'; if (valR != null) formatted = formatVal(valR, def.unit); }
      else formatted = valR != null ? formatVal(valR, def.unit) : 'N/A';

      var bgMap = {'#00c896':'rgba(0,200,150,.15)','#f59e0b':'rgba(245,158,11,.15)','#ef4444':'rgba(239,68,68,.15)','#5a7fa0':'rgba(90,127,160,.15)'};
      var badgeHtml = (badge && !isLocked) ? '<span class="ratio-card__badge" style="background:' + (bgMap[badgeColor]||'rgba(255,255,255,.1)') + ';color:' + badgeColor + ';border:1px solid ' + badgeColor + '44">' + badge.label + '</span>' : '';
      var yearLabel = tabData.annee ? '<span class="ratio-card__year">' + tabData.annee + '</span>' : '';
      var ctaText = isLocked ? '<span class="ratio-card__hover">D\u00e9bloquer</span>' : '<span class="ratio-card__cta">Voir analyse \u2192</span>';

      card.innerHTML = '<span class="ratio-card__info">\u24d8</span>'
        + '<span class="ratio-card__label">' + def.label + '</span>'
        + '<span class="ratio-card__value">' + formatted + '</span>'
        + yearLabel + badgeHtml + ctaText;

      card.onclick = function() { openModal(key, valR, isLocked, unlocked, secteur, tabData); };
      grid.appendChild(card);
    });

    // Update productivity card for this tab
    var prodCard = document.getElementById('productivite-card');
    var tabProd = tabData.productivite || (tabData.full || {}).productivite;
    if (prodCard) {
      if (tabProd && tabProd.etp && tabProd.etp > 0) {
        prodCard.hidden = false;
        var bc2 = {'vert':'#00c896','jaune':'#f59e0b','rouge':'#ef4444','gris':'#5a7fa0'}[tabProd.badge_ebitda_etp] || '#5a7fa0';
        prodCard.style.borderTop = '3px solid ' + bc2;
        var items2 = '<div class="productivite-card__item"><span class="productivite-card__label">EBITDA / ETP</span><span class="productivite-card__val" style="color:' + bc2 + '">' + (tabProd.ebitda_par_etp ? Math.round(tabProd.ebitda_par_etp).toLocaleString('fr-BE') + ' \u20ac' : 'N/A') + '</span></div>';
        if (tabProd.marge_par_etp) items2 += '<div class="productivite-card__item"><span class="productivite-card__label">Marge brute / ETP</span><span class="productivite-card__val">' + Math.round(tabProd.marge_par_etp).toLocaleString('fr-BE') + ' \u20ac</span></div>';
        prodCard.innerHTML = '<div class="productivite-card__header"><span class="productivite-card__title">Productivit\u00e9 par employ\u00e9</span><span class="productivite-card__etp">' + tabProd.etp + ' ETP</span></div>'
          + '<div class="productivite-card__grid">' + items2 + '</div>'
          + (tabProd.benchmark ? '<p class="productivite-card__bench">' + tabProd.benchmark + '</p>' : '');
      } else {
        prodCard.hidden = true;
      }
    }

    // Per-year disclaimer for individual tabs
    var valCard = document.querySelector('.valuation-card h3');
    if (valCard && tabData._isYearTab) {
      var disc = document.getElementById('valo-year-disclaimer');
      if (!disc) {
        disc = document.createElement('p');
        disc.id = 'valo-year-disclaimer';
        disc.style.cssText = 'font-size:.78rem;color:#5a7fa0;text-align:center;margin-top:8px';
        document.querySelector('.valuation-card').appendChild(disc);
      }
      disc.textContent = 'Valorisation indicative sur 1 exercice. La synth\u00e8se multi-ann\u00e9es est plus fiable.';
      disc.hidden = false;
    } else {
      var disc2 = document.getElementById('valo-year-disclaimer');
      if (disc2) disc2.hidden = true;
    }
  }

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

  // ── Add exercises / upsell block ──────────────────────────────────────────
  function renderAddExercises(data, unlocked) {
    var el = document.getElementById('add-exercises');
    if (!el) return;
    var nb = data.nb_exercices || 1;
    if (nb >= 5) return;

    el.hidden = false;
    var title = document.getElementById('add-exercises-title');
    var sub = document.getElementById('add-exercises-sub');
    var btns = document.getElementById('add-exercises-btns');
    var note = document.getElementById('add-exercises-note');
    btns.innerHTML = '';

    if (unlocked) {
      // Unlocked: free additional exercises
      title.innerHTML = '\uD83D\uDCCA Affinez la valorisation';
      sub.textContent = 'Bas\u00e9e sur ' + nb + ' exercice' + (nb > 1 ? 's' : '') + '. Ajoutez des exercices pour une valorisation plus fiable.';
      var baseYear = data.annee_precedente || (data.annee - 1);
      for (var y = baseYear - 1; y >= baseYear - 3; y--) {
        var btn = document.createElement('button');
        btn.className = 'add-exercises__btn';
        btn.textContent = '+ Ajouter ' + y;
        btn.onclick = function() { window.location.href = '/#analyse'; };
        btns.appendChild(btn);
      }
      note.textContent = 'Gratuit \u2014 inclus dans votre acc\u00e8s';
    } else {
      // Freemium: upsell
      title.innerHTML = '\uD83D\uDCCA D\u00e9bloquez l\u2019analyse compl\u00e8te';
      sub.textContent = 'Acc\u00e9dez \u00e0 la valorisation d\u00e9taill\u00e9e, tous les ratios et le diagnostic complet. Ajoutez autant d\u2019exercices que vous voulez.';
      var payBtn = document.createElement('button');
      payBtn.className = 'btn btn--large';
      payBtn.textContent = 'D\u00e9bloquer \u2014 19,99 \u20ac';
      payBtn.onclick = function() {
        document.getElementById('pay-btn').scrollIntoView({behavior:'smooth'});
      };
      btns.appendChild(payBtn);
      note.innerHTML = '<a href="#" id="add-ex-code-link" style="color:#5a7fa0;font-size:.82rem">Vous avez un code d\u2019acc\u00e8s ?</a>';
    }
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
