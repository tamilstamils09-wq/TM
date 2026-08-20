/**
 * TM Sweets - Shopping Cart State & Business Logic
 * Handles cart items, quantities, promo codes, tax, shipping, dynamic totals, and checkout flow.
 */

class ShoppingCart {
  constructor() {
    this.storageKey = "tm_sweets_cart_v2";
    this.currencyKey = "tm_sweets_currency_v2";
    this.activeCurrency = localStorage.getItem(this.currencyKey) || "INR";
    this.appliedPromo = null;
    this.freeShippingThreshold = 50.00; // in USD (approx ₹4,300)
    this.baseShippingRate = 6.50; // in USD
    this.taxRate = 0.05; // 5% tax

    this.items = this.loadFromStorage();
    if (this.items.length === 0) {
      // Default demo items highlighting TM Sweets masterpieces
      this.items = [
        { id: "tm-sweet-01", quantity: 1 },
        { id: "tm-sweet-02", quantity: 2 }
      ];
      this.saveToStorage();
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Could not load cart from localStorage", e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.warn("Could not save cart to localStorage", e);
    }
  }

  setCurrency(currencyCode) {
    if (CURRENCIES[currencyCode]) {
      this.activeCurrency = currencyCode;
      localStorage.setItem(this.currencyKey, currencyCode);
      this.render();
      if (window.productManager) {
        window.productManager.renderProducts();
      }
      window.ui?.showToast(`Currency changed to ${CURRENCIES[currencyCode].label}`, "info");
    }
  }

  formatPrice(usdAmount) {
    const curr = CURRENCIES[this.activeCurrency] || CURRENCIES.INR;
    const converted = usdAmount * curr.rate;
    if (this.activeCurrency === "INR") {
      return `${curr.symbol}${Math.round(converted).toLocaleString("en-IN")}`;
    }
    return `${curr.symbol}${converted.toFixed(2)}`;
  }

  getProduct(productId) {
    return CHOCOLATE_PRODUCTS.find(p => p.id === productId);
  }

  addItem(productId, quantity = 1) {
    const product = this.getProduct(productId);
    if (!product) return;

    const existingIndex = this.items.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({ id: productId, quantity: Math.max(1, quantity) });
    }

