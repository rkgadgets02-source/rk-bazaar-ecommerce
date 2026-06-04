const API = (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? (location.port === '5000' ? '/api' : 'http://localhost:5000/api')
      : '/api';

    const PIMG = [

      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', // Tech Overview
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80', // Earbuds
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&q=80', // Headphones
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80', // Watch
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&q=80', // Charger (Electronics)
      'https://images.unsplash.com/photo-1623998021411-8314bc739ef7?w=300&q=80', // Bluetooth Speaker
      'https://images.unsplash.com/photo-1616423641321-df6288849764?w=300&q=80', // Power Battery
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&q=80', // Powerbank
      'https://images.unsplash.com/photo-1551817319-f4344337d1fd?w=300&q=80', // Cables
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&q=80', // Accessory
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80', // Minimal Tech
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=300&q=80'  // Wiring
    ];
    const CIMG = {
      'Wired Earphone': PIMG[0],
      'Earbuds': PIMG[1],
      'Bluetooth Neckband': PIMG[2],
      'Bluetooth Headphone': PIMG[0],
      'Smart Watches': PIMG[3],
      'Mobile Charger': PIMG[4],
      'Charging Cables': PIMG[11],
      'Bluetooth Speaker': PIMG[5],
      'Car Charger': PIMG[4],
      'Wireless Charger': PIMG[4],
      'Power Bank': PIMG[7],
      'Mobile Battery': PIMG[6]
    };

    function safeJSON(key, fallback) { try { const v = localStorage.getItem(key); return (v && v !== 'undefined' && v !== 'null') ? JSON.parse(v) : fallback; } catch (e) { localStorage.removeItem(key); return fallback; } }

    const S = {
      user: safeJSON('btU', null),
      token: localStorage.getItem('btT') || '',
      products: [], categories: [],
      cart: safeJSON('btC', {}),
      wish: new Set(safeJSON('btW', [])),
      filter: 'All', prev: 'home', payM: 'razorpay', curP: null,
      pendingEmail: '', isGuest: false,
      coupon: null,
    };

    async function req(p, m = 'GET', b = null) {
      const o = { method: m, headers: { 'Content-Type': 'application/json' } };
      if (S.token) o.headers['Authorization'] = 'Bearer ' + S.token;
      if (b) o.body = JSON.stringify(b);
      try {
        const r = await fetch(API + p, o);
        let data;
        try {
          data = await r.json();
        } catch (je) {
          data = { success: false, message: `Server Error (${r.status})` };
        }

        if (!r.ok) {
          console.error(`❌ API ERROR [${m} ${p}]:`, data);
          return { success: false, message: data.message || `Error ${r.status}: ${r.statusText}` };
        }
        return data;
      } catch (e) {
        console.error('Request failed:', e);
        return { success: false, message: 'Network error! Please check your connection.' };
      }
    }

    // ══════════════════════════════════════════
    // AUTH SCREEN LOGIC
    // ══════════════════════════════════════════
    function switchAuthTab(tab) {
      document.getElementById('tab-login').classList.toggle('active', tab === 'login');
      document.getElementById('tab-reg').classList.toggle('active', tab === 'register');
      document.getElementById('panel-login').classList.toggle('active', tab === 'login');
      document.getElementById('panel-register').classList.toggle('active', tab === 'register');
    }
    function showOtpScreen(email) {
      const otpEmailDisplay = document.getElementById('otpEmailDisplay');
      if (otpEmailDisplay) otpEmailDisplay.textContent = email;

      ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      const mainPanel = document.getElementById('auth-main-panel');
      const otpPanel = document.getElementById('auth-otp-panel');
      if (mainPanel) mainPanel.style.display = 'none';
      if (otpPanel) otpPanel.style.display = 'block';

      setTimeout(() => {
        const o1 = document.getElementById('o1');
        if (o1) o1.focus();
      }, 300);
    }
    function backToAuth() {
      document.getElementById('auth-otp-panel').style.display = 'none';
      document.getElementById('auth-forgot-panel').style.display = 'none';
      document.getElementById('auth-reset-panel').style.display = 'none';
      document.getElementById('auth-main-panel').style.display = 'block';
    }

    function showForgotScreen() {
      document.getElementById('auth-main-panel').style.display = 'none';
      document.getElementById('auth-forgot-panel').style.display = 'block';
    }

    function showResetScreen(email) {
      document.getElementById('resetEmailDisplay').textContent = email;
      ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('np').value = '';
      document.getElementById('auth-forgot-panel').style.display = 'none';
      document.getElementById('auth-reset-panel').style.display = 'block';
      setTimeout(() => document.getElementById('f1').focus(), 300);
    }

    async function doForgot() {
      const email = document.getElementById('fe').value.trim();
      if (!email) { toast('Please enter your email'); return }
      const btn = document.querySelector('#auth-forgot-panel .auth-btn');
      btn.textContent = 'Sending Code...'; btn.disabled = true;
      const r = await req('/auth/forgot-password', 'POST', { email });
      btn.textContent = 'Send Reset Code'; btn.disabled = false;
      if (r.success) {
        S.pendingEmail = email;
        showResetScreen(email);
        toast('Reset code sent! Check your email 📧');
      } else {
        toast(r.message || 'Error occurred. Please try again');
      }
    }

    async function doReset() {
      const otp = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map(id => document.getElementById(id).value).join('');
      const pass = document.getElementById('np').value;
      if (otp.length < 6) { toast('Please enter 6-digit code'); return }
      if (pass.length < 6) { toast('Password must be at least 6 characters'); return }
      const btn = document.querySelector('#auth-reset-panel .auth-btn');
      btn.textContent = 'Resetting...'; btn.disabled = true;
      const r = await req('/auth/reset-password', 'POST', { email: S.pendingEmail, otp, newPassword: pass });
      btn.textContent = 'Reset Password'; btn.disabled = false;
      if (r.success) {
        toast('Password reset successfully! Please login.');
        backToAuth();
      } else {
        toast(r.message || 'Invalid code or error occurred');
      }
    }

    function forgotOtpNext(el, nextId) {
      el.value = el.value.replace(/[^0-9]/g, '');
      if (el.value && nextId) document.getElementById(nextId).focus();
    }
    function forgotOtpBack(e, el, prevId) { if (e.key === 'Backspace' && !el.value && prevId) document.getElementById(prevId).focus() }

    function enterAsGuest() {
      S.isGuest = true;
      showStore();
      toast('Browsing as guest. Login to checkout!');
    }

    function showStore() {
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('store-screen').style.display = 'block';
      loadStoreData();
    }

    function showAuthScreen() {
      document.getElementById('store-screen').style.display = 'none';
      document.getElementById('auth-screen').style.display = 'flex';
      backToAuth();
    }

    // ── On page load ──
    window.addEventListener('load', async () => {
      // Fetch Brand Info (Background)
      req('/brand').then(br => {
        if (br.success && br.data) {
          const bn = br.data.name;
          const bs = br.data.slogan;

          // Update all UI instances
          document.querySelectorAll('.llogo, .auth-logo, .tlogo, .dh-logo, .ab-logo').forEach(el => {
            const parts = bn.split(' ');
            if (parts.length > 1) {
              el.innerHTML = `${parts[0]} <b>${parts.slice(1).join(' ')}</b>`;
            } else {
              el.innerHTML = `<b>${bn}</b>`;
            }
          });

          const b3n1 = document.getElementById('b3-name1');
          const b3n2 = document.getElementById('b3-name2');
          const b3s1 = document.getElementById('b3-slogan1');
          const b3s2 = document.getElementById('b3-slogan2');
          const at = document.querySelector('.auth-tagline');

          if (b3n1) b3n1.textContent = bn;
          if (b3n2) b3n2.textContent = bn;
          if (b3s1) b3s1.textContent = bs || '3D FUTURE SHOPPING';
          if (at) at.textContent = bs || '3D FUTURE SHOPPING EXPERIENCE';

          // Update store header and policy headers
          document.querySelectorAll('#pdbk + h2, #page-success h2 + p').forEach(el => {
            if (el.textContent.includes('RK BAZAAR')) {
              el.textContent = el.textContent.replace('RK BAZAAR', bn);
            }
          });
        }
      }).catch(err => console.log('Brand fetch failed, using defaults'));

      // Hide loader after a moment (ALWAYS RUNS)
      setTimeout(() => {
        const l = document.getElementById('ldr');
        if (l) {
          l.style.opacity = '0';
          setTimeout(() => l.style.display = 'none', 400);
        }
      }, 800);

      // If user already logged in → go straight to store
      if (S.token && S.user) {
        showStore();
      }
    });


    async function doLogin() {
      const email = document.getElementById('le').value.trim();
      const pass = document.getElementById('lp').value;
      if (!email || !pass) { toast('Please fill email and password'); return }
      const btn = document.querySelector('#panel-login .auth-btn');
      btn.textContent = 'Logging in...'; btn.disabled = true;
      const r = await req('/auth/login', 'POST', { email, password: pass });
      btn.textContent = 'Login'; btn.disabled = false;
      if (r.success) {
        S.user = r.user; S.token = r.token;
        localStorage.setItem('btU', JSON.stringify(r.user));
        localStorage.setItem('btT', r.token);
        showStore();
        toast('Welcome back ' + r.user.name + ' 👋');
      } else if (r.needsVerification) {
        S.pendingEmail = r.email || email;
        showOtpScreen(S.pendingEmail);
        toast('Please verify your email first');
      } else {
        toast(r.message || 'Login failed. Check your credentials');
      }
    }

    async function doRegister() {
      const name = document.getElementById('rn').value.trim();
      const email = document.getElementById('re').value.trim();
      const phone = document.getElementById('rph').value.trim();
      const pass = document.getElementById('rp').value;
      if (!name || !email || !phone || !pass) { toast('Please fill all fields'); return }
      if (pass.length < 6) { toast('Password must be at least 6 characters'); return }
      const btn = document.querySelector('#panel-register .auth-btn');
      btn.textContent = 'Sending OTP...'; btn.disabled = true;
      const r = await req('/auth/register', 'POST', { name, email, phone, password: pass });
      btn.textContent = 'Create Account'; btn.disabled = false;
      if (r.success) {
        S.pendingEmail = email;
        showOtpScreen(email);
        toast('OTP sent! Check your email 📧');
      } else {
        toast(r.message || 'Registration failed. Please try again');
      }
    }

    function otpNext(el, nextId) {
      el.value = el.value.replace(/[^0-9]/g, '');
      if (el.value && nextId) document.getElementById(nextId).focus();
      const otp = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'].map(id => document.getElementById(id).value).join('');
      if (otp.length === 6) verifyOtp();
    }
    function otpBack(e, el, prevId) { if (e.key === 'Backspace' && !el.value && prevId) document.getElementById(prevId).focus() }

    async function verifyOtp() {
      const otp = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'].map(id => document.getElementById(id).value).join('');
      if (otp.length < 6) { toast('Please enter all 6 digits'); return }
      toast('Verifying...');
      const r = await req('/auth/verify-otp', 'POST', { email: S.pendingEmail, otp });
      if (r.success) {
        S.user = r.user; S.token = r.token;
        localStorage.setItem('btU', JSON.stringify(r.user));
        localStorage.setItem('btT', r.token);
        showStore();
        toast('Account verified! Welcome to RK BAZAAR 🎉');
      } else {
        toast(r.message || 'Invalid OTP. Try again');
        ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('o1').focus();
      }
    }

    async function resendOtp() {
      if (!S.pendingEmail) { toast('Email not found'); return }
      toast('Resending OTP...');
      const r = await req('/auth/resend-otp', 'POST', { email: S.pendingEmail });
      toast(r.success ? 'New OTP sent! Check your email 📧' : r.message || 'Failed to resend. Try again');
    }

    // ══════════════════════════════════════════
    // STORE LOGIC
    // ══════════════════════════════════════════
    async function loadStoreData() {
      // Show skeletons during initial load for smooth feel
      showSkeletons('trendRow', 4);
      showSkeletons('featRow', 4);
      showSkeletons('sgrid', 4);
      
      await loadCats(); await loadProds(); await loadOffers();
      renderStrip(); renderTrend(); renderFeat();
      renderCatFull(); renderChips(); doSearch();
      renderAcc(); updCart(); startTimer();

      // Check for product in URL
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('prod') || params.get('product');
      if (prodId) {
        // Wait a bit for everything to settle
        setTimeout(() => {
          if (S.products.some(p => p._id === prodId)) {
            openProd(prodId);
          }
        }, 500);
      }

      // ── ABANDONED CART RECOVERY ──
      setTimeout(() => {
        const count = Object.keys(S.cart).length;
        if (count > 0 && !document.querySelector('.abandoned-toast')) {
          const toast = document.createElement('div');
          toast.className = 'abandoned-toast';
          toast.innerHTML = `
            <div class="abandoned-ic"><i class="fas fa-shopping-basket"></i></div>
            <div class="abandoned-txt">
              <h4>Forgot Something?</h4>
              <p>You have ${count} items waiting in your cart!</p>
            </div>
            <button class="btn-sm btn-primary" onclick="go('cart',null);this.parentElement.remove()" style="margin-left:auto;padding:8px 12px;border-radius:8px">View Cart</button>
            <button onclick="this.parentElement.remove()" style="background:none;color:var(--g);font-size:1.2rem;margin-left:5px">&times;</button>
          `;
          document.body.appendChild(toast);
          // Auto remove after 10s
          setTimeout(() => toast?.remove(), 10000);
        }
      }, 4000); // Trigger 4s after landing if cart is full
    }


    // ── OFFERS CAROUSEL ──
    let curSlide = 0;
    let slideInterval = null;

    async function loadOffers() {
      const r = await req('/slides');
      const inner = document.getElementById('carousel-inner');
      const dots = document.getElementById('carousel-dots');
      if (!inner) return;

      if (!r.success || !r.data?.length) {
        inner.innerHTML = `
          <div class="hero-slide active">
            <div class="hero-bg-accent"></div>
            <div class="hero-body">
              <div class="hero-tag"><i class="fas fa-bolt"></i> Special Offer</div>
              <h1>Welcome to<br><span>RK BAZAAR</span></h1>
              <p>Explore the best items in town</p>
            </div>
          </div>
        `;
        return;
      }

      inner.innerHTML = r.data.map((s, i) => {
        const hasBanner = s.imageUrl && s.imageUrl.startsWith('http');
        if (hasBanner) {
          // Full banner image slide with glassmorphic overlay
          return `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" data-idx="${i}">
              <div class="hero-slide-banner">
                <img class="banner-bg" src="${s.imageUrl}" alt="${s.title}" loading="lazy" onerror="this.parentElement.style.background='linear-gradient(135deg,#c73200,#ff6b00)'">
              </div>
              <div class="hero-glass-overlay"></div>
              <div class="hero-glass-content">
                <div style="flex:1">
                  <div class="hero-tag" style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-color:rgba(255,255,255,0.3)">
                    <i class="fas ${s.icon || 'fa-bolt'}"></i> Special Offer
                  </div>
                  <h1 style="font-size:1.35rem;font-weight:900;color:#fff;line-height:1.2;margin:6px 0 4px;text-shadow:0 2px 12px rgba(0,0,0,0.4)">${s.title}<br><span style="font-size:1.8rem;display:block;margin-top:2px">${s.subtitle || ''}</span></h1>
                  <p style="font-size:.66rem;color:rgba(255,255,255,0.9);text-shadow:0 1px 4px rgba(0,0,0,0.5)">${s.offerText || ''}</p>
                </div>
                ${s.badgeText ? `
                  <div class="hero-badge" style="background:rgba(255,255,255,0.15);backdrop-filter:blur(12px);border-color:rgba(255,255,255,0.4)">
                    <span>${s.badgeText}</span>
                    <span>${s.badgeSub || ''}</span>
                    <i class="fas fa-gift"></i>
                  </div>` : ''}
              </div>
            </div>
          `;
        } else {
          // Gradient slide (original style)
          return `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" data-idx="${i}"
              style="background:linear-gradient(135deg,${s.gradientFrom || '#c73200'},${s.gradientTo || '#ff8c00'})">
              <div class="hero-bg-accent"></div>
              <div class="hero-body">
                <div class="hero-tag"><i class="fas ${s.icon || 'fa-bolt'}"></i> Special Offer</div>
                <h1>${s.title}<br><span>${s.subtitle || ''}</span></h1>
                <p>${s.offerText || ''}</p>
              </div>
              ${s.badgeText ? `
                <div class="hero-badge">
                  <span>${s.badgeText}</span>
                  <span>${s.badgeSub || ''}</span>
                  <i class="fas fa-gift"></i>
                </div>` : ''}
            </div>
          `;
        }
      }).join('');

      dots.innerHTML = r.data.map((_, i) => `
        <div class="dot ${i === 0 ? 'active' : ''}" onclick="setSlide(${i})"></div>
      `).join('');

      if (r.data.length > 1) {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
      }
    }

    function setSlide(idx) {
      const slides = document.querySelectorAll('.hero-slide');
      const dots = document.querySelectorAll('.dot');
      if (!slides.length) return;

      slides[curSlide].classList.remove('active');
      dots[curSlide].classList.remove('active');

      curSlide = idx;

      slides[curSlide].classList.add('active');
      dots[curSlide].classList.add('active');

      // Reset timer on manual click
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
    }

    function nextSlide() {
      const slides = document.querySelectorAll('.hero-slide');
      if (!slides.length) return;
      let next = (curSlide + 1) % slides.length;
      setSlide(next);
    }

    function startTimer() {
      let t = 8 * 3600 + 45 * 60;
      setInterval(() => {
        t--; if (t < 0) t = 9 * 3600;
        const el = document.getElementById('ftimer');
        if (el) el.textContent = `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
      }, 1000);
    }
    function pad(n) { return String(n).padStart(2, '0') }

    async function loadCats() {
      const d = await req('/categories');
      S.categories = d.success && d.categories.length ? d.categories : [
        { _id: 'c1', name: 'Wired Earphone' }, { _id: 'c2', name: 'Earbuds' }, { _id: 'c3', name: 'Bluetooth Neckband' },
        { _id: 'c4', name: 'Bluetooth Headphone' }, { _id: 'c5', name: 'Smart Watches' }, { _id: 'c6', name: 'Mobile Charger' },
        { _id: 'c7', name: 'Charging Cables' }, { _id: 'c8', name: 'Bluetooth Speaker' }, { _id: 'c9', name: 'Car Charger' },
        { _id: 'c10', name: 'Wireless Charger' }, { _id: 'c11', name: 'Power Bank' }, { _id: 'c12', name: 'Mobile Battery' },
      ];
    }

    // Returns true if URL is a valid direct image link
    function isValidImgUrl(img) {
      if (!img || typeof img !== 'string') return false;
      const lower = img.toLowerCase();
      // Ignore placeholders, generic perfume strings, or old local paths that don't exist
      if (lower.includes('placeholder') || lower.includes('perfume') || lower.includes('dummy') || lower.includes('sample')) return false;
      if (!img.startsWith('http') && !img.startsWith('/uploads') && !img.startsWith('data:')) return false;
      return true;
    }

    async function loadProds() {
      const d = await req('/products?limit=50');
      if (d.success && d.products.length) {
        S.products = d.products.map((p, i) => {
          const validImages = p.images?.filter(isValidImgUrl) || [];
          return { ...p, images: validImages.length ? validImages : [CIMG[p.category?.name] || PIMG[i % PIMG.length]] };
        });
      } else {
        S.products = [];
      }
    }

    // Refresh products from API and re-render the store
    async function refreshProducts() {
      await loadProds();
      await loadOffers(); // Sync carousel too
      renderTrend(); renderFeat(); renderCatFull(); doSearch();
    }

    function getCatName(p) {
      if (p.category?.name) return p.category.name;
      // If category is an ID, find it in the global list
      const c = S.categories.find(x => x._id === p.category || x._id === p.category?._id || x.name === p.category);
      return c ? c.name : 'Other';
    }

    function getImg(p, i) {
      const ok = p.images?.filter(isValidImgUrl) || [];
      if (ok.length) return ok[0];
      return CIMG[getCatName(p)] || PIMG[i % PIMG.length];
    }
    function disc(p) { if (!p.mrp || p.mrp <= p.price) return 0; return Math.round(((p.mrp - p.price) / p.mrp) * 100) }
    function stars(r) { let s = ''; for (let i = 1; i <= 5; i++)s += `<i class="fa${i <= Math.round(r) ? 's' : 'r'} fa-star"></i>`; return s }

    function renderStrip() { document.getElementById('catStrip').innerHTML = S.categories.map(c => `<div class="csi" onclick="filterCat('${c._id || c.name}')"><div class="csi-img"><img src="${c.image || CIMG[c.name] || PIMG[0]}" alt="${c.name}" loading="lazy" onerror="this.parentElement.innerHTML='<span style=font-size:1.5rem>📦</span>'"></div><span>${c.name}</span></div>`).join('') }
    function pcsCard(p) { const d = disc(p); return `<div class="pcs" onclick="openProd('${p._id}')"><div class="pcs-img"><img src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/148x132/181818/FF4500?text=📦'"><button class="wlb ${S.wish.has(p._id) ? 'on' : ''}" data-wid="${p._id}" onclick="event.stopPropagation();togWish('${p._id}')"><i class="fas fa-heart"></i></button>${d ? `<span class="dtag">${d}% OFF</span>` : ''}<button class="addbtn" onclick="event.stopPropagation();addById('${p._id}')"><i class="fas fa-plus"></i></button></div><div class="pcs-body"><h4>${p.name}</h4><div><span class="pcs-p">₹${p.price}</span><span class="pcs-m">₹${p.mrp || ''}</span></div></div></div>` }
    function pgcCard(p) {
      const d = disc(p);
      const sav = p.mrp ? (p.mrp - p.price) : 0;
      return `<div class="pgc" onclick="openProd('${p._id}')"><div class="pgc-img"><img src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/140x140/181818/FF4500?text=📦'"><button class="wlb ${S.wish.has(p._id) ? 'on' : ''}" data-wid="${p._id}" onclick="event.stopPropagation();togWish('${p._id}')" style="position:absolute;top:7px;right:7px"><i class="fas fa-heart"></i></button>${d > 0 ? `<span class="dtag">${d}% OFF</span>` : ''}<button class="addbtn" onclick="event.stopPropagation();addById('${p._id}')"><i class="fas fa-plus"></i></button></div><div class="pgc-body"><h4>${p.name}</h4><div class="pgc-stars">${stars(p.rating || 0)} <span style="color:var(--g);font-size:.6rem">(${p.numReviews || 0})</span></div><div><span class="pgc-p">₹${p.price}</span><span class="pgc-m">${p.mrp && p.mrp > p.price ? '₹' + p.mrp : ''}</span></div>${sav > 0 ? `<span class="pgc-save">You save ₹${sav}</span>` : ''}</div></div>`
    }
    function renderTrend() { document.getElementById('trendRow').innerHTML = S.products.slice(0, 8).map(pcsCard).join('') }
    function renderFeat() { const l = S.products.filter(p => p.isFeatured); document.getElementById('featRow').innerHTML = (l.length ? l : S.products.slice(4, 10)).map(pcsCard).join('') }
    function renderCatFull() {
      const CAT_META = {
        'Wired Earphone':    { icon: 'fa-headphones',       grad: 'linear-gradient(135deg,#1a1a2e,#16213e)', accent: '#4FC3F7' },
        'Earbuds':           { icon: 'fa-headphones-alt',   grad: 'linear-gradient(135deg,#0f3460,#533483)', accent: '#CE93D8' },
        'Bluetooth Neckband':{ icon: 'fa-broadcast-tower',  grad: 'linear-gradient(135deg,#1b4332,#2d6a4f)', accent: '#69F0AE' },
        'Bluetooth Headphone':{ icon: 'fa-headphones',     grad: 'linear-gradient(135deg,#3e1f47,#6d3b8b)', accent: '#F48FB1' },
        'Smart Watches':     { icon: 'fa-clock',            grad: 'linear-gradient(135deg,#7B2D00,#c0392b)', accent: '#FF8A65' },
        'Mobile Charger':    { icon: 'fa-plug',             grad: 'linear-gradient(135deg,#1a237e,#283593)', accent: '#90CAF9' },
        'Charging Cables':   { icon: 'fa-cable-car',        grad: 'linear-gradient(135deg,#263238,#37474f)', accent: '#80DEEA' },
        'Bluetooth Speaker': { icon: 'fa-music',            grad: 'linear-gradient(135deg,#4a0000,#7f0000)', accent: '#EF9A9A' },
        'Car Charger':       { icon: 'fa-car',              grad: 'linear-gradient(135deg,#1b2a1b,#2e4a2e)', accent: '#A5D6A7' },
        'Wireless Charger':  { icon: 'fa-wifi',             grad: 'linear-gradient(135deg,#0d0d2b,#1a1a4e)', accent: '#80CBC4' },
        'Power Bank':        { icon: 'fa-battery-full',     grad: 'linear-gradient(135deg,#3e2723,#6d4c41)', accent: '#FFCC80' },
        'Mobile Battery':    { icon: 'fa-battery-three-quarters', grad: 'linear-gradient(135deg,#01579b,#0277bd)', accent: '#81D4FA' },
      };
      const DEFAULT_META = { icon: 'fa-box-open', grad: 'linear-gradient(135deg,#1a1a1a,#333)', accent: '#FF7043' };

      const el = document.getElementById('catFull');
      if (!el) return;

      // Update the count badge
      const badge = document.getElementById('cat-total-count');
      if (badge) badge.textContent = S.categories.length + ' Categories';

      el.innerHTML = S.categories.map((c, idx) => {
        const meta = CAT_META[c.name] || DEFAULT_META;
        const prodCount = S.products.filter(p =>
          p.category?.name === c.name ||
          p.category?._id === (c._id || c.name) ||
          p.category === c.name
        ).length;
        const hasImg = c.image && c.image.startsWith('http');
        const fallbackImg = CIMG[c.name] || PIMG[idx % PIMG.length];
        const imgSrc = hasImg ? c.image : fallbackImg;

        return `<div class="cat-card" onclick="filterCat('${c._id || c.name}')" style="animation-delay:${idx * 40}ms">
          <div class="cat-card-bg" style="background:${meta.grad}">
            <div class="cat-card-glow" style="background:${meta.accent}"></div>
            <img class="cat-card-img" src="${imgSrc}" alt="${c.name}" loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="cat-card-icon-fb" style="display:none;color:${meta.accent}">
              <i class="fas ${meta.icon}"></i>
            </div>
          </div>
          <div class="cat-card-body">
            <div class="cat-card-icon-ring" style="background:${meta.accent}22;border-color:${meta.accent}44">
              <i class="fas ${meta.icon}" style="color:${meta.accent}"></i>
            </div>
            <div class="cat-card-info">
              <h4 class="cat-card-name">${c.name}</h4>
              <span class="cat-card-count">${prodCount > 0 ? prodCount + ' items' : 'Explore'}</span>
            </div>
            <div class="cat-card-arrow" style="color:${meta.accent}">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>`;
      }).join('');
    }
    function filterCat(id) { S.filter = id; go('search', document.getElementById('bn-search')); document.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); document.querySelector(`.chip[data-cat="${id}"]`)?.classList.add('on'); doSearch() }
    function renderChips() { document.getElementById('fchips').innerHTML = `<button class="chip on" data-cat="All" onclick="setF('All',this)">All</button>` + S.categories.map(c => `<button class="chip" data-cat="${c._id || c.name}" onclick="setF('${c._id || c.name}',this)">${c.name}</button>`).join('') }
    function setF(f, btn) { S.filter = f; document.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); if (btn) btn.classList.add('on'); doSearch() }
    function debounce(fn, wait) {
      let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
    }
    const debouncedSearch = debounce(() => doSearch(), 300);

    function triggerSearch(sourceId) {
      const sourceEl = document.getElementById(sourceId);
      const targetEl = document.getElementById('si');
      if (sourceEl && targetEl) {
        targetEl.value = sourceEl.value;
      }
      go('search', document.getElementById('bn-search'));
      // Sync from target to source in case of mobile -> search page navigation
      if (sourceEl && targetEl && (sourceId === 'si' || sourceId === 'home-si')) {
         const dhSi = document.getElementById('dh-si');
         if(dhSi) dhSi.value = targetEl.value;
      }
      doSearch();
      hideSug();
    }

    function showSug(id) {
      const el = document.getElementById(id);
      const sug = document.getElementById(id + '-sug');
      if (!el || !sug) return;
      const q = el.value.toLowerCase().trim();
      
      if (!q || q.length < 1) { 
        sug.style.display = 'none'; 
        return; 
      }
      
      // Filter from available products
      const matches = S.products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.category?.name || p.category || '').toString().toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      ).slice(0, 10);

      if (!matches.length) { 
        sug.style.display = 'none'; 
        return; 
      }

      sug.innerHTML = matches.map(p => `
        <div class="sug-item" onclick="selSug('${id}', '${p._id}', '${p.name.replace(/'/g, "\\'")}')">
          <i class="fas fa-search sug-icon"></i>
          <div class="sug-item-name">${p.name}</div>
          <div class="sug-item-cat">in <span>${p.category?.name || 'Store'}</span></div>
          <div class="sug-item-img"><img src="${p.images?.[0] || 'https://via.placeholder.com/44'}" onerror="this.src='https://via.placeholder.com/44'"></div>
        </div>
      `).join('');
      sug.style.display = 'block';
      sug.style.display = 'block';
    }

    function selSug(inputId, prodId, name) {
      const el = document.getElementById(inputId);
      if (el) el.value = name;
      hideSug();
      openProd(prodId);
    }

    function hideSug() {
      document.querySelectorAll('.sug-box').forEach(s => s.style.display = 'none');
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dh-search') && !e.target.closest('.sbar')) hideSug();
    });

    function sanitize(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function showSkeletons(id, count = 4) {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = new Array(count).fill(0).map(() => `
        <div class="skel-card">
          <div class="skel-img skel"></div>
          <div class="skel-line skel"></div>
          <div class="skel-line short skel"></div>
        </div>
      `).join('');
    }

    function doSearch() {
      const si = document.getElementById('si');
      if (!si) return;
      
      const rawQ = si.value || '';
      const q = sanitize(rawQ).toLowerCase().trim();
      
      // Update other search inputs to stay in sync
      const dhSi = document.getElementById('dh-si');
      if (dhSi && dhSi.value !== rawQ) dhSi.value = rawQ;

      let l = S.products;
      if (S.filter !== 'All') {
        l = l.filter(p => {
          const catId = p.category?._id || p.category;
          return catId === S.filter || (p.category?.name === S.filter);
        });
      }

      if (q) {
        l = l.filter(p => 
          p.name.toLowerCase().includes(q) || 
          (p.description || '').toLowerCase().includes(q) ||
          (p.category?.name || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }

      const g = document.getElementById('sgrid'), e = document.getElementById('sempty');
      if (!l.length) { 
        if(g) g.innerHTML = ''; 
        if(e) e.style.display = 'flex'; 
      } else { 
        if(e) e.style.display = 'none'; 
        if(g) g.innerHTML = l.map(pgcCard).join(''); 
      }
    }


    // ── Product Detail State
    let pdQty = 1, pdImgIdx = 0, pdAllImgs = [];

    async function openProd(id) {
      // Save where we came from
      S.prev = document.querySelector('.page.active')?.id.replace('page-', '') || 'home';
      go('pd', null);
      document.getElementById('pdtitle').textContent = 'Loading...';
      document.getElementById('pdbk').onclick = goBack;
      document.getElementById('pdcontent').innerHTML = `<div style="padding:60px 0;text-align:center"><div class="lring" style="margin:auto"></div></div>`;
      pdQty = 1; pdImgIdx = 0;

      // Try to fetch full product from API
      let p = S.products.find(x => x._id === id) || null;
      if (p && p._id && !p._id.startsWith('p')) {
        const r = await req('/products/' + id);
        if (r.success) p = r.product;
      }
      if (!p) { toast('Product not found'); goBack(); return; }
      S.curP = p;
      document.getElementById('pdtitle').textContent = p.name;

      // Build image list
      // Build image list — ensure they are ALL valid
      const raw = p.images || [];
      pdAllImgs = raw.filter(isValidImgUrl);
      if (!pdAllImgs.length) {
        const cn = getCatName(p);
        pdAllImgs = [CIMG[cn] || PIMG[0]];
      }

      const dsc = disc(p);
      const inWish = S.wish.has(p._id);

      // ── Image carousel HTML
      const slidesHtml = pdAllImgs.map((img, i) => `<div class="pd-slide"><img src="${img}" alt="${p.name} image ${i + 1}" onerror="this.src='https://via.placeholder.com/260/181818/FF4500?text=%F0%9F%93%A6'"></div>`).join('');
      const thumbsHtml = pdAllImgs.length > 1 ? `<div class="pd-thumbs" id="pdThumbs">${pdAllImgs.map((img, i) => `<div class="pd-thumb${i === 0 ? ' on' : ''}" onclick="pdGoSlide(${i})"><img src="${img}" alt=""></div>`).join('')}</div>` : '';
      const dotsHtml = pdAllImgs.length > 1 ? `<div class="pd-dots" id="pdDots">${pdAllImgs.map((_, i) => `<div class="pd-dot${i === 0 ? ' on' : ''}"></div>`).join('')}</div>` : ''
      const prevBtn = pdAllImgs.length > 1 ? `<button class="pd-carousel-btn prev" onclick="pdGoSlide(pdImgIdx-1)"><i class="fas fa-chevron-left"></i></button><button class="pd-carousel-btn next" onclick="pdGoSlide(pdImgIdx+1)"><i class="fas fa-chevron-right"></i></button>` : '';

      // ── Specs
      const specs = p.specifications || [];
      // Always add standard rows
      const stdSpecs = [
        ['Brand', p.brand || 'Generic'],
        ['SKU', p.sku || '—'],
        ['Category', p.category?.name || '—'],
        ['Unit', p.unit || '1 pcs'],
        ['Stock', p.stock > 0 ? `${p.stock} units` : 'Out of Stock'],
      ];
      const allSpecs = [...stdSpecs, ...specs.map(s => [s.key, s.value])];
      const specsHtml = `<table class="pd-specs">${allSpecs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;

      // ── Reviews
      const revs = (p.reviews || []).slice().reverse();
      const revHtml = revs.length
        ? `<div class="pd-rev">${revs.map(r => `<div class="pd-rcard"><div class="pd-rhead"><span class="pd-rname">${r.name}</span><span class="pd-rdate">${new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div><div class="pd-rstars">${stars(r.rating)}</div><div class="pd-rtext">${r.comment}</div></div>`).join('')}</div>`
        : `<div class="pd-no-rev"><i class="fas fa-comment-slash" style="font-size:2rem;margin-bottom:10px;display:block;color:var(--s3)"></i>No reviews yet.<br>Be the first to review!</div>`;

      // ── Review Form
      const reviewFormHtml = S.user
        ? `<div class="pd-review-form" style="margin-top:20px;padding-top:20px;border-top:1px solid var(--bdr)">
            <h4 style="margin-bottom:10px;font-size:1rem;">Write a Review</h4>
            <div id="pd-rev-res" style="display:none;margin-bottom:10px;font-size:.8rem;padding:8px;border-radius:6px"></div>
            <div style="display:flex;gap:8px;margin-bottom:15px;font-size:1.2rem" id="pd-star-select">
              <i class="far fa-star pd-star-sel" data-val="1" onclick="pdSetStar(1)" style="cursor:pointer;color:var(--o)"></i>
              <i class="far fa-star pd-star-sel" data-val="2" onclick="pdSetStar(2)" style="cursor:pointer;color:var(--o)"></i>
              <i class="far fa-star pd-star-sel" data-val="3" onclick="pdSetStar(3)" style="cursor:pointer;color:var(--o)"></i>
              <i class="far fa-star pd-star-sel" data-val="4" onclick="pdSetStar(4)" style="cursor:pointer;color:var(--o)"></i>
              <i class="far fa-star pd-star-sel" data-val="5" onclick="pdSetStar(5)" style="cursor:pointer;color:var(--o)"></i>
            </div>
            <textarea id="pd-rev-comment" placeholder="What do you think about this product?" rows="3" style="width:100%;background:var(--s2);color:var(--w);border:1px solid var(--bdr);padding:12px;border-radius:10px;margin-bottom:15px;outline:none"></textarea>
            <button onclick="pdSubmitReview('${p._id}')" class="pd-by" id="pd-rev-btn" style="width:100%;padding:10px;border-radius:8px;border:none;background:var(--blue);color:#fff;font-weight:700">Submit Review</button>
           </div>`
        : `<div class="pd-review-login" style="margin-top:20px;padding:20px;text-align:center;background:var(--s1);border-radius:10px">
             <p style="font-size:.9rem">Please <a onclick="showAuthScreen()" style="color:var(--blue);cursor:pointer;font-weight:700;text-decoration:underline">Login</a> to write a review.</p>
           </div>`;

      const tags = (p.tags || []).map(t => `<span class="pd-tag">${t}</span>`).join('');

      document.getElementById('pdcontent').innerHTML = `
    <div class="pd-desktop-grid">
      <div class="pd-col-img">
        <div class="pd-carousel" id="pdCarousel">
          ${dsc ? `<div class="pd-badge-sale">${dsc}% OFF</div>` : ''}
          <button class="pd-wl-float${inWish ? ' on' : ''}" id="pdwl" onclick="togWish('${p._id}');this.classList.toggle('on',S.wish.has('${p._id}'))"><i class="fas fa-heart"></i></button>
          <button class="pd-share-float" onclick="shareProd('${p._id}', '${p.name.replace(/'/g, "\\'")}')"><i class="fas fa-share-alt"></i></button>
          ${prevBtn}
          <div class="pd-slides" id="pdSlides">${slidesHtml}</div>
          ${dotsHtml}
        </div>
        ${thumbsHtml}
      </div>

      <div class="pd-col-info">
        <div class="pd-info">
          <div class="pd-brand">${p.brand || 'Generic'}</div>
          <div class="pd-name">${p.name}</div>
          <div class="pd-sr"><span class="s">${stars(p.rating || 0)}</span><span>${(p.rating || 0).toFixed(1)} (${p.numReviews || 0} reviews)</span></div>
          <div class="pd-pr">
            <span class="p">₹${p.price.toLocaleString('en-IN')}</span>
            ${p.mrp && p.mrp > p.price ? `<span class="m">₹${p.mrp.toLocaleString('en-IN')}</span>` : ''}${dsc ? `<span class="d">${dsc}% OFF</span>` : ''}
          </div>
          ${p.mrp && p.mrp > p.price ? `<div class="pd-save">💰 You save ₹${(p.mrp - p.price).toLocaleString('en-IN')}</div>` : ''}
          <div class="pd-st ${p.stock > 0 ? 'y' : 'n'}">${p.stock > 0 ? `<i class="fas fa-check-circle"></i> In Stock (${p.stock} available)` : '<i class="fas fa-times-circle"></i> Out of Stock'}</div>
          ${tags ? `<div class="pd-meta">${tags}</div>` : ''}
        </div>
        
        <div class="pd-tabs">
          <div class="pd-tab on" onclick="pdSwitchTab('desc',this)">Description</div>
          <div class="pd-tab" onclick="pdSwitchTab('specs',this)">Specs</div>
          <div class="pd-tab" onclick="pdSwitchTab('revs',this)">Reviews (${p.numReviews || 0})</div>
        </div>
        <div class="pd-tabcontent on" id="pdt-desc">${(()=>{ const d = p.description || 'No description available.'; const pts = d.split(/[•·]/).map(s=>s.trim()).filter(Boolean); if(pts.length > 1){ return '<ul class="pd-desc-list">' + pts.map(pt=>'<li>'+pt+'</li>').join('') + '</ul>'; } return '<p class="pd-desc">'+d+'</p>'; })()}</div>
        <div class="pd-tabcontent" id="pdt-specs">${specsHtml}</div>
        <div class="pd-tabcontent" id="pdt-revs">${revHtml}${reviewFormHtml}</div>
      </div>
      <div class="pd-acts" style="margin-top:20px">
        <button class="pd-ac" onclick="addById('${p._id}',pdQty)"><i class="fas fa-cart-plus"></i> Add to Cart</button>
        <button class="pd-by" onclick="buyNow('${p._id}')" ${p.stock === 0 ? 'disabled style="opacity:.5"' : ''}><i class="fas fa-bolt"></i> Buy Now</button>
      </div>
    </div>

    <!-- Related Products -->

    <div class="pw">
      <h3 class="rel-head">You Might Also Like</h3>
      <div class="rel-grid" id="relGrid">
        ${S.products
          .filter(x => x._id !== p._id && (x.category?._id === p.category?._id || x.category === p.category))
          .slice(0, 4)
          .map(rp => pgcCard(rp))
          .join('')}
      </div>
    </div>
    <div style="height:30px"></div>
`;


      // Init swipe
      pdInitSwipe();
    }

    function pdGoSlide(idx) {
      const n = pdAllImgs.length;
      pdImgIdx = ((idx % n) + n) % n;
      const slides = document.getElementById('pdSlides');
      if (slides) slides.style.transform = `translateX(-${pdImgIdx * 100}%)`;
      document.querySelectorAll('.pd-dot').forEach((d, i) => d.classList.toggle('on', i === pdImgIdx));
      document.querySelectorAll('.pd-thumb').forEach((t, i) => t.classList.toggle('on', i === pdImgIdx));
    }

    function pdInitSwipe() {
      const el = document.getElementById('pdCarousel');
      if (!el) return;
      let sx = 0, sy = 0;
      el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      el.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) { pdGoSlide(pdImgIdx + (dx < 0 ? 1 : -1)); }
      }, { passive: true });
    }

    function pdChQty(d) {
      const max = S.curP?.stock || 99;
      pdQty = Math.max(1, Math.min(max, pdQty + d));
      const el = document.getElementById('pdQtyNum');
      if (el) el.textContent = pdQty;
    }

    function pdSwitchTab(tab, btn) {
      document.querySelectorAll('.pd-tab').forEach(t => t.classList.remove('on'));
      document.querySelectorAll('.pd-tabcontent').forEach(t => t.classList.remove('on'));
      btn.classList.add('on');
      document.getElementById('pdt-' + tab)?.classList.add('on');
    }

    let pdReviewRating = 0;
    function pdSetStar(val) {
      pdReviewRating = val;
      document.querySelectorAll('.pd-star-sel').forEach(el => {
        const v = parseInt(el.getAttribute('data-val'));
        if (v <= val) { el.classList.remove('far'); el.classList.add('fas'); }
        else { el.classList.remove('fas'); el.classList.add('far'); }
      });
    }

    async function pdSubmitReview(productId) {
      if (!pdReviewRating) return toast('Please select a rating ⭐️');
      const comment = document.getElementById('pd-rev-comment').value.trim();
      if (!comment) return toast('Please write a review comment ✍️');

      const btn = document.getElementById('pd-rev-btn');
      btn.textContent = 'Submitting...'; btn.disabled = true;

      const res = await req('/products/' + productId + '/review', 'POST', { rating: pdReviewRating, comment });

      const msgBox = document.getElementById('pd-rev-res');
      msgBox.style.display = 'block';
      if (res.success) {
        msgBox.style.color = '#22c55e';
        msgBox.innerHTML = `✅ ${res.message}`;
        pdReviewRating = 0;
        document.getElementById('pd-rev-comment').value = '';
        pdSetStar(0);
        setTimeout(() => { openProd(productId) }, 1000);
      } else {
        msgBox.style.color = '#ef4444';
        msgBox.innerHTML = `❌ ${res.message}`;
        btn.textContent = 'Submit Review'; btn.disabled = false;
      }
    }

    function pdAddCart() {
      const p = S.curP; if (!p) return;
      const id = p._id;
      if (S.cart[id]) S.cart[id].qty += pdQty;
      else S.cart[id] = { qty: pdQty, price: p.price, name: p.name, img: pdAllImgs[0] || PIMG[0] };
      saveCart(); updCart();
      toast(`${pdQty > 1 ? pdQty + 'x ' : ''}Added to cart 🛒`);
      if (S.token) req('/cart/add', 'POST', { productId: id, quantity: pdQty });
    }

    function pdBuyNow() {
      pdAddCart();
      goCheckout();
    }

    function addById(id) { const p = S.products.find(x => x._id === id); if (p) addToCart(p) }
    function addToCart(p) {
      const id = p._id;
      if (S.cart[id]) S.cart[id].qty++; else S.cart[id] = { qty: 1, price: p.price, name: p.name, img: p.images[0] };
      saveCart(); updCart(); toast('Added to cart 🛒');
      if (S.token) req('/cart/add', 'POST', { productId: id, quantity: 1 });
    }
    function chQty(id, d) { if (!S.cart[id]) return; S.cart[id].qty += d; if (S.cart[id].qty <= 0) delete S.cart[id]; saveCart(); updCart(); renderCart(); if (S.token) req('/cart/update', 'PUT', { productId: id, quantity: S.cart[id]?.qty || 0 }) }
    function rmItem(id) { delete S.cart[id]; saveCart(); updCart(); renderCart(); if (S.token) req('/cart/remove/' + id, 'DELETE') }
    function saveCart() { localStorage.setItem('btC', JSON.stringify(S.cart)) }
    function cartTot() { return Object.values(S.cart).reduce((s, i) => s + i.price * i.qty, 0) }
    function cartCnt() { return Object.values(S.cart).reduce((s, i) => s + i.qty, 0) }
    function updCart() { const n = cartCnt(), t = cartTot(); document.getElementById('cpn').textContent = n + ' item' + (n !== 1 ? 's' : ''); document.getElementById('cpt').textContent = '₹' + t.toFixed(0); }
    function renderCart() {
      const ids = Object.keys(S.cart), c = document.getElementById('cartcontent');
      if (!ids.length) { c.innerHTML = `<div class="empty"><i class="fas fa-shopping-cart"></i><h3>Your cart is empty</h3><p>Add some products to get started</p><button class="eb" onclick="go('search',document.getElementById('bn-search'))">Browse Products</button></div>`; return }
      const tot = cartTot(), del = tot >= 500 ? 0 : 49, tax = 0;
      c.innerHTML = `${ids.map(id => { const i = S.cart[id]; return `<div class="ci"><div class="ci-img"><img src="${i.img}" onerror="this.src='https://via.placeholder.com/70/181818/FF4500?text=📦'"></div><div class="ci-body"><h4>${i.name}</h4><div class="ci-price">₹${(i.price * i.qty).toFixed(0)}</div><div class="qc"><button class="qb" onclick="chQty('${id}',-1)">−</button><span class="qn">${i.qty}</span><button class="qb" onclick="chQty('${id}',1)">+</button></div></div><button class="ci-rm" onclick="rmItem('${id}')"><i class="fas fa-times"></i></button></div>` }).join('')}<div class="sumbox"><h3>Order Summary</h3><div class="sr"><span>Subtotal (${cartCnt()} items)</span><strong>₹${tot.toFixed(0)}</strong></div><div class="sr"><span>Delivery</span><strong>${del === 0 ? '<span style="color:var(--green)">FREE</span>' : '₹' + del}</strong></div><div class="sdiv"></div><div class="stot"><span>Total Payable</span><strong>₹${(tot + del).toFixed(0)}</strong></div></div><button class="cobtn" onclick="goCheckout()"><i class="fas fa-lock"></i> Proceed to Checkout</button><div style="height:12px"></div>`;
    }

    function togWish(id) {
      if (S.wish.has(id)) { S.wish.delete(id); toast('Removed from wishlist') } else { S.wish.add(id); toast('Saved to wishlist ❤️') }
      localStorage.setItem('btW', JSON.stringify([...S.wish]));
      document.querySelectorAll(`[data-wid="${id}"]`).forEach(b => b.classList.toggle('on', S.wish.has(id)));
      document.getElementById('pdwl')?.classList.toggle('on', S.wish.has(id));
      renderWish();
      if (S.token) req('/wishlist/toggle', 'POST', { productId: id });
    }
    function renderWish() { const items = S.products.filter(p => S.wish.has(p._id)); const g = document.getElementById('wgrid'), e = document.getElementById('wempty'); if (!items.length) { g.innerHTML = ''; e.style.display = 'flex'; return } e.style.display = 'none'; g.innerHTML = items.map(pgcCard).join('') }

    function goCheckout() {
      // If guest → send to login
      if (!S.user) { showAuthScreen(); toast('Please login to checkout'); return }
      S.isExpressDelivery = false; // default
      // ensure clean UI state
      const std = document.getElementById('rd-deliver-std');
      const exp = document.getElementById('rd-deliver-exp');
      if (std) { std.classList.add('on'); std.parentElement.classList.add('on'); }
      if (exp) { exp.classList.remove('on'); exp.parentElement.classList.remove('on'); }

      updateCheckoutTotal();
      if (S.user) { document.getElementById('an').value = S.user.name || ''; document.getElementById('aph').value = S.user.phone || '' }
      go('checkout', null);
    }

    function selDeliver(isExpress, el) {
      S.isExpressDelivery = isExpress;
      document.getElementById('rd-deliver-std').classList.remove('on');
      document.getElementById('rd-deliver-exp').classList.remove('on');
      document.getElementById('rd-deliver-std').parentElement.classList.remove('on');
      document.getElementById('rd-deliver-exp').parentElement.classList.remove('on');
      el.classList.add('on');
      el.querySelector('.rd').classList.add('on');
      updateCheckoutTotal();
    }

    function updateCheckoutTotal() {
      const tot = cartTot();
      const standardDel = tot >= 500 ? 0 : 49;
      const expressCharge = S.isExpressDelivery ? 50 : 0;
      const del = standardDel + expressCharge;
      
      let discount = 0;
      if (S.coupon) {
        discount = Math.round(tot * (S.coupon.discountPercent / 100));
      }

      const grand = (tot + del - discount).toFixed(0);

      let delHtml = '';
      if (expressCharge > 0) {
        delHtml = `₹${del} <span style="font-size:0.6rem; color:var(--o)">(Inc. Express)</span>`;
      } else {
        delHtml = del === 0 ? 'FREE' : '₹' + del;
      }

      let summaryHtml = `
        <h3><i class="fas fa-receipt"></i> Order Summary</h3>
        <div class="sr"><span>Subtotal</span><strong>₹${tot.toFixed(0)}</strong></div>
      `;

      if (discount > 0) {
        summaryHtml += `<div class="sr" style="color:var(--green)"><span>Discount (${S.coupon.code})</span><strong>-₹${discount}</strong></div>`;
      }

      summaryHtml += `
        <div class="sr"><span>Delivery</span><strong>${delHtml}</strong></div>
        <div class="sdiv"></div>
        <div class="stot"><span>Grand Total</span><strong>₹${grand}</strong></div>
      `;

      document.getElementById('cosum').innerHTML = summaryHtml;
    }

    async function applyCoupon() {
      const code = document.getElementById('co-input').value.trim();
      const msg = document.getElementById('co-msg');
      const btn = document.getElementById('btn-apply-coupon');
      
      if (!code) { toast('Please enter a coupon code'); return; }
      
      btn.disabled = true; btn.textContent = '...';
      const res = await req('/coupons/validate', 'POST', { code });
      btn.disabled = false; btn.textContent = 'Apply';
      
      msg.style.display = 'block';
      if (res.success) {
        S.coupon = res.data;
        msg.style.color = 'var(--green)';
        msg.innerHTML = `✅ Applied! ${res.data.discountPercent}% OFF`;
        updateCheckoutTotal();
        toast('Coupon applied! 🎫');
      } else {
        S.coupon = null;
        msg.style.color = '#ef4444';
        msg.innerHTML = `❌ ${res.message}`;
        updateCheckoutTotal();
      }
    }

    function selPay(m, el) { S.payM = m; document.querySelectorAll('.popt').forEach(o => o.classList.remove('on')); el.classList.add('on'); document.querySelectorAll('[id^="rd-"]').forEach(d => d.classList.remove('on')); document.getElementById('rd-' + m).classList.add('on') }
    async function placeOrder() {
      const name = document.getElementById('an').value.trim(), phone = document.getElementById('aph').value.trim(), street = document.getElementById('ast').value.trim(), city = document.getElementById('aci').value.trim(), state = document.getElementById('ase').value.trim(), pin = document.getElementById('api').value.trim();
      if (!name || !phone || !street || !city || !state || !pin) { toast('Please fill all address fields!'); return }
      const tot = cartTot();
      const standardDel = tot >= 500 ? 0 : 49;
      const expressCharge = S.isExpressDelivery ? 50 : 0;
      const del = standardDel + expressCharge;
      const tax = 0;
      const orderItems = Object.keys(S.cart).map(id => ({ product: id, name: S.cart[id].name, image: S.cart[id].img, price: S.cart[id].price, quantity: S.cart[id].qty }));
      const od = { orderItems, shippingAddress: { name, phone, street, city, state, pincode: pin }, paymentMethod: S.payM, itemsPrice: tot, shippingPrice: del, taxPrice: tax, totalPrice: tot + del, isExpressDelivery: S.isExpressDelivery, couponCode: S.coupon ? S.coupon.code : null };
      if (S.token) {
        const res = await req('/orders', 'POST', od);
        if (res.success) {
          if (S.payM === 'razorpay') { initRzp(res.order); return }
          if (S.payM === 'cod') { await req('/payment/cod/confirm', 'POST', { orderId: res.order._id }); clearCart(res.order._id); return }
          clearCart(res.order._id);
        } else toast(res.message || 'Error placing order');
      }
    }
    async function initRzp(order) {
      const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; document.head.appendChild(s);
      s.onload = async () => {
        // ✅ Fix: NEVER trust amount from frontend. Send orderId and let backend verify.
        const rr = await req('/payment/razorpay/create-order', 'POST', { orderId: order._id });
        if (!rr.success) {
          toast(rr.message || 'Payment setup failed');
          return;
        }

        const options = {
          key: rr.key,
          amount: rr.amount, // Verified amount from backend (in paise)
          currency: rr.currency,
          name: 'RK BAZAAR',
          description: 'Premium Store',
          order_id: rr.razorpayOrderId,
          handler: async (resp) => {
            const v = await req('/payment/razorpay/verify', 'POST', {
              ...resp,
              orderId: order._id
            });
            if (v.success) clearCart(order._id);
            else toast('Payment verification failed');
          },
          prefill: {
            name: S.user?.name || '',
            email: S.user?.email || '',
            contact: S.user?.phone || ''
          },
          theme: { color: '#FF4500' }
        };
        new window.Razorpay(options).open();
      };
    }
    function clearCart(orderOrId) {
      S.cart = {}; saveCart(); updCart();
      const displayId = (typeof orderOrId === 'object') ? (orderOrId.orderNumber || orderOrId._id) : orderOrId;
      document.getElementById('succnum').textContent = displayId.toString().replace('#', '');
      go('success', null);
    }
    function buyNow(id) { addById(id); goCheckout() }

    function renderAcc() {
      const c = document.getElementById('accontent');
      if (!S.user) {
        c.innerHTML = `<div class="empty" style="padding:60px 20px"><i class="fas fa-user-circle" style="font-size:4rem;color:var(--s3)"></i><h3>Not Logged In</h3><p>Login to view orders, wishlist and track deliveries</p><button class="eb" onclick="showAuthScreen()">Login / Register</button></div>`;
        return;
      }

      const initial = (S.user.name && S.user.name.length > 0) ? S.user.name[0].toUpperCase() : 'U';
      const name = S.user.name || 'User';

      c.innerHTML = `<div class="pcard">
        <div class="pav">${initial}</div>
        <div class="pinfo">
          <h3>${name}</h3>
          <p>${S.user.email}</p>
          <p style="font-size:.63rem;color:var(--g);margin-top:1px">${S.user.phone || ''}</p>
        </div>
      </div>
      
      <!-- RK COINS WALLET -->
      <div class="p-wallet">
        <div class="p-wallet-ic"><i class="fas fa-coins"></i></div>
        <div class="p-wallet-val">
          <h4>RK COINS (WALLET)</h4>
          <div id="rk-coins-bal">₹0</div>
        </div>
        <div style="font-size: .6rem; color: var(--g); text-align: right;">100% RECLAIMABLE</div>
      </div>`;

      // Update balance
      document.getElementById('rk-coins-bal').textContent = '₹' + Math.floor(S.products.length * 1.5 + (S.user.id ? parseInt(S.user.id.slice(-4), 16) % 500 : 120));

      c.innerHTML += `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">

        <div class="pcard" onclick="go('wishlist',document.getElementById('bn-wishlist'))" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 16px;border:1px solid var(--o);margin:0;text-align:center">
          <i class="fas fa-heart" style="color:var(--o);font-size:1.3rem"></i>
          <div style="font-size:.78rem;font-weight:800;color:var(--w);letter-spacing:0.5px">${S.wish.size} SAVED</div>
        </div>
        <div class="pcard" onclick="go('cart',document.getElementById('bn-cart'))" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 16px;border:1px solid var(--green);margin:0;text-align:center">
          <i class="fas fa-shopping-bag" style="color:var(--green);font-size:1.3rem"></i>
          <div style="font-size:.78rem;font-weight:800;color:var(--w);letter-spacing:0.5px">${cartCnt()} IN CART</div>
        </div>
      </div>

      <div class="mb">
        <div class="ms">My Orders</div>
        <div class="mr" onclick="go('orders',null);loadOrds()">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <span class="ml">All Orders</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
      </div>

      <div class="mb">
        <div class="ms">Support</div>
        <div class="mr" onclick="go('contact',null)">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.25-2.25a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <span class="ml">Call Us</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
        <div class="mr" onclick="go('contact',null)">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .003 5.415.005 12.054c0 2.123.554 4.197 1.61 6.006L0 24l6.135-1.61a11.815 11.815 0 005.91 1.586h.005c6.638 0 12.05-5.415 12.052-12.054a11.75 11.75 0 00-3.535-8.513"></path></svg>
          </div>
          <span class="ml">WhatsApp Support</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
        <div class="mr" onclick="go('contact',null)">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <span class="ml">Help Center</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
        <div class="mr" onclick="go('refund',null)">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 2v6h6"></path><path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path></svg>
          </div>
          <span class="ml">Return & Refund Policy</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
        <div class="mr" onclick="go('privacy',null)">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <span class="ml">Privacy Policy</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
        <div class="mr" onclick="go('tos',null)">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <span class="ml">Terms of Service</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
        <div class="mr" onclick="go('overview',null)">
          <div class="mi" style="background:rgba(255,255,255,0.05);border:1px solid var(--bdr)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="2"></line></svg>
          </div>
          <span class="ml">About RK BAZAAR</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:auto"><path d="M9 18l6-6-6-6"></path></svg>
        </div>
      </div>

      <div class="mb">
        <div class="mr" onclick="doLogout()">
          <div class="mi" style="background:rgba(255,61,61,.1)">
            <i class="fas fa-sign-out-alt" style="color:var(--red)"></i>
          </div>
          <span class="ml" style="color:var(--red)">Logout</span>
        </div>
      </div>
      <div style="height:8px"></div>`;
    }

    async function loadOrds() {
      const c = document.getElementById('ordcontent');
      if (!S.token) { c.innerHTML = `<div class="empty"><i class="fas fa-box-open"></i><h3>Login Required</h3></div>`; return }
      c.innerHTML = `<div style="text-align:center;padding:40px"><div class="lring" style="margin:auto"></div></div>`;
      const d = await req('/orders/my');
      if (!d.success || !d.orders.length) { c.innerHTML = `<div class="empty"><i class="fas fa-box-open"></i><h3>No Orders Yet</h3><p>Your placed orders will appear here</p><button class="eb" onclick="go('home',document.getElementById('bn-home'))">Shop Now</button></div>`; return }

      c.innerHTML = d.orders.map(o => {
        const canCancel = ['pending', 'confirmed'].includes(o.orderStatus?.toLowerCase());
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        return `<div class="ocard" id="order-${o._id}">
          <div class="oh">
            <span class="onum">Order <b>#${o.orderNumber || o._id.slice(-8).toUpperCase()}</b></span>
            <span class="sp ${o.orderStatus?.toLowerCase() || 'pending'}">${o.orderStatus || 'Pending'}</span>
          </div>

          <!-- Order Tracking Stepper -->
          <div class="ord-timeline">
            <div class="ord-step ${['pending','confirmed','shipped','delivered'].includes(o.orderStatus?.toLowerCase()) ? 'on' : ''}">
              <div class="ord-dot"><i class="fas fa-check"></i></div>
              <span class="ord-label">Ordered</span>
            </div>
            <div class="ord-step ${['confirmed','shipped','delivered'].includes(o.orderStatus?.toLowerCase()) ? 'on' : ''}">
              <div class="ord-dot"><i class="fas fa-box"></i></div>
              <span class="ord-label">Confirmed</span>
            </div>
            <div class="ord-step ${['shipped','delivered'].includes(o.orderStatus?.toLowerCase()) ? 'on' : ''}">
              <div class="ord-dot"><i class="fas fa-truck"></i></div>
              <span class="ord-label">Shipped</span>
            </div>
            <div class="ord-step ${['delivered'].includes(o.orderStatus?.toLowerCase()) ? 'on' : ''}">
              <div class="ord-dot"><i class="fas fa-home"></i></div>
              <span class="ord-label">Delivered</span>
            </div>
          </div>

          <div class="otot">

            <div class="ot-l"><span>Ordered On</span><b>${dateStr}</b></div>
            <div class="ot-l" style="text-align:right"><span>Grand Total</span><b>₹${(o.totalPrice || 0).toFixed(0)}</b></div>
          </div>
          <div class="items-list">
            ${(o.orderItems || []).map(i => `
              <div class="item-row">
                <img class="item-img" src="${i.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}" onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='">
                <div class="item-info">
                  <div class="item-name">${i.name}</div>
                  <div class="item-meta">
                    <span>Qty: ${i.quantity}</span>
                    <span style="color:var(--bdr)">|</span>
                    <span style="color:var(--o)">₹${(i.price * i.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="iofr">
            ${canCancel ? `<button class="obtn obtn-c" onclick="cancelOrder('${o._id}')"><i class="fas fa-times-circle"></i> Cancel Order</button>` : ''}
            <button class="obtn obtn-d" onclick="go('contact',null)"><i class="fas fa-headset"></i> Get Support</button>
          </div>
        </div>`;
      }).join('');
    }

    async function cancelOrder(id) {
      if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
      toast('Cancelling order...');
      const r = await req(`/orders/${id}/cancel`, 'PUT');
      if (r.success) {
        toast('Order cancelled successfully 📉');
        loadOrds(); // Refresh list
      } else {
        toast(r.message || 'Failed to cancel order');
      }
    }

    async function sendContact() {
      const name = document.getElementById('ctname').value.trim(), phone = document.getElementById('ctphone').value.trim(), msg = document.getElementById('ctmsg').value.trim();
      if (!name || !msg) { toast('Name and message are required!'); return }
      await req('/contact', 'POST', { name, phone, message: msg });
      toast('Message sent! We\'ll reply soon 😊');
      document.getElementById('ctname').value = ''; document.getElementById('ctphone').value = ''; document.getElementById('ctmsg').value = '';
    }

    function doLogout() {
      S.user = null; S.token = ''; S.isGuest = false;
      localStorage.removeItem('btU'); localStorage.removeItem('btT');
      showAuthScreen();
      toast('Logged out successfully');
    }

    function go(id, btn) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const pg = document.getElementById('page-' + id);
      if (pg) pg.classList.add('active');
      if (btn) {
        document.querySelectorAll('.bn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      window.scrollTo(0, 0);
      if (id === 'search') setTimeout(() => document.getElementById('si')?.focus(), 250);
      if (id === 'checkout') goCheckout();
      if (id === 'wishlist') renderWish();
      if (id === 'cart') renderCart();
      if (id === 'account') renderAcc();
      if (id === 'orders') loadOrds();
    }

    // Auto-refresh products when user switches back to this tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && S.products.length > 0) refreshProducts();
    });
    function goBack() { go(S.prev || 'home', document.getElementById('bn-' + (S.prev || 'home'))) }
    function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500) }

    // ── SHARING LOGIC ──
    function shareProd(id, name) {
      const url = window.location.origin + window.location.pathname + '?prod=' + id;
      const text = `Check out this amazing product on RK BAZAAR: ${name}`;

      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        navigator.share({ title: name, text: text, url: url }).catch(err => {
          if (err.name !== 'AbortError') showShareSheet(url, text);
        });
      } else {
        showShareSheet(url, text);
      }
    }

    function showShareSheet(url, text) {
      const overlay = document.getElementById('share-sheet-overlay');
      
      // Update links
      document.getElementById('ss-wa').onclick = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        closeShareSheet();
      };
      document.getElementById('ss-copy').onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
          toast('Link copied to clipboard! 📋');
          closeShareSheet();
        });
      };
      document.getElementById('ss-fb').onclick = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        closeShareSheet();
      };

      overlay.classList.add('active');
    }

    function closeShareSheet() {
      document.getElementById('share-sheet-overlay').classList.remove('active');
    }