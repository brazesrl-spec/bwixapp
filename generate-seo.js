#!/usr/bin/env node
/* Generate SEO ratio pages: /ratio/{slug}?secteur={secteur} */
var fs = require('fs');
var path = require('path');

var ratios = {
  ebitda: {
    slug: 'ebitda', label: 'EBITDA',
    h1: "EBITDA — Comment l'interpréter pour une PME %SECTEUR% belge",
    intro: "L'EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization) mesure la capacité de l'entreprise à générer du cash par son activité principale, avant les choix d'amortissement, de financement et de fiscalité.",
    details: "C'est l'indicateur le plus utilisé pour comparer des entreprises entre elles et pour calculer la valorisation (méthode des multiples EV/EBITDA). Un EBITDA négatif signifie que l'activité opérationnelle ne génère pas de cash — situation à corriger rapidement.",
    formula: "EBITDA = Résultat d'exploitation + Amortissements",
  },
  roe: {
    slug: 'roe', label: 'ROE (Return on Equity)',
    h1: "ROE — Rentabilité des capitaux propres pour une PME %SECTEUR% belge",
    intro: "Le ROE (Return on Equity) mesure combien de bénéfice net l'entreprise génère pour chaque euro investi par les actionnaires. C'est le rendement pour les propriétaires.",
    details: "Sur 100 € investis par les actionnaires, combien de bénéfice net l'entreprise génère-t-elle ? Un ROE de 15 % signifie 15 € de profit pour 100 € de capitaux propres. C'est un indicateur clé pour les investisseurs et repreneurs.",
    formula: "ROE = Résultat net / Capitaux propres",
    benchmarks: { 'Construction / BTP': '8-20%', 'Tech / SaaS': '12-30%', 'Services': '10-25%', 'Commerce': '8-18%', 'Industrie': '8-20%' },
  },
  'liquidite-generale': {
    slug: 'liquidite-generale', label: 'Liquidité générale',
    h1: "Liquidité générale — Capacité de paiement d'une PME %SECTEUR% belge",
    intro: "Le ratio de liquidité générale compare les actifs à court terme (stocks + créances + trésorerie) aux dettes à court terme. C'est un indicateur de la capacité de l'entreprise à honorer ses engagements immédiats.",
    details: "Au-dessus de 1, l'entreprise peut couvrir ses dettes à court terme. En dessous, il y a un risque de tension de trésorerie. Les banques regardent ce ratio de très près lors de l'octroi de crédit.",
    formula: "Liquidité générale = Actifs circulants / Dettes à court terme",
    benchmarks: { 'Construction / BTP': '1.1-1.8', 'Tech / SaaS': '1.5-3.0', 'Services': '1.2-2.0', 'Commerce': '1.0-1.6', 'Industrie': '1.2-2.0' },
  },
  solvabilite: {
    slug: 'solvabilite', label: 'Solvabilité',
    h1: "Solvabilité — Autonomie financière d'une PME %SECTEUR% belge",
    intro: "La solvabilité mesure la part des capitaux propres dans le total du bilan. Plus ce ratio est élevé, moins l'entreprise dépend de ses créanciers.",
    details: "Un ratio de 30 %+ est généralement considéré comme sain. En dessous de 20 %, l'entreprise est fortement dépendante de financements externes, ce qui accroît le risque en cas de retournement.",
    formula: "Solvabilité = Capitaux propres / Total actif",
    benchmarks: { 'Construction / BTP': '25-45%', 'Tech / SaaS': '30-60%', 'Services': '25-50%', 'Commerce': '20-40%', 'Industrie': '30-50%' },
  },
  gearing: {
    slug: 'gearing', label: 'Gearing (ratio d\'endettement)',
    h1: "Gearing — Ratio d'endettement d'une PME %SECTEUR% belge",
    intro: "Le gearing mesure le rapport entre la dette nette et les capitaux propres. C'est l'indicateur du levier financier de l'entreprise.",
    details: "Un gearing de 1 signifie autant de dettes que de fonds propres. En dessous de 0.5, l'entreprise est peu endettée. Au-dessus de 2, l'endettement est élevé et peut devenir risqué.",
    formula: "Gearing = Dette nette / Capitaux propres",
    benchmarks: { 'Construction / BTP': '0.3-1.5', 'Tech / SaaS': '0.0-0.8', 'Services': '0.2-1.2', 'Commerce': '0.5-2.0', 'Industrie': '0.3-1.5' },
  },
  'dette-ebitda': {
    slug: 'dette-ebitda', label: 'Dette nette / EBITDA',
    h1: "Dette/EBITDA — Capacité de remboursement d'une PME %SECTEUR% belge",
    intro: "Ce ratio indique le nombre d'années nécessaires pour rembourser la dette nette avec l'EBITDA. C'est un indicateur clé pour les banques et investisseurs.",
    details: "En dessous de 3 ans = situation saine. Entre 3 et 5 = acceptable mais à surveiller. Au-dessus de 5 = endettement lourd, capacité de remboursement tendue.",
    formula: "Dette/EBITDA = Dette nette / EBITDA",
  },
  'marge-nette': {
    slug: 'marge-nette', label: 'Marge nette',
    h1: "Marge nette — Rentabilité réelle d'une PME %SECTEUR% belge",
    intro: "La marge nette représente la part du chiffre d'affaires qui reste en bénéfice net après toutes les charges : exploitation, financières et impôts.",
    details: "C'est la rentabilité réelle de l'entreprise. Une marge nette de 10 % signifie que sur 100 € de CA, il reste 10 € de bénéfice. Les marges varient fortement selon les secteurs.",
    formula: "Marge nette = Résultat net / Chiffre d'affaires",
    benchmarks: { 'Construction / BTP': '3-8%', 'Tech / SaaS': '8-25%', 'Services': '5-15%', 'Commerce': '2-6%', 'Industrie': '4-10%' },
  },
  bfr: {
    slug: 'bfr', label: 'BFR en jours de CA',
    h1: "BFR — Besoin en fonds de roulement d'une PME %SECTEUR% belge",
    intro: "Le BFR en jours de chiffre d'affaires mesure combien de jours de CA sont immobilisés dans le cycle d'exploitation (stocks + créances - dettes fournisseurs).",
    details: "Moins le BFR est élevé, mieux c'est pour la trésorerie. Un BFR négatif (comme en grande distribution) signifie que l'entreprise est financée par ses fournisseurs — situation idéale.",
    formula: "BFR = (Stocks + Créances - Dettes fournisseurs) × 365 / CA",
  },
  'couverture-interets': {
    slug: 'couverture-interets', label: 'Couverture des intérêts',
    h1: "Couverture des intérêts — Sécurité financière d'une PME %SECTEUR% belge",
    intro: "Ce ratio mesure combien de fois le résultat d'exploitation couvre les charges financières (intérêts sur emprunts).",
    details: "Au-dessus de 3 = confortable, marge de sécurité suffisante. En dessous de 1.5 = dangereux, l'entreprise peine à payer ses intérêts. Les banques exigent généralement un minimum de 2.",
    formula: "Couverture = Résultat d'exploitation / Charges financières",
  },
  'valorisation-ebitda': {
    slug: 'valorisation-ebitda', label: 'Valorisation EV/EBITDA',
    h1: "Valorisation EV/EBITDA — Comment valoriser une PME %SECTEUR% belge",
    intro: "La méthode EV/EBITDA est la plus utilisée pour valoriser une PME. Elle consiste à multiplier l'EBITDA par un multiple sectoriel pour obtenir la valeur d'entreprise.",
    details: "Le multiple varie selon le secteur, la taille et la croissance. Pour les PME belges, les multiples vont de 4x (industries matures) à 15x (tech en croissance). La valeur des fonds propres = EV - dette nette.",
    formula: "Valeur d'entreprise = EBITDA × Multiple sectoriel",
  },
  'valorisation-dcf': {
    slug: 'valorisation-dcf', label: 'Valorisation DCF',
    h1: "DCF — Valorisation par les flux de trésorerie d'une PME %SECTEUR% belge",
    intro: "La méthode DCF (Discounted Cash Flow) projette les flux de trésorerie futurs et les actualise au coût du capital. C'est la méthode privilégiée pour les entreprises en croissance.",
    details: "BWIX projette 5 ans de FCF basés sur l'historique, applique un taux d'actualisation (WACC) de 8 % et un taux de croissance perpétuel de 2 %. Cette méthode nécessite minimum 2 exercices pour être fiable.",
    formula: "DCF = Σ(FCF / (1+WACC)^t) + Valeur terminale",
  },
  'capitaux-propres': {
    slug: 'capitaux-propres', label: 'Valeur comptable (Capitaux propres)',
    h1: "Capitaux propres — Valeur comptable d'une PME %SECTEUR% belge",
    intro: "Les capitaux propres représentent la valeur nette comptable de l'entreprise : total des actifs moins total des dettes. C'est le plancher de valorisation.",
    details: "En théorie, c'est la valeur minimale en cas de liquidation ordonnée. En pratique, la valeur réelle dépend de la rentabilité future (goodwill, survaleur). Une entreprise rentable vaut toujours plus que ses capitaux propres.",
    formula: "Capitaux propres = Total actif - Total dettes",
  },
};

