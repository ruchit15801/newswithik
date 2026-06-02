const fs = require('fs');
const content = fs.readFileSync('play.html', 'utf8');

const openScript  = (content.match(/<script/g) || []).length;
const closeScript = (content.match(/<\/script>/g) || []).length;
const escapedBacktick = (content.match(/\\\`/g) || []).length;
const escapedTemplateVar = (content.match(/\\\$\{/g) || []).length;

const results = [
    ['adsbygoogle.js tag',        content.includes('pagead2.googlesyndication.com')],
    ['adBreak boilerplate',       content.includes('adBreak = adConfig')],
    ['data-ad-frequency-hint',    content.includes('data-ad-frequency-hint')],
    ['publisher ID',              content.includes('ca-pub-9408433736996330')],
    ['iframe allow=autoplay',     content.includes('allow="autoplay')],
    ['iframe sandbox set',        content.includes('sandbox=')],
    ['games.js loaded',           content.includes('/js/games.js')],
    ['encodeURI for path',        content.includes('encodeURI')],
    ['8s loader fallback',        content.includes('8000')],
    ['error screen present',      content.includes('error-screen')],
    ['touch event support',       content.includes('touchstart')],
    ['showTopBar global',         content.includes('window.showTopBar')],
    ['loader .gone class',        content.includes("'gone'")],
    ['NO escaped backtick',       escapedBacktick === 0],
    ['NO escaped template vars',  escapedTemplateVar === 0],
    ['script tags balanced',      openScript === closeScript],
];

console.log('=== play.html Full Audit ===');
let pass = 0, fail = 0;
results.forEach(function(r) {
    var label = r[0], ok = r[1];
    console.log((ok ? '  PASS' : '  FAIL') + '  ' + label);
    ok ? pass++ : fail++;
});
console.log('');
console.log('Result: ' + pass + '/' + (pass+fail) + ' checks passed');
console.log(fail === 0 ? 'ALL CHECKS PASSED!' : fail + ' issue(s) found!');
console.log('Script pairs: ' + openScript + ' open, ' + closeScript + ' close');
