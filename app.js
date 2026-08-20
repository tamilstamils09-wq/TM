/**
 * Velvet & Cocoa - Application Entry Point
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Cart
  if (window.cart) {
    window.cart.render();
  }

  // 2. Initialize Product Catalog & Wishlist
  if (window.productManager) {
    window.productManager.updateWishlistCountBadge();
    window.productManager.renderProducts();
  }

  // 3. Initialize UI Event Handlers
  if (window.ui) {
    window.ui.init();
  }

  // 4. Hydrate Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  console.log("👑 TM Sweets & Royal Confectionery initialized successfully.");
});
