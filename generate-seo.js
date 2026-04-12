#!/usr/bin/env node
/* Generate rich SEO ratio pages: /ratio/{slug}--{secteur}.html */
var fs = require('fs');
var path = require('path');

var ratios = {
  ebitda: {
    slug: 'ebitda', label: 'EBITDA',
    full: "EBITDA (Earnings Before Interest, Taxes, Depreciation & Amortization)",
    def: "L'EBITDA mesure la capacit\u00e9 de l'entreprise \u00e0 g\u00e9n\u00e9rer du cash par son activit\u00e9 principale, avant les choix d'amortissement, de financement et de fiscalit\u00e9. C'est l'indicateur le plus utilis\u00e9 en valorisation de PME.",
    why: "L'EBITDA est essentiel parce qu'il permet de comparer des entreprises ind\u00e9pendamment de leur politique d'amortissement, de leur structure de financement et de leur r\u00e9gime fiscal. C'est la base de la m\u00e9thode de valorisation par les multiples (EV/EBITDA), utilis\u00e9e dans 90% des transactions de PME en Belgique.",
    formula: "EBITDA = R\u00e9sultat d'exploitation (EBIT) + Amortissements et d\u00e9pr\u00e9ciations",
    good: "Un EBITDA positif et croissant sur plusieurs exercices. Pour la plupart des PME belges, une marge EBITDA de 10-20% du CA est consid\u00e9r\u00e9e comme saine.",
    bad: "Un EBITDA n\u00e9gatif signifie que l'activit\u00e9 op\u00e9rationnelle ne g\u00e9n\u00e8re pas de cash \u2014 situation \u00e0 corriger rapidement avant tout projet de cession ou de financement.",
    improve: ["Augmenter le chiffre d'affaires (pricing, volume, nouveaux clients)", "R\u00e9duire les co\u00fbts d'exploitation (ren\u00e9gocier fournisseurs, optimiser les processus)", "Am\u00e9liorer la productivit\u00e9 (automatisation, digitalisation)", "Revoir la structure de co\u00fbts fixes vs variables"],
    benchmarks: { 'Construction / BTP': '8-15% du CA', 'Tech / SaaS': '15-40% du CA', 'Services': '10-25% du CA', 'Commerce': '5-12% du CA', 'Industrie': '10-20% du CA' },
  },
  roe: {
    slug: 'roe', label: 'ROE (Return on Equity)',
    full: "ROE \u2014 Return on Equity (Rentabilit\u00e9 des capitaux propres)",
    def: "Le ROE mesure combien de b\u00e9n\u00e9fice net l'entreprise g\u00e9n\u00e8re pour chaque euro investi par les actionnaires. Sur 100\u00a0\u20ac de capitaux propres, combien de profit net ? C'est le rendement pour les propri\u00e9taires.",
    why: "Le ROE est l'indicateur cl\u00e9 pour les investisseurs et repreneurs. Il r\u00e9pond \u00e0 la question : \u00ab est-ce que mon argent travaille bien dans cette entreprise ? \u00bb. Un ROE \u00e9lev\u00e9 justifie un prix de rachat plus haut.",
    formula: "ROE = R\u00e9sultat net / Capitaux propres \u00d7 100",
    good: "Un ROE sup\u00e9rieur au co\u00fbt du capital (g\u00e9n\u00e9ralement 8-10% pour une PME belge). Au-dessus de 15%, l'entreprise cr\u00e9e significativement de la valeur pour ses actionnaires.",
    bad: "Un ROE n\u00e9gatif (pertes) ou inf\u00e9rieur \u00e0 5% est probl\u00e9matique \u2014 les actionnaires gagneraient plus en pla\u00e7ant leur argent ailleurs.",
    improve: ["Am\u00e9liorer la marge nette (r\u00e9duction des co\u00fbts, pricing)", "Optimiser l'effet de levier financier (endettement raisonnable)", "Am\u00e9liorer la rotation des actifs (vendre plus avec moins d'actifs)", "Distribuer les r\u00e9serves exc\u00e9dentaires pour concentrer les capitaux propres"],
    benchmarks: { 'Construction / BTP': '8-20%', 'Tech / SaaS': '12-30%', 'Services': '10-25%', 'Commerce': '8-18%', 'Industrie': '8-20%' },
  },
  roa: {
    slug: 'roa', label: 'ROA (Return on Assets)',
    full: "ROA \u2014 Return on Assets (Rentabilit\u00e9 des actifs)",
    def: "Le ROA mesure l'efficacit\u00e9 avec laquelle l'entreprise utilise l'ensemble de ses actifs pour g\u00e9n\u00e9rer du profit. Contrairement au ROE, il ne d\u00e9pend pas de la structure de financement.",
    why: "Le ROA est particuli\u00e8rement utile pour comparer des entreprises avec des niveaux d'endettement diff\u00e9rents. Il montre la performance intrins\u00e8que de l'activit\u00e9, ind\u00e9pendamment du levier financier.",
    formula: "ROA = R\u00e9sultat net / Total actif \u00d7 100",
    good: "Un ROA sup\u00e9rieur \u00e0 5% est g\u00e9n\u00e9ralement bon pour une PME. Les entreprises \u00e0 faible intensit\u00e9 capitalistique (services, tech) ont naturellement des ROA plus \u00e9lev\u00e9s.",
    bad: "Un ROA tr\u00e8s faible (<2%) sugg\u00e8re une sous-utilisation des actifs ou une rentabilit\u00e9 insuffisante par rapport \u00e0 la taille du bilan.",
    improve: ["C\u00e9der les actifs non productifs (immobilier non utilis\u00e9, participations dormantes)", "Am\u00e9liorer la marge nette", "Optimiser le besoin en fonds de roulement", "Privil\u00e9gier le leasing au lieu de l'achat pour les \u00e9quipements"],
    benchmarks: { 'Construction / BTP': '3-8%', 'Tech / SaaS': '5-15%', 'Services': '5-12%', 'Commerce': '3-8%', 'Industrie': '4-10%' },
  },
  gearing: {
    slug: 'gearing', label: 'Gearing',
    full: "Gearing \u2014 Ratio d'endettement net",
    def: "Le gearing mesure le rapport entre la dette nette et les capitaux propres. Il quantifie le levier financier : combien d'euros de dette pour chaque euro de fonds propres.",
    why: "Un gearing mod\u00e9r\u00e9 peut booster la rentabilit\u00e9 des fonds propres (effet de levier). Mais un gearing trop \u00e9lev\u00e9 fragilise l'entreprise \u2014 les banques belges surveillent ce ratio de pr\u00e8s pour l'octroi de cr\u00e9dit.",
    formula: "Gearing = Dette nette / Capitaux propres",
    good: "Un gearing inf\u00e9rieur \u00e0 1 signifie plus de fonds propres que de dettes \u2014 structure solide. Entre 0.5 et 1.5 est g\u00e9n\u00e9ralement acceptable pour une PME belge.",
    bad: "Au-dessus de 2, l'entreprise est fortement endett\u00e9e. Les banques peuvent refuser de nouveaux financements et les acquéreurs appliqueront une d\u00e9cote significative.",
    improve: ["Renforcer les fonds propres (r\u00e9tention de b\u00e9n\u00e9fices, augmentation de capital)", "Rembourser la dette bancaire par anticipation", "Convertir de la dette en quasi-fonds propres (pr\u00eat subordonn\u00e9)", "Optimiser le BFR pour r\u00e9duire le besoin de financement externe"],
    benchmarks: { 'Construction / BTP': '0.3-1.5', 'Tech / SaaS': '0.0-0.8', 'Services': '0.2-1.2', 'Commerce': '0.5-2.0', 'Industrie': '0.3-1.5' },
  },
  solvabilite: {
    slug: 'solvabilite', label: 'Solvabilit\u00e9',
    full: "Solvabilit\u00e9 \u2014 Autonomie financi\u00e8re",
    def: "La solvabilit\u00e9 mesure la part des capitaux propres dans le total du bilan. Plus ce ratio est \u00e9lev\u00e9, moins l'entreprise d\u00e9pend de ses cr\u00e9anciers. C'est un indicateur fondamental de la solidit\u00e9 financi\u00e8re.",
    why: "Les banques belges et les investisseurs regardent syst\u00e9matiquement la solvabilit\u00e9 avant d'accorder un financement. Le Code des soci\u00e9t\u00e9s (CSA) impose m\u00eame un signal d'alarme si les capitaux propres tombent sous certains seuils.",
    formula: "Solvabilit\u00e9 = Capitaux propres / Total actif \u00d7 100",
    good: "Au-dessus de 30%, l'entreprise est consid\u00e9r\u00e9e comme financi\u00e8rement autonome. Au-dessus de 50%, la structure est tr\u00e8s solide.",
    bad: "En dessous de 20%, l'entreprise est vuln\u00e9rable. En dessous de 10%, les banques refuseront g\u00e9n\u00e9ralement tout nouveau cr\u00e9dit.",
    improve: ["Retenir les b\u00e9n\u00e9fices dans l'entreprise (limiter les dividendes)", "Augmentation de capital", "Convertir les comptes courants d'associ\u00e9s en capital", "Am\u00e9liorer la rentabilit\u00e9 pour accumuler des r\u00e9serves"],
    benchmarks: { 'Construction / BTP': '25-45%', 'Tech / SaaS': '30-60%', 'Services': '25-50%', 'Commerce': '20-40%', 'Industrie': '30-50%' },
  },
  'liquidite-generale': {
    slug: 'liquidite-generale', label: 'Liquidit\u00e9 g\u00e9n\u00e9rale',
    full: "Liquidit\u00e9 g\u00e9n\u00e9rale \u2014 Current Ratio",
    def: "La liquidit\u00e9 g\u00e9n\u00e9rale compare les actifs \u00e0 court terme aux dettes \u00e0 court terme. Elle r\u00e9pond \u00e0 la question : l'entreprise peut-elle payer ses dettes exigibles dans l'ann\u00e9e avec ses actifs disponibles ?",
    why: "C'est un indicateur critique pour la survie de l'entreprise. Une liquidit\u00e9 insuffisante est la premi\u00e8re cause de faillite des PME belges \u2014 m\u00eame des entreprises rentables peuvent faire faillite par manque de tr\u00e9sorerie.",
    formula: "Liquidit\u00e9 g\u00e9n\u00e9rale = Actifs circulants / Dettes \u00e0 court terme",
    good: "Au-dessus de 1.2, l'entreprise a une marge de s\u00e9curit\u00e9 confortable. Id\u00e9alement entre 1.5 et 2.0 pour la plupart des secteurs.",
    bad: "En dessous de 1, l'entreprise ne peut pas couvrir ses dettes \u00e0 court terme \u2014 risque de cessation de paiement. Situation d'urgence.",
    improve: ["Acc\u00e9l\u00e9rer l'encaissement des cr\u00e9ances clients (factoring, relances)", "N\u00e9gocier des d\u00e9lais de paiement plus longs avec les fournisseurs", "R\u00e9duire les stocks excessifs", "Refinancer la dette court terme en dette long terme"],
    benchmarks: { 'Construction / BTP': '1.1-1.8', 'Tech / SaaS': '1.5-3.0', 'Services': '1.2-2.0', 'Commerce': '1.0-1.6', 'Industrie': '1.2-2.0' },
  },
  bfr: {
    slug: 'bfr', label: 'BFR en jours de CA',
    full: "BFR \u2014 Besoin en Fonds de Roulement",
    def: "Le BFR en jours de CA mesure combien de jours de chiffre d'affaires sont immobilis\u00e9s dans le cycle d'exploitation : stocks + cr\u00e9ances clients - dettes fournisseurs.",
    why: "Le BFR d\u00e9termine le besoin de financement li\u00e9 \u00e0 l'activit\u00e9 courante. Un BFR \u00e9lev\u00e9 signifie que l'entreprise doit financer un d\u00e9calage important entre ses d\u00e9caissements et ses encaissements.",
    formula: "BFR = (Stocks + Cr\u00e9ances clients - Dettes fournisseurs) \u00d7 365 / CA",
    good: "Un BFR inf\u00e9rieur \u00e0 30 jours est excellent. Un BFR n\u00e9gatif (comme en grande distribution) signifie que l'activit\u00e9 s'autofinance.",
    bad: "Un BFR sup\u00e9rieur \u00e0 90 jours immobilise beaucoup de capital et n\u00e9cessite des financements co\u00fbteux.",
    improve: ["R\u00e9duire les d\u00e9lais de paiement clients (factoring, escompte pour paiement rapide)", "N\u00e9gocier des d\u00e9lais fournisseurs plus longs", "Optimiser la gestion des stocks (just-in-time, r\u00e9duction du stock dormant)", "Automatiser la facturation et les relances"],
    benchmarks: { 'Construction / BTP': '30-90 jours', 'Tech / SaaS': '0-30 jours', 'Services': '15-60 jours', 'Commerce': '20-60 jours', 'Industrie': '40-90 jours' },
  },
  'dette-ebitda': {
    slug: 'dette-ebitda', label: 'Dette nette / EBITDA',
    full: "Ratio Dette nette / EBITDA \u2014 Capacit\u00e9 de remboursement",
    def: "Ce ratio indique le nombre d'ann\u00e9es th\u00e9oriques n\u00e9cessaires pour rembourser la dette nette avec l'EBITDA g\u00e9n\u00e9r\u00e9. C'est l'indicateur privil\u00e9gi\u00e9 des banques pour \u00e9valuer la capacit\u00e9 de remboursement.",
    why: "Les banques belges utilisent syst\u00e9matiquement ce ratio pour accorder ou refuser un cr\u00e9dit. C'est aussi un crit\u00e8re cl\u00e9 dans les covenants bancaires (clauses de respect de ratios).",
    formula: "Dette/EBITDA = Dette nette bancaire / EBITDA",
    good: "En dessous de 3 ans \u2014 situation confortable, les banques accorderont facilement du cr\u00e9dit suppl\u00e9mentaire.",
    bad: "Au-dessus de 5 ans \u2014 endettement lourd. Les banques peuvent exiger des garanties suppl\u00e9mentaires ou refuser de nouveaux financements.",
    improve: ["G\u00e9n\u00e9rer plus d'EBITDA (croissance du CA, r\u00e9duction des co\u00fbts)", "Rembourser la dette par anticipation avec la tr\u00e9sorerie exc\u00e9dentaire", "Refinancer \u00e0 des conditions plus favorables", "\u00c9viter de nouveaux emprunts tant que le ratio n'est pas am\u00e9lior\u00e9"],
    benchmarks: { 'Construction / BTP': '< 4 ans', 'Tech / SaaS': '< 2 ans', 'Services': '< 3 ans', 'Commerce': '< 4 ans', 'Industrie': '< 3.5 ans' },
  },
  'marge-nette': {
    slug: 'marge-nette', label: 'Marge nette',
    full: "Marge nette \u2014 Rentabilit\u00e9 apr\u00e8s toutes charges",
    def: "La marge nette repr\u00e9sente la part du chiffre d'affaires qui reste en b\u00e9n\u00e9fice net apr\u00e8s l'ensemble des charges : exploitation, financi\u00e8res et imp\u00f4ts. C'est la rentabilit\u00e9 r\u00e9elle de l'entreprise.",
    why: "La marge nette montre ce qui reste vraiment dans la poche de l'entreprise. C'est un indicateur de la qualit\u00e9 de la gestion globale et de la capacit\u00e9 \u00e0 r\u00e9mun\u00e9rer les actionnaires.",
    formula: "Marge nette = R\u00e9sultat net / Chiffre d'affaires \u00d7 100",
    good: "Au-dessus de 8%, l'entreprise est bien g\u00e9r\u00e9e. Les marges varient fortement selon les secteurs \u2014 5% en commerce est excellent, mais m\u00e9diocre en tech.",
    bad: "Une marge nette n\u00e9gative signifie que l'entreprise perd de l'argent. M\u00eame une marge faible (<2%) pose question sur la viabilit\u00e9 long terme.",
    improve: ["Augmenter les prix (si le march\u00e9 le permet)", "R\u00e9duire les co\u00fbts d'exploitation", "Optimiser la fiscalit\u00e9 (d\u00e9duction int\u00e9r\u00eats notionnels, investissements d\u00e9ductibles)", "R\u00e9n\u00e9gocier les conditions de financement"],
    benchmarks: { 'Construction / BTP': '3-8%', 'Tech / SaaS': '8-25%', 'Services': '5-15%', 'Commerce': '2-6%', 'Industrie': '4-10%' },
  },
  'couverture-interets': {
    slug: 'couverture-interets', label: 'Couverture des int\u00e9r\u00eats',
    full: "Ratio de couverture des int\u00e9r\u00eats \u2014 Interest Coverage Ratio",
    def: "Ce ratio mesure combien de fois le r\u00e9sultat d'exploitation couvre les charges financi\u00e8res (int\u00e9r\u00eats sur emprunts). C'est un indicateur de la capacit\u00e9 \u00e0 supporter le co\u00fbt de la dette.",
    why: "En p\u00e9riode de hausse des taux d'int\u00e9r\u00eat, ce ratio devient crucial. Une couverture insuffisante signifie que l'entreprise pourrait ne plus pouvoir honorer ses charges financi\u00e8res.",
    formula: "Couverture = R\u00e9sultat d'exploitation / Charges financi\u00e8res",
    good: "Au-dessus de 3x \u2014 marge de s\u00e9curit\u00e9 confortable, m\u00eame en cas de hausse des taux. Au-dessus de 5x, la dette ne p\u00e8se quasiment pas.",
    bad: "En dessous de 1.5x \u2014 dangereux. L'entreprise consacre une part excessive de son r\u00e9sultat au paiement des int\u00e9r\u00eats.",
    improve: ["Am\u00e9liorer le r\u00e9sultat d'exploitation", "Rembourser une partie de la dette", "Ren\u00e9gocier les taux d'int\u00e9r\u00eat", "Convertir de la dette variable en taux fixe pour pr\u00e9visibilit\u00e9"],
    benchmarks: { 'Construction / BTP': '> 2.5x', 'Tech / SaaS': '> 4x', 'Services': '> 3x', 'Commerce': '> 2x', 'Industrie': '> 3x' },
  },
  'valorisation-ebitda': {
    slug: 'valorisation-ebitda', label: 'Valorisation EV/EBITDA',
    full: "M\u00e9thode EV/EBITDA \u2014 Valorisation par les multiples",
    def: "La m\u00e9thode EV/EBITDA est la plus utilis\u00e9e pour valoriser une PME. Elle consiste \u00e0 multiplier l'EBITDA par un multiple sectoriel pour obtenir la valeur d'entreprise (Enterprise Value).",
    why: "C'est la m\u00e9thode de r\u00e9f\u00e9rence dans les transactions de PME en Belgique. Les acquéreurs, les banques et les experts-comptables l'utilisent syst\u00e9matiquement comme point de d\u00e9part d'une n\u00e9gociation.",
    formula: "Valeur d'entreprise (EV) = EBITDA \u00d7 Multiple sectoriel\nValeur des fonds propres = EV - Dette nette",
    good: "Un multiple \u00e9lev\u00e9 (>8x) refl\u00e8te une entreprise en croissance, avec des avantages comp\u00e9titifs forts et une bonne r\u00e9currence des revenus.",
    bad: "Un multiple faible (<4x) sugg\u00e8re une entreprise mature, d\u00e9pendante d'un dirigeant cl\u00e9, ou dans un secteur en d\u00e9clin.",
    improve: ["D\u00e9montrer une croissance r\u00e9guli\u00e8re de l'EBITDA sur 3-5 ans", "Diversifier la base clients (r\u00e9duire la d\u00e9pendance)", "Documenter les processus pour r\u00e9duire la d\u00e9pendance au dirigeant", "D\u00e9velopper des revenus r\u00e9currents (contrats, abonnements)"],
    benchmarks: { 'Construction / BTP': '4-6x', 'Tech / SaaS': '8-15x', 'Services': '5-8x', 'Commerce': '4-7x', 'Industrie': '5-8x' },
  },
  dcf: {
    slug: 'valorisation-dcf', label: 'Valorisation DCF',
    full: "DCF \u2014 Discounted Cash Flow (Flux de tr\u00e9sorerie actualis\u00e9s)",
    def: "La m\u00e9thode DCF projette les flux de tr\u00e9sorerie futurs de l'entreprise et les actualise au co\u00fbt du capital. C'est la m\u00e9thode th\u00e9oriquement la plus rigoureuse pour valoriser une entreprise.",
    why: "Le DCF est privil\u00e9gi\u00e9 pour les entreprises en croissance dont la valeur r\u00e9side dans les flux futurs plut\u00f4t que dans les actifs actuels. C'est aussi la m\u00e9thode utilis\u00e9e par les fonds d'investissement pour les op\u00e9rations de private equity.",
    formula: "DCF = \u03a3(FCF\u2099 / (1+WACC)\u207f) + Valeur terminale / (1+WACC)\u2075\nFCF = EBITDA - Imp\u00f4ts - Capex",
    good: "Une valeur DCF sup\u00e9rieure \u00e0 la valeur EV/EBITDA sugg\u00e8re un potentiel de croissance valoris\u00e9 par le march\u00e9.",
    bad: "Le DCF est tr\u00e8s sensible aux hypoth\u00e8ses (taux de croissance, WACC). Avec moins de 3 exercices historiques, les projections sont fragiles.",
    improve: ["Fournir 3 \u00e0 5 ans d'historique pour des projections fiables", "D\u00e9montrer une croissance stable et pr\u00e9visible", "R\u00e9duire la volatilit\u00e9 des r\u00e9sultats", "Avoir un plan d'affaires document\u00e9 pour justifier les projections"],
    benchmarks: { 'Construction / BTP': 'WACC 8-10%', 'Tech / SaaS': 'WACC 10-15%', 'Services': 'WACC 8-12%', 'Commerce': 'WACC 8-10%', 'Industrie': 'WACC 8-10%' },
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

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

var ratioKeys = Object.keys(ratios);

var CSS = '<style>\n'
  + '.breadcrumb{font-size:.8rem;color:#5a7fa0;margin-bottom:20px}.breadcrumb a{color:#5a7fa0;text-decoration:none}.breadcrumb a:hover{color:#00c896}.breadcrumb span{margin:0 6px}\n'
  + '.seo{max-width:760px;margin:0 auto;padding:100px 24px 80px}\n'
  + '.seo h1{font-size:1.6rem;line-height:1.3;margin-bottom:8px}\n'
  + '.seo h2{font-size:1.15rem;color:#00c896;margin-top:32px;margin-bottom:12px}\n'
  + '.seo h3{font-size:1rem;color:#fff;margin-bottom:8px}\n'
  + '.seo p,.seo li{color:#8fa3bf;font-size:.95rem;line-height:1.7;margin-bottom:12px}\n'
  + '.seo ul{padding-left:20px;margin-bottom:16px}\n'
  + '.seo li{margin-bottom:6px}\n'
  + '.seo-sub{color:#5a7fa0;font-size:.9rem;margin-bottom:24px}\n'
  + '.seo-formula{background:#162d4a;padding:16px 20px;border-radius:10px;font-family:monospace;color:#00c896;font-size:.9rem;margin:16px 0 24px;white-space:pre-line;line-height:1.6}\n'
  + '.seo-good{background:rgba(0,200,150,.06);border-left:3px solid #00c896;padding:14px 18px;border-radius:0 8px 8px 0;margin:12px 0}\n'
  + '.seo-bad{background:rgba(255,100,100,.06);border-left:3px solid #ff6b6b;padding:14px 18px;border-radius:0 8px 8px 0;margin:12px 0}\n'
  + '.seo-card{background:#162d4a;border:1px solid rgba(30,58,95,.6);border-radius:12px;padding:20px;margin:16px 0;text-align:center}\n'
  + '.seo-bench-val{font-size:1.5rem !important;font-weight:700;color:#00c896 !important}\n'
  + '.seo-cta{text-align:center;margin:48px 0 0;padding:36px;background:linear-gradient(135deg,#162d4a,#1e3a5f);border-radius:16px;border:1px solid rgba(0,200,150,.2)}\n'
  + '.seo-cta h2{color:#fff !important;margin-top:0}\n'
  + '.pills{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 24px}\n'
  + '.pill{display:inline-block;padding:6px 14px;border-radius:100px;font-size:.8rem;color:#8fa3bf;border:1px solid #1e3a5f;text-decoration:none;transition:all .2s}\n'
  + '.pill:hover,.pill--active{background:#00c896;color:#0b1929;border-color:#00c896;text-decoration:none}\n'
  + '.prevnext{display:flex;justify-content:space-between;margin:40px 0 0;padding-top:20px;border-top:1px solid #1e3a5f}\n'
  + '.prevnext a{color:#8fa3bf;text-decoration:none;font-size:.9rem}.prevnext a:hover{color:#00c896}\n'
  + '.other-ratios{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:16px}\n'
  + '.other-ratios a{display:block;background:#162d4a;border:1px solid rgba(30,58,95,.6);border-radius:10px;padding:14px;text-align:center;color:#fff;text-decoration:none;font-size:.85rem;font-weight:600;transition:border-color .2s}\n'
  + '.other-ratios a:hover{border-color:#00c896}\n'
  + '.other-ratios a span{display:block;font-size:.75rem;color:#5a7fa0;font-weight:400;margin-top:4px}\n'
  + '.secteur-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-top:12px}\n'
  + '.secteur-cards a{display:block;background:#162d4a;border:1px solid rgba(30,58,95,.6);border-radius:8px;padding:12px;text-align:center;color:#8fa3bf;text-decoration:none;font-size:.85rem;transition:border-color .2s}\n'
  + '.secteur-cards a:hover{border-color:#00c896;color:#fff}\n'
  + '.ratio-cta{background:#1a2535;padding:60px 20px;text-align:center;border-top:1px solid rgba(255,255,255,.05)}\n'
  + '.ratio-cta-inner{max-width:640px;margin:0 auto}\n'
  + '.ratio-cta h2{font-size:1.6rem;font-weight:700;color:#fff;max-width:600px;margin:0 auto 16px;line-height:1.3}\n'
  + '.ratio-cta p{font-size:1rem;color:rgba(255,255,255,.6);max-width:500px;margin:0 auto}\n'
  + '.ratio-cta-btn{display:inline-block;background:#00c896;color:#0f1923;padding:16px 36px;border-radius:8px;font-weight:700;font-size:1.05rem;text-decoration:none;margin-top:24px;transition:transform .2s}\n'
  + '.ratio-cta-btn:hover{transform:translateY(-2px);text-decoration:none}\n'
  + '.ratio-cta-sub{display:block;margin-top:12px;font-size:.75rem;color:rgba(255,255,255,.35)}\n'
  + '</style>\n';

var HEADER = '<header class="header"><div class="container header__inner"><a href="/" class="logo">BWIX<span class="logo__dot">.</span></a><a href="https://www.bwix.app/#analyse" class="btn btn--small">Lancer une analyse</a></div></header>\n';

// CTA verb per ratio for dynamic button text
var CTA_VERBS = {
  'ebitda': "Calculer l'EBITDA",
  'roe': "Calculer le ROE",
  'roa': "Calculer le ROA",
  'gearing': "Analyser l'endettement",
  'solvabilite': "Analyser la solvabilit\u00e9",
  'liquidite-generale': "Analyser la liquidit\u00e9",
  'bfr': "Calculer le BFR",
  'dette-ebitda': "Analyser la dette/EBITDA",
  'marge-nette': "Calculer la marge nette",
  'couverture-interets': "Analyser la couverture int\u00e9r\u00eats",
  'valorisation-ebitda': "Obtenir la valorisation",
  'valorisation-dcf': "Obtenir la valorisation DCF",
};

var SECTEUR_SHORT = {
  'construction-btp': 'BTP',
  'tech-saas': 'tech',
  'services': 'services',
  'commerce': 'commerce',
  'industrie': 'industrie',
};

var FOOTER = '<footer class="footer"><div class="container footer__grid">'
  + '<div class="footer__col"><p class="footer__brand">BWIX<span style="color:#00c896">.</span></p><p>\u00a9 2026 Braze SRL</p></div>'
  + '<div class="footer__col"><p class="footer__heading">L\u00e9gal</p><a href="/mentions-legales">Mentions l\u00e9gales</a><a href="/confidentialite">Confidentialit\u00e9</a><a href="/conditions-utilisation">CGU</a></div>'
  + '<div class="footer__col"><p class="footer__heading">Ratios</p>'
  + ratioKeys.map(function(k){ return '<a href="/ratio/' + ratios[k].slug + '">' + ratios[k].label.split(' \u2014')[0].split(' (')[0] + '</a>'; }).join('')
  + '</div></div></footer>\n';

function buildPage(r, s, isGeneric) {
  var rIdx = ratioKeys.indexOf(Object.keys(ratios).find(function(k){ return ratios[k].slug === r.slug; }));
  var prevR = rIdx > 0 ? ratios[ratioKeys[rIdx - 1]] : null;
  var nextR = rIdx < ratioKeys.length - 1 ? ratios[ratioKeys[rIdx + 1]] : null;

  var title, h1, canonical, benchBlock, secteurPills, secteurSection, voirAussi;

  if (isGeneric) {
    title = r.label + ' \u2014 Guide complet PME belge | BWIX';
    h1 = r.full + ' \u2014 Guide pour les PME belges';
    canonical = 'https://www.bwix.app/ratio/' + r.slug;
    benchBlock = '';
    // Sector pills
    secteurPills = '<div class="pills">'
      + secteurs.map(function(ss){ return '<a class="pill" href="/ratio/' + r.slug + '--' + ss.slug + '">' + ss.label + '</a>'; }).join('')
      + '</div>';
    // Sector cards section
    secteurSection = '<h2>Par secteur d\u2019activit\u00e9</h2><div class="secteur-cards">'
      + secteurs.map(function(ss){ return '<a href="/ratio/' + r.slug + '--' + ss.slug + '">' + r.label.split(' (')[0] + ' \u2014 ' + ss.label + '</a>'; }).join('')
      + '</div>';
    voirAussi = '';
  } else {
    title = r.label + ' \u2014 PME ' + s.label + ' belge | BWIX';
    h1 = r.full + ' pour les PME ' + s.label + ' en Belgique';
    canonical = 'https://www.bwix.app/ratio/' + r.slug + '--' + s.slug;
    var bench = (r.benchmarks && r.benchmarks[s.value]) || '';
    benchBlock = bench ? '<div class="seo-card"><h3>Benchmark ' + s.label + ' belge</h3><p class="seo-bench-val">' + bench + '</p></div>' : '';
    // Sector pills with active
    secteurPills = '<div class="pills">'
      + secteurs.map(function(ss){
        var active = ss.slug === s.slug ? ' pill--active' : '';
        return '<a class="pill' + active + '" href="/ratio/' + r.slug + '--' + ss.slug + '">' + ss.label + '</a>';
      }).join('')
      + '</div>';
    secteurSection = '';
    // Voir aussi
    voirAussi = '<h2>Voir aussi ce ratio pour</h2><div class="secteur-cards">'
      + secteurs.filter(function(ss){ return ss.slug !== s.slug; }).map(function(ss){
        return '<a href="/ratio/' + r.slug + '--' + ss.slug + '">' + ss.label + '</a>';
      }).join('')
      + '</div>';
  }

  var improveList = (r.improve || []).map(function(i){ return '<li>' + i + '</li>'; }).join('');

  // Prev/next nav
  var prevnext = '<div class="prevnext">';
  prevnext += prevR ? '<a href="/ratio/' + prevR.slug + (isGeneric ? '' : '--' + s.slug) + '">\u2190 ' + prevR.label.split(' (')[0] + '</a>' : '<span></span>';
  prevnext += nextR ? '<a href="/ratio/' + nextR.slug + (isGeneric ? '' : '--' + s.slug) + '">' + nextR.label.split(' (')[0] + ' \u2192</a>' : '<span></span>';
  prevnext += '</div>';

  // Other ratios
  var otherRatios = '<h2>Autres ratios financiers</h2><div class="other-ratios">'
    + ratioKeys.filter(function(k){ return ratios[k].slug !== r.slug; }).slice(0, 5).map(function(k){
      var or2 = ratios[k];
      return '<a href="/ratio/' + or2.slug + (isGeneric ? '' : '--' + s.slug) + '">' + or2.label.split(' (')[0] + '<span>' + or2.full.split(' \u2014 ')[1] + '</span></a>';
    }).join('')
    + '</div>';

  var breadcrumbSecteur = isGeneric ? '' : ' <span>\u203a</span> ' + s.label;

  return '<!DOCTYPE html>\n<html lang="fr-BE"><head>\n'
    + '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">\n'
    + '<title>' + esc(title) + '</title>\n'
    + '<meta name="description" content="' + esc(r.def.substring(0, 155)) + '">\n'
    + '<link rel="canonical" href="' + canonical + '">\n'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n'
    + '<link rel="stylesheet" href="../style.css">\n'
    + CSS
    + '</head><body>\n'
    + HEADER
    + '<main class="seo">\n'
    + '<nav class="breadcrumb"><a href="/">bwix.app</a> <span>\u203a</span> <a href="/ratio/ebitda">Ratios</a> <span>\u203a</span> <a href="/ratio/' + r.slug + '">' + r.label.split(' (')[0] + '</a>' + breadcrumbSecteur + '</nav>\n'
    + '<h1>' + h1 + '</h1>\n'
    + secteurPills
    + '<h2>D\u00e9finition</h2>\n<p>' + r.def + '</p>\n'
    + '<h2>Pourquoi ce ratio est important</h2>\n<p>' + r.why + '</p>\n'
    + '<h2>Formule de calcul</h2>\n<div class="seo-formula">' + r.formula + '</div>\n'
    + benchBlock + '\n'
    + '<h2>Interpr\u00e9tation</h2>\n'
    + '<div class="seo-good"><strong>\u2705 Bon signal :</strong> ' + r.good + '</div>\n'
    + '<div class="seo-bad"><strong>\u26a0\ufe0f Signal d\'alerte :</strong> ' + r.bad + '</div>\n'
    + '<h2>Comment am\u00e9liorer ce ratio</h2>\n<ul>' + improveList + '</ul>\n'
    + secteurSection + '\n'
    + voirAussi + '\n'
    + otherRatios + '\n'
    + prevnext + '\n'
    + '</main>\n'
    + '<section class="ratio-cta"><div class="ratio-cta-inner">\n'
    + '<h2>Obtenez la valorisation et la sant\u00e9 financi\u00e8re de n\u2019importe quelle soci\u00e9t\u00e9 belge</h2>\n'
    + '<p>Uploadez un bilan BNB officiel \u2014 ratios cl\u00e9s, score de sant\u00e9, valorisation 3 m\u00e9thodes et diagnostic financier complet en moins de 2 minutes.</p>\n'
    + '<a href="https://www.bwix.app/#analyse" class="ratio-cta-btn">' + (function(){
      var verb = CTA_VERBS[r.slug] || ('Analyser le ' + r.label.split(' (')[0]);
      if (isGeneric) return verb + ' de ma soci\u00e9t\u00e9 belge \u2192';
      return verb + ' de ma soci\u00e9t\u00e9 ' + (SECTEUR_SHORT[s.slug] || s.label) + ' \u2192';
    })() + '</a>\n'
    + '<span class="ratio-cta-sub">PDF BNB uniquement \u00b7 consult.cbso.nbb.be</span>\n'
    + '</div></section>\n'
    + FOOTER
    + '</body></html>';
}

var count = 0;
ratioKeys.forEach(function (key) {
  var r = ratios[key];
  // Generic page (no sector)
  fs.writeFileSync(path.join(outDir, r.slug + '.html'), buildPage(r, secteurs[0], true));
  count++;
  // Sectoral pages
  secteurs.forEach(function (s) {
    fs.writeFileSync(path.join(outDir, r.slug + '--' + s.slug + '.html'), buildPage(r, s, false));
    count++;
  });
});

console.log('Generated ' + count + ' SEO pages in ' + outDir);
