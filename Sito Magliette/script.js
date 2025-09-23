// ============================================================================
// 🐙 POLPO MAGLIETTE - JavaScript System
// Adapted from polpo portfolio design system
// ============================================================================

const collectionSelect = document.getElementById("collection-select");
const typeSelect = document.getElementById("type-select");
const colorSelect = document.getElementById("color-select");
const sizeSelect = document.getElementById("size-select");
const nameEl = document.getElementById("product-name");
const descEl = document.getElementById("product-description");
const imageEl = document.getElementById("product-image");
const imageSpinner = document.getElementById("image-spinner");

let currentProduct = null;
let cart = [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let paypalButtonRendered = false;

emailjs.init("JyVULYbhjRGgAq9cb");

// ============================================================================
// DUAL THEME SYSTEM - Header Themes + Global Dark/Light Mode
// ============================================================================

const headerThemes = [
  { name: 'light', icon: '🌙', label: 'Dark' },
  { name: 'dark', icon: '🌈', label: 'Neon' },
  { name: 'neon', icon: '🌅', label: 'Sunset' },
  { name: 'sunset', icon: '🌊', label: 'Ocean' },
  { name: 'ocean', icon: '☀️', label: 'Light' }
];

let currentHeaderThemeIndex = 0;
let globalDarkMode = false;

// Initialize themes from localStorage
const savedHeaderTheme = localStorage.getItem('header-theme') || 'light';
const savedGlobalTheme = localStorage.getItem('global-theme') || 'light';
const savedIndex = headerThemes.findIndex(theme => theme.name === savedHeaderTheme);

currentHeaderThemeIndex = savedIndex >= 0 ? savedIndex : 0;
globalDarkMode = savedGlobalTheme === 'dark';

// Apply themes
document.body.dataset.headerTheme = headerThemes[currentHeaderThemeIndex].name;
document.body.dataset.globalTheme = savedGlobalTheme;
updateThemeButton();
updateMetaThemeColor(headerThemes[currentHeaderThemeIndex].name, globalDarkMode);

// Dual theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Click cycles header themes, Shift+Click toggles global dark mode
    themeToggle.addEventListener('click', function(e) {
      if (e.shiftKey) {
        toggleGlobalDarkMode();
      } else {
        cycleHeaderTheme();
      }
    });

    // Show tooltip hint
    themeToggle.title = 'Click: Cycle header theme | Shift+Click: Toggle dark mode';
  }
});

function cycleHeaderTheme() {
  // Cycle through all header themes
  currentHeaderThemeIndex = (currentHeaderThemeIndex + 1) % headerThemes.length;
  const newTheme = headerThemes[currentHeaderThemeIndex];

  document.body.dataset.headerTheme = newTheme.name;
  localStorage.setItem('header-theme', newTheme.name);
  updateThemeButton();

  // Update meta theme color
  updateMetaThemeColor(newTheme.name, globalDarkMode);
}

function toggleGlobalDarkMode() {
  globalDarkMode = !globalDarkMode;
  const newGlobalTheme = globalDarkMode ? 'dark' : 'light';

  document.body.dataset.globalTheme = newGlobalTheme;
  localStorage.setItem('global-theme', newGlobalTheme);
  updateThemeButton();

  // Update meta theme color
  updateMetaThemeColor(headerThemes[currentHeaderThemeIndex].name, globalDarkMode);

  // Show feedback
  showToast(`${globalDarkMode ? 'Dark' : 'Light'} mode enabled`, 'success');
}

function updateThemeButton() {
  const themeIcon = document.querySelector('.theme-icon');
  const themeText = document.querySelector('.theme-text');

  if (globalDarkMode) {
    // Show global dark mode status
    if (themeIcon && themeText) {
      themeIcon.textContent = '☀️';
      themeText.textContent = 'Light';
    }
  } else {
    // Show next header theme
    const nextTheme = headerThemes[(currentHeaderThemeIndex + 1) % headerThemes.length];
    if (themeIcon && themeText) {
      themeIcon.textContent = nextTheme.icon;
      themeText.textContent = nextTheme.label;
    }
  }
}


