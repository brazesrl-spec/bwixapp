#!/usr/bin/env node
/* Generate guide pages: /guide/[slug].html */
var fs = require('fs');
var path = require('path');

var DISCLAIMER = '<section style="padding:32px 0"><div class="container container--narrow" style="text-align:center">'
  + '<p style="font-size:.82rem;color:#5a7fa0;line-height:1.6;background:rgba(30,58,95,.15);padding:16px 20px;border-radius:10px">'
  + '<strong style="color:#8fa3bf">ℹ️ Avertissement</strong><br>'
  + 'Les analyses et contenus propos\u00e9s par BWIX ont une vocation informative et p\u00e9dagogique. '
  + 'Ils ne constituent pas un conseil juridique, comptable ou financier. '
  + 'Toute d\u00e9cision relative \u00e0 une cession, acquisition, valorisation ou convention d\u2019actionnaires '
  + 'doit \u00eatre prise en concertation avec vos conseillers juridiques, comptables ou fiduciaires, '
  + 'en fonction de votre situation particuli\u00e8re.'
  + '</p></div></section>';

var HEADER = '<header class="header"><div class="container header__inner">'
  + '<a href="/" class="logo">BWIX<span class="logo__dot">.</span></a>'
  + '<a href="/" class="btn btn--small">Analyser</a></div></header>';

var FOOTER = '<footer class="footer"><div class="container footer__grid">'
  + '<div class="footer__col"><p class="footer__brand">BWIX<span style="color:#00c896">.</span></p><p>\u00a9 2026 Braze SRL</p></div>'
  + '<div class="footer__col"><p class="footer__heading">L\u00e9gal</p>'
  + '<a href="/mentions-legales">Mentions l\u00e9gales</a><a href="/confidentialite">Confidentialit\u00e9</a><a href="/conditions-utilisation">CGU</a></div>'
  + '<div class="footer__col"><p class="footer__heading">Guides</p>'
  + '<a href="/guide/cession-entreprise">Cession d\u2019entreprise</a>'
  + '<a href="/guide/acquisition-rachat">Acquisition / Rachat</a>'
  + '<a href="/guide/credit-bancaire">Cr\u00e9dit bancaire</a>'
  + '<a href="/guide/convention-actionnaires-valorisation">Convention d\u2019actionnaires</a>'
  + '</div></div></footer>';

var CSS = '<style>'
  + '.guide{max-width:760px;margin:0 auto;padding:100px 24px 60px}'
  + '.guide h1{font-size:1.7rem;line-height:1.3;margin-bottom:12px}'
  + '.guide h2{font-size:1.15rem;color:#00c896;margin-top:36px;margin-bottom:12px}'
  + '.guide h3{font-size:1rem;color:#fff;margin-bottom:8px}'
  + '.guide p,.guide li{color:#8fa3bf;font-size:.95rem;line-height:1.7;margin-bottom:12px}'
  + '.guide ul{padding-left:20px;margin-bottom:16px}'
  + '.guide li{margin-bottom:6px}'
  + '.guide-intro{font-size:1.05rem;color:#a0b4cc;line-height:1.8;margin-bottom:28px}'
  + '.guide-sub{color:#5a7fa0;font-size:.9rem;margin-bottom:24px}'
  + '.breadcrumb{font-size:.8rem;color:#5a7fa0;margin-bottom:20px}'
  + '.breadcrumb a{color:#5a7fa0;text-decoration:none}.breadcrumb a:hover{color:#00c896}'
  + '.breadcrumb span{margin:0 6px}'
  + '.ratio-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:16px 0}'
  + '.ratio-links a{display:block;background:#162d4a;border:1px solid rgba(30,58,95,.6);border-radius:10px;padding:14px;color:#fff;text-decoration:none;font-size:.9rem;font-weight:600;transition:border-color .2s}'
  + '.ratio-links a:hover{border-color:#00c896}'
  + '.ratio-links a small{display:block;color:#5a7fa0;font-size:.78rem;font-weight:400;margin-top:3px}'
  + '.guide-cta{text-align:center;margin:40px 0;padding:32px;background:linear-gradient(135deg,#162d4a,#1e3a5f);border-radius:16px;border:1px solid rgba(0,200,150,.2)}'
  + '.guide-cta h2{color:#fff !important;margin-top:0}'
  + '.guide-faq{margin-top:32px}'
  + '.guide-faq details{background:#162d4a;border:1px solid rgba(30,58,95,.6);border-radius:10px;margin-bottom:8px;padding:0}'
  + '.guide-faq summary{padding:14px 18px;cursor:pointer;color:#fff;font-weight:600;font-size:.9rem;list-style:none}'
  + '.guide-faq summary::-webkit-details-marker{display:none}'
  + '.guide-faq summary::before{content:"+ ";color:#00c896;font-weight:700}'
  + '.guide-faq details[open] summary::before{content:"- "}'
  + '.guide-faq .faq-answer{padding:0 18px 14px;color:#8fa3bf;font-size:.9rem;line-height:1.6}'
  + '.guide-related{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}'
  + '.guide-related a{padding:8px 16px;background:#162d4a;border:1px solid rgba(30,58,95,.6);border-radius:8px;color:#8fa3bf;text-decoration:none;font-size:.85rem;transition:border-color .2s}'
  + '.guide-related a:hover{border-color:#00c896;color:#fff}'
  + 'blockquote{background:#162d4a;border-left:3px solid #00c896;margin:16px 0;padding:16px 20px;border-radius:0 10px 10px 0;font-style:italic;color:#a0b4cc;font-size:.9rem;line-height:1.7}'
  + '</style>';