    this.saveToStorage();
    this.render();
    this.bumpCartIcon();
    window.ui?.showToast(`Added "${product.name}" (${quantity}x) to your TM Sweets bag! ✨`, "success");
  }

  updateQuantity(productId, delta) {
    const index = this.items.findIndex(item => item.id === productId);
    if (index === -1) return;

    this.items[index].quantity += delta;
    if (this.items[index].quantity <= 0) {
      const product = this.getProduct(productId);
      this.items.splice(index, 1);
      window.ui?.showToast(`Removed "${product ? product.name : 'item'}" from bag.`, "info");
    }

    this.saveToStorage();
    this.render();
  }

  removeItem(productId) {
    const product = this.getProduct(productId);
    this.items = this.items.filter(item => item.id !== productId);
    this.saveToStorage();
    this.render();
    window.ui?.showToast(`Removed "${product ? product.name : 'item'}" from bag.`, "info");
  }

  clearCart() {
    if (this.items.length === 0) return;
    this.items = [];
    this.appliedPromo = null;
    this.saveToStorage();
    this.render();
    window.ui?.showToast("Your TM Sweets bag is now empty.", "info");
  }

  getTotalCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getSubtotal() {
    return this.items.reduce((total, item) => {
      const product = this.getProduct(item.id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  applyPromoCode(code) {
    const cleaned = code.trim().toUpperCase();
    if (PROMO_CODES[cleaned]) {
      this.appliedPromo = { code: cleaned, ...PROMO_CODES[cleaned] };
      this.render();
      window.ui?.showToast(`Promo "${cleaned}" applied: ${this.appliedPromo.label}! 🎉`, "success");
      return true;
    } else {
      window.ui?.showToast(`Invalid promo code "${code}". Try TMSWEETS or TM10.`, "error");
      return false;
    }
  }

  removePromoCode() {
    if (this.appliedPromo) {
      window.ui?.showToast(`Removed promo code ${this.appliedPromo.code}`, "info");
      this.appliedPromo = null;
      this.render();
    }
  }

  getDiscountAmount() {
    if (!this.appliedPromo) return 0;
    const subtotal = this.getSubtotal();
    if (this.appliedPromo.type === "percent") {
      return (subtotal * this.appliedPromo.value) / 100;
    } else if (this.appliedPromo.type === "fixed") {
      return Math.min(subtotal, this.appliedPromo.value);
    }
    return 0;
  }

  getShippingFee() {
    if (this.items.length === 0) return 0;
    if (this.appliedPromo && this.appliedPromo.type === "shipping") return 0;
    const subtotal = this.getSubtotal();
    return subtotal >= this.freeShippingThreshold ? 0 : this.baseShippingRate;
  }

  getTaxAmount() {
    const taxableAmount = Math.max(0, this.getSubtotal() - this.getDiscountAmount());
    return taxableAmount * this.taxRate;
  }

  getGrandTotal() {
    if (this.items.length === 0) return 0;
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingFee();
    const tax = this.getTaxAmount();
    return Math.max(0, subtotal - discount + shipping + tax);
  }

  bumpCartIcon() {
    const badge = document.getElementById("cartBadgeCount");
    const headerBtn = document.getElementById("openCartBtn");
    if (badge) {
      badge.classList.remove("badge-bump");
      void badge.offsetWidth;
      badge.classList.add("badge-bump");
    }
    if (headerBtn) {
      headerBtn.classList.remove("btn-glow");
      void headerBtn.offsetWidth;
      headerBtn.classList.add("btn-glow");
    }
  }

  openDrawer() {
    const drawer = document.getElementById("cartDrawerOverlay");
    if (drawer) {
      drawer.classList.add("active");
      document.body.style.overflow = "hidden";
      this.render();
    }
  }

  closeDrawer() {
    const drawer = document.getElementById("cartDrawerOverlay");
    if (drawer) {
      drawer.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  render() {
    // 1. Update Header Badges & Count
    const totalCount = this.getTotalCount();
    const badgeEl = document.getElementById("cartBadgeCount");
    const mobileBadgeEl = document.getElementById("mobileCartBadgeCount");
    if (badgeEl) badgeEl.textContent = totalCount;
    if (mobileBadgeEl) mobileBadgeEl.textContent = totalCount;

    // 2. Update Cart Items List
    const listContainer = document.getElementById("cartItemsList");
    const emptyState = document.getElementById("cartEmptyState");
    const cartFooter = document.getElementById("cartDrawerFooter");
    const cartItemsCountHeading = document.getElementById("cartDrawerItemCount");

    if (cartItemsCountHeading) {
      cartItemsCountHeading.textContent = `(${totalCount} item${totalCount === 1 ? '' : 's'})`;
    }

    if (!listContainer) return;

    if (this.items.length === 0) {
      listContainer.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      if (cartFooter) cartFooter.style.display = "none";
    } else {
      if (emptyState) emptyState.style.display = "none";
      if (cartFooter) cartFooter.style.display = "block";

      let html = "";
      this.items.forEach(item => {
        const prod = this.getProduct(item.id);
        if (!prod) return;

        const itemTotal = prod.price * item.quantity;
        html += `
          <div class="cart-item-row" data-id="${prod.id}">
            <div class="cart-item-img-box">
              <img src="${prod.image}" alt="${prod.name}" loading="lazy" />
            </div>
            <div class="cart-item-details">
              <div class="cart-item-header">
                <h4 class="cart-item-title">${prod.name}</h4>
                <button class="cart-item-remove-btn" onclick="window.cart.removeItem('${prod.id}')" title="Remove item" aria-label="Remove ${prod.name}">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
              <div class="cart-item-meta">
                <span class="cart-item-origin">${prod.flag} ${prod.origin}</span>
                ${prod.cocoaPercentage > 0 ? `<span class="cart-item-cocoa">${prod.cocoaPercentage}% Cacao</span>` : `<span class="cart-item-cocoa" style="background:#10b981; color:#fff;">Royal Sweet</span>`}
              </div>
              <div class="cart-item-pricing-bar">
                <div class="cart-item-qty-stepper">
                  <button class="qty-btn" onclick="window.cart.updateQuantity('${prod.id}', -1)" aria-label="Decrease quantity">−</button>
                  <span class="qty-num">${item.quantity}</span>
                  <button class="qty-btn" onclick="window.cart.updateQuantity('${prod.id}', 1)" aria-label="Increase quantity">+</button>
                </div>
                <div class="cart-item-prices">
                  <span class="cart-item-unit-price">${this.formatPrice(prod.price)} ea</span>
                  <span class="cart-item-total-price">${this.formatPrice(itemTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      listContainer.innerHTML = html;
    }

    // 3. Update Shipping Progress Bar
    const subtotal = this.getSubtotal();
    const shippingProgressBox = document.getElementById("shippingProgressBarFill");
    const shippingMessage = document.getElementById("shippingProgressMessage");
    if (shippingProgressBox && shippingMessage) {
      if (subtotal >= this.freeShippingThreshold || (this.appliedPromo && this.appliedPromo.type === 'shipping')) {
        shippingProgressBox.style.width = "100%";
        shippingProgressBox.style.background = "linear-gradient(90deg, #10b981, #34d399)";
        shippingMessage.innerHTML = `✨ <strong>Unlocked:</strong> Free TM Express Insulated Delivery!`;
      } else {
        const remaining = this.freeShippingThreshold - subtotal;
        const percent = Math.min(100, (subtotal / this.freeShippingThreshold) * 100);
        shippingProgressBox.style.width = `${percent}%`;
        shippingProgressBox.style.background = "linear-gradient(90deg, var(--gold-primary), var(--gold-light))";
        shippingMessage.innerHTML = `Add <strong>${this.formatPrice(remaining)}</strong> more to unlock <strong>Free Express Shipping</strong>!`;
      }
    }

    // 4. Update Summary Breakdown Elements
    const subtotalEl = document.getElementById("cartSubtotalAmount");
    const discountRow = document.getElementById("cartDiscountRow");
    const discountEl = document.getElementById("cartDiscountAmount");
    const discountLabel = document.getElementById("cartDiscountLabel");
    const shippingEl = document.getElementById("cartShippingAmount");
    const taxEl = document.getElementById("cartTaxAmount");
    const grandTotalEl = document.getElementById("cartGrandTotalAmount");

    if (subtotalEl) subtotalEl.textContent = this.formatPrice(subtotal);

    const discountAmount = this.getDiscountAmount();
    if (discountRow) {
      if (discountAmount > 0) {
        discountRow.style.display = "flex";
        if (discountEl) discountEl.textContent = `-${this.formatPrice(discountAmount)}`;
        if (discountLabel && this.appliedPromo) {
          discountLabel.innerHTML = `Promo (${this.appliedPromo.code}) <button class="btn-text-gold" onclick="window.cart.removePromoCode()" style="font-size:0.75rem;">(Remove)</button>`;
        }
      } else {
        discountRow.style.display = "none";
      }
    }

    const shippingFee = this.getShippingFee();
    if (shippingEl) {
      shippingEl.textContent = shippingFee === 0 ? "FREE" : this.formatPrice(shippingFee);
      if (shippingFee === 0) {
        shippingEl.classList.add("text-success-gold");
      } else {
        shippingEl.classList.remove("text-success-gold");
      }
    }

    const taxAmount = this.getTaxAmount();
    if (taxEl) taxEl.textContent = this.formatPrice(taxAmount);

    const grandTotal = this.getGrandTotal();
    if (grandTotalEl) grandTotalEl.textContent = this.formatPrice(grandTotal);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  openCheckout() {
    if (this.items.length === 0) {
      window.ui?.showToast("Your TM Sweets bag is empty! Add items first.", "error");
      return;
    }
    this.closeDrawer();
    const modal = document.getElementById("checkoutModal");
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
      this.populateCheckoutSummary();
    }
  }

  closeCheckout() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  populateCheckoutSummary() {
    const summaryContainer = document.getElementById("checkoutSummaryList");
    const checkoutTotalEl = document.getElementById("checkoutFinalTotal");
    if (!summaryContainer) return;

    let itemsHtml = "";
    this.items.forEach(item => {
      const prod = this.getProduct(item.id);
      if (!prod) return;
      itemsHtml += `
        <div class="checkout-sum-item">
          <img src="${prod.image}" alt="${prod.name}" class="checkout-sum-thumb" />
          <div class="checkout-sum-info">
            <h5>${prod.name}</h5>
            <small>${item.quantity} × ${this.formatPrice(prod.price)}</small>
          </div>
          <span class="checkout-sum-price">${this.formatPrice(prod.price * item.quantity)}</span>
        </div>
      `;
    });

    summaryContainer.innerHTML = itemsHtml;
    if (checkoutTotalEl) {
      checkoutTotalEl.textContent = this.formatPrice(this.getGrandTotal());
    }
  }

  completeOrder(orderData) {
    const orderNumber = "TM-" + Math.floor(100000 + Math.random() * 900000);
    const grandTotal = this.formatPrice(this.getGrandTotal());

    this.closeCheckout();

    const confirmModal = document.getElementById("orderConfirmationModal");
    const orderNumEl = document.getElementById("confirmedOrderNumber");
    const orderEmailEl = document.getElementById("confirmedOrderEmail");
    const orderTotalEl = document.getElementById("confirmedOrderTotal");

    if (orderNumEl) orderNumEl.textContent = orderNumber;
    if (orderEmailEl) orderEmailEl.textContent = orderData.email || "patron@tmsweets.com";
    if (orderTotalEl) orderTotalEl.textContent = grandTotal;

    if (confirmModal) {
      confirmModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    this.items = [];
    this.appliedPromo = null;
    this.saveToStorage();
    this.render();

    window.ui?.showToast(`TM Sweets Order #${orderNumber} placed successfully! 🎉👑`, "success");
  }
}

// Instantiate global cart
window.cart = new ShoppingCart();
