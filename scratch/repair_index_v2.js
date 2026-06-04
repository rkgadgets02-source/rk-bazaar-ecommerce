
const fs = require('fs');
const content = fs.readFileSync('frontend/index.html', 'utf8').split('\n');

const head = content.slice(0, 16); // Up to </head>

let bodyStart = content.findIndex(line => line.includes('<div id="auth-screen">'));
let bodyEnd = content.findIndex(line => line.includes('</div><!-- end store-screen -->'));

if (bodyStart === -1) bodyStart = 18;
if (bodyEnd === -1) bodyEnd = content.length - 3;

const body = content.slice(bodyStart, bodyEnd + 1);

const missingElements = `
  <!-- LOADER -->
  <div id="ldr">
    <div class="lring"></div>
    <div class="llogo">RK <b>BAZAAR</b></div>
  </div>

  <!-- TOAST -->
  <div id="toast" class="toast"></div>

  <!-- SHARE SHEET FALLBACK -->
  <div id="share-sheet-overlay" class="ss-overlay" onclick="closeShareSheet()">
    <div class="ss-sheet" onclick="event.stopPropagation()">
      <div class="ss-head">
        <h3>Share Product</h3>
        <button class="ss-close" onclick="closeShareSheet()"><i class="fas fa-times"></i></button>
      </div>
      <div class="ss-body">
        <div class="ss-opt" id="ss-wa">
          <div class="ss-ic wa"><i class="fab fa-whatsapp"></i></div>
          <span>WhatsApp</span>
        </div>
        <div class="ss-opt" id="ss-fb">
          <div class="ss-ic fb"><i class="fab fa-facebook-f"></i></div>
          <span>Facebook</span>
        </div>
        <div class="ss-opt" id="ss-copy">
          <div class="ss-ic cp"><i class="fas fa-link"></i></div>
          <span>Copy Link</span>
        </div>
      </div>
    </div>
  </div>
`;

const final = [
  ...head,
  '<body>',
  missingElements,
  ...body,
  '  <script src="app.js"></script>',
  '</body>',
  '</html>'
].join('\n');

fs.writeFileSync('frontend/index.html', final);
console.log('Successfully restored missing elements to index.html.');
