
const fs = require('fs');
const path = 'frontend/index.html';
const content = fs.readFileSync(path, 'utf8').split('\n');

const header = content.slice(0, 4656);
const footer = content.slice(5776);

const final = [...header, '  <script src="app.js"></script>', ...footer].join('\n');
fs.writeFileSync(path, final);
console.log('Cleaned up index.html successfully');