var guides = [
  {
    slug: 'cession-entreprise',
    title: 'Cession d\u2019entreprise en Belgique \u2014 Pr\u00e9parer la vente de sa PME',
    metaDesc: 'Comment pr\u00e9parer la cession de votre PME belge ? Ratios financiers cl\u00e9s, valorisation EV/EBITDA et erreurs \u00e0 \u00e9viter. Guide complet.',
    intro: 'Vendre son entreprise est souvent le projet d\u2019une vie. Pourtant, la majorit\u00e9 des dirigeants de PME belges entament ce processus sans conna\u00eetre la valeur r\u00e9elle de leur soci\u00e9t\u00e9. R\u00e9sultat : des mois de n\u00e9gociation, des honoraires d\u2019experts \u00e9lev\u00e9s, et parfois une d\u00e9ception \u00e0 la signature. Une analyse financi\u00e8re objective, bas\u00e9e sur les comptes annuels officiels (BNB), est la premi\u00e8re \u00e9tape indispensable pour aborder une cession avec des chiffres fiables.',
    ratios: [
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'M\u00e9thode de valorisation de r\u00e9f\u00e9rence'},
      {slug:'dette-ebitda', label:'Dette/EBITDA', desc:'Capacit\u00e9 de remboursement'},
      {slug:'marge-nette', label:'Marge nette', desc:'Rentabilit\u00e9 r\u00e9elle'},
      {slug:'capitaux-propres', label:'Capitaux propres', desc:'Valeur plancher'},
      {slug:'couverture-interets', label:'Couverture int\u00e9r\u00eats', desc:'Solidit\u00e9 financi\u00e8re'},
    ],
    helpText: 'BWIX extrait automatiquement les donn\u00e9es de vos comptes annuels BNB, calcule tous les ratios financiers et produit une valorisation EV/EBITDA en 2 minutes. Vous obtenez un rapport objectif \u00e0 pr\u00e9senter \u00e0 un acqu\u00e9reur potentiel, sans d\u00e9pendre d\u2019un tiers.',
    faq: [
      {q:'Quelle m\u00e9thode de valorisation pour vendre une PME belge ?', a:'La m\u00e9thode EV/EBITDA (valeur d\u2019entreprise = EBITDA \u00d7 multiple sectoriel) est la plus utilis\u00e9e en Belgique. BWIX calcule automatiquement cette valorisation avec un multiple adapt\u00e9 \u00e0 votre secteur.'},
      {q:'Combien co\u00fbte une \u00e9valuation d\u2019entreprise ?', a:'Un expert-comptable facture g\u00e9n\u00e9ralement 2.000 \u00e0 10.000\u20ac pour un rapport de valorisation. BWIX produit une analyse compl\u00e8te pour 19,99\u20ac en 2 minutes.'},
      {q:'Combien d\u2019exercices faut-il pour une valorisation fiable ?', a:'Id\u00e9alement 3 \u00e0 5 exercices. BWIX utilise l\u2019EBITDA moyen des exercices disponibles pour lisser les variations conjoncturelles.'},
    ],
    related: ['acquisition-rachat', 'convention-actionnaires-valorisation', 'cession-parts-sociales'],
  },
  {
    slug: 'acquisition-rachat',
    title: 'Acquisition d\u2019une soci\u00e9t\u00e9 belge \u2014 Due diligence financi\u00e8re',
    metaDesc: 'Racheter une PME belge ? Analysez les comptes annuels BNB : ratios cl\u00e9s, gearing, BFR, liquidit\u00e9. Guide de due diligence rapide.',
    intro: 'Acqu\u00e9rir une soci\u00e9t\u00e9 sans analyser ses fondamentaux financiers, c\u2019est acheter une maison sans inspection. Les comptes annuels d\u00e9pos\u00e9s \u00e0 la BNB sont publics \u2014 n\u2019importe qui peut les t\u00e9l\u00e9charger et les analyser. Avant m\u00eame de contacter le vendeur, une premi\u00e8re analyse financi\u00e8re permet d\u2019identifier les forces, les risques et le juste prix.',
    ratios: [
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'Prix de r\u00e9f\u00e9rence du march\u00e9'},
      {slug:'gearing', label:'Gearing', desc:'Niveau d\u2019endettement'},
      {slug:'liquidite-generale', label:'Liquidit\u00e9', desc:'Capacit\u00e9 de paiement'},
      {slug:'bfr', label:'BFR', desc:'Besoin de financement courant'},
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Autonomie financi\u00e8re'},
    ],
    helpText: 'BWIX vous permet d\u2019analyser les comptes annuels BNB de n\u2019importe quelle soci\u00e9t\u00e9 belge en 2 minutes. Vous obtenez une vision claire de sa sant\u00e9 financi\u00e8re avant m\u00eame de prendre contact.',
    faq: [
      {q:'Peut-on analyser les comptes d\u2019une soci\u00e9t\u00e9 sans son accord ?', a:'Oui. Les comptes annuels d\u00e9pos\u00e9s \u00e0 la BNB sont des documents publics, accessibles sur consult.cbso.nbb.be. Tout le monde peut les t\u00e9l\u00e9charger.'},
      {q:'Que regarder en priorit\u00e9 dans une due diligence ?', a:'Le gearing (endettement), la liquidit\u00e9 (capacit\u00e9 de paiement court terme), le BFR (besoin de financement) et l\u2019\u00e9volution de l\u2019EBITDA sur 3 ans.'},
      {q:'BWIX remplace-t-il un audit complet ?', a:'Non. BWIX fournit une analyse rapide \u00e0 partir des comptes officiels. Pour une acquisition, un audit approfondi par un r\u00e9viseur d\u2019entreprises reste recommand\u00e9.'},
    ],
    related: ['cession-entreprise', 'credit-bancaire', 'entree-sortie-actionnaire'],
  },
  {
    slug: 'credit-bancaire',
    title: 'Pr\u00e9parer un dossier de cr\u00e9dit bancaire \u2014 Ratios que la banque analyse',
    metaDesc: 'Quels ratios financiers votre banque belge regarde-t-elle ? Solvabilit\u00e9, gearing, couverture int\u00e9r\u00eats, dette/EBITDA. Pr\u00e9parez votre dossier.',
    intro: 'Quand un dirigeant de PME belge demande un cr\u00e9dit, la banque analyse syst\u00e9matiquement ses comptes annuels. Solvabilit\u00e9, endettement, couverture des int\u00e9r\u00eats \u2014 ces ratios d\u00e9terminent si le cr\u00e9dit sera accord\u00e9 et \u00e0 quel taux. Conna\u00eetre ses ratios \u00e0 l\u2019avance, c\u2019est pr\u00e9parer un dossier solide et n\u00e9gocier en position de force.',
    ratios: [
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Autonomie financi\u00e8re \u2014 crit\u00e8re n\u00b01'},
      {slug:'gearing', label:'Gearing', desc:'Endettement vs fonds propres'},
      {slug:'couverture-interets', label:'Couverture int\u00e9r\u00eats', desc:'Capacit\u00e9 \u00e0 payer les charges financ.'},
      {slug:'liquidite-generale', label:'Liquidit\u00e9', desc:'Paiement des dettes court terme'},
      {slug:'dette-ebitda', label:'Dette/EBITDA', desc:'Ann\u00e9es de remboursement'},
    ],
    helpText: 'BWIX calcule exactement les ratios que votre banquier va regarder. Vous pouvez anticiper les questions, pr\u00e9parer vos r\u00e9ponses et pr\u00e9senter un dossier structur\u00e9 avec des chiffres v\u00e9rifi\u00e9s.',
    faq: [
      {q:'Quel ratio est le plus important pour obtenir un cr\u00e9dit ?', a:'La solvabilit\u00e9 (capitaux propres / total actif). En dessous de 20%, la plupart des banques belges refuseront un cr\u00e9dit sans garanties suppl\u00e9mentaires.'},
      {q:'Que faire si mes ratios sont mauvais ?', a:'Identifiez les points faibles (trop de dettes ? BFR \u00e9lev\u00e9 ?) et travaillez \u00e0 les am\u00e9liorer avant de d\u00e9poser votre demande. Chaque page ratio sur BWIX explique comment am\u00e9liorer le ratio concern\u00e9.'},
      {q:'La banque peut-elle v\u00e9rifier mes chiffres ?', a:'Oui. Les comptes annuels BNB sont publics. La banque acc\u00e8de aux m\u00eames documents que BWIX. Mieux vaut pr\u00e9senter un dossier coh\u00e9rent d\u00e8s le d\u00e9part.'},
    ],
    related: ['cession-entreprise', 'acquisition-rachat', 'entree-actionnaire'],
  },
  {
    slug: 'entree-actionnaire',
    title: 'Entr\u00e9e d\u2019un actionnaire ou investisseur \u2014 Valorisation de la soci\u00e9t\u00e9',
    metaDesc: 'Un investisseur veut entrer au capital de votre PME belge ? Calculez la valorisation, le ROE et les capitaux propres pour n\u00e9gocier.',
    intro: 'L\u2019entr\u00e9e d\u2019un nouvel actionnaire dans une PME belge n\u00e9cessite une valorisation pr\u00e9cise de la soci\u00e9t\u00e9. Sans chiffres objectifs, la n\u00e9gociation repose sur des perceptions subjectives \u2014 le dirigeant surestime souvent, l\u2019investisseur sous-estime. Une analyse financi\u00e8re ind\u00e9pendante bas\u00e9e sur les comptes BNB pose un cadre de discussion factuel.',
    ratios: [
      {slug:'roe', label:'ROE', desc:'Rendement pour les actionnaires'},
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'Valorisation de r\u00e9f\u00e9rence'},
      {slug:'marge-nette', label:'Marge nette', desc:'Rentabilit\u00e9 r\u00e9elle'},
      {slug:'capitaux-propres', label:'Capitaux propres', desc:'Valeur comptable'},
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Solidit\u00e9 de la structure'},
    ],
    helpText: 'BWIX fournit une valorisation neutre et document\u00e9e, utilisable comme base de n\u00e9gociation entre le dirigeant et l\u2019investisseur entrant. Pas besoin de mandater un expert pour un premier cadrage.',
    faq: [
      {q:'Comment fixer le prix des parts pour un nouvel actionnaire ?', a:'La m\u00e9thode standard est EV/EBITDA : EBITDA moyen \u00d7 multiple sectoriel - dette nette = valeur des fonds propres. Divisez par le nombre de parts pour obtenir le prix unitaire.'},
      {q:'Faut-il un expert pour une entr\u00e9e au capital ?', a:'Pas n\u00e9cessairement pour le cadrage initial. BWIX donne une premi\u00e8re valorisation objective. Pour la finalisation juridique, consultez un notaire ou avocat.'},
      {q:'Comment prot\u00e9ger les actionnaires existants ?', a:'Pr\u00e9voyez une convention d\u2019actionnaires avec une clause de valorisation. Voir notre guide d\u00e9di\u00e9.'},
    ],
    related: ['entree-sortie-actionnaire', 'convention-actionnaires-valorisation', 'cession-parts-sociales'],
  },
  {
    slug: 'transmission-familiale',
    title: 'Transmission familiale d\u2019entreprise en Belgique \u2014 Valorisation et succession',
    metaDesc: 'Transmettre votre PME \u00e0 vos enfants ou un repreneur familial ? Valorisation, capitaux propres, DCF. Guide pour une transmission r\u00e9ussie.',
    intro: 'La transmission d\u2019une entreprise familiale en Belgique est un moment d\u00e9licat qui m\u00eale \u00e9motions, enjeux fiscaux et r\u00e9alit\u00e9s financi\u00e8res. Qu\u2019il s\u2019agisse d\u2019une donation, d\u2019une vente \u00e0 un enfant ou d\u2019une succession, conna\u00eetre la valeur objective de l\u2019entreprise est indispensable \u2014 tant pour le fisc que pour l\u2019\u00e9quit\u00e9 entre h\u00e9ritiers.',
    ratios: [
      {slug:'capitaux-propres', label:'Actif net', desc:'Valeur comptable de r\u00e9f\u00e9rence'},
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Solidit\u00e9 du bilan'},
      {slug:'ebitda', label:'EBITDA', desc:'Capacit\u00e9 b\u00e9n\u00e9ficiaire'},
      {slug:'valorisation-dcf', label:'DCF', desc:'Valeur bas\u00e9e sur les flux futurs'},
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'Valorisation march\u00e9'},
    ],
    helpText: 'BWIX produit une valorisation objective et document\u00e9e, utilisable comme base pour les discussions familiales et les formalit\u00e9s fiscales. Trois m\u00e9thodes (EV/EBITDA, DCF, actif net) pour une vision compl\u00e8te.',
    faq: [
      {q:'Quelle m\u00e9thode de valorisation pour une transmission familiale ?', a:'Le fisc belge accepte g\u00e9n\u00e9ralement la m\u00e9thode des capitaux propres comme plancher, combin\u00e9e \u00e0 une approche par les revenus (EV/EBITDA ou DCF). Mieux vaut pr\u00e9senter plusieurs m\u00e9thodes.'},
      {q:'La transmission est-elle fiscalement avantageuse en Belgique ?', a:'La Belgique offre des r\u00e9gimes favorables pour la transmission de PME familiales (taux r\u00e9duit en Flandre, Wallonie et Bruxelles sous conditions). Consultez un fiscaliste pour les d\u00e9tails.'},
      {q:'Comment assurer l\u2019\u00e9quit\u00e9 entre h\u00e9ritiers ?', a:'Une valorisation ind\u00e9pendante \u00e9vite les conflits. Si un enfant reprend l\u2019entreprise et pas les autres, la valeur BWIX sert de base pour compenser les autres h\u00e9ritiers.'},
    ],
    related: ['evaluation-divorce-succession', 'cession-entreprise', 'convention-actionnaires-valorisation'],
  },
  {
    slug: 'evaluation-divorce-succession',
    title: '\u00c9valuation d\u2019entreprise en cas de divorce ou succession en Belgique',
    metaDesc: 'Divorce ou succession impliquant une PME belge ? Valorisation l\u00e9gale, actif net, DCF. M\u00e9thodes accept\u00e9es par les tribunaux.',
    intro: 'Lors d\u2019un divorce ou d\u2019une succession, la valeur des parts d\u2019une soci\u00e9t\u00e9 doit \u00eatre \u00e9tablie de mani\u00e8re objective. Les tribunaux belges exigent une \u00e9valuation fond\u00e9e sur des m\u00e9thodes reconnues. Disposer d\u2019une premi\u00e8re analyse financi\u00e8re avant de mandater un expert permet de comprendre les enjeux et d\u2019\u00e9viter les surprises.',
    ratios: [
      {slug:'capitaux-propres', label:'Actif net', desc:'Valeur comptable \u2014 base l\u00e9gale'},
      {slug:'valorisation-dcf', label:'DCF', desc:'Valeur \u00e9conomique projet\u00e9e'},
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'Valorisation march\u00e9'},
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Structure du bilan'},
    ],
    helpText: 'BWIX fournit une premi\u00e8re estimation objective bas\u00e9e sur les comptes officiels BNB. Ce n\u2019est pas un rapport d\u2019expertise judiciaire, mais un outil de cadrage pour comprendre les ordres de grandeur avant de mandater un expert.',
    faq: [
      {q:'Un tribunal accepte-t-il la valorisation BWIX ?', a:'BWIX est un outil indicatif. Pour une proc\u00e9dure judiciaire, un rapport d\u2019expert (r\u00e9viseur d\u2019entreprises) sera n\u00e9cessaire. BWIX sert de cadrage pr\u00e9paratoire.'},
      {q:'Quelle m\u00e9thode les tribunaux belges pr\u00e9f\u00e8rent-ils ?', a:'Les tribunaux utilisent g\u00e9n\u00e9ralement une combinaison : actif net corrig\u00e9 + capitalisation des b\u00e9n\u00e9fices (approche similaire \u00e0 EV/EBITDA).'},
      {q:'Peut-on contester une \u00e9valuation trop basse ou trop haute ?', a:'Oui. C\u2019est pourquoi disposer de sa propre analyse, m\u00eame indicative, est important pour comparer avec le rapport de l\u2019expert d\u00e9sign\u00e9.'},
    ],
    related: ['transmission-familiale', 'cession-parts-sociales', 'cession-entreprise'],
  },
  {
    slug: 'cession-parts-sociales',
    title: 'Cession de parts sociales en Belgique \u2014 Valorisation et proc\u00e9dure',
    metaDesc: 'C\u00e9der des parts sociales d\u2019une SRL belge ? Valorisation EV/EBITDA, actif net, convention d\u2019actionnaires. Guide complet.',
    intro: 'La cession de parts sociales d\u2019une SRL ou SA belge \u2014 qu\u2019elle soit totale ou partielle, \u00e0 un tiers ou entre associ\u00e9s \u2014 suppose de conna\u00eetre la valeur r\u00e9elle de ces parts. L\u2019absence de march\u00e9 organis\u00e9 pour les PME rend cette valorisation n\u00e9cessairement conventionnelle : elle repose sur les comptes annuels et une m\u00e9thode accept\u00e9e par les parties.',
    ratios: [
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'Valorisation de r\u00e9f\u00e9rence'},
      {slug:'capitaux-propres', label:'Actif net', desc:'Valeur plancher'},
      {slug:'roe', label:'ROE', desc:'Rendement des fonds propres'},
      {slug:'valorisation-dcf', label:'DCF', desc:'Valeur \u00e9conomique'},
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Structure financi\u00e8re'},
    ],
    helpText: 'BWIX calcule la valeur des fonds propres selon 3 m\u00e9thodes (EV/EBITDA, DCF, actif net) en 2 minutes. Vous obtenez une base de n\u00e9gociation objective, coh\u00e9rente avec les clauses standard de convention d\u2019actionnaires.',
    faq: [
      {q:'Comment d\u00e9terminer le prix de cession des parts ?', a:'Le prix se calcule g\u00e9n\u00e9ralement en divisant la valeur des fonds propres (EV - dette nette) par le nombre de parts. BWIX calcule cette valeur automatiquement.'},
      {q:'Faut-il un acte notari\u00e9 pour c\u00e9der des parts de SRL ?', a:'En Belgique, la cession de parts de SRL n\u00e9cessite un acte sous seing priv\u00e9 ou notari\u00e9, et l\u2019inscription au registre des parts. Consultez votre notaire.'},
      {q:'La convention d\u2019actionnaires impose-t-elle une m\u00e9thode ?', a:'Si une convention existe, elle fixe souvent la m\u00e9thode de valorisation. Voir notre guide sur la convention d\u2019actionnaires.'},
    ],
    related: ['convention-actionnaires-valorisation', 'entree-sortie-actionnaire', 'cession-entreprise'],
  },
  {
    slug: 'entree-sortie-actionnaire',
    title: 'Entr\u00e9e et sortie d\u2019actionnaire \u2014 Impact sur la valorisation',
    metaDesc: 'G\u00e9rer l\u2019entr\u00e9e ou la sortie d\u2019un associ\u00e9 dans une PME belge. Dilution, rachat de parts, valorisation. Guide pratique.',
    intro: 'L\u2019entr\u00e9e d\u2019un nouvel associ\u00e9 ou la sortie d\u2019un associ\u00e9 existant sont des moments cl\u00e9s dans la vie d\u2019une PME belge. Chaque mouvement au capital n\u00e9cessite de conna\u00eetre la valeur de la soci\u00e9t\u00e9 : pour fixer le prix d\u2019entr\u00e9e, calculer la dilution, ou d\u00e9terminer le prix de rachat des parts d\u2019un sortant.',
    ratios: [
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'Valeur de la soci\u00e9t\u00e9'},
      {slug:'capitaux-propres', label:'Actif net', desc:'Valeur comptable'},
      {slug:'roe', label:'ROE', desc:'Rendement pour les associ\u00e9s'},
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Solidit\u00e9 du bilan'},
    ],
    helpText: 'BWIX permet de calculer la valeur actuelle de la soci\u00e9t\u00e9 \u00e0 tout moment, sans mandater un expert. Utile pour les op\u00e9rations ponctuelles comme pour le suivi r\u00e9gulier de la valorisation.',
    faq: [
      {q:'Comment calculer la dilution lors d\u2019une augmentation de capital ?', a:'La dilution d\u00e9pend du rapport entre la valeur d\u2019\u00e9mission des nouvelles parts et la valeur actuelle. BWIX calcule la valeur actuelle ; votre notaire g\u00e8re la m\u00e9canique juridique.'},
      {q:'Un associ\u00e9 peut-il forcer le rachat de ses parts ?', a:'Cela d\u00e9pend de la convention d\u2019actionnaires et des statuts. En SRL belge, la cession est en principe libre sauf clause contraire.'},
      {q:'Faut-il revaloriser \u00e0 chaque mouvement ?', a:'Oui. La valeur change avec chaque exercice cl\u00f4tur\u00e9. BWIX permet une revalorisation rapide et peu co\u00fbteuse.'},
    ],
    related: ['entree-actionnaire', 'cession-parts-sociales', 'convention-actionnaires-valorisation'],
  },
  {
    slug: 'convention-actionnaires-valorisation',
    title: 'Convention d\u2019actionnaires \u2014 Fixer une m\u00e9thode de valorisation',
    metaDesc: 'Pourquoi figer une m\u00e9thode de valorisation dans la convention d\u2019actionnaires ? Clause type, EV/EBITDA, guide complet pour PME belges.',
    intro: 'Sans clause de valorisation dans la convention d\u2019actionnaires, chaque associ\u00e9 arrive avec son propre chiffre, son propre expert, sa propre m\u00e9thode. Le r\u00e9sultat ? Un conflit garanti au moment de la cession ou de la sortie d\u2019un associ\u00e9. Figer UNE m\u00e9thode de valorisation en amont, quand tout le monde s\u2019entend encore, est la d\u00e9cision la plus intelligente qu\u2019une PME belge puisse prendre.',
    ratios: [
      {slug:'valorisation-ebitda', label:'EV/EBITDA', desc:'M\u00e9thode de r\u00e9f\u00e9rence'},
      {slug:'capitaux-propres', label:'Actif net', desc:'Valeur plancher'},
      {slug:'roe', label:'ROE', desc:'Performance des fonds propres'},
      {slug:'valorisation-dcf', label:'DCF', desc:'Valeur \u00e9conomique projet\u00e9e'},
      {slug:'solvabilite', label:'Solvabilit\u00e9', desc:'Structure du bilan'},
    ],
    extraContent: '<h2>Le probl\u00e8me sans clause de valorisation</h2>'
      + '<p>Quand deux associ\u00e9s se s\u00e9parent sans clause pr\u00e9\u00e9tablie, chacun mandate son propre expert. L\u2019un obtient une valorisation de 500.000\u20ac, l\u2019autre de 1.200.000\u20ac. Qui a raison ? Personne \u2014 et le conflit finit devant le tribunal, avec des mois de proc\u00e9dure et des frais d\u2019avocat.</p>'
      + '<h2>Clause type \u00e0 int\u00e9grer</h2>'
      + '<blockquote>\u00ab La valeur des parts sociales, en cas de cession entre associ\u00e9s ou \u00e0 un tiers, sera d\u00e9termin\u00e9e sur base de l\u2019EBITDA moyen des trois derniers exercices cl\u00f4tur\u00e9s, multipli\u00e9 par un multiple sectoriel compris entre 4 et 6, d\u00e9fini d\u2019un commun accord. \u00c0 d\u00e9faut d\u2019accord, le multiple retenu sera 5. La valeur obtenue constitue la valeur d\u2019entreprise (EV), dont sera d\u00e9duite la dette nette pour obtenir la valeur des fonds propres. \u00bb</blockquote>'
      + '<h2>Pourquoi cette clause fonctionne avec BWIX</h2>'
      + '<p>La m\u00e9thode utilis\u00e9e par BWIX (EV/EBITDA sur EBITDA moyen) correspond exactement \u00e0 la clause ci-dessus. Chaque associ\u00e9 peut v\u00e9rifier la valeur actuelle \u00e0 tout moment pour 19,99\u20ac, sans mandater un expert-comptable. La transparence r\u00e9duit les conflits.</p>'
      + '<p><strong>Important :</strong> il est conseill\u00e9 de faire valider la clause par un notaire ou avocat sp\u00e9cialis\u00e9. BWIX fournit la donn\u00e9e financi\u00e8re, pas le conseil juridique.</p>',
    helpText: 'BWIX permet \u00e0 chaque associ\u00e9 de v\u00e9rifier la valorisation actuelle de la soci\u00e9t\u00e9 en 2 minutes, sur base de la m\u00eame m\u00e9thode (EV/EBITDA moyen) que celle fig\u00e9e dans la convention.',
    faq: [
      {q:'Quelle m\u00e9thode choisir pour la convention ?', a:'La m\u00e9thode EV/EBITDA est la plus r\u00e9pandue pour les PME belges. Elle est simple, compr\u00e9hensible et applicable automatiquement avec BWIX.'},
      {q:'Le multiple doit-il \u00eatre fix\u00e9 \u00e0 l\u2019avance ?', a:'Id\u00e9alement oui, ou du moins une fourchette (ex : 4-6x). Cela \u00e9vite les discussions au moment critique. Le secteur d\u2019activit\u00e9 d\u00e9termine le multiple courant.'},
      {q:'Que faire si la convention ne pr\u00e9voit rien ?', a:'En l\u2019absence de clause, la valorisation est libre et sujette \u00e0 n\u00e9gociation. C\u2019est la source principale de conflits entre associ\u00e9s. Mettez \u00e0 jour votre convention d\u00e8s que possible.'},
      {q:'BWIX peut-il servir de r\u00e9f\u00e9rence contractuelle ?', a:'BWIX est un outil indicatif. Il ne remplace pas un expert agr\u00e9\u00e9. Mais la m\u00e9thode utilis\u00e9e (EV/EBITDA moyen) est exactement celle pr\u00e9conis\u00e9e dans les conventions standard.'},
    ],
    related: ['cession-parts-sociales', 'entree-sortie-actionnaire', 'entree-actionnaire'],
  },
];

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

