/**
 * Anya Bikini — Main Frontend Script
 *
 * Architecture: IIFE, no eval(), no unsafe-inline handlers.
 * All DOM event wiring uses addEventListener.
 * Products stored in a module-scoped Map (productsMap) keyed by ID
 * so Add-to-Cart handlers retrieve data without JSON.parse(getAttribute()).
 *
 * CSP: script-src 'self' https://js.stripe.com
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     Constants
  ───────────────────────────────────────────────────────────── */
  const CART_KEY        = 'anya_cart';
  const TOAST_DURATION  = 4000;   // ms
  const API_BASE        = '/api';

  /* ─────────────────────────────────────────────────────────────
     State
  ───────────────────────────────────────────────────────────── */
  /** @type {Map<string, Object>} keyed by product id */
  const productsMap = new Map();

  /** Currently active category filter */
  let activeCategory = 'All';

  /** Stripe instance and Elements (initialised lazily) */
  let stripeInstance  = null;
  let stripeElements  = null;
  let cardElement     = null;

  /* ─────────────────────────────────────────────────────────────
     Toast Notifications
  ───────────────────────────────────────────────────────────── */
  const toastContainer = document.getElementById('toast-container');

  /**
   * Display a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} [type='info']
   */
  function showToast(message, type) {
    if (!toastContainer) return;
    const safeType = ['success', 'error', 'info', 'warning'].includes(type) ? type : 'info';

    const icons = {
      success: '<polyline points="20 6 9 17 4 12"/>',
      error:   '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8"  x2="12.01" y2="8"/>',
    };

    const toast = document.createElement('div');
    toast.className = 'toast ' + safeType;
    toast.setAttribute('role', 'status');

    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.setAttribute('aria-hidden', 'true');
    svgIcon.classList.add('toast-icon');
    svgIcon.innerHTML = icons[safeType];

    const msgEl = document.createElement('span');
    msgEl.className = 'toast-msg';
    msgEl.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => removeToast(toast));

    toast.appendChild(svgIcon);
    toast.appendChild(msgEl);
    toast.appendChild(closeBtn);
    toastContainer.appendChild(toast);

    const timer = setTimeout(() => removeToast(toast), TOAST_DURATION);
    toast._timer = timer;
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._timer);
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // Fallback in case animation doesn't fire
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
  }

  // Expose showToast globally so other scripts (e.g. payment callbacks) can use it.
  window.showToast = showToast;

  /* ─────────────────────────────────────────────────────────────
     Cart — localStorage helpers
  ───────────────────────────────────────────────────────────── */
  /**
   * @returns {Array<{id:string, name:string, price:number, image:string, quantity:number}>}
   */
  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * @param {Array} cart
   */
  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Could not save cart:', err);
    }
  }

  /**
   * Add a product to the cart (increment quantity if already present).
   * @param {{ id:string, name:string, price:number, image:string }} product
   */
  function addToCartItem(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id:       product.id,
        name:     product.name,
        price:    product.price,
        image:    product.image || '',
        quantity: 1,
      });
    }
    saveCart(cart);
    updateCartUI();
    showToast(product.name + ' added to cart', 'success');
  }

  /**
   * Update the cart badge count, item list, and totals.
   */
  function updateCartUI() {
    const cart        = getCart();
    const totalItems  = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const totalAmount = cart.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

    // Badge
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = String(totalItems);
      badge.style.display = totalItems > 0 ? '' : 'none';
    }

    // Total price
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = '$' + totalAmount.toFixed(2);

    // Footer visibility
    const footer = document.getElementById('cart-footer');
    if (footer) footer.hidden = cart.length === 0;

    // Item list
    const listEl = document.getElementById('cart-items-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (cart.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'cart-empty';
      // SVG shopping bag
      const emptyIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      emptyIcon.setAttribute('viewBox', '0 0 24 24');
      emptyIcon.setAttribute('aria-hidden', 'true');
      emptyIcon.innerHTML =
        '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>' +
        '<line x1="3" y1="6" x2="21" y2="6"/>' +
        '<path d="M16 10a4 4 0 0 1-8 0"/>';
      const emptyText = document.createElement('p');
      emptyText.textContent = 'Your cart is empty';
      empty.appendChild(emptyIcon);
      empty.appendChild(emptyText);
      listEl.appendChild(empty);
      return;
    }

    cart.forEach(item => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.setAttribute('role', 'listitem');

      // Image
      const imgWrap = document.createElement('div');
      imgWrap.className = 'cart-item-img';
      if (item.image) {
        const img = document.createElement('img');
        img.src     = item.image;
        img.alt     = item.name;
        img.loading = 'lazy';
        imgWrap.appendChild(img);
      }

      // Details
      const details = document.createElement('div');
      details.className = 'cart-item-details';

      const nameEl = document.createElement('p');
      nameEl.className   = 'cart-item-name';
      nameEl.textContent = item.name;

      const priceEl = document.createElement('p');
      priceEl.className   = 'cart-item-price';
      priceEl.textContent = '$' + ((item.price || 0) * (item.quantity || 1)).toFixed(2);

      // Quantity controls
      const qtyWrap = document.createElement('div');
      qtyWrap.className = 'cart-item-qty';

      const decBtn = document.createElement('button');
      decBtn.className    = 'qty-btn';
      decBtn.textContent  = '−';
      decBtn.setAttribute('aria-label', 'Decrease quantity of ' + item.name);
      decBtn.addEventListener('click', () => {
        changeItemQty(item.id, -1);
      });

      const qtyVal = document.createElement('span');
      qtyVal.className   = 'qty-value';
      qtyVal.textContent = String(item.quantity || 1);

      const incBtn = document.createElement('button');
      incBtn.className    = 'qty-btn';
      incBtn.textContent  = '+';
      incBtn.setAttribute('aria-label', 'Increase quantity of ' + item.name);
      incBtn.addEventListener('click', () => {
        changeItemQty(item.id, 1);
      });

      qtyWrap.appendChild(decBtn);
      qtyWrap.appendChild(qtyVal);
      qtyWrap.appendChild(incBtn);

      // Remove
      const removeBtn = document.createElement('button');
      removeBtn.className   = 'cart-item-remove';
      removeBtn.textContent = 'Remove';
      removeBtn.setAttribute('aria-label', 'Remove ' + item.name + ' from cart');
      removeBtn.addEventListener('click', () => {
        removeFromCart(item.id);
      });

      details.appendChild(nameEl);
      details.appendChild(priceEl);
      details.appendChild(qtyWrap);
      details.appendChild(removeBtn);

      li.appendChild(imgWrap);
      li.appendChild(details);
      listEl.appendChild(li);
    });
  }

  /**
   * Change the quantity of a cart item by delta; remove if qty drops to 0.
   * @param {string} productId
   * @param {number} delta
   */
  function changeItemQty(productId, delta) {
    const cart = getCart();
    const idx  = cart.findIndex(i => i.id === productId);
    if (idx === -1) return;
    cart[idx].quantity = (cart[idx].quantity || 1) + delta;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    saveCart(cart);
    updateCartUI();
  }

  /**
   * Remove an item from cart completely.
   * @param {string} productId
   */
  function removeFromCart(productId) {
    const cart = getCart().filter(i => i.id !== productId);
    saveCart(cart);
    updateCartUI();
  }

  /* ─────────────────────────────────────────────────────────────
     Cart Drawer — open / close
  ───────────────────────────────────────────────────────────── */
  function openCart() {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    const cartBtn = document.getElementById('cart-btn');
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  }

  function closeCart() {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    const cartBtn = document.getElementById('cart-btn');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
    if (!document.querySelector('.modal-backdrop.open')) {
      document.body.classList.remove('no-scroll');
    }
  }

  function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('open')) closeCart();
    else openCart();
  }

  /* ─────────────────────────────────────────────────────────────
     User Account UI
  ───────────────────────────────────────────────────────────── */
  /**
   * Hit /api/profile; if 200 → mark user as logged in, else logged out.
   * @returns {Promise<{id:number, email:string, name:string}|null>}
   */
  async function fetchProfile() {
    try {
      const res = await fetch(API_BASE + '/profile', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  }

  /**
   * Update the account button appearance based on auth state.
   */
  async function updateUserAccountUI() {
    const btn = document.getElementById('user-account-btn');
    if (!btn) return;

    const user = await fetchProfile();
    if (user) {
      btn.classList.add('logged-in');
      btn.setAttribute('title', 'Signed in as ' + (user.name || user.email));
      showAccountPanel(user);
    } else {
      btn.classList.remove('logged-in');
      btn.removeAttribute('title');
      hideAccountPanel();
    }
  }

  function showAccountPanel(user) {
    const loginPanel    = document.getElementById('panel-login');
    const registerPanel = document.getElementById('panel-register');
    const accountPanel  = document.getElementById('panel-account');
    const welcomeEl     = document.getElementById('account-welcome');
    const tabsEl        = document.querySelector('.auth-tabs');

    if (loginPanel)    loginPanel.classList.remove('active');
    if (registerPanel) registerPanel.classList.remove('active');
    if (tabsEl)        tabsEl.style.display = 'none';
    if (accountPanel)  accountPanel.hidden  = false;
    if (welcomeEl)     welcomeEl.textContent = 'Welcome back, ' + (user.name || user.email) + ' ✨';
  }

  function hideAccountPanel() {
    const loginPanel    = document.getElementById('panel-login');
    const accountPanel  = document.getElementById('panel-account');
    const tabsEl        = document.querySelector('.auth-tabs');

    if (accountPanel) accountPanel.hidden = true;
    if (tabsEl)       tabsEl.style.display = '';
    if (loginPanel)   loginPanel.classList.add('active');
  }

  /* ─────────────────────────────────────────────────────────────
     Auth Modal
  ───────────────────────────────────────────────────────────── */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    // Focus first focusable element
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.cart-drawer.open') && !document.querySelector('.modal-backdrop.open')) {
      document.body.classList.remove('no-scroll');
    }
  }

  function switchAuthTab(activeId) {
    const loginPanel    = document.getElementById('panel-login');
    const registerPanel = document.getElementById('panel-register');
    const tabLogin      = document.getElementById('tab-login');
    const tabRegister   = document.getElementById('tab-register');

    const showLogin = activeId === 'login';

    if (loginPanel)    loginPanel.classList.toggle('active', showLogin);
    if (registerPanel) registerPanel.classList.toggle('active', !showLogin);
    if (tabLogin) {
      tabLogin.classList.toggle('active', showLogin);
      tabLogin.setAttribute('aria-selected', String(showLogin));
    }
    if (tabRegister) {
      tabRegister.classList.toggle('active', !showLogin);
      tabRegister.setAttribute('aria-selected', String(!showLogin));
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Product Loading & Rendering
  ───────────────────────────────────────────────────────────── */
  async function loadProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    try {
      const res  = await fetch(API_BASE + '/products');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const products = (data.products || []).filter(p => p.published !== false);

      productsMap.clear();
      products.forEach(p => productsMap.set(String(p.id), p));

      grid.setAttribute('aria-busy', 'false');
      renderProducts(activeCategory);
    } catch (err) {
      console.error('Failed to load products:', err);
      if (grid) {
        grid.setAttribute('aria-busy', 'false');
        const errEl = document.createElement('div');
        errEl.className   = 'product-grid-empty';
        errEl.textContent = 'Could not load products. Please try again later.';
        grid.innerHTML    = '';
        grid.appendChild(errEl);
      }
    }
  }

  /**
   * Render the product grid, optionally filtered by category.
   * @param {string} category
   */
  function renderProducts(category) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const allProducts = Array.from(productsMap.values());
    const filtered    = category === 'All'
      ? allProducts
      : allProducts.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());

    grid.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className   = 'product-grid-empty';
      empty.textContent = 'No products in this category yet.';
      grid.appendChild(empty);
      return;
    }

    filtered.forEach((product, index) => {
      const card = buildProductCard(product, index);
      grid.appendChild(card);
    });
  }

  /**
   * Build a single product card element.
   * @param {Object} product
   * @param {number} index  Used for reveal animation stagger.
   * @returns {HTMLElement}
   */
  function buildProductCard(product, index) {
    const id    = String(product.id);
    const name  = product.name  || 'Unnamed Product';
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    const image = product.image || '';
    const cat   = product.category || '';

    const article = document.createElement('article');
    article.className = 'product-card reveal';
    article.setAttribute('role', 'listitem');
    article.setAttribute('aria-label', name);
    // Stagger reveal delay (cycle through 0–3)
    if (index > 0 && index % 4 !== 0) {
      article.classList.add('reveal-delay-' + (index % 4));
    }
    article.dataset.productId = id;

    // --- Image wrapper ---
    const imgWrap = document.createElement('div');
    imgWrap.className = 'product-image-wrap';

    const overlay = document.createElement('div');
    overlay.className    = 'product-image-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    if (image) {
      const img    = document.createElement('img');
      img.src      = image;
      img.alt      = name;
      img.loading  = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        img.style.display = 'none';
      });
      imgWrap.appendChild(img);
    }

    imgWrap.appendChild(overlay);

    // Hover Add to Cart button (hidden on touch devices via CSS)
    const addHoverBtn = document.createElement('button');
    addHoverBtn.className = 'product-add-btn';
    addHoverBtn.textContent = 'Add to Cart';
    addHoverBtn.dataset.productId = id;
    addHoverBtn.setAttribute('aria-label', 'Add ' + name + ' to cart');
    addHoverBtn.addEventListener('click', handleAddToCart);

    imgWrap.appendChild(addHoverBtn);

    // --- Card body ---
    const info = document.createElement('div');
    info.className = 'product-info';

    if (cat) {
      const catEl = document.createElement('p');
      catEl.className   = 'product-category';
      catEl.textContent = cat;
      info.appendChild(catEl);
    }

    const nameEl = document.createElement('h3');
    nameEl.className   = 'product-name';
    nameEl.textContent = name;

    const priceEl = document.createElement('p');
    priceEl.className   = 'product-price';
    priceEl.textContent = '$' + price.toFixed(2);

    // Always-visible button for touch devices
    const addMobileBtn = document.createElement('button');
    addMobileBtn.className = 'product-add-mobile';
    addMobileBtn.textContent = 'Add to Cart';
    addMobileBtn.dataset.productId = id;
    addMobileBtn.setAttribute('aria-label', 'Add ' + name + ' to cart');
    addMobileBtn.addEventListener('click', handleAddToCart);

    info.appendChild(nameEl);
    info.appendChild(priceEl);
    info.appendChild(addMobileBtn);

    article.appendChild(imgWrap);
    article.appendChild(info);

    return article;
  }

  /**
   * Shared handler for "Add to Cart" buttons.
   * Reads the product from productsMap using the data-product-id attribute.
   * @param {Event} evt
   */
  function handleAddToCart(evt) {
    const btn       = evt.currentTarget;
    const productId = btn.dataset.productId;
    if (!productId) return;

    const product = productsMap.get(productId);
    if (!product) {
      showToast('Product not found.', 'error');
      return;
    }

    addToCartItem({
      id:    String(product.id),
      name:  product.name,
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
      image: product.image || '',
    });

    // Brief visual feedback on the button
    const originalText  = btn.textContent;
    btn.textContent     = '✓ Added';
    btn.disabled        = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled    = false;
    }, 1200);
  }

  /* ─────────────────────────────────────────────────────────────
     Category Filters
  ───────────────────────────────────────────────────────────── */
  function initCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    container.addEventListener('click', evt => {
      const btn = evt.target.closest('.filter-btn');
      if (!btn) return;

      const category = btn.dataset.category || 'All';
      activeCategory = category;

      container.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });

      renderProducts(category);
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Instagram Feed
  ───────────────────────────────────────────────────────────── */
  async function loadInstagramFeed() {
    const feedEl = document.getElementById('instagram-feed');
    if (!feedEl) return;

    try {
      const res  = await fetch(API_BASE + '/instagram');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const posts = (data.data || []).slice(0, 12);

      if (posts.length === 0) throw new Error('No posts');

      feedEl.innerHTML = '';
      posts.forEach(post => {
        const a = document.createElement('a');
        a.href      = post.permalink || '#';
        a.target    = '_blank';
        a.rel       = 'noopener noreferrer';
        a.className = 'instagram-item';
        a.setAttribute('role', 'listitem');
        a.setAttribute('aria-label', 'View on Instagram');

        const imgUrl = post.media_url || post.thumbnail_url;
        if (imgUrl) {
          const img    = document.createElement('img');
          img.src      = imgUrl;
          img.alt      = (post.caption || '').slice(0, 80) || 'Instagram post';
          img.loading  = 'lazy';
          img.decoding = 'async';
          a.appendChild(img);
        }

        const ov = document.createElement('div');
        ov.className    = 'instagram-item-overlay';
        ov.setAttribute('aria-hidden', 'true');
        const igSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        igSvg.setAttribute('viewBox', '0 0 24 24');
        igSvg.innerHTML =
          '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>' +
          '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>' +
          '<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>';
        ov.appendChild(igSvg);
        a.appendChild(ov);

        feedEl.appendChild(a);
      });
    } catch {
      feedEl.innerHTML = '<p class="instagram-placeholder">Follow us on Instagram <a href="https://instagram.com/anyabikini" target="_blank" rel="noopener noreferrer">@anyabikini</a></p>';
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Newsletter Form
  ───────────────────────────────────────────────────────────── */
  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async evt => {
      evt.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const submitBtn  = form.querySelector('[type="submit"]');
      if (!emailInput) return;

      const email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'warning');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled    = true;
        submitBtn.textContent = 'Subscribing…';
      }

      try {
        const res = await fetch(API_BASE + '/newsletter', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email }),
        });
        const json = await res.json().catch(() => ({}));

        if (res.ok && json.ok !== false) {
          showToast('You\'re subscribed! 🌊', 'success');
          emailInput.value = '';
        } else {
          showToast(json.error || 'Subscription failed. Please try again.', 'error');
        }
      } catch {
        // If the endpoint doesn't exist yet, treat as graceful success in dev
        showToast('Thanks for subscribing! 🌊', 'success');
        emailInput.value = '';
      } finally {
        if (submitBtn) {
          submitBtn.disabled    = false;
          submitBtn.textContent = 'Subscribe';
        }
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Auth Forms — Login & Register
  ───────────────────────────────────────────────────────────── */
  function initAuthForms() {
    // Login form
    const loginForm = document.getElementById('panel-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async evt => {
        evt.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passInput  = document.getElementById('login-password');
        const errorEl    = document.getElementById('login-error');
        const submitBtn  = loginForm.querySelector('[type="submit"]');

        if (errorEl) errorEl.textContent = '';

        const email    = emailInput ? emailInput.value.trim() : '';
        const password = passInput  ? passInput.value         : '';

        if (!email || !password) {
          if (errorEl) errorEl.textContent = 'Email and password are required.';
          return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Logging in…'; }

        try {
          const res  = await fetch(API_BASE + '/login', {
            method:      'POST',
            headers:     { 'Content-Type': 'application/json' },
            credentials: 'include',
            body:        JSON.stringify({ email, password }),
          });
          const json = await res.json();

          if (res.ok && json.ok) {
            showToast('Welcome back! 👋', 'success');
            closeModal('auth-modal');
            await updateUserAccountUI();
          } else {
            if (errorEl) errorEl.textContent = json.error || 'Login failed. Please try again.';
          }
        } catch {
          if (errorEl) errorEl.textContent = 'Network error. Please try again.';
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Log In'; }
        }
      });
    }

    // Register form
    const registerForm = document.getElementById('panel-register');
    if (registerForm) {
      registerForm.addEventListener('submit', async evt => {
        evt.preventDefault();
        const emailInput = document.getElementById('register-email');
        const nameInput  = document.getElementById('register-name');
        const passInput  = document.getElementById('register-password');
        const errorEl    = document.getElementById('register-error');
        const submitBtn  = registerForm.querySelector('[type="submit"]');

        if (errorEl) errorEl.textContent = '';

        const email    = emailInput ? emailInput.value.trim() : '';
        const name     = nameInput  ? nameInput.value.trim()  : '';
        const password = passInput  ? passInput.value         : '';

        if (!email || !password) {
          if (errorEl) errorEl.textContent = 'Email and password are required.';
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
          return;
        }

        if (password.length < 6) {
          if (errorEl) errorEl.textContent = 'Password must be at least 6 characters.';
          return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating account…'; }

        try {
          const res  = await fetch(API_BASE + '/register', {
            method:      'POST',
            headers:     { 'Content-Type': 'application/json' },
            credentials: 'include',
            body:        JSON.stringify({ email, password, name: name || undefined }),
          });
          const json = await res.json();

          if (res.ok && json.ok) {
            showToast('Account created! Welcome to Anya Bikini 🌺', 'success');
            closeModal('auth-modal');
            await updateUserAccountUI();
          } else {
            if (errorEl) errorEl.textContent = json.error || 'Registration failed. Please try again.';
          }
        } catch {
          if (errorEl) errorEl.textContent = 'Network error. Please try again.';
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account'; }
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch(API_BASE + '/logout', { method: 'POST', credentials: 'include' });
        } catch { /* ignore */ }
        showToast('Signed out successfully.', 'info');
        closeModal('auth-modal');
        await updateUserAccountUI();
      });
    }

    // Tab switching
    const tabLogin    = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (tabLogin)    tabLogin.addEventListener('click', () => switchAuthTab('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => switchAuthTab('register'));

    // Cross-link buttons
    const switchToReg   = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');

    if (switchToReg)   switchToReg.addEventListener('click',   () => switchAuthTab('register'));
    if (switchToLogin) switchToLogin.addEventListener('click', () => switchAuthTab('login'));
  }

  /* ─────────────────────────────────────────────────────────────
     Checkout Flow
  ───────────────────────────────────────────────────────────── */
  async function handleCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
      showToast('Your cart is empty.', 'warning');
      return;
    }

    const items = cart.map(i => ({
      name:     i.name,
      price:    i.price,
      quantity: i.quantity || 1,
    }));

    // Prefer Stripe Checkout Session redirect (simplest, most secure)
    try {
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) { checkoutBtn.disabled = true; checkoutBtn.textContent = 'Redirecting…'; }

      const res = await fetch(API_BASE + '/create-checkout-session', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          items,
          success_url: window.location.origin + '/?checkout=success',
          cancel_url:  window.location.origin + '/?checkout=canceled',
        }),
      });

      const json = await res.json();

      if (res.ok && json.url) {
        // Stripe redirects the browser to the hosted checkout page
        window.location.href = json.url;
        return;
      }

      // If session creation failed (Stripe not configured), fall back to
      // the in-page Stripe Elements modal.
      if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = 'Checkout'; }

      if (json.error && json.error.includes('not configured')) {
        showToast('Payment not yet configured. Please contact us.', 'info');
      } else {
        await openCheckoutModal(items);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('Could not start checkout. Please try again.', 'error');
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = 'Checkout'; }
    }
  }

  /**
   * Fallback in-page Stripe Elements checkout modal.
   * @param {Array} items
   */
  async function openCheckoutModal(items) {
    const modal      = document.getElementById('checkout-modal');
    const summaryEl  = document.getElementById('checkout-summary');
    const errorEl    = document.getElementById('checkout-error');
    const payBtn     = document.getElementById('stripe-pay-btn');
    const elementsEl = document.getElementById('stripe-elements-container');

    if (summaryEl) {
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
      summaryEl.textContent = items.length + ' item(s) — Total: $' + total.toFixed(2);
    }
    if (errorEl) errorEl.textContent = '';

    openModal('checkout-modal');
    closeCart();

    // Fetch Stripe publishable key
    let publishableKey = '';
    try {
      const cfgRes = await fetch(API_BASE + '/config');
      const cfg    = await cfgRes.json();
      publishableKey = cfg.stripePublishableKey || '';
    } catch { /* ignore */ }

    if (!publishableKey) {
      if (elementsEl) elementsEl.textContent = 'Stripe is not configured on this server.';
      if (payBtn)     payBtn.style.display = 'none';
      return;
    }

    // Initialise Stripe Elements once
    if (!stripeInstance) {
      stripeInstance = window.Stripe ? window.Stripe(publishableKey) : null;
    }

    if (!stripeInstance) {
      if (elementsEl) elementsEl.textContent = 'Could not load Stripe.';
      return;
    }

    // Create PaymentIntent
    let clientSecret = '';
    try {
      const piRes  = await fetch(API_BASE + '/create-payment-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items }),
      });
      const piJson = await piRes.json();
      clientSecret = piJson.clientSecret || '';
    } catch { /* ignore */ }

    if (!clientSecret) {
      if (elementsEl) elementsEl.textContent = 'Could not create payment intent.';
      return;
    }

    if (elementsEl) elementsEl.innerHTML = '';
    stripeElements = stripeInstance.elements();
    cardElement    = stripeElements.create('card', {
      style: {
        base: {
          fontFamily: "'Montserrat', sans-serif",
          fontSize:   '16px',
          color:      '#2c2420',
        },
      },
    });
    cardElement.mount(elementsEl);

    if (payBtn) {
      payBtn.style.display = '';
      // Remove any previous listener clone trick
      const newBtn = payBtn.cloneNode(true);
      payBtn.parentNode.replaceChild(newBtn, payBtn);

      newBtn.addEventListener('click', async () => {
        if (errorEl) errorEl.textContent = '';
        newBtn.disabled    = true;
        newBtn.textContent = 'Processing…';

        const { error, paymentIntent } = await stripeInstance.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        });

        if (error) {
          if (errorEl) errorEl.textContent = error.message;
          newBtn.disabled    = false;
          newBtn.textContent = 'Pay Now';
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          showToast('Payment successful! Thank you for your order 🌴', 'success');
          saveCart([]);
          updateCartUI();
          closeModal('checkout-modal');
        }
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Navigation — scroll & mobile
  ───────────────────────────────────────────────────────────── */
  function initNav() {
    const nav = document.getElementById('site-nav');

    // Scroll shadow
    const onScroll = () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile hamburger
    const hamburger  = document.getElementById('nav-hamburger');
    const mobileNav  = document.getElementById('mobile-nav');
    const mobileClose = document.getElementById('mobile-nav-close');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');

    function openMobileNav() {
      if (!mobileNav) return;
      mobileNav.classList.add('open');
      document.body.classList.add('no-scroll');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    }
    function closeMobileNav() {
      if (!mobileNav) return;
      mobileNav.classList.remove('open');
      if (!document.querySelector('.modal-backdrop.open') && !document.querySelector('.cart-drawer.open')) {
        document.body.classList.remove('no-scroll');
      }
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    }

    if (hamburger)      hamburger.addEventListener('click', openMobileNav);
    if (mobileClose)    mobileClose.addEventListener('click', closeMobileNav);
    if (mobileOverlay)  mobileOverlay.addEventListener('click', closeMobileNav);

    // Close mobile nav on link click
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMobileNav);
      });
    }

    // Footer year
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ─────────────────────────────────────────────────────────────
     Scroll-reveal (IntersectionObserver)
  ───────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    if (!window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Re-observe when new cards are added to the grid
    const grid = document.getElementById('product-grid');
    if (grid) {
      const mutObs = new MutationObserver(() => {
        grid.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
      });
      mutObs.observe(grid, { childList: true });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Checkout success / cancel feedback from URL params
  ───────────────────────────────────────────────────────────── */
  function handleCheckoutReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    if (status === 'success') {
      showToast('Your order was placed successfully! Thank you 🌴', 'success');
      saveCart([]);
      updateCartUI();
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    } else if (status === 'canceled') {
      showToast('Checkout was cancelled.', 'info');
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Escape key closes modals / cart
  ───────────────────────────────────────────────────────────── */
  function initKeyboardHandlers() {
    document.addEventListener('keydown', evt => {
      if (evt.key !== 'Escape') return;

      const cart = document.getElementById('cart-drawer');
      if (cart && cart.classList.contains('open')) {
        closeCart();
        return;
      }

      const authModal = document.getElementById('auth-modal');
      if (authModal && authModal.classList.contains('open')) {
        closeModal('auth-modal');
        return;
      }

      const checkoutModal = document.getElementById('checkout-modal');
      if (checkoutModal && checkoutModal.classList.contains('open')) {
        closeModal('checkout-modal');
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Wire up top-level button click handlers
  ───────────────────────────────────────────────────────────── */
  function initButtonHandlers() {
    // Cart open
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', toggleCart);

    // Cart close
    const cartCloseBtn = document.getElementById('cart-close-btn');
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);

    // Cart overlay
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Checkout button (inside cart drawer)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

    // User account button
    const accountBtn = document.getElementById('user-account-btn');
    if (accountBtn) {
      accountBtn.addEventListener('click', async () => {
        await updateUserAccountUI();
        openModal('auth-modal');
      });
    }

    // Auth modal close
    const authClose = document.getElementById('auth-modal-close');
    if (authClose) authClose.addEventListener('click', () => closeModal('auth-modal'));

    // Auth modal backdrop click
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
      authModal.addEventListener('click', evt => {
        if (evt.target === authModal) closeModal('auth-modal');
      });
    }

    // Checkout modal close
    const checkoutClose = document.getElementById('checkout-modal-close');
    if (checkoutClose) checkoutClose.addEventListener('click', () => closeModal('checkout-modal'));

    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
      checkoutModal.addEventListener('click', evt => {
        if (evt.target === checkoutModal) closeModal('checkout-modal');
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Initialise everything
  ───────────────────────────────────────────────────────────── */
  async function init() {
    initNav();
    initButtonHandlers();
    initKeyboardHandlers();
    initCategoryFilters();
    initAuthForms();
    initNewsletterForm();
    initScrollReveal();

    // Non-blocking parallel loads
    await Promise.allSettled([
      loadProducts(),
      loadInstagramFeed(),
      updateUserAccountUI(),
    ]);

    handleCheckoutReturn();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