// ✅ Toast notification system
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ✅ Loading overlay system
function showOverlay(message) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'loading-overlay';
  overlay.innerHTML = `
    <div class="overlay-content">
      <div class="overlay-spinner"></div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function hideOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
}

// ✅ Image loading with spinner and lazy loading optimization
const imageCache = new Map();

function loadImageWithSpinner(src) {
  imageSpinner.style.display = 'block';
  imageEl.classList.add('loading');

  // ✅ Check cache first
  if (imageCache.has(src)) {
    imageEl.src = src;
    imageSpinner.style.display = 'none';
    imageEl.classList.remove('loading');
    return;
  }

  const img = new Image();

  img.onload = () => {
    // ✅ Add to cache
    imageCache.set(src, true);

    // ✅ Fade transition effect
    imageEl.style.opacity = '0';
    setTimeout(() => {
      imageEl.src = src;
      imageEl.style.opacity = '1';
      imageSpinner.style.display = 'none';
      imageEl.classList.remove('loading');
    }, 150);
  };

  img.onerror = () => {
    imageSpinner.style.display = 'none';
    imageEl.classList.remove('loading');
    showToast('Errore nel caricamento dell\'immagine', 'error');

    // ✅ Show placeholder on error
    imageEl.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltbWFnaW5lIG5vbiBkaXNwb25pYmlsZTwvdGV4dD48L3N2Zz4=';
  };

  // ✅ Preload with low priority
  img.loading = 'lazy';
  img.src = src;
}

// ✅ Preload next images for better UX
function preloadNextImages() {
  if (!currentProduct) return;

  const selectedType = typeSelect.value;
  const nextVariants = currentProduct.variants.filter(v =>
    v.type === selectedType && !imageCache.has(v.image)
  );

  nextVariants.slice(0, 2).forEach(variant => {
    const img = new Image();
    img.onload = () => imageCache.set(variant.image, true);
    img.src = variant.image;
  });
}

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.type} ${item.color} ${item.size} - €${item.price}`;

    // ✅ Animazione per nuovi elementi
    if (item.isNew) {
      li.classList.add('cart-item-new');
      delete item.isNew; // Rimuovi flag dopo animazione
    }

    cartItems.appendChild(li);
    total += item.price;
  });

  cartTotal.textContent = "Totale: €" + total.toFixed(2);
}

