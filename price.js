/* BWIX — Prix unique : lu depuis le prix par défaut du produit Stripe via /api/price.
   Aucun montant en dur dans les pages : tout élément .js-price est rempli ici. */
(function () {
  'use strict';
  var API = 'https://bwix-api.onrender.com';
  var label = null;

  function apply(root) {
    if (!label) return;
    var nodes = (root || document).querySelectorAll('.js-price');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].textContent !== label) nodes[i].textContent = label;
    }
  }

  fetch(API + '/api/price')
    .then(function (r) { if (!r.ok) throw new Error('price ' + r.status); return r.json(); })
    .then(function (d) {
      label = d.label; // ex. « 19,99 € hors TVA »
      apply();
      new MutationObserver(function () { apply(); })
        .observe(document.body, { childList: true, subtree: true });
    })
    .catch(function () { /* prix indisponible : les emplacements restent vides */ });
})();
