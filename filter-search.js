/**
 * TM Sweets - Product Filtering, Live Search, and Grid Rendering
 */

class ProductManager {
  constructor() {
    this.products = CHOCOLATE_PRODUCTS;
    this.filteredProducts = [...this.products];
    this.activeCategory = "all";
    this.searchQuery = "";
    this.minCocoa = 0;
    this.activeSort = "featured";
    this.activeDietary = [];
    this.wishlist = this.loadWishlist();
    this.cardQuantities = {};
  }

  loadWishlist() {
    try {
      const stored = localStorage.getItem("tm_sweets_wishlist_v1");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem("tm_sweets_wishlist_v1", JSON.stringify(this.wishlist));
    } catch (e) {
      console.warn(e);
    }
  }

  toggleWishlist(productId) {
    const index = this.wishlist.indexOf(productId);
    const prod = CHOCOLATE_PRODUCTS.find(p => p.id === productId);
    if (index > -1) {
      this.wishlist.splice(index, 1);
      window.ui?.showToast(`Removed "${prod?.name || 'item'}" from your wishlist.`, "info");
    } else {
      this.wishlist.push(productId);
      window.ui?.showToast(`Saved "${prod?.name || 'item'}" to your TM Sweets wishlist! ❤️`, "success");
    }
    this.saveWishlist();
    this.updateWishlistCountBadge();
    this.renderProducts();
  }

  updateWishlistCountBadge() {
    const badge = document.getElementById("wishlistBadgeCount");
    if (badge) {
      badge.textContent = this.wishlist.length;
    }
  }

  getCardQty(productId) {
    return this.cardQuantities[productId] || 1;
  }

  setCardQty(productId, delta) {
    const current = this.getCardQty(productId);
    const next = Math.max(1, current + delta);
    this.cardQuantities[productId] = next;
    const qtyEl = document.getElementById(`card-qty-${productId}`);
    if (qtyEl) {
      qtyEl.textContent = next;
    }
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(item => {
      // 1. Category Filter
      if (this.activeCategory !== "all" && item.category !== this.activeCategory) {
        return false;
      }

      // 2. Search Query Filter
      if (this.searchQuery.trim() !== "") {
        const q = this.searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchOrigin = item.origin.toLowerCase().includes(q);
        const matchNotes = item.tastingNotes.some(note => note.toLowerCase().includes(q));
        const matchBadge = item.badge?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchOrigin && !matchNotes && !matchBadge) {
          return false;
        }
      }

      // 3. Cocoa Percentage Filter (if applicable)
      if (this.minCocoa > 0 && item.cocoaPercentage < this.minCocoa) {
        return false;
      }

      // 4. Dietary Checkboxes Filter
      if (this.activeDietary.length > 0) {
        const matchesAllDietary = this.activeDietary.every(d => item.dietary && item.dietary.includes(d));
        if (!matchesAllDietary) {
          return false;
        }
      }

      return true;
    });