var guideSlugs = guides.map(function(g){ return g.slug; });

guides.forEach(function (g) {
  var ratioLinks = g.ratios.map(function(r) {
    return '<a href="/ratio/' + r.slug + '">' + r.label + '<small>' + r.desc + '</small></a>';
  }).join('');

  var faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': g.faq.map(function(f) {
      return {'@type':'Question','name':f.q,'acceptedAnswer':{'@type':'Answer','text':f.a}};
    })
  };

  var faqHtml = g.faq.map(function(f) {
    return '<details><summary>' + f.q + '</summary><div class="faq-answer">' + f.a + '</div></details>';
  }).join('');

  var relatedHtml = (g.related || []).map(function(slug) {
    var rg = guides.find(function(gg){ return gg.slug === slug; });
    return rg ? '<a href="/guide/' + slug + '">' + rg.title.split(' \u2014 ')[0] + '</a>' : '';
  }).join('');

  var html = '<!DOCTYPE html>\n<html lang="fr"><head>\n'
    + '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">\n'
    + '<title>' + esc(g.title) + ' | BWIX</title>\n'
    + '<meta name="description" content="' + esc(g.metaDesc) + '">\n'
    + '<link rel="canonical" href="https://www.bwix.app/guide/' + g.slug + '">\n'
    + '<meta property="og:title" content="' + esc(g.title) + '">\n'
    + '<meta property="og:description" content="' + esc(g.metaDesc) + '">\n'
    + '<meta property="og:url" content="https://www.bwix.app/guide/' + g.slug + '">\n'
    + '<meta property="og:type" content="article">\n'
    + '<script type="application/ld+json">' + JSON.stringify(faqSchema) + '</script>\n'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n'
    + '<link rel="stylesheet" href="../style.css">\n'
    + CSS + '\n'
    + '</head><body>\n'
    + HEADER + '\n'
    + '<main class="guide">\n'
    + '<nav class="breadcrumb"><a href="/">bwix.app</a> <span>\u203a</span> <a href="/guide/cession-entreprise">Guides</a> <span>\u203a</span> ' + g.title.split(' \u2014 ')[0] + '</nav>\n'
    + '<h1>' + g.title + '</h1>\n'
    + '<p class="guide-intro">' + g.intro + '</p>\n'
    + '<h2>Les ratios cl\u00e9s \u00e0 surveiller</h2>\n'
    + '<div class="ratio-links">' + ratioLinks + '</div>\n'
    + (g.extraContent || '') + '\n'
    + '<h2>Comment BWIX vous aide</h2>\n'
    + '<p>' + g.helpText + '</p>\n'
    + '<div class="guide-cta"><h2>Analyser un bilan maintenant</h2>'
    + '<p style="color:#8fa3bf;margin-bottom:16px">Importez un bilan BNB et obtenez tous les ratios + valorisation en 2 minutes.</p>'
    + '<a href="/" class="btn btn--large">Lancer une analyse \u2192</a></div>\n'
    + '<h2 class="guide-faq">Questions fr\u00e9quentes</h2>\n'
    + faqHtml + '\n'
    + '<h2>Guides li\u00e9s</h2>\n'
    + '<div class="guide-related">' + relatedHtml + '</div>\n'
    + '</main>\n'
    + DISCLAIMER + '\n'
    + FOOTER + '\n'
    + '</body></html>';

  fs.writeFileSync(path.join(__dirname, 'guide', g.slug + '.html'), html);
});

console.log('Generated ' + guides.length + ' guide pages');
