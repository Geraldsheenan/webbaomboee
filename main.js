// main.js
import {
    db,
    collection,
    addDoc,
    serverTimestamp,
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    } from "./firebase.js";

    document.addEventListener("DOMContentLoaded", () => {
    /* =========================================================
        1. NAVBAR & PROFILE MENU
    ========================================================= */
    const navMenu = document.querySelector(".navbar-nav");
    const navToggle = document.querySelector(".nav-toggle");

    if (navToggle && navMenu) {
        navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        navToggle.classList.toggle("active");
        });
    }

    const profileBtn = document.querySelector(".profile-btn");
    const profileMenu = document.getElementById("profile-menu");

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("visible");
        });

        document.addEventListener("click", (e) => {
        if (
            profileMenu.classList.contains("visible") &&
            !profileMenu.contains(e.target) &&
            !profileBtn.contains(e.target)
        ) {
            profileMenu.classList.remove("visible");
        }
        });
    }

    /* =========================================================
        2. RECIPE MODAL (LIHAT RESEP)
    ========================================================= */
    const recipeModal = document.getElementById("recipe-modal");
    const modalTitle = document.getElementById("modal-recipe-title");
    const modalBody = document.querySelector(".modal-recipe-body");
    const closeModalBtn = document.getElementById("modal-close-btn");
    const recipesSection = document.getElementById("recipes");

    if (recipesSection && recipeModal && modalTitle && modalBody) {
        recipesSection.addEventListener("click", (e) => {
        const trigger = e.target.closest(".recipe-popup-trigger");
        if (!trigger) return;

        e.preventDefault();
        const card = trigger.closest(".recipe-card");
        if (!card) return;

        const title = card.dataset.recipeTitle || "";
        const content = card.dataset.recipeHtml || "";

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        recipeModal.classList.add("visible");
        });
    }

    const closeRecipeModal = () => {
        if (recipeModal) recipeModal.classList.remove("visible");
    };

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeRecipeModal);
    }

    if (recipeModal) {
        recipeModal.addEventListener("click", (e) => {
        if (e.target === recipeModal) closeRecipeModal();
        });
    }

    /* =========================================================
        3. KATALOG: FILTER & SEARCH
    ========================================================= */
    const filterButtons = document.querySelectorAll(".filter-btn");
    const catalogCards = document.querySelectorAll(".catalog-product-card");
    const searchBar = document.getElementById("search-bar");
    const searchBtn = document.getElementById("search-btn");

    let activeFilter = "all";
    let searchQuery = "";

    const applyCatalogFilters = () => {
        const q = searchQuery.toLowerCase();

        catalogCards.forEach((card) => {
        const category = card.dataset.category || "all";
        const titleEl = card.querySelector(".product-title");
        const text = (titleEl ? titleEl.textContent : "").toLowerCase();

        const matchesCategory =
            activeFilter === "all" || category === activeFilter;
        const matchesSearch = !q || text.includes(q);

        const visible = matchesCategory && matchesSearch;
        card.classList.toggle("hidden", !visible);
        });
    };

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter || "all";
        applyCatalogFilters();
        });
    });

    if (searchBar) {
        const handleSearchChange = () => {
        searchQuery = searchBar.value.trim();
        applyCatalogFilters();
        };

        searchBar.addEventListener("input", handleSearchChange);

        if (searchBtn) {
        searchBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleSearchChange();
        });
        }
    }

    /* =========================================================
        4. KERANJANG: STATE, BADGE & MODAL
    ========================================================= */
    const CART_STORAGE_KEY = "bamboe_cart";
    let cart = [];

    const profileCartBadge = document.getElementById("profile-cart-badge");
    const rowCartBadges = document.querySelectorAll(".cart-badge-row");

    const parseRupiahToNumber = (text) => {
        if (!text) return 0;
        const digits = text.replace(/[^\d]/g, "");
        return digits ? parseInt(digits, 10) : 0;
    };

    const formatRupiah = (value) => {
        const number = Number(value) || 0;
        return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
        }).format(number);
    };

    const loadCartFromStorage = () => {
        try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) cart = parsed;
        } catch (err) {
        console.error("Gagal membaca cart dari storage", err);
        }
    };

    const saveCartToStorage = () => {
        try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (err) {
        console.error("Gagal menyimpan cart ke storage", err);
        }
    };

    const getCartTotalItems = () =>
        cart.reduce((sum, item) => sum + (item.qty || 0), 0);

    const getCartSubtotal = () =>
        cart.reduce((sum, item) => sum + item.price * (item.qty || 0), 0);

    const updateCartBadge = () => {
        const total = getCartTotalItems();

        const applyToBadge = (badge) => {
        if (!badge) return;
        if (total > 0) {
            badge.textContent = total;
            badge.classList.add("visible-cart-badge");
        } else {
            badge.textContent = "";
            badge.classList.remove("visible-cart-badge");
        }
        };

        applyToBadge(profileCartBadge);
        rowCartBadges.forEach(applyToBadge);
    };

    const addItemToCart = (name, price, qty) => {
        if (!name || qty <= 0) return;

        const existing = cart.find(
        (item) => item.name === name && item.price === price
        );

        if (existing) {
        existing.qty += qty;
        } else {
        cart.push({ name, price, qty });
        }

        saveCartToStorage();
        updateCartBadge();
    };

    loadCartFromStorage();
    updateCartBadge();

    // + / - & add-to-cart di Katalog
    catalogCards.forEach((card) => {
        const minusBtn = card.querySelector(".quantity-btn.minus");
        const plusBtn = card.querySelector(".quantity-btn.plus");
        const qtyInput = card.querySelector(".quantity-input");
        const addBtn = card.querySelector(".add-to-cart-btn");

        const titleEl = card.querySelector(".product-title");
        const priceEl = card.querySelector(".product-price");

        if (!qtyInput) return;

        const normalizeQty = () => {
        let value = parseInt(qtyInput.value, 10);
        if (isNaN(value) || value < 1) value = 1;
        qtyInput.value = value;
        };

        if (minusBtn) {
        minusBtn.addEventListener("click", () => {
            let value = parseInt(qtyInput.value, 10) || 1;
            value = Math.max(1, value - 1);
            qtyInput.value = value;
        });
        }

        if (plusBtn) {
        plusBtn.addEventListener("click", () => {
            let value = parseInt(qtyInput.value, 10) || 1;
            qtyInput.value = value + 1;
        });
        }

        qtyInput.addEventListener("blur", normalizeQty);

        if (addBtn) {
        addBtn.addEventListener("click", () => {
            normalizeQty();
            const qty = parseInt(qtyInput.value, 10) || 1;
            const name = titleEl ? titleEl.textContent.trim() : "Produk Bamboe";
            const price = priceEl ? parseRupiahToNumber(priceEl.textContent) : 0;

            addItemToCart(name, price, qty);

            addBtn.classList.add("added");
            setTimeout(() => addBtn.classList.remove("added"), 250);
        });
        }
    });

    // CART MODAL
    const cartModal = document.getElementById("cart-modal");
    const cartModalCloseBtn = document.getElementById("cart-modal-close");
    const cartItemsContainer = document.getElementById("cart-items-container");
    const cartSubtotalAmount = document.getElementById("cart-subtotal-amount");
    const cartTotalAmount = document.getElementById("cart-total-amount");
    const cartCouponInput = document.getElementById("cart-coupon-input");
    const cartApplyCouponBtn = document.getElementById("cart-apply-coupon");
    const profileMenuCartBtn = document.querySelector(".profile-menu-cart");

    const renderCartModal = () => {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = "";

        if (!cart.length) {
        cartItemsContainer.innerHTML =
            '<p style="text-align:center; font-size:0.9rem; color:var(--text-light);">Keranjang masih kosong.</p>';
        } else {
        cart.forEach((item) => {
            const row = document.createElement("div");
            row.className = "cart-item";
            row.dataset.name = item.name;
            row.dataset.price = item.price;

            row.innerHTML = `
            <div class="cart-item-main">
                <div>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price-line">
                    ${formatRupiah(item.price)} × ${item.qty}
                </div>
                </div>
                <div class="cart-item-subtotal">
                ${formatRupiah(item.price * item.qty)}
                </div>
            </div>
            <div class="cart-item-qty-row">
                <button class="cart-qty-btn minus" type="button">−</button>
                <span class="cart-qty-value">${item.qty}</span>
                <button class="cart-qty-btn plus" type="button">+</button>
            </div>
            `;
            cartItemsContainer.appendChild(row);
        });
        }

        const subtotal = getCartSubtotal();
        if (cartSubtotalAmount)
        cartSubtotalAmount.textContent = formatRupiah(subtotal);
        if (cartTotalAmount) cartTotalAmount.textContent = formatRupiah(subtotal);
    };

    const openCartModal = () => {
        if (!cartModal) return;
        renderCartModal();
        cartModal.classList.add("visible");
        if (profileMenu) profileMenu.classList.remove("visible");
    };

    const closeCartModal = () => {
        if (!cartModal) return;
        cartModal.classList.remove("visible");
    };

    if (profileMenuCartBtn) {
        profileMenuCartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCartModal();
        });
    }

    if (cartModalCloseBtn) {
        cartModalCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeCartModal();
        });
    }

    if (cartModal) {
        cartModal.addEventListener("click", (e) => {
        if (e.target === cartModal) closeCartModal();
        });

        // + / - di dalam modal
        cartItemsContainer?.addEventListener("click", (e) => {
        const minusBtn = e.target.closest(".cart-qty-btn.minus");
        const plusBtn = e.target.closest(".cart-qty-btn.plus");
        if (!minusBtn && !plusBtn) return;

        const row = e.target.closest(".cart-item");
        const name = row.dataset.name;
        const price = Number(row.dataset.price);

        const idx = cart.findIndex(
            (item) => item.name === name && item.price === price
        );
        if (idx === -1) return;

        if (minusBtn) {
            cart[idx].qty -= 1;
            if (cart[idx].qty <= 0) {
            cart.splice(idx, 1);
            }
        }
        if (plusBtn) {
            cart[idx].qty += 1;
        }

        saveCartToStorage();
        updateCartBadge();
        renderCartModal();
        });
    }

    if (cartApplyCouponBtn && cartCouponInput) {
        cartApplyCouponBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const kode = cartCouponInput.value.trim();
        if (!kode) {
            alert("Silakan masukkan kode kupon terlebih dahulu.");
            return;
        }
        alert(
            "Fitur kupon masih dalam pengembangan.\nKode yang Anda masukkan: " +
            kode
        );
        });
    }

    /* =========================================================
        5. FAVORITE (ICON LOVE) + MODAL FAVORIT
    ========================================================= */
    const FAVORITES_STORAGE_KEY = "bamboe_favorites";
    let favorites = [];

    const favoriteCountBadge = document.getElementById("favorite-count-badge");
    const profileMenuFavoriteBtn = document.querySelector(
        ".profile-menu-favorite"
    );
    const favoriteModal = document.getElementById("favorite-modal");
    const favoriteModalCloseBtn = document.getElementById("favorite-modal-close");
    const favoriteItemsContainer = document.getElementById(
        "favorite-items-container"
    );

    const favFilterButtons = document.querySelectorAll(".fav-filter-btn");
    const favSearchInput = document.getElementById("fav-search-input");
    const favSearchClear = document.getElementById("fav-search-clear");

    let activeFavoriteFilter = "all";
    let favoriteSearchQuery = "";

    const loadFavoritesFromStorage = () => {
        try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) favorites = parsed;
        } catch (err) {
        console.error("Gagal membaca favorites dari storage", err);
        }
    };

    const saveFavoritesToStorage = () => {
        try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        } catch (err) {
        console.error("Gagal menyimpan favorites ke storage", err);
        }
    };

    const isFavorite = (name) => favorites.some((item) => item.name === name);

    const getFavoritesTotal = () => favorites.length;

    const updateFavoriteIndicator = () => {
        if (!favoriteCountBadge) return;
        const total = getFavoritesTotal();
        if (total > 0) {
        favoriteCountBadge.textContent = total;
        favoriteCountBadge.classList.add("visible-favorite-badge");
        } else {
        favoriteCountBadge.textContent = "";
        favoriteCountBadge.classList.remove("visible-favorite-badge");
        }
    };

    const syncFavoriteHearts = () => {
        const cards = document.querySelectorAll("#products .product-card");
        cards.forEach((card) => {
        const nameEl = card.querySelector(".product-name");
        const btn = card.querySelector(".product-fav-btn");
        if (!nameEl || !btn) return;

        const name = nameEl.textContent.trim();
        if (isFavorite(name)) {
            btn.classList.add("favorited");
        } else {
            btn.classList.remove("favorited");
        }
        });
    };

    const toggleFavorite = (product) => {
        if (!product.name) return;

        const idx = favorites.findIndex((item) => item.name === product.name);
        if (idx >= 0) {
        favorites.splice(idx, 1);
        } else {
        favorites.push(product);
        }

        saveFavoritesToStorage();
        updateFavoriteIndicator();
        syncFavoriteHearts();
    };

    const getFilteredFavorites = () => {
        const q = favoriteSearchQuery.toLowerCase();
        return favorites.filter(item => {
            const categoryMatch =
            activeFavoriteFilter === 'all' ||
            item.category === activeFavoriteFilter;
            const text = (item.name || '').toLowerCase();
            const searchMatch = !q || text.includes(q);
            return categoryMatch && searchMatch;
        });
    };


    const renderFavoriteModal = () => {
        if (!favoriteItemsContainer) return;

        favoriteItemsContainer.innerHTML = "";

        const visibleFavs = getFilteredFavorites();

        if (!visibleFavs.length) {
        favoriteItemsContainer.innerHTML =
            '<p style="text-align:center; font-size:0.9rem; color:var(--text-light);">Belum ada produk favorit (atau tidak cocok dengan filter/pencarian).</p>';
        return;
        }

        visibleFavs.forEach((fav) => {
        const row = document.createElement("div");
        row.className = "fav-item-card";
        row.dataset.name = fav.name;

        row.innerHTML = `
            <img class="fav-item-thumb" src="${fav.image || ""}" alt="${fav.name}">
            <div class="fav-item-text">
            <div class="fav-item-name">${fav.name}</div>
            <div class="fav-item-desc">${fav.description || ""}</div>
            </div>
            <button class="favorite-remove-btn" type="button">Hapus</button>
        `;

        const removeBtn = row.querySelector(".favorite-remove-btn");
        removeBtn.addEventListener("click", () => {
            const index = favorites.findIndex((item) => item.name === fav.name);
            if (index >= 0) {
            favorites.splice(index, 1);
            saveFavoritesToStorage();
            updateFavoriteIndicator();
            syncFavoriteHearts();
            renderFavoriteModal();
            }
        });

        favoriteItemsContainer.appendChild(row);
        });
    };

    const openFavoriteModal = () => {
        if (!favoriteModal) return;

        renderFavoriteModal();
        favoriteModal.classList.add("visible");

        if (profileMenu) profileMenu.classList.remove("visible");

        // tutup auth modal kalau sedang terbuka
        if (authModal) authModal.classList.remove("visible");
    };

    const closeFavoriteModal = () => {
        if (!favoriteModal) return;
        favoriteModal.classList.remove("visible");
    };

    if (profileMenuFavoriteBtn) {
        profileMenuFavoriteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openFavoriteModal();
        });
    }

    if (favoriteModalCloseBtn) {
        favoriteModalCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeFavoriteModal();
        });
    }

    if (favoriteModal) {
        favoriteModal.addEventListener("click", (e) => {
        if (e.target === favoriteModal) closeFavoriteModal();
        });
    }

    // Inisialisasi favorites & tombol love
    loadFavoritesFromStorage();
    updateFavoriteIndicator();

    const favButtons = document.querySelectorAll(
        "#products .product-card .product-fav-btn"
    );

    favButtons.forEach((btn) => {
        const card = btn.closest(".product-card");
        if (!card) return;

        const nameEl = card.querySelector(".product-name");
        const descEl = card.querySelector(".product-desc");
        const imgEl = card.querySelector("img");

        const product = {
        name: nameEl ? nameEl.textContent.trim() : "",
        description: descEl ? descEl.textContent.trim() : "",
        image: imgEl ? imgEl.getAttribute("src") : "",
        // optional kategori (bisa kamu atur sendiri)
        category: card.dataset.category || "all",
        };

        if (isFavorite(product.name)) {
        btn.classList.add("favorited");
        }

        btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleFavorite(product);
        });
    });

    syncFavoriteHearts();

    // Filter & search di modal favorit
    favFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            favFilterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // ⬇️ ambil dari data-fav-filter
            activeFavoriteFilter = btn.dataset.favFilter || 'all';

            renderFavoriteModal();
        });
    });

    if (favSearchInput) {
        favSearchInput.addEventListener("input", () => {
        favoriteSearchQuery = favSearchInput.value.trim();
        renderFavoriteModal();
        });
    }

    if (favSearchClear && favSearchInput) {
        favSearchClear.addEventListener("click", () => {
        favSearchInput.value = "";
        favoriteSearchQuery = "";
        renderFavoriteModal();
        });
    }

    /* =========================================================
        6. FORM KONTAK (FIRESTORE)
    ========================================================= */
    const contactForm = document.getElementById("contact-form");
    const sendMessageBtn = document.getElementById("send-message-btn");
    const formStatus = document.getElementById("form-status");

    const setStatus = (message, type, button, buttonText) => {
        if (formStatus && button) {
        formStatus.textContent = message;
        formStatus.className = "visible " + type;
        button.className = "btn btn-primary " + type;
        if (buttonText) button.textContent = buttonText;
        }
    };

    if (sendMessageBtn && contactForm) {
        sendMessageBtn.addEventListener("click", async () => {
        sendMessageBtn.className = "btn btn-primary";
        if (formStatus) formStatus.className = "";

        const name = contactForm.name.value.trim();
        const email = contactForm.email.value.trim();
        const message = contactForm.message.value.trim();

        if (!name || !email || !message) {
            setStatus(
            "Harap isi semua kolom yang wajib diisi.",
            "error",
            sendMessageBtn,
            "Kirim Ulang"
            );
            setTimeout(() => {
            if (formStatus) formStatus.className = "";
            if (sendMessageBtn) sendMessageBtn.textContent = "Kirim Pesan";
            }, 4000);
            return;
        }

        setStatus(
            "Mengirim pesan Anda...",
            "sending",
            sendMessageBtn,
            "Mengirim..."
        );
        sendMessageBtn.disabled = true;

        try {
            await addDoc(collection(db, "contacts"), {
            name,
            email,
            message,
            createdAt: serverTimestamp(),
            });

            setStatus(
            "Pesan berhasil terkirim! Terima kasih.",
            "success",
            sendMessageBtn,
            "Terkirim!"
            );
            contactForm.reset();

            setTimeout(() => {
            setStatus("", "", sendMessageBtn, "Kirim Pesan");
            sendMessageBtn.disabled = false;
            }, 5000);
        } catch (error) {
            console.error("Error adding document: ", error);
            let errorMessage =
            "Gagal mengirim pesan. Periksa konsol untuk detailnya.";
            if (error.message.includes("Missing or insufficient permissions")) {
            errorMessage = "Gagal: Aturan keamanan Firestore menolak akses.";
            } else if (error.message.includes("failed-precondition")) {
            errorMessage =
                "Gagal: Konfigurasi Firebase tidak valid atau tidak lengkap.";
            }

            setStatus(errorMessage, "error", sendMessageBtn, "Gagal!");
            setTimeout(() => {
            setStatus("", "", sendMessageBtn, "Kirim Pesan");
            sendMessageBtn.disabled = false;
            }, 6000);
        }
        });
    }

    /* =========================================================
        7. AUTH MODAL (LOGIN / REGISTER / FORGOT) + FIREBASE AUTH
    ========================================================= */
    const authModal = document.getElementById("auth-modal");
    const authModalCloseBtn = document.getElementById("auth-modal-close");
    const profileLoginBtn = document.getElementById("profile-login-btn");
    const profileRegisterBtn = document.getElementById("profile-register-btn");

    const authTabs = document.querySelectorAll(".auth-tab");
    const loginPanel = document.getElementById("auth-login-form");
    const registerPanel = document.getElementById("auth-register-form");
    const authStatusBox = document.getElementById("auth-status");

    const loginForm = loginPanel;
    const registerForm = registerPanel;
    const forgotBtn = document.getElementById("auth-forgot-password");

    const setAuthMessage = (msg) => {
        if (!authStatusBox) return;
        authStatusBox.textContent = msg || "";
    };

    const setAuthTab = (tabName) => {
        if (!loginPanel || !registerPanel) return;

        if (tabName === "register") {
        loginPanel.classList.add("hidden");
        registerPanel.classList.remove("hidden");
        } else {
        registerPanel.classList.add("hidden");
        loginPanel.classList.remove("hidden");
        }

        authTabs.forEach((btn) => {
        const target = btn.dataset.target || "login";
        btn.classList.toggle("auth-tab-active", target === tabName);
        });

        setAuthMessage("");
    };

    const openAuthModal = (initialTab = "login") => {
        if (!authModal) return;

        setAuthTab(initialTab);
        authModal.classList.add("visible");

        if (profileMenu) profileMenu.classList.remove("visible");

        // tutup favorite modal kalau sedang terbuka
        if (favoriteModal) favoriteModal.classList.remove("visible");
    };

    const closeAuthModal = () => {
        if (!authModal) return;
        authModal.classList.remove("visible");
        setAuthMessage("");
    };

    if (profileLoginBtn) {
        profileLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAuthModal("login");
        });
    }

    if (profileRegisterBtn) {
        profileRegisterBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAuthModal("register");
        });
    }

    if (authModalCloseBtn) {
        authModalCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeAuthModal();
        });
    }

    if (authModal) {
        authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeAuthModal();
        });
    }

    authTabs.forEach((tabBtn) => {
        tabBtn.addEventListener("click", () => {
        const target = tabBtn.dataset.target || "login";
        setAuthTab(target);
        });
    });

    // LOGIN
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector("#login-email")?.value.trim();
        const password = loginForm.querySelector("#login-password")?.value || "";

        if (!email || !password) {
            setAuthMessage("Email dan password wajib diisi.");
            return;
        }

        try {
            setAuthMessage("Sedang masuk...");
            await signInWithEmailAndPassword(auth, email, password);
            setAuthMessage("Berhasil masuk.");
            setTimeout(() => {
            closeAuthModal();
            }, 800);
        } catch (err) {
            console.error(err);
            setAuthMessage(err.message || "Gagal masuk.");
        }
        });
    }

    // REGISTER
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = registerForm.querySelector("#register-email")?.value.trim();
        const password =
            registerForm.querySelector("#register-password")?.value || "";
        const confirm =
            registerForm.querySelector("#register-confirm")?.value || "";

        if (!email || !password || !confirm) {
            setAuthMessage("Semua kolom wajib diisi.");
            return;
        }
        if (password !== confirm) {
            setAuthMessage("Konfirmasi password tidak sama.");
            return;
        }
        if (password.length < 6) {
            setAuthMessage("Password minimal 6 karakter.");
            return;
        }

        try {
            setAuthMessage("Membuat akun...");
            await createUserWithEmailAndPassword(auth, email, password);
            setAuthMessage("Akun berhasil dibuat. Silakan login.");
            setAuthTab("login");
        } catch (err) {
            console.error(err);
            setAuthMessage(err.message || "Gagal membuat akun.");
        }
        });
    }

    // FORGOT PASSWORD
    if (forgotBtn) {
        forgotBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = prompt("Masukkan email yang terdaftar:");
        if (!email) return;

        try {
            await sendPasswordResetEmail(auth, email.trim());
            alert("Link reset password sudah dikirim ke email tersebut.");
        } catch (err) {
            console.error(err);
            alert(
            "Gagal mengirim email reset: " + (err.message || "Unknown error")
            );
        }
        });
    }

    // UPDATE NAMA & EMAIL DI PROFILE MENU SAAT LOGIN/LOGOUT
    onAuthStateChanged(auth, (user) => {
        const nameSpan = document.querySelector(".profile-menu-name");
        const emailSpan = document.querySelector(".profile-menu-email");

        if (user) {
        const email = user.email || "";
        const displayName =
            user.displayName || email.split("@")[0] || "Pengguna Bamboe";

        if (nameSpan) nameSpan.textContent = displayName;
        if (emailSpan) emailSpan.textContent = email;
        } else {
        if (nameSpan) nameSpan.textContent = "Tamu Bamboe";
        if (emailSpan) emailSpan.textContent = "Belum login";
        }
    });
    /* =========================================================
    NEWS MODAL FIXED
    ========================================================= */
    const newsModal = document.getElementById("news-modal");
    const newsModalContent = document.querySelector(".news-modal-content");
    const newsModalClose = document.querySelector(".news-modal-close");

    document.querySelectorAll(".news-read-more").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute("data-news-target");
            const source = document.getElementById(targetId);
            if (!source) return;

            newsModalContent.innerHTML = source.innerHTML;
            newsModal.classList.add("visible");
            document.body.style.overflow = "hidden";
        });
    });

    const closeNewsModal = () => {
        newsModal.classList.remove("visible");
        newsModalContent.innerHTML = "";
        document.body.style.overflow = "";
    };

    newsModalClose.addEventListener("click", closeNewsModal);

    newsModal.addEventListener("click", (e) => {
        if (e.target === newsModal) closeNewsModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && newsModal.classList.contains("visible")) {
            closeNewsModal();
        }
    });

});
