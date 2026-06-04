
const fs = require('fs');
const appJs = fs.readFileSync('frontend/app.js', 'utf8');
const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');

const idsInJs = [...appJs.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const uniqueIds = [...new Set(idsInJs)];

uniqueIds.forEach(id => {
  if (!indexHtml.includes('id="' + id + '"') && !indexHtml.includes("id='" + id + "'")) {
    console.log('Missing ID in HTML:', id);
  }
});
