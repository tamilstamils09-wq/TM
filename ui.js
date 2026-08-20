/**
 * Velvet & Cocoa - UI Interactivity, Modals, Forms, Toasts, and Mobile Navigation
 */

class UIManager {
  constructor() {
    this.quickViewQty = 1;
    this.activeQuickViewProduct = null;
  }

  init() {
    this.setupEventListeners();
    this.setupScrollSpy();
    this.setupAccordion();
  }

  // Toast Notification Engine
  showToast(message, type = "info", duration = 3500) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-pill toast-${type}`;

    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    if (type === "error") iconName = "alert-circle";
    if (type === "warning") iconName = "alert-triangle";

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="toast-icon"></i>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">×</button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons({ root: toast });

    // Animate in
    setTimeout(() => toast.classList.add("show"), 10);

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // Quick View Sensory Modal
  openQuickView(productId) {
    const product = CHOCOLATE_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    this.activeQuickViewProduct = product;
    this.quickViewQty = 1;

    const modal = document.getElementById("quickViewModal");
    const container = document.getElementById("quickViewContent");
    if (!modal || !container) return;

    const formattedPrice = window.cart ? window.cart.formatPrice(product.price) : `$${product.price.toFixed(2)}`;
    const formattedOriginal = product.originalPrice && window.cart ? window.cart.formatPrice(product.originalPrice) : null;

    container.innerHTML = `
      <div class="quickview-grid">
        <!-- Visual Column -->
        <div class="quickview-visual-col">
          <div class="quickview-img-frame">
            <img src="${product.image}" alt="${product.name}" class="quickview-main-img" />
            <span class="quickview-origin-tag">${product.flag} ${product.origin}</span>
            <span class="quickview-cocoa-tag">${product.cocoaPercentage}% CACAO</span>
          </div>
          <div class="quickview-badges-strip">
            ${product.dietary.map(d => `<span class="quickview-diet-pill"><i data-lucide="check"></i> ${d}</span>`).join('')}
          </div>
        </div>

        <!-- Details Column -->
        <div class="quickview-info-col">
          <div class="quickview-header">
            <span class="quickview-category">${product.categoryLabel}</span>
            <div class="quickview-rating">
              <i data-lucide="star" class="star-filled"></i>
              <strong>${product.rating.toFixed(1)}</strong>
              <span>(${product.reviewsCount} sommelier reviews)</span>
            </div>
          </div>

          <h2 class="quickview-title">${product.name}</h2>

          <div class="quickview-pricing">
            <span class="quickview-price">${formattedPrice}</span>
            ${formattedOriginal ? `<span class="quickview-orig-price">${formattedOriginal}</span>` : ''}
            <span class="quickview-weight">• ${product.weight}</span>
          </div>

          <p class="quickview-desc">${product.description}</p>

          <!-- Sensory Profile Radar / Notes -->
          <div class="quickview-sensory-box">
            <h4><i data-lucide="sparkles"></i> Sensory Flavor Profile</h4>
            <div class="tasting-radar-tags">
              ${product.tastingNotes.map(n => `<span class="radar-tag">✨ ${n}</span>`).join('')}
            </div>
          </div>

          <!-- Master Pairings -->
          <div class="quickview-pairings-box">
            <h4><i data-lucide="wine"></i> Recommended Sommelier Pairings</h4>
            <p class="pairings-text">
              ${product.cocoaPercentage >= 75 
                ? "Pairs exquisitely with single-malt peated Scotch, dark roast espresso, or vintage Port wine."
                : "Pairs magnificently with Champagne, roasted pour-over coffee, Earl Grey tea, or fresh berries."}
            </p>
          </div>

          <!-- Quantity Selector & Add Button -->
          <div class="quickview-actions-bar">
            <div class="card-qty-stepper">
              <button class="card-qty-btn" onclick="window.ui.adjustQuickViewQty(-1)" aria-label="Decrease quantity">−</button>
              <span class="card-qty-display" id="quickViewQtyDisplay">1</span>
              <button class="card-qty-btn" onclick="window.ui.adjustQuickViewQty(1)" aria-label="Increase quantity">+</button>
            </div>

