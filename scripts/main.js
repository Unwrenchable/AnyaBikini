// =========================================
// ANYA BIKINI - Main JavaScript
// =========================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Sticky Header ---
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  });

  // --- Mobile Nav ---
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileClose = document.querySelector('.mobile-nav-close');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
  }

  if (mobileClose && mobileNav) {
    mobileClose.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // --- Product Filters ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      productCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
          setTimeout(() => { card.style.opacity = '1'; }, 10);
        } else {
          card.style.opacity = '0';
          setTimeout(() => { card.style.display = 'none'; }, 300);
        }
      });
    });
  });

  // --- Quick Add to Cart ---
  let cartCount = 0;
  const cartCountEl = document.querySelector('.cart-count');

  document.querySelectorAll('.product-quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      cartCount++;
      if (cartCountEl) cartCountEl.textContent = cartCount;
      const productName = btn.closest('.product-card').querySelector('.product-name')?.textContent || 'Item';
      showToast(`✓ ${productName} added to cart`);
    });
  });

  // --- Wishlist (API-backed) ---
  async function fetchWishlist() {
    try {
      const res = await fetchJSON(API_BASE + '/wishlist');
      return Array.isArray(res.wishlist) ? res.wishlist : [];
    } catch {
      return [];
    }
  }

  async function addToWishlist(productId, btn) {
    try {
      await fetchJSON(API_BASE + '/wishlist/add', { method: 'POST', body: JSON.stringify({ productId }) });
      btn.classList.add('active');
      btn.style.background = 'var(--color-primary)';
      btn.style.color = 'white';
      showToast('♥ Added to wishlist');
    } catch {
      showToast('Please sign in to use wishlist');
    }
  }

  async function removeFromWishlist(productId, btn) {
    try {
      await fetchJSON(API_BASE + '/wishlist/remove', { method: 'POST', body: JSON.stringify({ productId }) });
      btn.classList.remove('active');
      btn.style.background = '';
      btn.style.color = '';
      showToast('Removed from wishlist');
    } catch {
      showToast('Please sign in to use wishlist');
    }
  }

  async function syncWishlistUI() {
    const wishlist = await fetchWishlist();
    document.querySelectorAll('.product-card').forEach(card => {
      const btn = card.querySelector('.product-wishlist');
      if (!btn) return;
      const productId = card.dataset.sku || card.dataset.id || card.querySelector('.product-name')?.textContent?.trim();
      if (wishlist.includes(productId)) {
        btn.classList.add('active');
        btn.style.background = 'var(--color-primary)';
        btn.style.color = 'white';
      } else {
        btn.classList.remove('active');
        btn.style.background = '';
        btn.style.color = '';
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.product-wishlist')) {
      e.preventDefault();
      const btn = e.target.closest('.product-wishlist');
      const card = btn.closest('.product-card');
      const productId = card?.dataset.sku || card?.dataset.id || card?.querySelector('.product-name')?.textContent?.trim();
      if (!btn.classList.contains('active')) {
        addToWishlist(productId, btn);
      } else {
        removeFromWishlist(productId, btn);
      }
    }
  });

  // Sync wishlist UI on page load and after login/logout
  document.addEventListener('DOMContentLoaded', syncWishlistUI);
  window.syncWishlistUI = syncWishlistUI;

  // --- Newsletter Form ---
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.newsletter-input');
      if (input && input.value.includes('@')) {
        showToast('🌊 Welcome! Check your email for a special offer.');
        input.value = '';
      } else {
        showToast('Please enter a valid email address.');
      }
    });
  }

  // --- Color Swatches ---
  document.querySelectorAll('.product-colors').forEach(colorGroup => {
    colorGroup.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        colorGroup.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });
  });

  // --- Toast ---
  let toastTimeout;
  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="toast-icon">✦</span><span>${msg}</span>`;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // --- Scroll Reveal Animation ---
  if ('IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll(
      '.product-card, .collection-card, .feature-item, .testimonial-card, .lookbook-item'
    );

    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  // --- Banner Strip Duplicate for Seamless Loop ---
  const stripInner = document.querySelector('.banner-strip-inner');
  if (stripInner) {
    stripInner.innerHTML += stripInner.innerHTML;
  }

});

// --- App enhancements: Auth, Instagram, Cart, Checkout ---
(function () {
  const API_BASE = document.querySelector('meta[name="api-base"]')?.getAttribute('content') || '/api';
  let stripeKey = document.querySelector('meta[name="stripe-publishable-key"]')?.getAttribute('content') || '';
  let stripe = null;

  async function loadConfig() {
    try {
      const cfg = await fetchJSON(API_BASE + '/config');
      if (cfg && cfg.stripePublishableKey) {
        stripeKey = cfg.stripePublishableKey;
        if (stripeKey && window.Stripe) stripe = Stripe(stripeKey);
      }
      if (cfg && cfg.instagramConfigured) {
        // Instagram will be fetched later by loadInstagram()
      }
    } catch (err) {
      console.warn('Could not load config', err);
    }
  }

  function $qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $qa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, opts));
    return res.json();
  }

  // AUTH UI
  function openAuthModal(showRegister) {
    const modal = $qs('#auth-modal');
    if (!modal) return;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    $qs('#register-form').style.display = showRegister ? 'block' : 'none';
    $qs('#login-form').style.display = showRegister ? 'none' : 'block';
  }
  function closeAuthModal() {
    const modal = $qs('#auth-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('click', (e) => {
    if (e.target.matches('#show-login')) openAuthModal(false);
    if (e.target.matches('#show-register')) openAuthModal(true);
    if (e.target.matches('.modal-close')) closeAuthModal();
    if (e.target.matches('.cart-close')) toggleCart(false);
  });

  // register
  $qs('#register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[name="name"]').value;
    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const resp = await fetchJSON(API_BASE + '/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    if (resp && resp.ok) { closeAuthModal(); showToast('Account created — you are signed in.'); }
    else showToast(resp.error || 'Registration failed');
  });

  // login
  $qs('#login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const resp = await fetchJSON(API_BASE + '/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (resp && resp.ok) { closeAuthModal(); showToast('Signed in'); }
    else showToast(resp.error || 'Sign in failed');
  });

  // INSTAGRAM
  async function loadInstagram() {
    try {
      const res = await fetchJSON(API_BASE + '/instagram');
      if (res && Array.isArray(res.data) && res.data.length) {
        const gallery = $qs('#instagram-gallery');
        const photos = $qs('#instagram-photos');
        gallery.style.display = 'block';
        photos.innerHTML = '';
        res.data.slice(0, 9).forEach(p => {
          const a = document.createElement('a');
          a.href = p.permalink || '#';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'ig-photo';
          const img = document.createElement('img');
          img.src = p.media_url || p.thumbnail_url;
          img.alt = p.caption || 'Instagram photo';
          img.loading = 'lazy';
          a.appendChild(img);
          photos.appendChild(a);
        });
      }
    } catch (err) {
      console.warn('Instagram load failed', err);
    }
  }

  // CART
  function getCart() { try { return JSON.parse(localStorage.getItem('anya_cart') || '[]'); } catch { return []; } }
  function saveCart(cart) { localStorage.setItem('anya_cart', JSON.stringify(cart)); updateCartUI(); }
  function addToCartItem(item) {
    const cart = getCart();
    const existing = cart.find(i => i.name === item.name);
    if (existing) existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    else cart.push(Object.assign({ quantity: 1 }, item));
    saveCart(cart);
    showToast(`✓ ${item.name} added to cart`);
  }

  function updateCartUI() {
    const cart = getCart();
    const count = cart.reduce((s, i) => s + (i.quantity || 0), 0);
    const elCount = $qs('.cart-count'); if (elCount) elCount.textContent = count;
    const itemsContainer = $qs('#cart-items');
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';
    let total = 0;
    cart.forEach(i => {
      const row = document.createElement('div'); row.className = 'cart-item';
      row.innerHTML = `<div class="cart-item-name">${i.name}</div><div class="cart-item-meta">${i.quantity} × $${(i.price||0).toFixed(2)}</div>`;
      itemsContainer.appendChild(row);
      total += (i.price||0) * (i.quantity||1);
    });
    $qs('#cart-total').textContent = `Total: $${total.toFixed(2)}`;
  }

  function toggleCart(show) {
    const drawer = $qs('#cart-drawer');
    if (!drawer) return;
    const isOpen = drawer.style.display !== 'none';
    const want = typeof show === 'boolean' ? show : !isOpen;
    drawer.style.display = want ? 'block' : 'none';
  }

  // Hook quick add buttons to cart
  document.addEventListener('click', (e) => {
    if (e.target.closest('.product-quick-add')) {
      const btn = e.target.closest('.product-quick-add');
      const card = btn.closest('.product-card');
      const name = card.querySelector('.product-name')?.textContent?.trim() || 'Item';
      const priceText = card.querySelector('.price-current')?.textContent || '0';
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      addToCartItem({ name, price });
    }
  });

  // Cart icon click
  const cartBtn = document.querySelector('.nav-actions .nav-icon-btn[aria-label="Shopping cart"]');
  if (cartBtn) cartBtn.addEventListener('click', () => toggleCart(true));

  // Checkout flow: if not signed in, prompt auth; otherwise create Stripe checkout session
  $qs('#btn-checkout')?.addEventListener('click', async () => {
    try {
      const profile = await fetchJSON(API_BASE + '/profile');
      if (!profile || profile.error) { openAuthModal(false); return; }
    } catch (err) { openAuthModal(false); return; }

    const cart = getCart();
    if (!cart.length) { showToast('Your cart is empty'); return; }
    // create session
    const resp = await fetchJSON(API_BASE + '/create-checkout-session', { method: 'POST', body: JSON.stringify({ items: cart }) });
    if (resp && resp.url) {
      window.location.href = resp.url;
    } else {
      showToast(resp.error || 'Checkout failed');
    }
  });

  // In-page card payment flow using PaymentIntent + Stripe Elements
  let elements = null;
  let cardElement = null;
  $qs('#btn-pay-card')?.addEventListener('click', async () => {
    if (!stripe) { showToast('Card payments not available (no Stripe key)'); return; }
    $qs('#card-payment').style.display = 'block';
    if (!elements) {
      elements = stripe.elements();
      cardElement = elements.create('card');
      cardElement.mount('#card-element');
    }
  });

  $qs('#btn-confirm-card')?.addEventListener('click', async () => {
    if (!stripe) { showToast('Stripe not initialized'); return; }
    const cart = getCart();
    if (!cart.length) { showToast('Cart is empty'); return; }
    showToast('Creating payment...');
    try {
      const resp = await fetchJSON(API_BASE + '/create-payment-intent', { method: 'POST', body: JSON.stringify({ items: cart }) });
      if (!resp || !resp.clientSecret) { showToast(resp.error || 'Could not create payment'); return; }
      const result = await stripe.confirmCardPayment(resp.clientSecret, { payment_method: { card: cardElement } });
      if (result.error) {
        showToast(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        showToast('Payment succeeded — thank you!');
        // create order (optional)
        await fetchJSON(API_BASE + '/create-order', { method: 'POST', body: JSON.stringify({ items: cart, amount_cents: cart.reduce((s,i) => s + Math.round((i.price||0)*100)*(i.quantity||1), 0) }) });
        localStorage.removeItem('anya_cart');
        updateCartUI();
        toggleCart(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Payment error');
    }
  });

  // initialize
  document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    updateCartUI();
    loadInstagram();
  });
  // Product modal
  function openProductModal(p) {
    const modal = $qs('#product-modal');
    const body = $qs('#product-modal-body');
    if (!modal || !body) return;
    body.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <img src="${p.image||''}" alt="${p.name||''}" style="width:260px;height:auto;object-fit:cover;border-radius:6px;" />
        <div style="max-width:520px;"><h2>${p.name||''}</h2><p style="color:#666">${p.description||''}</p><p style="font-weight:700">$${(p.price||0).toFixed(2)}</p><div style="display:flex;gap:8px;margin-top:12px;"><button id="modal-add" class="btn btn-primary">Add to cart</button><a class="btn" href="${p.permalink||'#'}" target="_blank" rel="noopener">View on Instagram</a></div></div>
      </div>
    `;
    modal.style.display = 'block'; modal.setAttribute('aria-hidden','false');
    $qs('#modal-add').addEventListener('click', () => {
      addToCartItem({ name: p.name || 'Item', price: p.price || 0, sku: p.sku || p.id });
    });
    modal.querySelector('.modal-close')?.addEventListener('click', () => { modal.style.display='none'; modal.setAttribute('aria-hidden','true'); });
  }

  // Load server-managed products and replace static grid if present
  async function loadProducts() {
    try {
      const resp = await fetchJSON(API_BASE + '/products');
      if (resp && Array.isArray(resp.products) && resp.products.length) {
        const grid = document.querySelector('.products-grid');
        if (!grid) return;
        grid.innerHTML = '';
        resp.products.forEach(p => {
          // only show if published (default true)
          if (p.published === false) return;
          const card = document.createElement('div'); card.className = 'product-card';
          const priceText = `$${(p.price||0).toFixed(2)}`;
          card.innerHTML = `
            <div class="product-image-wrap">
              <img src="${p.image || ''}" alt="${p.name||''}" loading="lazy" />
              <button class="product-wishlist" aria-label="Add to wishlist">♥</button>
              <div class="product-actions">
                <button class="product-quick-add" data-name="${(p.name||'').replace(/"/g,'&quot;')}" data-price="${(p.price||0)}" data-sku="${p.sku||p.id||''}">Quick Add</button>
                <button class="product-preview" data-product='${JSON.stringify(p).replace(/'/g, "\\'") }'>Preview</button>
              </div>
            </div>
            <div class="product-info">
              <p class="product-style">${p.source === 'instagram' ? 'From Instagram' : ''}</p>
              <h3 class="product-name">${p.name || ''}</h3>
              <div class="product-price"><span class="price-current">${priceText}</span></div>
            </div>
          `;
          grid.appendChild(card);
        });
        // re-wire quick add events for new nodes
        updateCartUI();
        // wire preview buttons
        document.querySelectorAll('.product-preview').forEach(btn => btn.addEventListener('click', (e) => {
          const p = JSON.parse(btn.getAttribute('data-product'));
          openProductModal(p);
        }));
      }
    } catch (err) {
      console.warn('Could not load products', err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
  });

})();
