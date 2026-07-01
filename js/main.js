document.addEventListener("DOMContentLoaded", () => {
  initCart();
  initQuantitySelector();
  initProductGallery();
  initCatalogFilters();
  initForms();
});

function initCart() {
  const cartCountEls = document.querySelectorAll("[data-cart-count]");
  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const cartTotalEl = document.getElementById("cartTotal");

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("c7s_cart") || "[]");
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem("c7s_cart", JSON.stringify(cart));
  }

  function getTotalItems(cart) {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function getTotalPrice(cart) {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function renderCart() {
    const cart = getCart();
    const totalItems = getTotalItems(cart);

    cartCountEls.forEach((el) => {
      el.textContent = totalItems;
    });

    if (!cartItemsEl) return;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = "";
      if (cartEmptyEl) cartEmptyEl.classList.remove("d-none");
      if (cartTotalEl) cartTotalEl.textContent = "$0.00";
      return;
    }

    if (cartEmptyEl) cartEmptyEl.classList.add("d-none");

    cartItemsEl.innerHTML = cart
      .map(
        (item) => `
        <div class="cart-item d-flex gap-3">
          <img src="${item.image}" alt="${item.name}" width="64" height="64" class="rounded object-fit-cover" loading="lazy">
          <div class="flex-grow-1">
            <p class="fw-semibold mb-0">${item.name}</p>
            <p class="text-muted-custom small mb-1">${item.qty} x $${item.price.toFixed(2)}</p>
            <button type="button" class="btn btn-link btn-sm text-danger p-0" data-remove-cart="${item.id}">Eliminar</button>
          </div>
        </div>`
      )
      .join("");

    if (cartTotalEl) {
      cartTotalEl.textContent = `$${getTotalPrice(cart).toFixed(2)}`;
    }

    cartItemsEl.querySelectorAll("[data-remove-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-remove-cart");
        const updated = getCart().filter((i) => i.id !== id);
        saveCart(updated);
        renderCart();
        showToast("Producto eliminado del carrito");
      });
    });
  }

  document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-add-to-cart");
      const name = btn.getAttribute("data-product-name") || "Producto";
      const price = parseFloat(btn.getAttribute("data-product-price") || "0");
      const image = btn.getAttribute("data-product-image") || "img/product-sticker.jpg";
      const qtyInput = document.getElementById("productQuantity");
      const qty = qtyInput ? parseInt(qtyInput.textContent, 10) || 1 : 1;

      const cart = getCart();
      const existing = cart.find((i) => i.id === id);

      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ id, name, price, image, qty });
      }

      saveCart(cart);
      renderCart();
      showToast(`${name} agregado al carrito`);
    });
  });

  renderCart();
}

function initQuantitySelector() {
  const minusBtn = document.getElementById("qtyMinus");
  const plusBtn = document.getElementById("qtyPlus");
  const qtyEl = document.getElementById("productQuantity");

  if (!minusBtn || !plusBtn || !qtyEl) return;

  minusBtn.addEventListener("click", () => {
    const current = parseInt(qtyEl.textContent, 10) || 1;
    if (current > 1) qtyEl.textContent = current - 1;
  });

  plusBtn.addEventListener("click", () => {
    const current = parseInt(qtyEl.textContent, 10) || 1;
    qtyEl.textContent = current + 1;
  });
}

function initProductGallery() {
  const carousel = document.getElementById("productCarousel");
  const thumbs = document.querySelectorAll(".product-gallery-thumb");

  if (!carousel || thumbs.length === 0) return;

  const bsCarousel = bootstrap.Carousel.getOrCreateInstance(carousel);

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      bsCarousel.to(index);
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  carousel.addEventListener("slid.bs.carousel", (e) => {
    thumbs.forEach((t) => t.classList.remove("active"));
    if (thumbs[e.to]) thumbs[e.to].classList.add("active");
  });
}

function initCatalogFilters() {
  const searchInput = document.getElementById("catalogSearch");
  const filterBtns = document.querySelectorAll("[data-filter-category]");
  const productCards = document.querySelectorAll("[data-product-card]");
  const resultsCount = document.getElementById("resultsCount");

  if (productCards.length === 0) return;

  let activeCategory = "all";

  function filterProducts() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let visible = 0;

    productCards.forEach((card) => {
      const name = (card.getAttribute("data-name") || "").toLowerCase();
      const category = (card.getAttribute("data-category") || "").toLowerCase();
      const matchCategory = activeCategory === "all" || category === activeCategory.toLowerCase();
      const matchSearch = !query || name.includes(query) || category.includes(query);
      const show = matchCategory && matchSearch;

      card.classList.toggle("d-none", !show);
      if (show) visible++;
    });

    if (resultsCount) {
      resultsCount.textContent = visible;
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.getAttribute("data-filter-category") || "all";
      filterBtns.forEach((b) => {
        const match = (b.getAttribute("data-filter-category") || "all") === activeCategory;
        b.classList.toggle("active", match);
      });
      filterProducts();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
  }
}

function initForms() {
  const contactForm = document.getElementById("contactForm");
  const newsletterForm = document.getElementById("newsletterForm");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        e.stopPropagation();
        contactForm.classList.add("was-validated");
        return;
      }

      contactForm.reset();
      contactForm.classList.remove("was-validated");
      showToast("Consulta enviada. Te responderemos en menos de 24 horas.");
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value.trim()) {
        emailInput?.classList.add("is-invalid");
        return;
      }

      emailInput.classList.remove("is-invalid");
      newsletterForm.reset();
      showToast("¡Gracias por suscribirte a la comunidad C7S!");
    });
  }
}

function showToast(message) {
  const toastEl = document.getElementById("liveToast");
  const toastBody = document.getElementById("toastMessage");

  if (!toastEl || !toastBody) return;

  toastBody.textContent = message;
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
  toast.show();
}