    // 5. Apply Sorting
    this.sortProducts();
    this.renderProducts();
  }

  sortProducts() {
    switch (this.activeSort) {
      case "price-asc":
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "cocoa-desc":
        this.filteredProducts.sort((a, b) => b.cocoaPercentage - a.cocoaPercentage);
        break;
      case "rating-desc":
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case "featured":
      default:
        this.filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }
  }

  resetFilters() {
    this.activeCategory = "all";
    this.searchQuery = "";
    this.minCocoa = 0;
    this.activeSort = "featured";
    this.activeDietary = [];

    const searchInput = document.getElementById("productSearchInput");
    if (searchInput) searchInput.value = "";

    const slider = document.getElementById("cocoaFilterSlider");
    const sliderVal = document.getElementById("cocoaFilterVal");
    if (slider) slider.value = 0;
    if (sliderVal) sliderVal.textContent = "All Intensities";

    const sortSelect = document.getElementById("productSortSelect");
    if (sortSelect) sortSelect.value = "featured";

    document.querySelectorAll(".cat-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.category === "all");
    });

    document.querySelectorAll(".dietary-check-box").forEach(cb => {
      cb.checked = false;
    });

    this.applyFilters();
    window.ui?.showToast("All TM Sweets filters have been reset.", "info");
  }

  renderProducts() {
    const grid = document.getElementById("chocolateProductsGrid");
    const resultsCountEl = document.getElementById("filterResultsCount");

    if (resultsCountEl) {
      const count = this.filteredProducts.length;
      resultsCountEl.innerHTML = `Showing <strong>${count}</strong> TM Sweets creation${count === 1 ? '' : 's'}`;
    }

    if (!grid) return;

    if (this.filteredProducts.length === 0) {
      grid.innerHTML = `
        <div class="no-products-state">
          <div class="no-products-icon">👑🔍</div>
          <h3>No Delicacies Found</h3>
          <p>We couldn't find any sweets matching your selected criteria. Try adjusting your search keywords or dietary filters.</p>
          <button class="btn-primary" onclick="window.productManager.resetFilters()">
            <i data-lucide="refresh-cw"></i> Reset All Filters
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let cardsHtml = "";

    this.filteredProducts.forEach(prod => {
      const isWishlisted = this.wishlist.includes(prod.id);
      const cardQty = this.getCardQty(prod.id);
      const formattedPrice = window.cart ? window.cart.formatPrice(prod.price) : `$${prod.price.toFixed(2)}`;
      const formattedOriginal = prod.originalPrice && window.cart ? window.cart.formatPrice(prod.originalPrice) : null;

      cardsHtml += `
        <article class="chocolate-card" data-id="${prod.id}">
          <!-- Card Image Header -->
          <div class="card-image-wrap">
            <img src="${prod.image}" alt="${prod.name}" class="card-product-img" loading="lazy" />
            <div class="card-image-gradient"></div>

            <!-- Top Floating Badges -->
            <div class="card-top-badges">
              <span class="card-origin-tag">${prod.flag} ${prod.origin.split(' ')[0]}</span>
              ${prod.cocoaPercentage > 0 ? `<span class="card-cocoa-pill">${prod.cocoaPercentage}% CACAO</span>` : `<span class="card-cocoa-pill" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff;">ROYAL SWEET</span>`}
            </div>

            ${prod.badge ? `<span class="card-curation-badge">${prod.badge}</span>` : ''}

            <!-- Card Quick Action Buttons -->
            <div class="card-floating-actions">
              <button class="card-action-icon-btn ${isWishlisted ? 'wishlisted' : ''}" 
                      onclick="window.productManager.toggleWishlist('${prod.id}')" 
                      title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
                      aria-label="Wishlist ${prod.name}">
                <i data-lucide="heart"></i>
              </button>
              <button class="card-action-icon-btn" 
                      onclick="window.ui.openQuickView('${prod.id}')" 
                      title="Quick View Sensory Details"
                      aria-label="Quick View ${prod.name}">
                <i data-lucide="eye"></i>
              </button>
            </div>
          </div>

          <!-- Card Content Body -->
          <div class="card-body">
            <div class="card-category-row">
              <span class="card-cat-name">${prod.categoryLabel}</span>
              <div class="card-rating-stars" title="${prod.rating} out of 5 stars (${prod.reviewsCount} reviews)">
                <i data-lucide="star" class="star-filled"></i>
                <span class="rating-num">${prod.rating.toFixed(1)}</span>
                <span class="rating-count">(${prod.reviewsCount})</span>
              </div>
            </div>

            <h3 class="card-product-title" onclick="window.ui.openQuickView('${prod.id}')" title="${prod.name}">
              ${prod.name}
            </h3>

            <p class="card-product-desc">
              ${prod.description}
            </p>

            <!-- Tasting Notes Tags -->
            <div class="card-tasting-chips">
              ${prod.tastingNotes.slice(0, 3).map(note => `<span class="tasting-chip">${note}</span>`).join('')}
            </div>

            <!-- Price & Quantity Bar -->
            <div class="card-pricing-row">
              <div class="card-price-group">
                <span class="card-current-price">${formattedPrice}</span>
                ${formattedOriginal ? `<span class="card-strikethrough-price">${formattedOriginal}</span>` : ''}
              </div>
              <span class="card-weight-label">${prod.weight}</span>
            </div>

            <!-- Quantity & Add to Cart Action Footer -->
            <div class="card-footer-actions">
              <div class="card-qty-stepper">
                <button class="card-qty-btn" onclick="window.productManager.setCardQty('${prod.id}', -1)" aria-label="Decrease quantity">−</button>
                <span class="card-qty-display" id="card-qty-${prod.id}">${cardQty}</span>
                <button class="card-qty-btn" onclick="window.productManager.setCardQty('${prod.id}', 1)" aria-label="Increase quantity">+</button>
              </div>

              <button class="btn-add-to-cart" onclick="window.productManager.handleAddCardToCart('${prod.id}')">
                <i data-lucide="shopping-bag"></i>
                <span>Add to Bag</span>
              </button>
            </div>
          </div>
        </article>
      `;
    });

    grid.innerHTML = cardsHtml;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  handleAddCardToCart(productId) {
    const qty = this.getCardQty(productId);
    window.cart.addItem(productId, qty);
    this.cardQuantities[productId] = 1;
    const qtyEl = document.getElementById(`card-qty-${productId}`);
    if (qtyEl) qtyEl.textContent = 1;
  }
}

// Instantiate Global Product Manager
window.productManager = new ProductManager();
