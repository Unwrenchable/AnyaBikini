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

  // --- Wishlist ---
  document.querySelectorAll('.product-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const icon = btn.querySelector('svg');
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) {
        btn.style.background = 'var(--color-primary)';
        btn.style.color = 'white';
        showToast('♥ Added to wishlist');
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    });
  });

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
