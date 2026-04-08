/* BWIX — Ratio definitions, explanations, and benchmarks */
var RATIOS_DATA = {
  ebitda: {
    key: 'ebitda', label: 'EBITDA', unit: 'eur', free: true,
    title: "EBITDA \u2014 R\u00e9sultat d'exploitation avant amortissements",
    slug: 'ebitda',
    explain: "L'EBITDA mesure la capacit\u00e9 de l'entreprise \u00e0 g\u00e9n\u00e9rer du cash par son activit\u00e9 principale, avant les choix d'amortissement, de financement et de fiscalit\u00e9.",
    interpret: function (v, s) {
      if (v == null) return '';
      if (v < 0) return "Un EBITDA n\u00e9gatif signifie que l'activit\u00e9 op\u00e9rationnelle ne g\u00e9n\u00e8re pas de cash \u2014 situation \u00e0 corriger rapidement.";
      return "L'activit\u00e9 g\u00e9n\u00e8re " + Math.round(v).toLocaleString('fr-BE') + "\u00a0\u20ac de cash op\u00e9rationnel avant amortissements.";
    },
    path: function (r) { return r.rentabilite ? r.rentabilite.ebitda : null; }
  },
  roe: {
    key: 'roe', label: 'ROE', unit: 'pct', free: false,
    title: "ROE \u2014 Rentabilit\u00e9 des capitaux propres",
    slug: 'roe',
    explain: "Sur 100\u00a0\u20ac investis par les actionnaires, combien de b\u00e9n\u00e9fice net l'entreprise g\u00e9n\u00e8re-t-elle ? C'est le rendement pour les propri\u00e9taires.",
    benchmarks: { 'Construction / BTP': [8,20], 'Tech / SaaS': [12,30], 'Services': [10,25], 'Commerce': [8,18], 'Industrie': [8,20] },
    interpret: function (v, s) {
      if (v == null) return '';
      var pct = (v * 100).toFixed(1);
      var b = this.benchmarks[s];
      if (!b) return "ROE de " + pct + "%.";
      if (v * 100 >= b[1]) return "ROE de " + pct + "% \u2014 excellent pour le secteur " + s + " (benchmark : " + b[0] + "-" + b[1] + "%).";
      if (v * 100 >= b[0]) return "ROE de " + pct + "% \u2014 correct pour le secteur " + s + " (benchmark : " + b[0] + "-" + b[1] + "%).";
      return "ROE de " + pct + "% \u2014 en dessous du benchmark " + s + " (" + b[0] + "-" + b[1] + "%). Rentabilit\u00e9 \u00e0 am\u00e9liorer.";
    },
    path: function (r) { return r.rentabilite ? r.rentabilite.roe : null; }
  },
  liquidite_generale: {
    key: 'liquidite_generale', label: 'Liquidit\u00e9 g\u00e9n\u00e9rale', unit: 'ratio', free: false,
    title: "Liquidit\u00e9 g\u00e9n\u00e9rale \u2014 Capacit\u00e9 \u00e0 payer les dettes court terme",
    slug: 'liquidite-generale',
    explain: "Ce ratio compare les actifs \u00e0 court terme (stocks + cr\u00e9ances + tr\u00e9sorerie) aux dettes \u00e0 court terme. Au-dessus de 1 = l'entreprise peut couvrir ses dettes. En dessous = tension de tr\u00e9sorerie.",
    benchmarks: { 'Construction / BTP': [1.1,1.8], 'Tech / SaaS': [1.5,3.0], 'Services': [1.2,2.0], 'Commerce': [1.0,1.6], 'Industrie': [1.2,2.0] },
    interpret: function (v, s) {
      if (v == null) return '';
      var b = this.benchmarks[s];
      if (!b) return "Liquidit\u00e9 g\u00e9n\u00e9rale de " + v.toFixed(2) + ".";
      if (v >= b[1]) return "Liquidit\u00e9 de " + v.toFixed(2) + " \u2014 confortable pour " + s + " (benchmark : " + b[0] + "-" + b[1] + ").";
      if (v >= b[0]) return "Liquidit\u00e9 de " + v.toFixed(2) + " \u2014 dans la norme " + s + " (benchmark : " + b[0] + "-" + b[1] + ").";
      return "Liquidit\u00e9 de " + v.toFixed(2) + " \u2014 en dessous du benchmark " + s + " (" + b[0] + "-" + b[1] + "). Risque de tension de tr\u00e9sorerie.";
    },
    path: function (r) { return r.liquidite ? r.liquidite.liquidite_generale : null; }
  },
  solvabilite: {
    key: 'solvabilite', label: 'Solvabilit\u00e9', unit: 'pct', free: false,
    title: "Solvabilit\u00e9 \u2014 Autonomie financi\u00e8re",
    slug: 'solvabilite',
    explain: "Part des capitaux propres dans le total du bilan. Plus c'est \u00e9lev\u00e9, moins l'entreprise d\u00e9pend de ses cr\u00e9anciers. Un ratio de 30%+ est g\u00e9n\u00e9ralement sain.",
    benchmarks: { 'Construction / BTP': [25,45], 'Tech / SaaS': [30,60], 'Services': [25,50], 'Commerce': [20,40], 'Industrie': [30,50] },
    interpret: function (v, s) {
      if (v == null) return '';
      var pct = (v * 100).toFixed(1);
      var b = this.benchmarks[s];
      if (!b) return "Solvabilit\u00e9 de " + pct + "%.";
      if (v * 100 >= b[1]) return "Solvabilit\u00e9 de " + pct + "% \u2014 tr\u00e8s solide pour " + s + " (benchmark : " + b[0] + "-" + b[1] + "%).";
      if (v * 100 >= b[0]) return "Solvabilit\u00e9 de " + pct + "% \u2014 correcte pour " + s + " (benchmark : " + b[0] + "-" + b[1] + "%).";
      return "Solvabilit\u00e9 de " + pct + "% \u2014 fragile pour " + s + " (" + b[0] + "-" + b[1] + "%). D\u00e9pendance aux cr\u00e9anciers.";
    },
    path: function (r) { return r.structure ? r.structure.solvabilite : null; }
  },
  gearing: {
    key: 'gearing', label: 'Gearing', unit: 'ratio', free: false,
    title: "Gearing \u2014 Ratio d'endettement",
    slug: 'gearing',
    explain: "Rapport entre la dette nette et les capitaux propres. Mesure le levier financier. Un gearing de 1 signifie autant de dettes que de fonds propres.",
    benchmarks: { 'Construction / BTP': [0.3,1.5], 'Tech / SaaS': [0.0,0.8], 'Services': [0.2,1.2], 'Commerce': [0.5,2.0], 'Industrie': [0.3,1.5] },
    interpret: function (v, s) {
      if (v == null) return '';
      if (v < 0) return "Tr\u00e9sorerie nette positive (cash > dettes financi\u00e8res) \u2014 situation excellente.";
      var b = this.benchmarks[s];
      if (!b) return "Gearing de " + v.toFixed(2) + ".";
      if (v <= b[0]) return "Gearing de " + v.toFixed(2) + " \u2014 tr\u00e8s peu endett\u00e9 pour " + s + " (benchmark : " + b[0] + "-" + b[1] + ").";
      if (v <= b[1]) return "Gearing de " + v.toFixed(2) + " \u2014 dans la norme " + s + " (benchmark : " + b[0] + "-" + b[1] + ").";
      return "Gearing de " + v.toFixed(2) + " \u2014 endettement \u00e9lev\u00e9 pour " + s + " (" + b[0] + "-" + b[1] + "). Risque de d\u00e9pendance.";
    },
    formatOverride: function (v) {
      if (v != null && v < 0) return 'Tr\u00e9sorerie nette \u2705';
      return null;
    },
    path: function (r) { return r.structure ? r.structure.gearing : null; }
  },
  dettes_ebitda: {
    key: 'dettes_ebitda', label: 'Dette / EBITDA', unit: 'ratio', free: false,
    title: "Dette nette / EBITDA \u2014 Capacit\u00e9 de remboursement",
    slug: 'dette-ebitda',
    explain: "Nombre d'ann\u00e9es n\u00e9cessaires pour rembourser la dette nette avec l'EBITDA. En dessous de 3 = sain. Au-dessus de 5 = risqu\u00e9.",
    interpret: function (v) {
      if (v == null) return '';
      if (v < 2) return v.toFixed(1) + " ann\u00e9es \u2014 excellent, dette facilement remboursable.";
      if (v < 4) return v.toFixed(1) + " ann\u00e9es \u2014 raisonnable, dans la norme.";
      return v.toFixed(1) + " ann\u00e9es \u2014 endettement lourd, capacit\u00e9 de remboursement tendue.";
    },
    path: function (r) { return r.structure ? r.structure.dettes_ebitda : null; }
  },
  marge_nette: {
    key: 'marge_nette', label: 'Marge nette', unit: 'pct', free: false,
    title: "Marge nette \u2014 Rentabilit\u00e9 apr\u00e8s toutes charges",
    slug: 'marge-nette',
    explain: "Part du chiffre d'affaires qui reste en b\u00e9n\u00e9fice net apr\u00e8s toutes les charges (exploitation, financi\u00e8res, imp\u00f4ts). C'est la rentabilit\u00e9 r\u00e9elle de l'entreprise.",
    benchmarks: { 'Construction / BTP': [3,8], 'Tech / SaaS': [8,25], 'Services': [5,15], 'Commerce': [2,6], 'Industrie': [4,10] },
    interpret: function (v, s) {
      if (v == null) return '';
      var pct = (v * 100).toFixed(1);
      var b = this.benchmarks[s];
      if (!b) return "Marge nette de " + pct + "%.";
      if (v * 100 >= b[1]) return "Marge nette de " + pct + "% \u2014 excellente pour " + s + " (benchmark : " + b[0] + "-" + b[1] + "%).";
      if (v * 100 >= b[0]) return "Marge nette de " + pct + "% \u2014 correcte pour " + s + " (benchmark : " + b[0] + "-" + b[1] + "%).";
      return "Marge nette de " + pct + "% \u2014 faible pour " + s + " (" + b[0] + "-" + b[1] + "%).";
    },
    path: function (r) { return r.rentabilite ? r.rentabilite.marge_nette : null; }
  },
  bfr_jours_ca: {
    key: 'bfr_jours_ca', label: 'BFR en jours', unit: 'days', free: false,
    title: "BFR en jours de CA \u2014 Besoin en fonds de roulement",
    slug: 'bfr',
    explain: "Nombre de jours de chiffre d'affaires immobilis\u00e9s dans le cycle d'exploitation (stocks + cr\u00e9ances - dettes fournisseurs). Moins c'est \u00e9lev\u00e9, mieux c'est pour la tr\u00e9sorerie.",
    interpret: function (v) {
      if (v == null) return 'Non calculable \u2014 chiffre d\u2019affaires non disponible (sch\u00e9ma abr\u00e9g\u00e9 BNB).';
      var d = Math.round(v);
      if (d < 30) return d + " jours \u2014 BFR l\u00e9ger, bonne gestion du cycle d'exploitation.";
      if (d < 90) return d + " jours \u2014 BFR mod\u00e9r\u00e9, dans la norme pour la plupart des secteurs.";
      return d + " jours \u2014 BFR \u00e9lev\u00e9, capital immobilis\u00e9 important. Optimiser les d\u00e9lais de paiement.";
    },
    formatOverride: function (v) {
      if (v == null) return 'N/A (sch\u00e9ma abr\u00e9g\u00e9)';
      return null;
    },
    path: function (r) { return r.liquidite ? r.liquidite.bfr_jours_ca : null; }
  },
  couverture_interets: {
    key: 'couverture_interets', label: 'Couverture int\u00e9r\u00eats', unit: 'ratio', free: false,
    title: "Couverture des int\u00e9r\u00eats \u2014 Capacit\u00e9 \u00e0 payer les charges financi\u00e8res",
    slug: 'couverture-interets',
    explain: "Combien de fois le r\u00e9sultat d'exploitation couvre les charges financi\u00e8res. Au-dessus de 3 = confortable. En dessous de 1.5 = dangereux.",
    interpret: function (v) {
      if (v == null) return '';
      if (v > 5) return v.toFixed(1) + "x \u2014 tr\u00e8s confortable, charges financi\u00e8res facilement couvertes.";
      if (v > 2) return v.toFixed(1) + "x \u2014 correct, marge de s\u00e9curit\u00e9 suffisante.";
      return v.toFixed(1) + "x \u2014 couverture tendue, vuln\u00e9rabilit\u00e9 en cas de hausse des taux.";
    },
    path: function (r) { return r.structure ? r.structure.couverture_interets : null; }
  },
  ev_ebitda: {
    key: 'ev_ebitda', label: 'Valorisation EV/EBITDA', unit: 'eur', free: false,
    title: "Valorisation EV/EBITDA \u2014 Valeur d'entreprise",
    slug: 'valorisation-ebitda',
    explain: "Valeur d'entreprise calcul\u00e9e en multipliant l'EBITDA par un multiple sectoriel. C'est la m\u00e9thode la plus utilis\u00e9e pour valoriser une PME.",
    interpret: function (v, s, extra) {
      if (v == null || v <= 0) return 'Non applicable \u2014 EBITDA n\u00e9gatif ou nul. La valorisation par les multiples n\u00e9cessite un EBITDA positif.';
      var txt = "Valeur d'entreprise estim\u00e9e \u00e0 " + Math.round(v).toLocaleString('fr-BE') + "\u00a0\u20ac par la m\u00e9thode EV/EBITDA.";
      if (extra && extra.ebitda_reference_label && extra.ebitda_reference) {
        txt += "\nCalcul\u00e9 sur " + extra.ebitda_reference_label + " : " + Math.round(extra.ebitda_reference).toLocaleString('fr-BE') + "\u00a0\u20ac \u00d7 " + (extra.multiple_sectoriel || '?') + "x";
      }
      return txt;
    },
    formatOverride: function (v) {
      if (v != null && v <= 0) return 'N/A (EBITDA n\u00e9gatif)';
      return null;
    },
    path: function (r) { return r.valorisation_resume ? r.valorisation_resume.ev_ebitda : null; }
  },
  dcf_equity: {
    key: 'dcf_equity', label: 'Valorisation DCF', unit: 'eur', free: false,
    title: "DCF \u2014 Discounted Cash Flow",
    slug: 'valorisation-dcf',
    explain: "Valorisation bas\u00e9e sur la projection des flux de tr\u00e9sorerie futurs, actualis\u00e9s au co\u00fbt du capital. M\u00e9thode privil\u00e9gi\u00e9e pour les entreprises en croissance.",
    interpret: function (v) {
      if (v == null) return 'Non calculable \u2014 n\u00e9cessite minimum 2 exercices avec EBITDA positif, ou cashflows n\u00e9gatifs sur les exercices disponibles.';
      return "Valeur des fonds propres estim\u00e9e \u00e0 " + Math.round(v).toLocaleString('fr-BE') + "\u00a0\u20ac par DCF.";
    },
    formatOverride: function (v) {
      if (v == null) return 'Non calculable';
      return null;
    },
    path: function (r) { return r.valorisation_resume ? r.valorisation_resume.dcf_equity : null; }
  },
  capitaux_propres: {
    key: 'capitaux_propres', label: 'Capitaux propres', unit: 'eur', free: false,
    title: "Valeur comptable \u2014 Capitaux propres",
    slug: 'capitaux-propres',
    explain: "Valeur nette comptable de l'entreprise : actifs moins dettes. C'est le plancher de valorisation \u2014 la valeur minimale th\u00e9orique en cas de liquidation.",
    interpret: function (v) {
      if (v == null) return '';
      return "Capitaux propres comptables : " + Math.round(v).toLocaleString('fr-BE') + "\u00a0\u20ac.";
    },
    path: function (r) { return r.valorisation_resume ? r.valorisation_resume.capitaux_propres_comptables : null; }
  }
};

// Ordered list for grid display
var RATIOS_ORDER = ['ebitda','roe','liquidite_generale','solvabilite','gearing','dettes_ebitda','marge_nette','bfr_jours_ca','couverture_interets','ev_ebitda','dcf_equity','capitaux_propres'];

// Sector slugs for SEO
var SECTEURS_SEO = [
  {value:'Construction / BTP', slug:'construction-btp'},
  {value:'Tech / SaaS', slug:'tech-saas'},
  {value:'Services', slug:'services'},
  {value:'Commerce', slug:'commerce'},
  {value:'Industrie', slug:'industrie'}
];
