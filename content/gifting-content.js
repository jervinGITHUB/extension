/**
 * DVN_Jerv — In-Page Roblox Gifting Feature
 * Injects an authentic "Gift" button directly below the "Buy" button on Roblox catalog/bundle pages,
 * and handles the visual Roblox Gifting confirmation modal & success celebration popup.
 */
(function () {
  'use strict';

  // Prevent double initialization
  if (window.__erxGiftingContentInitialized) return;
  window.__erxGiftingContentInitialized = true;

  // Known preset catalog database for high-accuracy details & fallback images
  const KNOWN_PRESETS = {
    '192': {
      id: '192',
      name: 'Korblox Deathspeaker',
      category: 'Character / Bundle',
      price: 17000,
      image: 'https://tr.rbxcdn.com/180DAY-1a6296d91da3295f70a1cb64bbfb9f1d/420/420/Avatar/Webp/noFilter',
      color: '#00b0ff'
    },
    '201': {
      id: '201',
      name: 'Headless Horseman',
      category: 'Character / Bundle',
      price: 31000,
      image: 'https://tr.rbxcdn.com/180DAY-7ee4e5cb4ba677c7d4ea5481fe973dd1/420/420/Avatar/Webp/noFilter',
      color: '#ff9800'
    },
    '21070012': {
      id: '21070012',
      name: 'Dominus Empyreus',
      category: 'Limited Accessory',
      price: 69000000,
      image: 'https://tr.rbxcdn.com/180DAY-d89613e5ae8e3f94be54ebf7bb25ae54/420/420/Hat/Webp/noFilter',
      color: '#ffe082'
    },
    '1365767': {
      id: '1365767',
      name: 'Valkyrie Helm',
      category: 'Accessory / Hat',
      price: 250000,
      image: 'https://tr.rbxcdn.com/180DAY-b0244ca76c8c0e29b110bc51a0ae63e9/420/420/Hat/Webp/noFilter',
      color: '#4fc3f7'
    },
    '494291269': {
      id: '494291269',
      name: 'Super Super Happy Face',
      category: 'Face Accessory',
      price: 185000,
      image: 'https://tr.rbxcdn.com/180DAY-d035414f52e5d957ba4e414c1fa0b65f/420/420/Face/Webp/noFilter',
      color: '#ff80ab'
    },
    '11748356': {
      id: '11748356',
      name: "Clockwork's Shades",
      category: 'Accessory / Glasses',
      price: 420000,
      image: 'https://tr.rbxcdn.com/180DAY-b422a57835d038237ba5e80cb5f13459/420/420/Hat/Webp/noFilter',
      color: '#00e676'
    },
    '1031429': {
      id: '1031429',
      name: 'Fiery Horns of the Netherworld',
      category: 'Accessory / Hat',
      price: 95000,
      image: 'https://tr.rbxcdn.com/180DAY-927b233a0172bf42e2b9c7b949c83ce4/420/420/Hat/Webp/noFilter',
      color: '#ff5722'
    },
    '1285307': {
      id: '1285307',
      name: 'Sparkle Time Fedora',
      category: 'Limited Accessory',
      price: 1200000,
      image: 'https://tr.rbxcdn.com/180DAY-5bb53f9154a4ba713ff406d44a2512f4/420/420/Hat/Webp/noFilter',
      color: '#00e5ff'
    }
  };

  /**
   * Helper to format numbers with commas
   */
  function formatNumber(num) {
    return Number(num || 0).toLocaleString('en-US');
  }

  /**
   * Safe getter for chrome storage / localStorage
   */
  function getStorage(keys, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, callback);
    } else {
      const res = {};
      keys.forEach(k => {
        try {
          const val = localStorage.getItem(k);
          res[k] = val ? JSON.parse(val) : undefined;
        } catch (e) {
          res[k] = undefined;
        }
      });
      callback(res);
    }
  }

  /**
   * Safe setter for chrome storage / localStorage
   */
  function setStorage(data, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, callback);
    } else {
      Object.keys(data).forEach(k => {
        try {
          localStorage.setItem(k, JSON.stringify(data[k]));
        } catch (e) {}
      });
      if (callback) callback();
    }
  }

  /**
   * Scrapes current item details from the page or presets
   */
  function getCurrentItemDetails() {
    const path = window.location.pathname;
    const match = path.match(/\/(?:catalog|bundles|items)\/(\d+)/i);
    const itemId = match ? match[1] : '';

    // Check preset first
    if (itemId && KNOWN_PRESETS[itemId]) {
      return { ...KNOWN_PRESETS[itemId] };
    }

    // Try name scraping
    const nameEl = document.querySelector(
      '.item-name-container h1, [data-testid="item-name"], .item-title, h1.item-name, h1'
    );
    let name = nameEl ? nameEl.textContent.trim() : '';
    if (!name) {
      const titleMatch = document.title.split('-')[0];
      name = titleMatch ? titleMatch.trim() : 'Roblox Item';
    }

    // Check if name matches any known item
    const lowerName = name.toLowerCase();
    if (lowerName.includes('korblox')) return { ...KNOWN_PRESETS['192'] };
    if (lowerName.includes('headless')) return { ...KNOWN_PRESETS['201'] };
    if (lowerName.includes('empyreus')) return { ...KNOWN_PRESETS['21070012'] };
    if (lowerName.includes('valkyrie')) return { ...KNOWN_PRESETS['1365767'] };
    if (lowerName.includes('super super happy face')) return { ...KNOWN_PRESETS['494291269'] };

    // Scrape price
    const priceEl = document.querySelector(
      '.text-robux-lg, .item-price-value, [data-testid="item-price"], .price-container .text-robux'
    );
    let price = 0;
    if (priceEl) {
      const parsed = parseInt(priceEl.textContent.replace(/\D+/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) price = parsed;
    }
    if (price === 0) price = 1000; // fallback reasonable price

    // Scrape category
    let category = 'Accessory';
    if (path.includes('/bundles/')) category = 'Character / Bundle';
    else if (path.includes('/catalog/')) category = 'Catalog Accessory';

    // Scrape thumbnail
    const thumbEl = document.querySelector(
      '.thumbnail-span img, [data-testid="item-thumbnail"] img, .item-thumbnail-container img, #item-container img'
    );
    let image = thumbEl ? thumbEl.src : '';

    return {
      id: itemId || 'custom',
      name: name || 'Roblox Accessory',
      category: category,
      price: price,
      image: image,
      color: '#00b06f'
    };
  }

  /**
   * Locates the Roblox Buy button or its parent container
   */
  function findBuyButtonContainer() {
    // 1. Direct price-row-container
    const priceRow = document.querySelector('.price-row-container');
    if (priceRow) return priceRow;

    // 2. Buy button container testid
    const buyBtn = document.querySelector(
      '[data-testid="item-details-buy-button"], [data-testid="item-purchase-button"], button.shopping-cart-buy-button, button.PurchaseButton, .item-purchase-btns-container'
    );
    if (buyBtn) {
      return buyBtn.parentElement;
    }

    // 3. Fallback to item details actions
    const detailsActions = document.querySelector('#item-details-actions, .item-details-actions');
    if (detailsActions) return detailsActions;

    return null;
  }

  /**
   * Injects the Gift button below the Buy button
   */
  function injectGiftButton() {
    // Avoid double injection
    if (document.getElementById('erx-roblox-gift-btn')) return;

    const container = findBuyButtonContainer();
    if (!container) return;

    const item = getCurrentItemDetails();

    // Create authentic Roblox Gift Button
    const giftBtn = document.createElement('button');
    giftBtn.id = 'erx-roblox-gift-btn';
    giftBtn.className = 'erx-roblox-gift-btn';
    giftBtn.type = 'button';
    giftBtn.title = `Gift ${item.name} to a friend`;

    giftBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"></polyline>
        <rect x="2" y="7" width="20" height="5"></rect>
        <line x1="12" y1="22" x2="12" y2="7"></line>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
      </svg>
      <span class="gift-btn-text">Gift</span>
      <span class="gift-btn-badge">R$</span>
    `;

    giftBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openGiftingModal();
    });

    // Insert directly below the buy button / container
    if (container.classList && container.classList.contains('price-row-container')) {
      container.parentNode.insertBefore(giftBtn, container.nextSibling);
    } else {
      container.appendChild(giftBtn);
    }
  }

  /**
   * Opens the authentic Roblox Gifting confirmation modal
   */
  function openGiftingModal() {
    const existing = document.getElementById('erx-gift-overlay');
    if (existing) existing.remove();

    const item = getCurrentItemDetails();

    // Fetch Robux balance from storage
    getStorage(['robuxAmount', 'customRobux', 'transactions'], function (data) {
      let currentRobux = 50000;
      if (typeof data.robuxAmount === 'number' || typeof data.robuxAmount === 'string') {
        const parsed = parseInt(data.robuxAmount, 10);
        if (!isNaN(parsed)) currentRobux = parsed;
      } else if (typeof data.customRobux === 'number') {
        currentRobux = data.customRobux;
      }

      const balanceAfter = Math.max(0, currentRobux - item.price);
      const isInsufficient = currentRobux < item.price;

      // Overlay
      const overlay = document.createElement('div');
      overlay.id = 'erx-gift-overlay';
      overlay.className = 'erx-gift-overlay';

      // Dialog container
      const dialog = document.createElement('div');
      dialog.className = 'erx-gift-dialog';

      dialog.innerHTML = `
        <div class="erx-gift-dialog-header">
          <h2 class="erx-gift-dialog-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect x="2" y="7" width="20" height="5"></rect>
              <line x1="12" y1="22" x2="12" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
            <span>Gift Item</span>
          </h2>
          <button type="button" class="erx-gift-close-btn" id="erx-gift-close" aria-label="Close">&times;</button>
        </div>

        <div class="erx-gift-dialog-body" id="erx-gift-dialog-body">
          <!-- Item Showcase -->
          <div class="erx-gift-item-showcase">
            <div class="erx-gift-item-thumb-frame">
              ${
                item.image
                  ? `<img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.parentElement.innerHTML='<span class=\\'erx-gift-item-thumb-fallback\\'>🎁</span>';" />`
                  : `<span class="erx-gift-item-thumb-fallback">🎁</span>`
              }
            </div>
            <div class="erx-gift-item-info">
              <span class="erx-gift-item-category">${item.category}</span>
              <h3 class="erx-gift-item-name" title="${item.name}">${item.name}</h3>
              <div class="erx-gift-item-price-tag">
                <span class="erx-gift-robux-glyph">R$</span>
                <span>${formatNumber(item.price)}</span>
              </div>
            </div>
          </div>

          <!-- Recipient Selection -->
          <div class="erx-gift-field-group">
            <label class="erx-gift-field-label">Recipient Username</label>
            <div class="erx-gift-input-row">
              <div class="erx-gift-recipient-avatar" id="erx-recipient-avatar">
                <span>F</span>
              </div>
              <input
                id="erx-gift-username-input"
                class="erx-gift-input"
                type="text"
                placeholder="Enter Roblox Username"
                value="FriendUser"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
            <div class="erx-gift-quick-recipients">
              <span class="erx-gift-quick-badge" data-user="FriendUser">@FriendUser</span>
              <span class="erx-gift-quick-badge" data-user="BestieRoblox">@BestieRoblox</span>
              <span class="erx-gift-quick-badge" data-user="ProGamer99">@ProGamer99</span>
            </div>
          </div>

          <!-- Gift Note -->
          <div class="erx-gift-field-group">
            <label class="erx-gift-field-label">Personal Message (Optional)</label>
            <input
              id="erx-gift-note-input"
              class="erx-gift-note-input"
              type="text"
              placeholder="e.g. Enjoy the Korblox!"
              value="Enjoy your gift!"
              maxlength="80"
            />
          </div>

          <!-- Balance Breakdown -->
          <div class="erx-gift-balance-card">
            <div class="erx-gift-balance-row">
              <span>Your Robux Balance</span>
              <span class="erx-gift-balance-val">R$ ${formatNumber(currentRobux)}</span>
            </div>
            <div class="erx-gift-balance-row">
              <span>Gift Item Price</span>
              <span class="erx-gift-balance-val deduct">- R$ ${formatNumber(item.price)}</span>
            </div>
            <div class="erx-gift-balance-row total">
              <span>Balance After Gift</span>
              <span class="erx-gift-balance-val final">R$ ${formatNumber(balanceAfter)}</span>
            </div>
          </div>
        </div>

        <div class="erx-gift-dialog-footer" id="erx-gift-dialog-footer">
          <button type="button" class="erx-gift-btn-cancel" id="erx-btn-cancel-gift">Cancel</button>
          <button type="button" class="erx-gift-btn-send" id="erx-btn-send-gift">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>Send Gift</span>
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Setup close buttons
      const closeBtn = dialog.querySelector('#erx-gift-close');
      const cancelBtn = dialog.querySelector('#erx-btn-cancel-gift');
      const sendBtn = dialog.querySelector('#erx-btn-send-gift');
      const userInput = dialog.querySelector('#erx-gift-username-input');
      const avatarBox = dialog.querySelector('#erx-recipient-avatar');
      const noteInput = dialog.querySelector('#erx-gift-note-input');

      function closeModal() {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 180);
      }

      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });

      // Quick recipient badge clicks
      dialog.querySelectorAll('.erx-gift-quick-badge').forEach(b => {
        b.addEventListener('click', () => {
          const user = b.getAttribute('data-user');
          userInput.value = user;
          updateAvatarLetter(user);
        });
      });

      function updateAvatarLetter(name) {
        const clean = (name || '').trim().replace(/^@/, '');
        const letter = clean.charAt(0).toUpperCase() || '?';
        avatarBox.innerHTML = `<span>${letter}</span>`;
      }

      userInput.addEventListener('input', () => {
        updateAvatarLetter(userInput.value);
      });

      // Send Gift Click
      sendBtn.addEventListener('click', function () {
        const recipient = (userInput.value || 'Friend').trim().replace(/^@/, '');
        const note = (noteInput.value || '').trim();

        // Button loading state
        sendBtn.disabled = true;
        sendBtn.innerHTML = `
          <svg class="erx-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:erx-spin 0.7s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.3"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg>
          <span>Sending...</span>
        `;

        setTimeout(function () {
          // Calculate new balance
          const newBalance = Math.max(0, currentRobux - item.price);

          // Update chrome storage
          getStorage(['transactions', 'purchasedCatalogItems'], function (prev) {
            const txs = Array.isArray(prev.transactions) ? prev.transactions : [];
            const newTx = {
              id: Date.now(),
              name: `Gift: ${item.name}`,
              recipient: recipient,
              note: note,
              amount: -item.price,
              date: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'gift'
            };
            txs.unshift(newTx);

            const items = Array.isArray(prev.purchasedCatalogItems) ? prev.purchasedCatalogItems : [];
            if (!items.includes(item.id)) items.push(item.id);

            setStorage(
              {
                robuxAmount: newBalance,
                customRobux: newBalance,
                transactions: txs,
                purchasedCatalogItems: items
              },
              function () {
                // Update in-page Robux balance header if present
                updateInPageRobuxHeader(newBalance);

                // Render authentic Roblox Success celebration modal
                showSuccessCelebration(dialog, item, recipient, newBalance);
              }
            );
          });
        }, 600);
      });
    });
  }

  /**
   * Updates any in-page Robux balance header in the Roblox DOM
   */
  function updateInPageRobuxHeader(newBalance) {
    const robuxHeaders = document.querySelectorAll(
      '#nav-robux-amount, .robux-header-amount, [data-testid="nav-robux-amount"], #nav-robux-balance'
    );
    robuxHeaders.forEach(el => {
      el.textContent = formatNumber(newBalance);
    });
  }

  /**
   * Renders the authentic Roblox Gifting Success modal
   */
  function showSuccessCelebration(dialog, item, recipient, newBalance) {
    dialog.innerHTML = `
      <div class="erx-gift-dialog-header">
        <h2 class="erx-gift-dialog-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b06f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Gift Delivered</span>
        </h2>
        <button type="button" class="erx-gift-close-btn" id="erx-success-close" aria-label="Close">&times;</button>
      </div>

      <div class="erx-gift-success-view">
        <!-- Animated Green Checkmark -->
        <div class="erx-gift-checkmark-wrap">
          <svg class="erx-gift-checkmark-svg" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h3 class="erx-gift-success-title">Gift Sent!</h3>
        <p class="erx-gift-success-desc">
          Your gift of <strong>${item.name}</strong> was successfully delivered to <strong>@${recipient}</strong>!
        </p>

        <!-- Receipt Card -->
        <div class="erx-gift-receipt-card">
          <div class="erx-gift-receipt-row">
            <span>Item</span>
            <b>${item.name}</b>
          </div>
          <div class="erx-gift-receipt-row">
            <span>Recipient</span>
            <b>@${recipient}</b>
          </div>
          <div class="erx-gift-receipt-row">
            <span>Price Paid</span>
            <b style="color:#00b06f;">R$ ${formatNumber(item.price)}</b>
          </div>
          <div class="erx-gift-receipt-row" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px; margin-top:2px;">
            <span>Remaining Robux</span>
            <b style="color:#fff;">R$ ${formatNumber(newBalance)}</b>
          </div>
        </div>

        <button type="button" class="erx-gift-btn-done" id="erx-btn-done-gift">Done</button>
      </div>
    `;

    // Burst confetti ribbons
    burstConfetti(dialog);

    function dismiss() {
      const overlay = document.getElementById('erx-gift-overlay');
      if (overlay) overlay.remove();
    }

    const doneBtn = dialog.querySelector('#erx-btn-done-gift');
    const closeBtn = dialog.querySelector('#erx-success-close');
    if (doneBtn) doneBtn.addEventListener('click', dismiss);
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
  }

  /**
   * Creates celebratory confetti ribbons
   */
  function burstConfetti(container) {
    const colors = ['#00b06f', '#00b0ff', '#ffeb3b', '#e91e63', '#9c27b0', '#ff9800'];
    for (let i = 0; i < 24; i++) {
      const particle = document.createElement('div');
      particle.className = 'erx-confetti-particle';
      particle.style.background = colors[i % colors.length];
      particle.style.left = `${30 + Math.random() * 40}%`;
      particle.style.top = '25%';

      const tx = (Math.random() - 0.5) * 260;
      const ty = (Math.random() * 180) + 40;
      const rot = (Math.random() - 0.5) * 720;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.setProperty('--rot', `${rot}deg`);

      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1200);
    }
  }

  // Initial injection attempt
  injectGiftButton();

  // Robust observer to handle SPA client-side routing on roblox.com
  let debounceTimer = null;
  const observer = new MutationObserver(function () {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      injectGiftButton();
    }, 150);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen to popstate & custom erx navigation events
  window.addEventListener('popstate', () => setTimeout(injectGiftButton, 200));
  window.addEventListener('erx-nav-change', () => setTimeout(injectGiftButton, 200));

  // Expose global trigger for manual simulation testing
  window.__erxOpenGiftingModal = openGiftingModal;
  window.__erxInjectGiftButton = injectGiftButton;
})();