            <button class="btn-primary flex-1" onclick="window.ui.addQuickViewItemToCart()">
              <i data-lucide="shopping-bag"></i>
              <span>Add to TM Sweets Bag</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    if (window.lucide) window.lucide.createIcons();
  }

  adjustQuickViewQty(delta) {
    this.quickViewQty = Math.max(1, this.quickViewQty + delta);
    const display = document.getElementById("quickViewQtyDisplay");
    if (display) display.textContent = this.quickViewQty;
  }

  addQuickViewItemToCart() {
    if (!this.activeQuickViewProduct) return;
    window.cart.addItem(this.activeQuickViewProduct.id, this.quickViewQty);
    this.closeQuickView();
  }

  closeQuickView() {
    const modal = document.getElementById("quickViewModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // Mobile Navigation Drawer
  toggleMobileNav(forceState) {
    const drawer = document.getElementById("mobileNavDrawer");
    const overlay = document.getElementById("mobileNavOverlay");
    const hamburger = document.getElementById("mobileMenuToggleBtn");

    const shouldOpen = forceState !== undefined ? forceState : !drawer.classList.contains("active");

    if (shouldOpen) {
      drawer.classList.add("active");
      if (overlay) overlay.classList.add("active");
      if (hamburger) hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    } else {
      drawer.classList.remove("active");
      if (overlay) overlay.classList.remove("active");
      if (hamburger) hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  }

  // Accordion Logic
  setupAccordion() {
    document.querySelectorAll(".faq-item-header").forEach(header => {
      header.addEventListener("click", () => {
        const item = header.parentElement;
        const isActive = item.classList.contains("active");

        // Close other items
        document.querySelectorAll(".faq-item").forEach(other => {
          if (other !== item) other.classList.remove("active");
        });

        item.classList.toggle("active", !isActive);
      });
    });
  }

  // Event Listeners Setup
  setupEventListeners() {
    // 1. Mobile Menu Button
    const menuBtn = document.getElementById("mobileMenuToggleBtn");
    if (menuBtn) {
      menuBtn.addEventListener("click", () => this.toggleMobileNav());
    }

    const mobileOverlay = document.getElementById("mobileNavOverlay");
    if (mobileOverlay) {
      mobileOverlay.addEventListener("click", () => this.toggleMobileNav(false));
    }

    const mobileCloseBtn = document.getElementById("closeMobileNavBtn");
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener("click", () => this.toggleMobileNav(false));
    }

    // Close mobile nav when clicking any nav link
    document.querySelectorAll(".mobile-nav-link").forEach(link => {
      link.addEventListener("click", () => this.toggleMobileNav(false));
    });

    // 2. Cart Open/Close Buttons
    const openCartBtn = document.getElementById("openCartBtn");
    if (openCartBtn) {
      openCartBtn.addEventListener("click", () => window.cart.openDrawer());
    }

    const mobileOpenCartBtn = document.getElementById("mobileOpenCartBtn");
    if (mobileOpenCartBtn) {
      mobileOpenCartBtn.addEventListener("click", () => {
        this.toggleMobileNav(false);
        window.cart.openDrawer();
      });
    }

    const closeCartBtn = document.getElementById("closeCartDrawerBtn");
    if (closeCartBtn) {
      closeCartBtn.addEventListener("click", () => window.cart.closeDrawer());
    }

    const cartOverlay = document.getElementById("cartDrawerOverlay");
    if (cartOverlay) {
      cartOverlay.addEventListener("click", (e) => {
        if (e.target === cartOverlay) {
          window.cart.closeDrawer();
        }
      });
    }

    // 3. Currency Selector
    const currencySelect = document.getElementById("currencySelector");
    if (currencySelect) {
      currencySelect.value = window.cart.activeCurrency;
      currencySelect.addEventListener("change", (e) => {
        window.cart.setCurrency(e.target.value);
      });
    }

    // 4. Promo Code Form
    const promoForm = document.getElementById("cartPromoForm");
    if (promoForm) {
      promoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("promoCodeInput");
        if (input && input.value) {
          window.cart.applyPromoCode(input.value);
          input.value = "";
        }
      });
    }

    // 5. Checkout Modal Triggers
    const checkoutBtn = document.getElementById("proceedToCheckoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => window.cart.openCheckout());
    }

    const closeCheckoutBtn = document.getElementById("closeCheckoutModalBtn");
    if (closeCheckoutBtn) {
      closeCheckoutBtn.addEventListener("click", () => window.cart.closeCheckout());
    }

    const checkoutOverlay = document.getElementById("checkoutModal");
    if (checkoutOverlay) {
      checkoutOverlay.addEventListener("click", (e) => {
        if (e.target === checkoutOverlay) window.cart.closeCheckout();
      });
    }

    // 6. Checkout Form Submission
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(checkoutForm);
        const orderInfo = {
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          address: formData.get("address"),
          city: formData.get("city"),
          zip: formData.get("zip")
        };
        window.cart.completeOrder(orderInfo);
        checkoutForm.reset();
      });
    }

    // 7. Order Confirmation Close
    const closeConfirmBtn = document.getElementById("closeConfirmationModalBtn");
    if (closeConfirmBtn) {
      closeConfirmBtn.addEventListener("click", () => {
        const modal = document.getElementById("orderConfirmationModal");
        if (modal) modal.classList.remove("active");
        document.body.style.overflow = "";
      });
    }

    // 8. Search Input Filter
    const searchInput = document.getElementById("productSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        window.productManager.searchQuery = e.target.value;
        window.productManager.applyFilters();
      });
    }

    const clearSearchBtn = document.getElementById("clearSearchBtn");
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        window.productManager.searchQuery = "";
        window.productManager.applyFilters();
      });
    }

    // 9. Category Tabs
    document.querySelectorAll(".cat-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        window.productManager.activeCategory = btn.dataset.category;
        window.productManager.applyFilters();
      });
    });

    // 10. Cocoa Slider Filter
    const cocoaSlider = document.getElementById("cocoaFilterSlider");
    const cocoaValDisplay = document.getElementById("cocoaFilterVal");
    if (cocoaSlider) {
      cocoaSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        window.productManager.minCocoa = val;
        if (cocoaValDisplay) cocoaValDisplay.textContent = `${val}%+ Cacao`;
        window.productManager.applyFilters();
      });
    }

    // 11. Sort Select
    const sortSelect = document.getElementById("productSortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        window.productManager.activeSort = e.target.value;
        window.productManager.applyFilters();
      });
    }

    // 12. Dietary Checkboxes
    document.querySelectorAll(".dietary-check-box").forEach(cb => {
      cb.addEventListener("change", () => {
        const checkedValues = Array.from(document.querySelectorAll(".dietary-check-box:checked")).map(c => c.value);
        window.productManager.activeDietary = checkedValues;
        window.productManager.applyFilters();
      });
    });

    // 13. Quick View Modal Close
    const closeQuickViewBtn = document.getElementById("closeQuickViewModalBtn");
    if (closeQuickViewBtn) {
      closeQuickViewBtn.addEventListener("click", () => this.closeQuickView());
    }

    const quickViewModal = document.getElementById("quickViewModal");
    if (quickViewModal) {
      quickViewModal.addEventListener("click", (e) => {
        if (e.target === quickViewModal) this.closeQuickView();
      });
    }

    // 14. Contact Form Submission
    const contactForm = document.getElementById("boutiqueContactForm");
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("contactName");
        const emailInput = document.getElementById("contactEmail");
        const subjectInput = document.getElementById("contactSubject");
        const messageInput = document.getElementById("contactMessage");

        if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
          this.showToast("Please fill in all required fields.", "error");
          return;
        }

        // Simulate sending
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const origText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Sending message...`;
        submitBtn.disabled = true;

        setTimeout(() => {
          submitBtn.innerHTML = origText;
          submitBtn.disabled = false;
          contactForm.reset();
          this.showToast("Thank you! Your message has been sent to TM Sweets Concierge. ✉️", "success");
          if (window.lucide) window.lucide.createIcons();
        }, 800);
      });
    }

    // 15. Newsletter Form Submission
    const newsletterForm = document.getElementById("footerNewsletterForm");
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const emailInput = document.getElementById("newsletterEmailInput");
        if (emailInput && emailInput.value) {
          this.showToast(`✨ Subscribed to TM Sweets Gazette! Use promo code "TMSWEETS" for 20% off your order.`, "success", 5000);
          emailInput.value = "";
        }
      });
    }

    // 16. Scroll to Top Button
    const scrollTopBtn = document.getElementById("scrollToTopBtn");
    if (scrollTopBtn) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 400) {
          scrollTopBtn.classList.add("visible");
        } else {
          scrollTopBtn.classList.remove("visible");
        }
      });

      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  setupScrollSpy() {
    // Header shadow on scroll
    const header = document.querySelector(".site-header");
    window.addEventListener("scroll", () => {
      if (window.scrollY > 30) {
        header?.classList.add("scrolled");
      } else {
        header?.classList.remove("scrolled");
      }
    });
  }
}

// Instantiate Global UI Manager
window.ui = new UIManager();