var secteurs = [
  { value: 'Construction / BTP', slug: 'construction-btp', label: 'construction / BTP' },
  { value: 'Tech / SaaS', slug: 'tech-saas', label: 'tech / SaaS' },
  { value: 'Services', slug: 'services', label: 'services' },
  { value: 'Commerce', slug: 'commerce', label: 'commerce' },
  { value: 'Industrie', slug: 'industrie', label: 'industrie' },
];

var outDir = path.join(__dirname, 'ratio');
fs.mkdirSync(outDir, { recursive: true });

var count = 0;
Object.keys(ratios).forEach(function (key) {
  var r = ratios[key];
  secteurs.forEach(function (s) {
    var h1 = r.h1.replace('%SECTEUR%', s.label);
    var bench = (r.benchmarks && r.benchmarks[s.value]) || null;
    var benchHtml = bench ? '<p class="seo-bench"><strong>Benchmark ' + s.label + ' belge :</strong> ' + bench + '</p>' : '';

    var html = '<!DOCTYPE html>\n<html lang="fr-BE"><head>'
      + '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">'
      + '<title>' + r.label + ' — PME ' + s.label + ' belge | BWIX</title>'
      + '<meta name="description" content="' + r.intro.substring(0, 155) + '">'
      + '<link rel="canonical" href="https://bwix.app/ratio/' + r.slug + '?secteur=' + s.slug + '">'
      + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
      + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
      + '<link rel="stylesheet" href="../style.css">'
      + '<style>.seo{max-width:760px;margin:0 auto;padding:100px 24px 80px}.seo h1{font-size:1.8rem;line-height:1.3;margin-bottom:24px}.seo p{color:#8fa3bf;font-size:.95rem;line-height:1.7;margin-bottom:16px}.seo-formula{background:#162d4a;padding:16px 20px;border-radius:10px;font-family:monospace;color:#00c896;font-size:.9rem;margin:20px 0}.seo-bench{background:rgba(0,200,150,.06);border:1px solid rgba(0,200,150,.2);padding:14px 18px;border-radius:10px}.seo-bench strong{color:#00c896}.seo-cta{text-align:center;margin:40px 0;padding:32px;background:#162d4a;border-radius:16px}.seo-cta h2{color:#fff;font-size:1.2rem;margin-bottom:16px}</style>'
      + '</head><body>'
      + '<header class="header"><div class="container header__inner"><a href="/" class="logo">BWIX<span class="logo__dot">.</span></a><a href="/" class="btn btn--small">Analyser</a></div></header>'
      + '<main class="seo">'
      + '<h1>' + h1 + '</h1>'
      + '<p>' + r.intro + '</p>'
      + '<p>' + r.details + '</p>'
      + '<div class="seo-formula">' + r.formula + '</div>'
      + benchHtml
      + '<div class="seo-cta"><h2>Calculez le ' + r.label + ' de n\'importe quelle soci&eacute;t&eacute; belge</h2>'
      + '<p style="color:#8fa3bf;margin-bottom:16px">Importez un bilan BNB et obtenez tous les ratios en 2 minutes.</p>'
      + '<a href="/" class="btn btn--large">Analyser une entreprise &rarr;</a></div>'
      + '</main>'
      + '<footer class="footer"><div class="container footer__inner"><p>&copy; 2026 BWIX &mdash; Braze SRL</p></div></footer>'
      + '</body></html>';

    var filename = r.slug + '--' + s.slug + '.html';
    fs.writeFileSync(path.join(outDir, filename), html);
    count++;
  });
});

console.log('Generated ' + count + ' SEO pages in ' + outDir);
