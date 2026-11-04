/**
 * Chrome Extension API Polyfill for NMC_PATHAN Web Simulator
 * Simulates chrome.* APIs in standard browser context with localStorage persistence.
 */
(function() {
  'use strict';

  if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
    return;
  }

  const STORAGE_PREFIX = 'nmc_ext_';
  const changeListeners = new Set();
  const messageListeners = new Set();
  const alarmListeners = new Set();

  function safeJSONParse(val) {
    if (val === null || val === undefined) return undefined;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }

  function getLocalItem(key) {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return safeJSONParse(raw);
  }

  function setLocalItem(key, val) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  }

  function removeLocalItem(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }

  // Pre-seed non-banned and default values if not present
  if (getLocalItem('_erxBanned') === undefined) {
    setLocalItem('_erxBanned', false);
  }
  if (getLocalItem('_erxVersionExpired') === undefined) {
    setLocalItem('_erxVersionExpired', false);
  }
  if (getLocalItem('transactions') === undefined) {
    setLocalItem('transactions', []);
  }
  if (getLocalItem('purchasedCatalogItems') === undefined) {
    setLocalItem('purchasedCatalogItems', []);
  }

  const mockStorageLocal = {
    get: function(keys, callback) {
      return new Promise((resolve) => {
        let result = {};
        if (keys === null || keys === undefined) {
          for (let i = 0; i < localStorage.length; i++) {
            const rawKey = localStorage.key(i);
            if (rawKey && rawKey.startsWith(STORAGE_PREFIX)) {
              const k = rawKey.slice(STORAGE_PREFIX.length);
              result[k] = getLocalItem(k);
            }
          }
        } else if (typeof keys === 'string') {
          const val = getLocalItem(keys);
          if (val !== undefined) result[keys] = val;
        } else if (Array.isArray(keys)) {
          keys.forEach(k => {
            const val = getLocalItem(k);
            if (val !== undefined) result[k] = val;
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(k => {
            const val = getLocalItem(k);
            result[k] = val !== undefined ? val : keys[k];
          });
        }
        if (typeof callback === 'function') {
          callback(result);
        }
        resolve(result);
      });
    },

    set: function(items, callback) {
      return new Promise((resolve) => {
        const changes = {};
        if (items && typeof items === 'object') {
          Object.keys(items).forEach(k => {
            const oldVal = getLocalItem(k);
            const newVal = items[k];
            setLocalItem(k, newVal);
            changes[k] = { oldValue: oldVal, newValue: newVal };
          });
        }
        changeListeners.forEach(listener => {
          try {
            listener(changes, 'local');
          } catch (e) {
            console.error('Storage change listener error:', e);
          }
        });
        if (typeof callback === 'function') {
          callback();
        }
        resolve();
      });
    },

    remove: function(keys, callback) {
      return new Promise((resolve) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        const changes = {};
        keyList.forEach(k => {
          const oldVal = getLocalItem(k);
          removeLocalItem(k);
          changes[k] = { oldValue: oldVal, newValue: undefined };
        });
        changeListeners.forEach(listener => {
          try {
            listener(changes, 'local');
          } catch (e) {
            console.error('Storage change listener error:', e);
          }
        });
        if (typeof callback === 'function') {
          callback();
        }
        resolve();
      });
    },

    clear: function(callback) {
      return new Promise((resolve) => {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const rawKey = localStorage.key(i);
          if (rawKey && rawKey.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(rawKey);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        if (typeof callback === 'function') {
          callback();
        }
        resolve();
      });
    }
  };

  const mockChrome = {
    runtime: {
      id: 'nmc-pathan-web-simulator',
      lastError: null,
      getManifest: function() {
        return {
          manifest_version: 3,
          name: 'NMC_PATHAN',
          version: '1.0',
          description: 'NMC_PATHAN — Client-side Robux display, profile badge, purchase modal, Send Robux, and transaction previews for roblox.com.',
          icons: {
            16: '/icons/nmc-16.png',
            32: '/icons/nmc-32.png',
            48: '/icons/nmc-48.png',
            128: '/icons/nmc-128.png'
          }
        };
      },
      getURL: function(path) {
        if (!path) return '/';
        return path.startsWith('/') ? path : '/' + path;
      },
      sendMessage: function(msg, options, callback) {
        const cb = typeof options === 'function' ? options : callback;
        return new Promise((resolve) => {
          const response = { success: true };
          if (typeof cb === 'function') {
            cb(response);
          }
          resolve(response);
        });
      },
      onMessage: {
        addListener: function(fn) {
          messageListeners.add(fn);
        },
        removeListener: function(fn) {
          messageListeners.delete(fn);
        },
        hasListener: function(fn) {
          return messageListeners.has(fn);
        }
      }
    },

    storage: {
      local: mockStorageLocal,
      sync: mockStorageLocal,
      onChanged: {
        addListener: function(fn) {
          changeListeners.add(fn);
        },
        removeListener: function(fn) {
          changeListeners.delete(fn);
        },
        hasListener: function(fn) {
          return changeListeners.has(fn);
        }
      }
    },

    tabs: {
      query: function(queryInfo, callback) {
        return new Promise((resolve) => {
          const mockTabs = [{
            id: 1,
            active: true,
            currentWindow: true,
            url: 'https://www.roblox.com/home',
            title: 'Roblox',
            favIconUrl: '/icons/nmc-16.png'
          }];
          if (typeof callback === 'function') {
            callback(mockTabs);
          }
          resolve(mockTabs);
        });
      },
      sendMessage: function(tabId, message, options, callback) {
        const cb = typeof options === 'function' ? options : callback;
        return new Promise((resolve) => {
          const robux = getLocalItem('robuxAmount') || '';
          const response = {
            success: true,
            isRoblox: true,
            realBalance: 0,
            shownBalance: robux ? Number(robux) : 0,
            transactions: getLocalItem('transactions') || [],
            purchasedCatalogItems: getLocalItem('purchasedCatalogItems') || []
          };
          if (typeof cb === 'function') {
            cb(response);
          }
          resolve(response);
        });
      }
    },

    action: {
      setBadgeText: function(details, callback) {
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      },
      setBadgeBackgroundColor: function(details, callback) {
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      }
    },

    cookies: {
      get: function(details, callback) {
        return new Promise((resolve) => {
          const cookie = {
            name: (details && details.name) || '.ROBLOSECURITY',
            value: '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_SIMULATOR_COOKIE',
            domain: '.roblox.com',
            path: '/',
            secure: true,
            httpOnly: true,
            session: false,
            expirationDate: Math.floor(Date.now() / 1000) + 86400 * 30
          };
          if (typeof callback === 'function') callback(cookie);
          resolve(cookie);
        });
      },
      getAll: function(details, callback) {
        return new Promise((resolve) => {
          const cookies = [
            {
              name: '.ROBLOSECURITY',
              value: '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_SIMULATOR_COOKIE',
              domain: '.roblox.com',
              path: '/',
              secure: true,
              httpOnly: true,
              session: false
            },
            {
              name: 'RBXEventTrackerV2',
              value: 'createDate=2025-01-01&browserId=12345678',
              domain: '.roblox.com',
              path: '/',
              secure: true,
              httpOnly: false,
              session: true
            }
          ];
          if (typeof callback === 'function') callback(cookies);
          resolve(cookies);
        });
      }
    },

    alarms: {
      create: function() {},
      clear: function(name, cb) { if (cb) cb(true); },
      onAlarm: {
        addListener: function(fn) { alarmListeners.add(fn); },
        removeListener: function(fn) { alarmListeners.delete(fn); }
      }
    }
  };

  window.chrome = mockChrome;
})();