// ✅ Wishlist functions
function updateWishlistDisplay() {
  const wishlistItems = document.getElementById("wishlist-items");
  wishlistItems.innerHTML = "";

  wishlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 4px 0; background: rgba(255,255,255,0.1); border-radius: 6px;">
        <span>${item.type} ${item.color} ${item.size} - €${item.price}</span>
        <div>
          <button onclick="moveToCart(${index})" style="background: #27ae60; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-right: 5px; cursor: pointer;">🛒</button>
          <button onclick="removeFromWishlist(${index})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">❌</button>
        </div>
      </div>
    `;
    wishlistItems.appendChild(li);
  });

  updateWishlistCounter();
}

function updateWishlistCounter() {
  const wishlistBtn = document.getElementById("add-to-wishlist");
  const toggleBtn = document.getElementById("toggle-wishlist");
  const count = wishlist.length;

  if (count > 0) {
    wishlistBtn.textContent = `❤️ Wishlist (${count})`;
    toggleBtn.textContent = `👀 Wishlist (${count})`;
  } else {
    wishlistBtn.textContent = "♡ Wishlist";
    toggleBtn.textContent = "👀 Mostra Wishlist";
  }
}

function saveWishlist() {
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function addToWishlist() {
  const selectedType = typeSelect.value;
  const selectedColor = colorSelect.value;
  const selectedSize = sizeSelect.value;
  const variant = currentProduct.variants.find(v => v.type === selectedType && v.color === selectedColor);

  if (variant) {
    const wishlistItem = { ...variant, size: selectedSize };

    // Check if already in wishlist
    const exists = wishlist.some(item =>
      item.type === wishlistItem.type &&
      item.color === wishlistItem.color &&
      item.size === wishlistItem.size
    );

    if (exists) {
      showToast("Prodotto già nella wishlist!", "warning");
      return;
    }

    wishlist.push(wishlistItem);
    saveWishlist();
    updateWishlistDisplay();
    updateWishlistCounter();
    showToast(`${variant.type} ${variant.color} ${selectedSize} aggiunto alla wishlist!`);
  }
}

function moveToCart(index) {
  const item = wishlist[index];
  cart.push({ ...item, isNew: true });
  wishlist.splice(index, 1);
  saveWishlist();
  updateCartDisplay();
  updateWishlistDisplay();
  updateWishlistCounter();
  showToast("Prodotto spostato nel carrello!");
}

function removeFromWishlist(index) {
  wishlist.splice(index, 1);
  saveWishlist();
  updateWishlistDisplay();
  updateWishlistCounter();
  showToast("Rimosso dalla wishlist");
}

function loadCollections() {
  collectionSelect.innerHTML = "";
  products.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = p.name;
    collectionSelect.appendChild(opt);
  });
}

function loadProduct(index) {
  currentProduct = products[index];

  // Apply collection-specific theme
  applyCollectionTheme(currentProduct.themeClass);

  // Update main title
  const mainTitle = document.getElementById("main-title");
  mainTitle.textContent = `${currentProduct.name}`;

  nameEl.textContent = currentProduct.name;
  descEl.textContent = currentProduct.description;
  updateTypeSelect();
}

// ============================================================================
// COLLECTION THEME SYSTEM
// ============================================================================

function applyCollectionTheme(themeClass) {
  const body = document.body;

  // Remove existing collection classes
  body.classList.remove('collection-fijo', 'collection-gpower');

  // Map theme classes to collection classes
  const themeMap = {
    'theme-fijo': 'collection-fijo',
    'theme-gpower': 'collection-gpower'
  };

  // Apply new collection theme
  if (themeMap[themeClass]) {
    body.classList.add(themeMap[themeClass]);

    // Show collection wave banner
    showCollectionWaveBanner(themeMap[themeClass]);
  }
}

function updateMetaThemeColor(themeName, isDarkMode = false) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const colors = {
    'light': isDarkMode ? '#1a1a1a' : '#48dbfb',
    'dark': isDarkMode ? '#0f0f0f' : '#2c3e50',
    'neon': isDarkMode ? '#001a0f' : '#00ff88',
    'sunset': isDarkMode ? '#2a0f00' : '#ff6b35',
    'ocean': isDarkMode ? '#001122' : '#0077be'
  };

  if (metaThemeColor && colors[themeName]) {
    metaThemeColor.setAttribute('content', colors[themeName]);
  }
}

// ============================================================================
// COLLECTION WAVE BANNER SYSTEM
// ============================================================================

function showCollectionWaveBanner(collectionClass) {
  // Remove existing banner if present
  const existingBanner = document.getElementById('collection-wave-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  const bannerData = {
    'collection-fijo': {
      title: 'Fijo dell\'Amore',
      subtitle: 'Ironia • Amore • Fertilità • Minimalismo Provocatorio',
      icon: '♥',
      theme: 'fijo'
    },
    'collection-gpower': {
      title: 'G Power',
      subtitle: 'Forza • Femminilità • Potere • Pop-Art • Energia',
      icon: '⚡',
      theme: 'gpower'
    }
  };

  const data = bannerData[collectionClass];
  if (!data) return;

  // Create banner element
  const banner = document.createElement('div');
  banner.id = 'collection-wave-banner';
  banner.className = `wave-banner wave-banner-${data.theme}`;

  banner.innerHTML = `
    <div class="wave-banner-content">
      <div class="wave-banner-icon">${data.icon}</div>
      <div class="wave-banner-text">
        <h3 class="wave-banner-title">${data.title}</h3>
        <p class="wave-banner-subtitle">${data.subtitle}</p>
      </div>
    </div>
    <div class="wave-banner-wave"></div>
  `;

  // Add to page
  document.body.appendChild(banner);

  // Animate in
  setTimeout(() => banner.classList.add('wave-banner-show'), 100);

  // Auto remove after 4 seconds
  setTimeout(() => {
    banner.classList.remove('wave-banner-show');
    setTimeout(() => banner.remove(), 500);
  }, 4000);
}

function updateTypeSelect() {
  const types = [...new Set(currentProduct.variants.map(v => v.type))];
  typeSelect.innerHTML = "";
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeSelect.appendChild(opt);
  });
  updateColorSelect();
  // ✅ Preload images for current type
  setTimeout(preloadNextImages, 100);
}

function updateColorSelect() {
  const selectedType = typeSelect.value;
  const colors = currentProduct.variants.filter(v => v.type === selectedType);
  colorSelect.innerHTML = "";
  colors.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.color;
    opt.textContent = v.color;
    colorSelect.appendChild(opt);
  });
  updateSizeAndImage();
}

function updateSizeAndImage() {
  const selectedType = typeSelect.value;
  const selectedColor = colorSelect.value;
  const variant = currentProduct.variants.find(v => v.type === selectedType && v.color === selectedColor);
  if (!variant) return;
  sizeSelect.innerHTML = "";
  variant.sizes.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sizeSelect.appendChild(opt);
  });

  // ✅ Usa loading spinner per immagini
  loadImageWithSpinner(variant.image);
}

document.getElementById("add-to-cart").addEventListener("click", () => {
  const selectedType = typeSelect.value;
  const selectedColor = colorSelect.value;
  const selectedSize = sizeSelect.value;
  const variant = currentProduct.variants.find(v => v.type === selectedType && v.color === selectedColor);

  if (variant) {
    const addButton = document.getElementById("add-to-cart");
    const originalText = addButton.textContent;

    // ✅ Feedback visivo sul bottone
    addButton.classList.add('btn-success');
    addButton.textContent = '✓ Aggiunto!';

    // ✅ Aggiungi flag per animazione
    const cartItem = { ...variant, size: selectedSize, isNew: true };
    cart.push(cartItem);
    updateCartDisplay();

    // ✅ Toast notification
    showToast(`${variant.type} ${variant.color} ${selectedSize} aggiunto al carrello!`);

    // ✅ Reset bottone dopo 2 secondi
    setTimeout(() => {
      addButton.classList.remove('btn-success');
      addButton.textContent = originalText;
    }, 2000);
  }
});

// ✅ Funzione per pulire e creare il bottone PayPal
function renderPayPalButton(total, customerName) {
  const paypalContainer = document.getElementById("paypal-button-container");
  
  // ✅ PULISCE il container prima di creare un nuovo bottone
  paypalContainer.innerHTML = "";
  paypalButtonRendered = false;

  if (paypalButtonRendered) {
    console.log("Bottone PayPal già renderizzato, evito duplicati");
    return;
  }

  paypal.Buttons({
    createOrder: function (data, actions) {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: total
          },
          description: "Ordine magliette - " + customerName
        }]
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function (details) {
        alert("Pagamento completato da " + details.payer.name.given_name + "!");
        
        // ✅ Reset del carrello e form dopo pagamento completato
        cart = [];
        updateCartDisplay();
        document.getElementById("name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("address").value = "";
        document.getElementById("user-form").style.display = "block";
        document.getElementById("confirmation-message").style.display = "none";
        paypalButtonRendered = false;
      });
    },
    onError: function (err) {
      console.error("Errore PayPal:", err);
      alert("C'è stato un errore con PayPal.");
    },
    onCancel: function (data) {
      console.log("Pagamento cancellato dall'utente");
      // L'utente può riprovare, non resettiamo nulla
    }
  }).render('#paypal-button-container').then(() => {
    paypalButtonRendered = true; // ✅ Marca come renderizzato
    console.log("Bottone PayPal renderizzato con successo");
  });
}

document.getElementById("send-order").addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!name || !email || !address) {
    showToast("Compila tutti i campi!", "warning");
    return;
  }

  if (cart.length === 0) {
    showToast("Il carrello è vuoto!", "warning");
    return;
  }

  const orderDetails = cart.map(item =>
    `${item.type} ${item.color} ${item.size} - €${item.price}`
  ).join("\n");

  const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  const templateParams = {
    name,
    email,
    address,
    order: orderDetails,
    total
  };

  // ✅ Loading overlay durante invio
  showOverlay("Invio ordine in corso...");

  // ✅ Disabilita il bottone durante l'invio per evitare click multipli
  const sendButton = document.getElementById("send-order");
  sendButton.disabled = true;
  sendButton.textContent = "Invio in corso...";

  emailjs.send("service_9gg745u", "template_i4jsjda", templateParams)
    .then(() => {
      hideOverlay();
      showToast("Ordine inviato con successo! Procedi al pagamento.", "success");

      document.getElementById("user-form").style.display = "none";
      document.getElementById("confirmation-message").style.display = "block";

      // ✅ Render del bottone PayPal pulito
      renderPayPalButton(total, name);

    }, (error) => {
      hideOverlay();
      showToast("Errore nell'invio dell'ordine. Riprova.", "error");
      console.error("Errore EmailJS:", error);
    })
    .finally(() => {
      // ✅ Riabilita il bottone anche in caso di errore
      sendButton.disabled = false;
      sendButton.textContent = "Invia ordine e Paga";
    });
});

// ✅ Svuota carrello
document.getElementById("clear-cart").addEventListener("click", () => {
  cart = [];
  updateCartDisplay();
  showToast("Carrello svuotato");
});

// ✅ Wishlist event listeners
document.getElementById("add-to-wishlist").addEventListener("click", addToWishlist);

document.getElementById("clear-wishlist").addEventListener("click", () => {
  wishlist = [];
  saveWishlist();
  updateWishlistDisplay();
  updateWishlistCounter();
  showToast("Wishlist svuotata");
});

document.getElementById("toggle-wishlist").addEventListener("click", () => {
  const wishlistDiv = document.getElementById("wishlist");
  const toggleBtn = document.getElementById("toggle-wishlist");

  if (wishlistDiv.style.display === "none") {
    wishlistDiv.style.display = "block";
    toggleBtn.textContent = wishlist.length > 0 ? `🙈 Nascondi Wishlist (${wishlist.length})` : "🙈 Nascondi Wishlist";
  } else {
    wishlistDiv.style.display = "none";
    toggleBtn.textContent = wishlist.length > 0 ? `👀 Wishlist (${wishlist.length})` : "👀 Mostra Wishlist";
  }
});

collectionSelect.addEventListener("change", e => loadProduct(e.target.value));
typeSelect.addEventListener("change", updateColorSelect);
colorSelect.addEventListener("change", updateSizeAndImage);

// ============================================================================
// INITIALIZATION
// ============================================================================

loadCollections();
loadProduct(0);
updateWishlistCounter();

// Initialize header title
document.addEventListener('DOMContentLoaded', function() {
  const headerTitle = document.querySelector('.header-content .main-title');
  if (headerTitle && !headerTitle.textContent) {
    headerTitle.textContent = 'Magliette Store';
  }
});