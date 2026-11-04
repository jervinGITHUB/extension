/**
 * DVN_Jerv — In-Page Roblox Buy & Gifting Feature
 * Injects authentic "Buy" and "Gift" buttons on Roblox bundle and catalog pages
 * (e.g. Korblox Deathspeaker, Headless Horseman, accessories) with realistic
 * Roblox purchase and gifting confirmation modals & success celebration popups.
 */
(function () {
  'use strict';

  // Prevent multiple initializations in the same context
  if (window.__erxGiftingContentInitialized) return;
  window.__erxGiftingContentInitialized = true;

  // Known catalog & bundle presets for pixel-accurate details
  const KNOWN_PRESETS = {
    '192': {
      id: '192',
      name: 'Korblox Deathspeaker',
      creator: 'Roblox',
      category: 'Character / Bundle',
      price: 17000,
      image: 'https://tr.rbxcdn.com/180DAY-1a6296d91da3295f70a1cb64bbfb9f1d/420/420/Avatar/Webp/noFilter',
      desc: 'His tribe is widely considered the best and strongest of the twelve Korblox tribes. No one dares challenge his authority.'
    },
    '201': {
      id: '201',
      name: 'Headless Horseman',
      creator: 'Roblox',
      category: 'Character / Bundle',
      price: 31000,
      image: 'https://tr.rbxcdn.com/180DAY-7ee4e5cb4ba677c7d4ea5481fe973dd1/420/420/Avatar/Webp/noFilter',
      desc: 'Haunting the crossroads every Halloween season, the Headless Horseman carries his glowing pumpkin jack-o-lantern. Includes the legendary invisible Head!'
    },
    '21070012': {
      id: '21070012',
      name: 'Dominus Empyreus',
      creator: 'Roblox',
      category: 'Limited Accessory',
      price: 69000000,
      image: 'https://tr.rbxcdn.com/180DAY-d89613e5ae8e3f94be54ebf7bb25ae54/420/420/Hat/Webp/noFilter',
      desc: 'Supreme divinity draped in golden feathers. The pinnacle artifact of Roblox history.'
    },
    '1365767': {
      id: '1365767',
      name: 'Valkyrie Helm',
      creator: 'Roblox',
      category: 'Accessory / Hat',
      price: 250000,
      image: 'https://tr.rbxcdn.com/180DAY-b0244ca76c8c0e29b110bc51a0ae63e9/420/420/Hat/Webp/noFilter',
      desc: 'A sacred helm forged by Norse gods with angelic wing guards. Wear the emblem of royalty.'
    },
    '494291269': {
      id: '494291269',
      name: 'Super Super Happy Face',
      creator: 'Roblox',
      category: 'Face Accessory',
      price: 185000,
      image: 'https://tr.rbxcdn.com/180DAY-d035414f52e5d957ba4e414c1fa0b65f/420/420/Face/Webp/noFilter',
      desc: 'Radiating eternal joy across the Metaverse! Highly coveted limited face.'
    },
    '11748356': {
      id: '11748356',
      name: "Clockwork's Shades",
      creator: 'Clockwork',
      category: 'Accessory / Glasses',
      price: 420000,
      image: 'https://tr.rbxcdn.com/180DAY-b422a57835d038237ba5e80cb5f13459/420/420/Hat/Webp/noFilter',
      desc: 'The original iconic shades created by Clockwork. Pure vintage drip.'
    },
    '1031429': {
      id: '1031429',
      name: 'Fiery Horns of the Netherworld',
      creator: 'Roblox',
      category: 'Accessory / Hat',
      price: 95000,
      image: 'https://tr.rbxcdn.com/180DAY-927b233a0172bf42e2b9c7b949c83ce4/420/420/Hat/Webp/noFilter',
      desc: 'Emitting perpetual brimstone and hellfire sparks directly from the underworld.'
    },
    '1285307': {
      id: '1285307',
      name: 'Sparkle Time Fedora',
      creator: 'Roblox',
      category: 'Limited Accessory',
      price: 1200000,
      image: 'https://tr.rbxcdn.com/180DAY-5bb53f9154a4ba713ff406d44a2512f4/420/420/Hat/Webp/noFilter',
      desc: 'Covered in shimmering turquoise sparkles that twinkle with every step.'
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

    // Check known name aliases
    const lowerName = name.toLowerCase();
    if (lowerName.includes('korblox')) return { ...KNOWN_PRESETS['192'] };
    if (lowerName.includes('headless')) return { ...KNOWN_PRESETS['201'] };
    if (lowerName.includes('empyreus')) return { ...KNOWN_PRESETS['21070012'] };
    if (lowerName.includes('valkyrie')) return { ...KNOWN_PRESETS['1365767'] };
    if (lowerName.includes('super super happy face')) return { ...KNOWN_PRESETS['494291269'] };
    if (lowerName.includes('clockwork')) return { ...KNOWN_PRESETS['11748356'] };
    if (lowerName.includes('fiery horns')) return { ...KNOWN_PRESETS['1031429'] };
    if (lowerName.includes('sparkle time')) return { ...KNOWN_PRESETS['1285307'] };

    // Scrape price
    let price = 0;
    const priceEl = document.querySelector(
      '.text-robux-lg, .item-price-value, [data-testid="item-price"], .price-container .text-robux, #sim-item-price'
    );
    if (priceEl) {
      const parsed = parseInt(priceEl.textContent.replace(/\D+/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) price = parsed;
    }
    if (price === 0) {
      // Find element containing "Price" and numbers
      const allTextEls = Array.from(document.querySelectorAll('span, div, p'));
      for (const el of allTextEls) {
        if (el.children.length === 0 && /\d{2,}/.test(el.textContent)) {
          const prev = el.previousElementSibling;
          if (prev && /price/i.test(prev.textContent)) {
            const parsed = parseInt(el.textContent.replace(/\D+/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) {
              price = parsed;
              break;
            }
          }
        }
      }
    }
    if (price === 0) price = 1000;

    // Scrape category
    let category = 'Accessory';
    if (path.includes('/bundles/')) category = 'Character / Bundle';
    else if (path.includes('/catalog/')) category = 'Catalog Accessory';

    // Scrape thumbnail
    const thumbEl = document.querySelector(
      '.thumbnail-span img, [data-testid="item-thumbnail"] img, .item-thumbnail-container img, #item-container img, .roblox-thumb-img'
    );
    let image = thumbEl ? thumbEl.src : '';

    return {
      id: itemId || 'item',
      name: name || 'Roblox Accessory',
      creator: 'Roblox',
      category: category,
      price: price,
      image: image,
      desc: 'Official Roblox item.'
    };
  }

  /**
   * Checks if an authentic native Roblox buy button exists on the page
   */
  function findNativeBuyButton() {
    const selectors = [
      '[data-testid="item-details-buy-button"]',
      '[data-testid="item-purchase-button"]',
      'button.shopping-cart-buy-button',
      'button.PurchaseButton',
      'button.roblox-buy-btn',
      'button[class*="PurchaseButton"]',
      'button[class*="ItemPurchaseButton"]'
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && !el.closest('#erx-action-container') && !el.id.includes('erx-')) {
        return el;
      }
    }
    return null;
  }

  /**
   * Resiliently finds the best insertion target in the Roblox DOM.
   * Matches both the live roblox.com bundle layout (with RoEarn or off-sale)
   * and catalog/item pages.
   */
  function findInsertionTarget() {
    // 1. If RoEarn or third-party extension button exists (as in user screenshot)
    const allButtons = Array.from(document.querySelectorAll('button'));
    const roearnBtn = allButtons.find(b => {
      if (b.id && b.id.includes('erx-')) return false;
      const text = (b.textContent || '').toLowerCase();
      return text.includes('roearn') || text.includes('buy with roearn');
    });
    if (roearnBtn) {
      return { type: 'before-element', element: roearnBtn };
    }

    // 2. Existing native Buy button
    const nativeBuy = findNativeBuyButton();
    if (nativeBuy) {
      return { type: 'after-element', element: nativeBuy };
    }

    // 3. Price row container
    const priceRow = document.querySelector(
      '.price-row-container, [data-testid="item-price-container"], .item-purchase-card, .price-container'
    );
    if (priceRow) {
      return { type: 'inside-container', element: priceRow };
    }

    // 4. Element containing "Price" and numbers / Robux glyph
    const allDivs = Array.from(document.querySelectorAll('div, section, p, tr'));
    for (const el of allDivs) {
      if (el.id && el.id.includes('erx-')) continue;
      if (el.closest('#erx-action-container') || el.closest('#erx-gift-overlay') || el.closest('#erx-purchase-overlay')) continue;
      if (el.children.length >= 1 && el.children.length <= 5) {
        const text = (el.textContent || '').trim();
        if (/^price/i.test(text) && /\d+/.test(text)) {
          return { type: 'after-element', element: el };
        }
      }
    }

    // 5. Specs container (contains Tradable / Characters / Placement / Description)
    for (const el of allDivs) {
      if (el.id && el.id.includes('erx-')) continue;
      if (el.children.length >= 1 && el.children.length <= 8) {
        const text = (el.textContent || '').toLowerCase();
        if (text.includes('tradable') && (text.includes('characters') || text.includes('full body') || text.includes('description'))) {
          return { type: 'before-element', element: el };
        }
      }
    }

    // 6. Right column under H1 item title
    const h1 = document.querySelector('.item-name-container h1, [data-testid="item-name"], h1.item-name, h1');
    if (h1 && h1.parentElement) {
      return { type: 'inside-column', element: h1.parentElement };
    }

    return null;
  }

  /**
   * Injects BOTH the authentic green Roblox Buy button and the Gift button directly below it.
   */
  function injectActionButtons() {
    // Avoid double injection if already active and in document
    const existing = document.getElementById('erx-action-container');
    if (existing && document.contains(existing)) {
      return;
    }

    const target = findInsertionTarget();
    if (!target) return;

    const item = getCurrentItemDetails();

    // Create Action Container
    const container = document.createElement('div');
    container.id = 'erx-action-container';
    container.className = 'erx-action-container';

    // 1. Check if a native Roblox Buy button already exists
    const nativeBuyBtn = findNativeBuyButton();

    if (!nativeBuyBtn) {
      // Create authentic Roblox green Buy Button
      const buyBtn = document.createElement('button');
      buyBtn.id = 'erx-roblox-buy-btn';
      buyBtn.className = 'erx-roblox-buy-btn';
      buyBtn.type = 'button';
      buyBtn.innerHTML = `<span>Buy</span>`;
      buyBtn.title = `Buy ${item.name} for R$ ${formatNumber(item.price)}`;

      buyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openPurchaseModal(item);
      });

      container.appendChild(buyBtn);
    }

    // 2. Create authentic Roblox Gift Button directly below Buy button
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
      openGiftingModal(item);
    });

    container.appendChild(giftBtn);

    // Insert container into the DOM
    if (target.type === 'before-element') {
      target.element.parentNode.insertBefore(container, target.element);
    } else if (target.type === 'after-element') {
      target.element.parentNode.insertBefore(container, target.element.nextSibling);
    } else if (target.type === 'inside-container' || target.type === 'inside-column') {
      target.element.appendChild(container);
    }
  }

  /**
   * Opens the authentic Roblox Purchase confirmation modal
   */
  function openPurchaseModal(item) {
    const existing = document.getElementById('erx-purchase-overlay');
    if (existing) existing.remove();

    getStorage(['robuxAmount', 'customRobux'], function (data) {
      let currentRobux = 99800;
      if (typeof data.robuxAmount === 'number' || typeof data.robuxAmount === 'string') {
        const parsed = parseInt(data.robuxAmount, 10);
        if (!isNaN(parsed)) currentRobux = parsed;
      } else if (typeof data.customRobux === 'number') {
        currentRobux = data.customRobux;
      }

      const balanceAfter = Math.max(0, currentRobux - item.price);

      const overlay = document.createElement('div');
      overlay.id = 'erx-purchase-overlay';
      overlay.className = 'erx-purchase-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'erx-gift-dialog';

      dialog.innerHTML = `
        <div class="erx-gift-dialog-header">
          <h2 class="erx-gift-dialog-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Buy Item</span>
          </h2>
          <button type="button" class="erx-gift-close-btn" id="erx-purchase-close" aria-label="Close">&times;</button>
        </div>

        <div class="erx-gift-dialog-body">
          <div class="erx-gift-item-showcase">
            <div class="erx-gift-item-thumb-frame">
              ${
                item.image
                  ? `<img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.parentElement.innerHTML='<span class=\\'erx-gift-item-thumb-fallback\\'>🛒</span>';" />`
                  : `<span class="erx-gift-item-thumb-fallback">🛒</span>`
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

          <p style="font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.5; margin: 4px 0;">
            Would you like to buy <strong>${item.name}</strong> from <strong>${item.creator || 'Roblox'}</strong> for <strong style="color:#00b06f;">R$ ${formatNumber(item.price)}</strong>?
          </p>

          <div class="erx-gift-balance-card">
            <div class="erx-gift-balance-row">
              <span>Your Robux Balance</span>
              <span class="erx-gift-balance-val">R$ ${formatNumber(currentRobux)}</span>
            </div>
            <div class="erx-gift-balance-row">
              <span>Price</span>
              <span class="erx-gift-balance-val deduct">- R$ ${formatNumber(item.price)}</span>
            </div>
            <div class="erx-gift-balance-row total">
              <span>Balance After Transaction</span>
              <span class="erx-gift-balance-val final">R$ ${formatNumber(balanceAfter)}</span>
            </div>
          </div>
        </div>

        <div class="erx-gift-dialog-footer">
          <button type="button" class="erx-gift-btn-cancel" id="erx-btn-cancel-purchase">Cancel</button>
          <button type="button" class="erx-gift-btn-send" id="erx-btn-confirm-purchase">
            <span>Buy Now</span>
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      function closeModal() {
        overlay.remove();
      }

      dialog.querySelector('#erx-purchase-close').addEventListener('click', closeModal);
      dialog.querySelector('#erx-btn-cancel-purchase').addEventListener('click', closeModal);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });

      const confirmBtn = dialog.querySelector('#erx-btn-confirm-purchase');
      confirmBtn.addEventListener('click', function () {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<span>Purchasing...</span>`;

        setTimeout(function () {
          const newBalance = Math.max(0, currentRobux - item.price);

          getStorage(['transactions', 'purchasedCatalogItems'], function (prev) {
            const txs = Array.isArray(prev.transactions) ? prev.transactions : [];
            txs.unshift({
              id: Date.now(),
              name: `Purchase: ${item.name}`,
              amount: -item.price,
              date: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'purchase'
            });

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
                updateInPageRobuxHeader(newBalance);
                showPurchaseCelebration(dialog, item, newBalance);
              }
            );
          });
        }, 500);
      });
    });
  }

  /**
   * Renders the authentic Roblox Purchase Success celebration modal
   */
  function showPurchaseCelebration(dialog, item, newBalance) {
    dialog.innerHTML = `
      <div class="erx-gift-dialog-header">
        <h2 class="erx-gift-dialog-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b06f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Purchase Completed</span>
        </h2>
        <button type="button" class="erx-gift-close-btn" id="erx-buy-success-close" aria-label="Close">&times;</button>
      </div>

      <div class="erx-gift-success-view">
        <div class="erx-gift-checkmark-wrap">
          <svg class="erx-gift-checkmark-svg" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h3 class="erx-gift-success-title">Purchase Completed!</h3>
        <p class="erx-gift-success-desc">
          You have successfully purchased <strong>${item.name}</strong>! Your avatar can now equip this item.
        </p>

        <div class="erx-gift-receipt-card">
          <div class="erx-gift-receipt-row">
            <span>Item</span>
            <b>${item.name}</b>
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

        <button type="button" class="erx-gift-btn-done" id="erx-btn-done-buy">Done</button>
      </div>
    `;

    function dismiss() {
      const overlay = document.getElementById('erx-purchase-overlay');
      if (overlay) overlay.remove();
    }

    const doneBtn = dialog.querySelector('#erx-btn-done-buy');
    const closeBtn = dialog.querySelector('#erx-buy-success-close');
    if (doneBtn) doneBtn.addEventListener('click', dismiss);
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
  }

  /**
   * Opens the authentic Roblox Gifting confirmation modal
   */
  function openGiftingModal(item) {
    const existing = document.getElementById('erx-gift-overlay');
    if (existing) existing.remove();

    getStorage(['robuxAmount', 'customRobux'], function (data) {
      let currentRobux = 99800;
      if (typeof data.robuxAmount === 'number' || typeof data.robuxAmount === 'string') {
        const parsed = parseInt(data.robuxAmount, 10);
        if (!isNaN(parsed)) currentRobux = parsed;
      } else if (typeof data.customRobux === 'number') {
        currentRobux = data.customRobux;
      }

      const balanceAfter = Math.max(0, currentRobux - item.price);

      const overlay = document.createElement('div');
      overlay.id = 'erx-gift-overlay';
      overlay.className = 'erx-gift-overlay';

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

      const closeBtn = dialog.querySelector('#erx-gift-close');
      const cancelBtn = dialog.querySelector('#erx-btn-cancel-gift');
      const sendBtn = dialog.querySelector('#erx-btn-send-gift');
      const userInput = dialog.querySelector('#erx-gift-username-input');
      const avatarBox = dialog.querySelector('#erx-recipient-avatar');
      const noteInput = dialog.querySelector('#erx-gift-note-input');

      function closeModal() {
        overlay.remove();
      }

      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });

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

      sendBtn.addEventListener('click', function () {
        const recipient = (userInput.value || 'Friend').trim().replace(/^@/, '');
        const note = (noteInput.value || '').trim();

        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span>Sending...</span>`;

        setTimeout(function () {
          const newBalance = Math.max(0, currentRobux - item.price);

          getStorage(['transactions', 'purchasedCatalogItems'], function (prev) {
            const txs = Array.isArray(prev.transactions) ? prev.transactions : [];
            txs.unshift({
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
            });

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
                updateInPageRobuxHeader(newBalance);
                showGiftingCelebration(dialog, item, recipient, newBalance);
              }
            );
          });
        }, 500);
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
  function showGiftingCelebration(dialog, item, recipient, newBalance) {
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
        <div class="erx-gift-checkmark-wrap">
          <svg class="erx-gift-checkmark-svg" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h3 class="erx-gift-success-title">Gift Sent!</h3>
        <p class="erx-gift-success-desc">
          Your gift of <strong>${item.name}</strong> was successfully delivered to <strong>@${recipient}</strong>!
        </p>

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

  /**
   * Safe execution starter
   */
  function startInjection() {
    injectActionButtons();

    // Recurring scanner for first 20 seconds to catch React hydration & RoEarn async buttons
    let attempts = 0;
    const interval = setInterval(function () {
      attempts++;
      injectActionButtons();
      if (attempts > 50) {
        clearInterval(interval);
      }
    }, 400);

    // MutationObserver to watch DOM alterations
    const observerTarget = document.body || document.documentElement;
    if (observerTarget) {
      const observer = new MutationObserver(function () {
        injectActionButtons();
      });
      observer.observe(observerTarget, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInjection);
  } else {
    startInjection();
  }

  // Handle SPA routing & navigation events
  window.addEventListener('popstate', () => setTimeout(injectActionButtons, 300));
  window.addEventListener('erx-nav-change', () => setTimeout(injectActionButtons, 300));

  // Expose global test helpers for simulation
  window.__erxOpenGiftingModal = openGiftingModal;
  window.__erxOpenPurchaseModal = openPurchaseModal;
  window.__erxInjectActionButtons = injectActionButtons;
  window.__erxInjectGiftButton = injectActionButtons;
})();
