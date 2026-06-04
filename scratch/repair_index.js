
const fs = require('fs');
const content = fs.readFileSync('frontend/index.html', 'utf8').split('\n');

// 1. Keep the <head> section (links to font, scripts, style.css)
const head = content.slice(0, 15);

// 2. Identify where the actual HTML UI starts
// Based on my view_file, the auth screen div starts around line 3779
// But let's find it dynamically for safety
let bodyStart = content.findIndex(line => line.includes('<div id="auth-screen">'));
if (bodyStart === -1) bodyStart = 3775; // fallback

// 3. Keep the body up to the point where the messy script started
// The messy script started after the last div of store-screen (around line 4627)
let bodyEnd = content.findIndex(line => line.includes('</div><!-- end store-screen -->'));
if (bodyEnd === -1) bodyEnd = 4627; // fallback
else bodyEnd += 1; // include the line itself

const body = content.slice(bodyStart, bodyEnd);

const final = [
  ...head,
  '</head>',
  '<body>',
  ...body,
  '  <script src="app.js"></script>',
  '</body>',
  '</html>'
].join('\n');

fs.writeFileSync('frontend/index.html', final);
console.log('Successfully repaired index.html structure.');
