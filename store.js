
document.addEventListener("DOMContentLoaded", () => {
	
  const salesLog = [];
  
  function logEvent(eventType, data = {}) {
	salesLog.push({
	  event: eventType,
	  ...data,
	  timestamp: new Date().toISOString()
	});
  }
  
  function downloadSalesJSON() {
	const blob = new Blob([JSON.stringify(salesLog, null, 2)], {
	  type: "application/json"
	});
	
	const url = URL.createObjectURL(blob);
	
	const a = document.createElement("a");
	a.href = url;
	a.download = "sales-data.json";
	a.click();
	
	URL.revokeObjectURL(url);
	
	logEvent("download-sales-data", {
	  count: salesLog.length
	});
  }
  
  function downloadSalesCSV() {
	if (salesLog.length === 0) {
	  alert("No available data.");
	  return;
	}
	
	// Extract all unique keys from dataset
	const headers = Object.keys(salesLog[0]);
	
	// Build CSV rows
	const csvRows = [];
	
	// Header row
	csvRows.push(headers.join(","));
	
	// Data rows
	salesLog.forEach(entry => {
	  const row = headers.map(h => {
	    let val = entry[h];
		
		// Convert objects (like items array) into JSON strings
		if (typeof val === "object") {
		  val = JSON.stringify(val).replace(/,/g, ";");
		}
		
		return val;
	  });
	  
	  csvRows.push(row.join(","));
	});
	
	const csvString = csvRows.join("\n");
	
	const blob = new Blob([csvString], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	
	const a = document.createElement("a");
	a.href = url;
	a.download = "sales-data-csv";
	a.click();
	
	URL.revokeObjectURL(url);
	
	logEvent("download-sales-data-csv", {
	  count: salesLog.length 
	});
  }

  /*=============================================================
      CART SYSTEM
  ============================================================== */

  const cartSidebar = document.getElementById("cart-sidebar");
  const openCartBtn = document.getElementById("open-cart");
  const closeCartBtn = document.getElementById("close-cart");
  const cartItemsContainer = document.getElementById("cart-items");
  const clearAllBtn = document.getElementById("clear-cart-info");
  const miniCartCount = document.getElementById("mini-cart-count");

  const TAX_RATE = 0.055;
  let cart = [];
  let selectedShipping = 0;

  /*=============================================================
      REMOVE / DECREASE QUANTITY
  ============================================================== */
  function removeFromCart(name) {
    const item = cart.find(i => i.name === name);
    if (!item) return;

    item.qty--;
	
	logEvent("decrease-qty", {
	  name,
	  newQty: item.qty
	});
	
    if (item.qty <= 0) {
      cart = cart.filter(i => i.name !== name);
	  
	  logEvent("remove", {
	    name
	  });
    }
  }

  /*=============================================================
      UPDATE MINI CART COUNT
  ============================================================== */
  function updateMiniCartCount() {
    const el = document.getElementById("mini-cart-count");
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    el.textContent = count;
  }

  /*=============================================================
      UPDATE CART TOTAL
  ============================================================== */
  function updateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = subtotal * TAX_RATE;
	const shipping = selectedShipping || 0;

    const total = subtotal + tax + shipping;

    document.getElementById("cart-total").innerHTML = 
     `Subtotal: $${subtotal.toFixed(2)}<br>
      Tax: $${tax.toFixed(2)}<br>
      Shipping: $${shipping.toFixed(2)}<br>
      <strong>Total: $${total.toFixed(2)}</strong>`;
    
  }

  /*=============================================================
      RENDER CART
  ============================================================== */
  function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>The cart is empty!</p>";
      updateCartTotal();
      updateMiniCartCount();
      return;
    }

    cart.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("cart-item");

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "10px";

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name;

      const info = document.createElement("div");
      info.style.flex = "1";

      const nameEl = document.createElement("strong");
      nameEl.textContent = item.name;

      const priceEl = document.createElement("div");
      priceEl.textContent = `Price: $${item.price.toFixed(2)}`;

      const lineTotalEl = document.createElement("div");
      lineTotalEl.textContent = `Line Total: $${(item.price * item.qty).toFixed(2)}`;

      const qtyControls = document.createElement("div");
      qtyControls.style.marginTop = "5px";

      const minusBtn = document.createElement("button");
      minusBtn.textContent = "-";
      minusBtn.addEventListener("click", () => {
        removeFromCart(item.name);
        renderCart();
      });

      const qtyEl = document.createElement("span");
      qtyEl.textContent = ` ${item.qty}`;

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", () => {
        item.qty++;
		
		logEvent("increase-qty", {
		  name: item.name,
		  newQty: item.qty
		});
		
        renderCart();
      });

      qtyControls.appendChild(minusBtn);
      qtyControls.appendChild(qtyEl);
      qtyControls.appendChild(plusBtn);

      info.appendChild(nameEl);
      info.appendChild(priceEl);
      info.appendChild(lineTotalEl);
      info.appendChild(qtyControls);

      row.appendChild(img);
      row.appendChild(info);

      div.appendChild(row);

      cartItemsContainer.appendChild(div);
    });

    updateCartTotal();
    updateMiniCartCount();

    if (cart.length > 0) {
      const selected = document.querySelector(`input[name="shipping"][value="${selectedShipping}"]`);
      if (selected) selected.checked = true;
    }
  }
  
  /*==============================================================
      CHECKOUT SYSTEM
  ============================================================== */
  function checkout() {
	const customer = {
	  country: document.getElementById("cust-country").value,
	  state: document.getElementById("cust-state").value,
	  city: document.getElementById("cust-city").value,
	  zip: document.getElementById("cust-zip").value,
	  age: document.getElementById("cust-age").value,
	  gender: document.getElementById("cust-gender").value
	};
	
	logEvent("checkout", {
	  customer,
	  items: cart.map(i => ({
		name: i.name,
		qty: i.qty,
		price: i.price,
		brand: i.brand,
		category: i.category,
		type: i.type,
		display: i.display 
	  })),
	  total: cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    });
	
	cart = [];
	renderCart();
	updateMiniCartCount();	
	cartItemsContainer.innerHTML = "<p>Order placed successfully!</p>";
  }

  /*==============================================================
      SEARCH SYSTEM
  ============================================================== */
  function fuzzyMatch(query, word) {
    query = query.toLowerCase();
    word = word.toLowerCase();

    if (query.length < 3) {
	  return word.includes(query);
	}

    if (word.includes(query)) return true;

    function levenshtein(a, b) {
      const dp = Array(a.length + 1).fill(null).map(() =>
        Array(b.length + 1).fill(null)
      );

      for (let i = 0; i <= a.length; i++) dp[i][0] = i;
      for (let j = 0; j <= b.length; j++) dp[0][j] = j;

      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
          );
        }
      }

      return dp[a.length][b.length];
    }

    const distance = levenshtein(query, word);
    const threshold = Math.max(1, Math.floor(query.length * 0.4));
    return distance <= threshold;
  }

  function applySearch() {
    const query = document.getElementById("search-input").value.toLowerCase().trim();
    const tiles = document.querySelectorAll(".product-tile");

    if (query === "" || query.length < 3) {
      document.getElementById("category-cards").style.display = "grid";
      document.querySelector(".products-container").style.display = "none";
      showEmptyState();
      return;
    }

    hideEmptyState();

    tiles.forEach(tile => {
      const name = tile.dataset.name.toLowerCase();
      const category = tile.dataset.category.toLowerCase();
      const type = tile.dataset.type.toLowerCase();

      let words = [
	    ...name.split(" "),
		tile.dataset.brand?.toLowerCase(),
		tile.dataset.category?.toLowerCase(),
		tile.dataset.type?.toLowerCase()
	  ].filter(Boolean);

      if (query.includes("gpu") || query.includes("rtx") || query.includes("gtx")) {
        words.push("graphics", "graphic", "graphicscard", "geforce", "rtx", "gtx", "videocard", "card");
      }
	  
      if (query.includes("cpu") || query.includes("ryzen") || query.includes("intel")) {
        words.push("processor", "chip", "cpu");
      }
	  
      if (query.includes("monitor") || query.includes("hz")) {
        words.push("display", "screen", "monitor", "monitors");
      }

      const match = words.some(word => fuzzyMatch(query, word));
      tile.style.display = match ? "block" : "none";
    });

    const anyVisible = [...tiles].some(t => t.style.display !== "none");

    if (!anyVisible) {
      document.getElementById("category-cards").style.display = "grid";
      document.querySelector(".products-container").style.display = "none";
      showEmptyState();
    } else {
      document.getElementById("category-cards").style.display = "none";
      document.querySelector(".products-container").style.display = "grid";
    }
  }

  /*=============================================================
      FILTER SYSTEM
  ============================================================== */
  function applyFilters() {
    const activeCategories = [];
    const activeTypes = [];
	const activeBrands = [];
	const activeDisplays = [];
	
	document.querySelectorAll("input[type='checkbox']:checked").forEach(cb => {
	  if (cb.id.startsWith("display-")) {
		activeDisplays.push(cb.id.replace("display-", "").toUpperCase());
	  }
	});

    // CATEGORY + TYPE + BRAND FILTERS
    document.querySelectorAll("input[type='checkbox']:checked")
      .forEach(cb => {
        if (cb.name === "shipping") return;
		
		// BRAND FILTERS
		if (cb.classList.contains("brand-filter")) {
		  activeBrands.push(cb.value);
		  return;
		}

        const id = cb.id;
		
		// CATEGORY FILTERS 
		if (id.endsWith("-checkbox")) {
		  activeCategories.push(id.replace("-checkbox", ""));
		  return;
		}
		
		// TYPE FILTERS
        if (!id.startsWith("display-")) {			
		  activeTypes.push(id);
		}
	  });
	  
      const anyFiltersActive = 
	    activeCategories.length > 0 || 
		activeTypes.length > 0 ||
		activeBrands.length > 0 ||
		activeDisplays.length > 0;

      if (!anyFiltersActive) {
        showEmptyState();
      } else {
        hideEmptyState();
      }

      document.getElementById("category-cards").style.display = 
	    anyFiltersActive ? "none" : "grid";
    
	  document.querySelector(".products-container").style.display = 
	    anyFiltersActive ? "grid" : "none";

      const categoryMap = {
		kb: ["kb"],
		mouse: ["mouse"],
		speakers: ["speakers"],
		headphones: ["headphones"],
		webcams: ["webcams"],
		monitors: ["monitors"],
		
		// Grouped storage categories
		hdd: ["xhdd", "inthdd"],
		ssd: ["xssd", "intssd"],
		
		ram: ["ram"],
		gpu: ["gpu"],
		cpu: ["cpu"],
		motherboard: ["motherboard"],
		psu: ["psu"],
		nic: ["nic"],
		cases: ["cases"]
	  };

      // APPLY FILTERS TO PRODUCT TILES 
      document.querySelectorAll(".product-tile").forEach(tile => {
        const tileCategory = tile.dataset.category;
        const tileType = tile.dataset.type;
	    const tileBrand = tile.dataset.brand;
		const tileDisplay = tile.dataset.display;

        let show = true;

        if (activeDisplays.length > 0 && !activeDisplays.includes(tileDisplay)) {
		  show = false;
		}

        if (activeCategories.length > 0) {
		  const matchesCategory = activeCategories.some(cat =>
		    categoryMap[cat]?.includes(tileCategory)
		  );
		  
		  if (!matchesCategory) show = false;
		}
	  
        if (activeTypes.length > 0 && !activeTypes.includes(tileType)) { 
	      show = false;
	    }
	  
	    if (activeBrands.length > 0 && !activeBrands.includes(tileBrand)) {
		  show = false;
	    }

        tile.style.display = show ? "block" : "none";
      });
    }
  

  /*=============================================================
      EMPTY STATE
  ============================================================== */
  function showEmptyState() {
    document.getElementById("empty-state").style.display = "block";
  }

  function hideEmptyState() {
    document.getElementById("empty-state").style.display = "none";
  }

  /*=============================================================
      EVENT LISTENERS
  ============================================================== */

  document.addEventListener("change", event => {
	const t = event.target;
	
	if (t.name === "shipping") return;
	if (t.id === "clear-all") return;
	
	// CATEGORY FILTERS
	if (t.id.endsWith("-checkbox")) {
	  applyFilters();
	  return;
	}
	
	// BRAND FILTERS 
	if (t.classList.contains("brand-filter")) {
	  applyFilters();
	  return;
	}
	
	// DISPLAY FILTERS 
	if (t.id.startsWith("display-")) {
	  applyFilters();
	  return;
	}
	
	// TYPE FILTERS (all other checkboxes)
	if (t.type === "checkbox") {
	  applyFilters();
	  return;
	}
  });
    
  // SHIPPING LISTENER
  document.querySelectorAll('input[name="shipping"]').forEach(radio => {
    radio.addEventListener("change", () => {
      selectedShipping = parseFloat(radio.value);
	  updateCartTotal();
	});      
  });

  clearAllBtn.addEventListener("click", () => {

    // Clear cart
    cart = [];
    renderCart();
    updateMiniCartCount();

    // Clear customer info
    const customerFields = [
      "cust-country",
      "cust-state",
      "cust-city",
      "cust-zip",
      "cust-age",
      "cust-gender"
    ];

    customerFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    // Clear filters safely
    const priceMin = document.getElementById("price-min");
    const priceMax = document.getElementById("price-max");
  
    if (priceMin) priceMin.value = "";
    if (priceMax) priceMax.value = "";
  
    // Clear all checkboxes
    document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);

    // Reapply filters safely
    applyFilters();

    // Button animation
    clearAllBtn.classList.add("cleared");
    setTimeout(() => clearAllBtn.classList.remove("cleared"), 500);
  });

  
  document.addEventListener("click", event => {
    if (event.target.classList.contains("add-to-cart")) {
      const tile = event.target.closest(".product-tile");
	  
      const name = tile.dataset.name;
      const price = parseFloat(tile.dataset.price);
      const image = tile.dataset.image;
	  const brand = tile.dataset.brand;
	  const category = tile.dataset.category;
	  const type = tile.dataset.type;
	  const display = tile.dataset.display;

      const existing = cart.find(item => item.name === name);

      if (existing) {
        existing.qty++;
		
		logEvent("increase-qty", {
		  name,
		  price,
		  brand,
		  category,
		  type,
		  display,
		  newQty: existing.qty
		});
		
      } else {
        cart.push({ name, qty: 1, price, image, brand, category, type, display });
		
		logEvent("add", {
		  name,
		  price,
		  brand,
		  category,
		  type,
		  display,
		  qty: 1
		});
      }

      renderCart();
      updateMiniCartCount();
    }
  });
  
  document.getElementById("clear-all").addEventListener("click", () => {

    // Clear all filter checkboxes
    document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);

    // Clear search bar
    const search = document.getElementById("search-input");
    if (search) search.value = "";

    // Reapply filters
    applyFilters();

    // Show empty state
    showEmptyState();
  });

  document.getElementById("search-input").addEventListener("input", applySearch);

  document.getElementById("mini-cart").addEventListener("click", () => {
    cartSidebar.classList.add("open");
  });

  openCartBtn.addEventListener("click", () => {
    cartSidebar.classList.add("open");
  });

  closeCartBtn.addEventListener("click", () => {
    cartSidebar.classList.remove("open");
  });
  
  document.getElementById("checkout").addEventListener("click", checkout);

  const cardToCheckboxMap = {
	xhdd: "hdd",
	inthdd: "hdd",
	xssd: "ssd",
	intssd: "ssd"
  };

  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;

      document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);

      let mappedCategory = category;
	  
	  // Map storage subcategories → parent category 
	  if (cardToCheckboxMap[category]) {
		mappedCategory = cardToCheckboxMap[category];
	  }

      const catBox = document.getElementById(mappedCategory + "-checkbox");
      if (catBox) catBox.checked = true;

      applyFilters();

      document.querySelector(".products-container").scrollIntoView({ behavior: "smooth" });
    });
  });
  
  document.getElementById("download-sales-json").addEventListener("click", downloadSalesJSON);
  document.getElementById("download-sales-csv").addEventListener("click", downloadSalesCSV);

  /*=============================================================
      INITIAL LOAD
  ============================================================== */
  applyFilters();
});
