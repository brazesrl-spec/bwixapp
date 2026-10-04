#!/usr/bin/env node
/* Réécrit les adresses absolues du site dans les pages statiques déjà générées
   (canonical, og:url, hreflang, JSON-LD, sitemap.xml, robots.txt).
   Usage : node set-site-url.js <ancien-origin> <nouvel-origin> [--write]
   Ex.   : node set-site-url.js https://www.bwix.app https://bilan.bwix.app --write
   Sans --write : simulation (liste les fichiers et le nombre de remplacements).
   Ne touche que les URL complètes (https://…), jamais les adresses e-mail. */
var fs = require('fs');
var path = require('path');

var args = process.argv.slice(2);
var write = args.indexOf('--write') !== -1;
var pos = args.filter(function (a) { return a.indexOf('--') !== 0; });
if (pos.length !== 2) { console.error('Usage: node set-site-url.js <ancien> <nouveau> [--write]'); process.exit(1); }
var from = pos[0].replace(/\/+$/, ''), to = pos[1].replace(/\/+$/, '');

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    if (e.name === 'node_modules' || e.name === 'backend' || e.name[0] === '.') return;
    var p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|xml|txt)$/.test(e.name)) out.push(p);
  });
  return out;
}

var total = 0, files = 0;
walk('.', []).forEach(function (f) {
  var s = fs.readFileSync(f, 'utf8');
  var n = s.split(from).length - 1;
  if (!n) return;
  total += n; files++;
  if (write) fs.writeFileSync(f, s.split(from).join(to));
  else if (files <= 8) console.log('  ' + f + ' : ' + n);
});
console.log((write ? 'Écrit' : 'Simulation') + ' : ' + total + ' remplacement(s) dans ' + files + ' fichier(s).');
