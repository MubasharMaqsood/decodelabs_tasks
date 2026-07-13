/* =====================================================================
   MA STUDIO — shared interactivity
   Implements the Input -> Process -> Output loop across the site:
   nav + mobile menu, sticky header, scroll reveal, cart drawer with
   in-memory state, wishlist toggles, product filters, quick-add toast,
   newsletter + contact form validation, FAQ accordion, hero drag divider.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------- State (in-memory, resets per session) ---------------- */
  const cart = []; // {id, name, price, cat}

  /* ---------------- Helpers ---------------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const money = (n) => "Rs " + n.toLocaleString("en-PK");

  /* ---------------- Mobile nav toggle ---------------- */
  const navToggle = $(".nav-toggle");
  const mainNav = $(".main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    $$(".main-nav a").forEach((a) =>
      a.addEventListener("click", () => {
        mainNav.classList.remove("open");
        navToggle.classList.remove("open");
      })
    );
  }

  /* ---------------- Sticky header shrink ---------------- */
  const header = $(".site-header");
  if (header) {
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("shrink", window.scrollY > 30),
      { passive: true }
    );
  }

  /* ---------------- Back to top ---------------- */
  const toTop = $(".to-top");
  if (toTop) {
    window.addEventListener(
      "scroll",
      () => toTop.classList.toggle("show", window.scrollY > 700),
      { passive: true }
    );
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = $$(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ---------------- Cart drawer ---------------- */
  const drawer = $(".cart-drawer");
  const overlay = $(".overlay");
  const cartItemsEl = $(".cart-items");
  const cartCountEls = $$(".cart-count");
  const cartSubtotalEl = $(".cart-subtotal .amt");

  function openDrawer() {
    drawer && drawer.classList.add("open");
    overlay && overlay.classList.add("show");
  }
  function closeDrawer() {
    drawer && drawer.classList.remove("open");
    overlay && overlay.classList.remove("show");
  }
  $$(".cart-open").forEach((b) => b.addEventListener("click", openDrawer));
  $(".cart-close") && $(".cart-close").addEventListener("click", closeDrawer);
  overlay && overlay.addEventListener("click", closeDrawer);

  function renderCart() {
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = "";
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Your bag is empty. Time to fix that.</p>';
    } else {
      cart.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
          <div class="thumb"><img src="${item.img}" alt="${item.name}"></div>
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="meta">${item.cat}</div>
            <div class="price">${money(item.price)}</div>
          </div>
          <button class="remove" data-idx="${idx}" type="button">Remove</button>
        `;
        cartItemsEl.appendChild(row);
      });
    }
    const subtotal = cart.reduce((s, i) => s + i.price, 0);
    if (cartSubtotalEl) cartSubtotalEl.textContent = money(subtotal);
    cartCountEls.forEach((el) => (el.textContent = cart.length));
  }

  cartItemsEl &&
    cartItemsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".remove");
      if (!btn) return;
      cart.splice(Number(btn.dataset.idx), 1);
      renderCart();
    });

  $$(".quick-add button, .add-to-bag").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-name]");
      if (!card) return;
      cart.push({
        name: card.dataset.name,
        price: Number(card.dataset.price),
        cat: card.dataset.cat || "",
        img: card.dataset.img || "",
      });
      renderCart();
      toast(card.dataset.name + " added to your bag");
      openDrawer();
    });
  });

  renderCart();

  /* ---------------- Wishlist heart toggle ---------------- */
  $$(".wish-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const active = btn.classList.toggle("active");
      btn.setAttribute("aria-pressed", String(active));
      toast(active ? "Saved to your wishlist" : "Removed from wishlist");
    });
  });

  /* ---------------- Product filters ---------------- */
  $$(".filter-bar").forEach((bar) => {
    const grid = document.getElementById(bar.dataset.target);
    if (!grid) return;
    const empty = grid.parentElement.querySelector(".grid-empty");
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      $$(".filter-btn", bar).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      let visible = 0;
      $$(".product-card", grid).forEach((card) => {
        const show = filter === "all" || card.dataset.cat === filter;
        card.classList.toggle("hide", !show);
        if (show) visible++;
      });
      if (empty) empty.classList.toggle("show", visible === 0);
    });
  });

  /* ---------------- FAQ accordion ---------------- */
  $$(".faq-item").forEach((item) => {
    const q = $(".faq-q", item);
    const a = $(".faq-a", item);
    q &&
      q.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        $$(".faq-item").forEach((other) => {
          other.classList.remove("open");
          $(".faq-a", other).style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
  });

  /* ---------------- Newsletter form ---------------- */
  const nlForm = $(".nl-form");
  if (nlForm) {
    nlForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("input", nlForm);
      const msg = $(".nl-msg");
      const val = input.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) {
        msg.textContent = "Please enter a valid email address.";
        msg.style.color = "#E7C6BE";
        input.focus();
        return;
      }
      msg.textContent = "Welcome to the house of MA — check your inbox.";
      msg.style.color = "";
      input.value = "";
    });
  }

  /* ---------------- Contact form validation ---------------- */
  const contactForm = $("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      $$(".form-field", contactForm).forEach((field) => {
        const input = field.querySelector("input, textarea, select");
        if (!input) return;
        const required = input.hasAttribute("required");
        let ok = true;
        if (required && !input.value.trim()) ok = false;
        if (input.type === "email" && input.value.trim()) {
          ok = ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        field.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });
      const status = $(".form-status", contactForm);
      if (!valid) {
        if (status) {
          status.textContent = "Please fix the highlighted fields.";
          status.style.color = "#7A1730";
        }
        return;
      }
      if (status) {
        status.textContent = "Message sent — our stylists will reply within 24 hours.";
        status.style.color = "#1F4438";
      }
      contactForm.reset();
    });
  }

  /* ---------------- Hero East/West drag divider ---------------- */
  const heroDivider = $(".hero-divider");
  const heroPk = $(".hero-side.pk");
  const heroWn = $(".hero-side.wn");
  const hero = $(".hero");
  if (heroDivider && heroPk && heroWn && hero) {
    let dragging = false;

    function setSplit(pct) {
      pct = Math.min(78, Math.max(22, pct));
      heroPk.style.flex = pct + " 1 0";
      heroWn.style.flex = (100 - pct) + " 1 0";
      heroDivider.style.left = pct + "%";
    }
    setSplit(50);

    function pointerToPct(clientX) {
      const rect = hero.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }
    function start(e) {
      dragging = true;
      hero.classList.add("dragging");
    }
    function move(e) {
      if (!dragging) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setSplit(pointerToPct(x));
    }
    function end() {
      dragging = false;
      hero.classList.remove("dragging");
    }
    heroDivider.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    heroDivider.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);

    heroDivider.addEventListener("keydown", (e) => {
      const current = parseFloat(heroDivider.style.left) || 50;
      if (e.key === "ArrowLeft") setSplit(current - 4);
      if (e.key === "ArrowRight") setSplit(current + 4);
    });
  }

  /* ---------------- Footer year ---------------- */
  $$(".year").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
