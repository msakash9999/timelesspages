(function (global) {
  'use strict';

  var STORAGE_PREFIX = 'timelessPages';
  var TOKEN_KEY = STORAGE_PREFIX + 'UserToken';
  var LOGIN_FLAG_KEY = STORAGE_PREFIX + 'LoggedIn';
  var USER_NAME_KEY = STORAGE_PREFIX + 'UserName';
  var USER_EMAIL_KEY = STORAGE_PREFIX + 'UserEmail';
  var USER_PROFILE_IMAGE_KEY = STORAGE_PREFIX + 'UserProfileImage';
  var ACTIVE_TOKEN_KEY = STORAGE_PREFIX + 'ActiveUserToken';
  var ACTIVE_USER_ID_KEY = STORAGE_PREFIX + 'ActiveUserId';
  var GUEST_SESSION_ID_KEY = STORAGE_PREFIX + 'GuestSessionId';
  var KEY_SUFFIX_TMP = '__tmp';
  var KEY_SUFFIX_BACKUP = '__backup';
  var LOG_PREFIX = '[TP Persistence]';

  function log() {
    if (global.console && typeof global.console.log === 'function') {
      global.console.log.apply(global.console, [LOG_PREFIX].concat([].slice.call(arguments)));
    }
  }

  function warn() {
    if (global.console && typeof global.console.warn === 'function') {
      global.console.warn.apply(global.console, [LOG_PREFIX].concat([].slice.call(arguments)));
    }
  }

  function readStorage(storage, key) {
    try {
      return storage ? storage.getItem(key) : null;
    } catch (error) {
      warn('Unable to read storage key:', key, error);
      return null;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      if (storage) {
        storage.setItem(key, value);
      }
      return true;
    } catch (error) {
      warn('Unable to write storage key:', key, error);
      return false;
    }
  }

  function removeStorage(storage, key) {
    try {
      if (storage) {
        storage.removeItem(key);
      }
    } catch (error) {
      warn('Unable to remove storage key:', key, error);
    }
  }

  function getLocalStorage() {
    try {
      return global.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function getSessionStorage() {
    try {
      return global.sessionStorage || null;
    } catch (error) {
      return null;
    }
  }

  function readLocal(key) {
    return readStorage(getLocalStorage(), key);
  }

  function writeLocal(key, value) {
    return writeStorage(getLocalStorage(), key, value);
  }

  function removeLocal(key) {
    removeStorage(getLocalStorage(), key);
  }

  function readSession(key) {
    return readStorage(getSessionStorage(), key);
  }

  function writeSession(key, value) {
    return writeStorage(getSessionStorage(), key, value);
  }

  function removeSession(key) {
    removeStorage(getSessionStorage(), key);
  }

  function generateId(prefix) {
    var randomPart = '';
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      randomPart = global.crypto.randomUUID().replace(/-/g, '');
    } else {
      randomPart = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    return (prefix || 'tp') + '_' + randomPart;
  }

  function cloneValue(value) {
    if (value === undefined) {
      return value;
    }

    if (typeof global.structuredClone === 'function') {
      try {
        return global.structuredClone(value);
      } catch (error) {
        // Fall through to JSON cloning.
      }
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function decodeBase64Url(input) {
    var normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
    var padding = normalized.length % 4;
    if (padding) {
      normalized += new Array(5 - padding).join('=');
    }

    if (typeof global.atob === 'function') {
      return global.atob(normalized);
    }

    if (typeof global.Buffer !== 'undefined') {
      return global.Buffer.from(normalized, 'base64').toString('utf8');
    }

    throw new Error('No base64 decoder available');
  }

  function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }

    var parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      return JSON.parse(decodeBase64Url(parts[1]));
    } catch (error) {
      warn('JWT payload decode failed:', error);
      return null;
    }
  }

  function normalizeUserId(value) {
    if (value === null || value === undefined) {
      return 'guest';
    }

    var text = String(value).trim();
    return text ? text : 'guest';
  }

  function getGuestSessionId() {
    var existing = readSession(GUEST_SESSION_ID_KEY);
    if (existing) {
      return existing;
    }

    var generated = generateId('guest');
    writeSession(GUEST_SESSION_ID_KEY, generated);
    return generated;
  }

  function getCurrentUserToken() {
    return readSession(ACTIVE_TOKEN_KEY) || readLocal(TOKEN_KEY) || '';
  }

  function getCurrentUserId() {
    var cachedUserId = readSession(ACTIVE_USER_ID_KEY);
    if (cachedUserId) {
      return cachedUserId;
    }

    var token = getCurrentUserToken();
    var payload = decodeJwtPayload(token);
    var userId = normalizeUserId(payload && (payload.userId || payload.sub || payload.id));

    if (userId !== 'guest') {
      writeSession(ACTIVE_USER_ID_KEY, userId);
    }

    return userId;
  }

  function getScopeId(userId) {
    var resolvedUserId = normalizeUserId(userId || getCurrentUserId());
    return resolvedUserId === 'guest' ? 'guest_' + getGuestSessionId() : resolvedUserId;
  }

  function getCartStorageKey(userId) {
    return STORAGE_PREFIX + 'Cart_' + getScopeId(userId);
  }

  function getWishlistStorageKey(userId) {
    return STORAGE_PREFIX + 'Wishlist_' + getScopeId(userId);
  }

  function getProfileStorageKey(userId) {
    return STORAGE_PREFIX + 'Profile_' + getScopeId(userId);
  }

  function getOrdersStorageKey(userId) {
    return STORAGE_PREFIX + 'Orders_' + getScopeId(userId);
  }

  function getAddressStorageKey(userId) {
    return STORAGE_PREFIX + 'Address_' + getScopeId(userId);
  }

  function getPreferencesStorageKey(userId) {
    return STORAGE_PREFIX + 'Preferences_' + getScopeId(userId);
  }

  function normalizeCartItem(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    var title = String(item.title || item.name || 'Book').trim();
    var bookId = String(item.bookId || item.id || '').trim();
    var price = Number(item.price);

    if (!Number.isFinite(price)) {
      price = 0;
    }

    return {
      bookId: bookId,
      id: bookId || String(item.id || title).trim(),
      title: title,
      author: String(item.author || '').trim(),
      price: price,
      priceLabel: String(item.priceLabel || '').trim(),
      image: String(item.image || item.imageUrl || '').trim(),
      imageUrl: String(item.imageUrl || item.image || '').trim(),
      qty: Math.max(1, Number(item.qty) || 1),
      selected: item.selected !== false
    };
  }

  function normalizeCart(cartItems) {
    var list = Array.isArray(cartItems) ? cartItems : [];
    var deduped = [];

    list.forEach(function (item) {
      var normalized = normalizeCartItem(item);
      if (!normalized) {
        return;
      }

      var existing = deduped.find(function (entry) {
        return (normalized.bookId && entry.bookId && normalized.bookId === entry.bookId) ||
          (normalized.id && entry.id && normalized.id === entry.id) ||
          entry.title === normalized.title;
      });

      if (existing) {
        existing.qty = Math.max(existing.qty, normalized.qty);
        existing.selected = existing.selected !== false && normalized.selected !== false;
        if (!existing.price && normalized.price) existing.price = normalized.price;
        if (!existing.priceLabel && normalized.priceLabel) existing.priceLabel = normalized.priceLabel;
        if (!existing.image && normalized.image) existing.image = normalized.image;
        if (!existing.imageUrl && normalized.imageUrl) existing.imageUrl = normalized.imageUrl;
        return;
      }

      deduped.push(normalized);
    });

    return deduped;
  }

  function normalizeWishlistItem(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    var title = String(item.title || 'Book').trim();
    var bookId = String(item.bookId || item.id || '').trim();
    var price = Number(item.price);

    if (!Number.isFinite(price)) {
      price = 0;
    }

    return {
      bookId: bookId,
      id: bookId || String(item.id || title).trim(),
      title: title,
      author: String(item.author || '').trim(),
      price: price,
      priceLabel: String(item.priceLabel || '').trim(),
      image: String(item.image || item.imageUrl || '').trim(),
      imageUrl: String(item.imageUrl || item.image || '').trim()
    };
  }

  function normalizeWishlist(list) {
    var items = Array.isArray(list) ? list : [];
    var deduped = [];

    items.forEach(function (item) {
      var normalized = normalizeWishlistItem(item);
      if (!normalized) {
        return;
      }

      var exists = deduped.some(function (entry) {
        return (normalized.bookId && entry.bookId && normalized.bookId === entry.bookId) ||
          (normalized.id && entry.id && normalized.id === entry.id) ||
          entry.title === normalized.title;
      });

      if (!exists) {
        deduped.push(normalized);
      }
    });

    return deduped;
  }

  function normalizeProfile(profile) {
    if (!profile || typeof profile !== 'object') {
      return {};
    }

    var normalized = cloneValue(profile) || {};
    normalized.name = String(normalized.name || '').trim();
    normalized.email = String(normalized.email || '').trim().toLowerCase();
    normalized.phone = String(normalized.phone || '').trim();
    normalized.profileImage = String(normalized.profileImage || normalized.imageUrl || '').trim();
    normalized.addresses = Array.isArray(normalized.addresses) ? normalized.addresses : [];
    normalized.preferences = normalized.preferences && typeof normalized.preferences === 'object' ? normalized.preferences : {};
    return normalized;
  }

  function normalizeOrders(orders) {
    var list = Array.isArray(orders) ? orders : [];
    return list
      .filter(function (item) { return item && typeof item === 'object'; })
      .map(function (item) { return cloneValue(item); });
  }

  function normalizeAddresses(addresses) {
    var list = Array.isArray(addresses) ? addresses : [];
    return list
      .filter(function (item) { return item && typeof item === 'object'; })
      .map(function (item) {
        var normalized = cloneValue(item) || {};
        normalized.fullName = String(normalized.fullName || '').trim();
        normalized.addressLine = String(normalized.addressLine || '').trim();
        normalized.city = String(normalized.city || '').trim();
        normalized.state = String(normalized.state || '').trim();
        normalized.pincode = String(normalized.pincode || '').trim();
        normalized.phone = String(normalized.phone || '').trim();
        normalized.isDefault = normalized.isDefault === true;
        return normalized;
      });
  }

  function normalizePreferences(preferences) {
    if (!preferences || typeof preferences !== 'object') {
      return {};
    }

    return cloneValue(preferences) || {};
  }

  function safeSave(key, data) {
    try {
      var serialized = JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        data: cloneValue(data)
      });

      if (serialized === undefined) {
        throw new Error('Data could not be serialized');
      }

      writeLocal(key + KEY_SUFFIX_TMP, serialized);
      writeLocal(key, serialized);
      removeLocal(key + KEY_SUFFIX_TMP);
      return true;
    } catch (error) {
      warn('safeSave failed for key:', key, error);
      return false;
    }
  }

  function parseStoredValue(raw) {
    if (!raw) {
      return null;
    }

    var parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'data')) {
      return parsed.data;
    }

    return parsed;
  }

  function safeLoad(key, fallback) {
    var keys = [key, key + KEY_SUFFIX_BACKUP, key + KEY_SUFFIX_TMP];

    for (var i = 0; i < keys.length; i += 1) {
      var raw = readLocal(keys[i]);
      if (!raw) {
        continue;
      }

      try {
        return cloneValue(parseStoredValue(raw));
      } catch (error) {
        warn('safeLoad could not parse key:', keys[i], error);
      }
    }

    return cloneValue(fallback);
  }

  function getCart(userId) {
    return normalizeCart(safeLoad(getCartStorageKey(userId), []));
  }

  function getWishlist(userId) {
    return normalizeWishlist(safeLoad(getWishlistStorageKey(userId), []));
  }

  function getProfile(userId) {
    return normalizeProfile(safeLoad(getProfileStorageKey(userId), {}));
  }

  function getOrders(userId) {
    return normalizeOrders(safeLoad(getOrdersStorageKey(userId), []));
  }

  function getAddress(userId) {
    return normalizeAddresses(safeLoad(getAddressStorageKey(userId), []));
  }

  function getPreferences(userId) {
    return normalizePreferences(safeLoad(getPreferencesStorageKey(userId), {}));
  }

  function dispatchPersistenceEvent(type, payload) {
    if (!global.CustomEvent) {
      return;
    }

    try {
      global.dispatchEvent(new CustomEvent('timelessPages:persistence-changed', {
        detail: {
          type: type,
          userId: getCurrentUserId(),
          payload: payload || null
        }
      }));
    } catch (error) {
      warn('Failed to dispatch persistence event:', error);
    }
  }

  function notifyUi(type) {
    var callbacks = [];

    if (type === 'cart') {
      callbacks = ['syncCartUi', 'updateCartBadge', 'renderCartDrawer'];
    } else if (type === 'wishlist') {
      callbacks = ['syncWishlistUi', 'updateWishlistCount', 'syncWishlistButtons', 'renderWishlistDrawer'];
    } else if (type === 'profile') {
      callbacks = ['syncProfileUi', 'renderProfileUi'];
    } else if (type === 'orders') {
      callbacks = ['syncOrdersUi'];
    }

    callbacks.forEach(function (name) {
      if (typeof global[name] === 'function') {
        try {
          global[name]();
        } catch (error) {
          warn('UI refresh failed for', name, error);
        }
      }
    });

    dispatchPersistenceEvent(type);
  }

  function syncCartToServer(cartItems, token) {
    var sessionToken = token || getCurrentUserToken();
    var userId = getCurrentUserId();

    if (!sessionToken || userId === 'guest') {
      return Promise.resolve(null);
    }

    var apiBase = readLocal(STORAGE_PREFIX + 'ApiBaseUrl') || 'http://localhost:5000';
    log('Syncing cart to server for user:', userId);

    return fetch(apiBase + '/api/user/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionToken
      },
      body: JSON.stringify({ cart: normalizeCart(cartItems) })
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Cart sync failed with status ' + response.status);
      }
      return response.json().catch(function () { return null; });
    }).catch(function (error) {
      warn('Cart sync failed:', error);
      return null;
    });
  }

  function syncWishlistToServer(wishlistItems, token) {
    var sessionToken = token || getCurrentUserToken();
    var userId = getCurrentUserId();

    if (!sessionToken || userId === 'guest') {
      return Promise.resolve(null);
    }

    var apiBase = readLocal(STORAGE_PREFIX + 'ApiBaseUrl') || 'http://localhost:5000';
    log('Syncing wishlist to server for user:', userId);

    return fetch(apiBase + '/api/user/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionToken
      },
      body: JSON.stringify({ wishlist: normalizeWishlist(wishlistItems) })
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Wishlist sync failed with status ' + response.status);
      }
      return response.json().catch(function () { return null; });
    }).catch(function (error) {
      warn('Wishlist sync failed:', error);
      return null;
    });
  }

  function syncProfileToServer(profile, token) {
    var sessionToken = token || getCurrentUserToken();
    var userId = getCurrentUserId();

    if (!sessionToken || userId === 'guest') {
      return Promise.resolve(null);
    }

    var apiBase = readLocal(STORAGE_PREFIX + 'ApiBaseUrl') || 'http://localhost:5000';
    var normalized = normalizeProfile(profile);

    return fetch(apiBase + '/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionToken
      },
      body: JSON.stringify({
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone
      })
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Profile sync failed with status ' + response.status);
      }
      return response.json().catch(function () { return null; });
    }).catch(function (error) {
      warn('Profile sync failed:', error);
      return null;
    });
  }

  function saveCart(cartItems, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var normalized = normalizeCart(cartItems);
    safeSave(getCartStorageKey(userId), normalized);
    notifyUi('cart');

    if (settings.sync !== false) {
      syncCartToServer(normalized, settings.token);
    }

    return normalized;
  }

  function saveWishlist(wishlistItems, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var normalized = normalizeWishlist(wishlistItems);
    safeSave(getWishlistStorageKey(userId), normalized);
    notifyUi('wishlist');

    if (settings.sync !== false) {
      syncWishlistToServer(normalized, settings.token);
    }

    return normalized;
  }

  function saveProfile(profile, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var normalized = normalizeProfile(profile);
    safeSave(getProfileStorageKey(userId), normalized);

    if (normalized.name) {
      writeLocal(USER_NAME_KEY, normalized.name);
    }
    if (normalized.email) {
      writeLocal(USER_EMAIL_KEY, normalized.email);
    }
    if (normalized.profileImage) {
      writeLocal(USER_PROFILE_IMAGE_KEY, normalized.profileImage);
    }

    notifyUi('profile');

    if (settings.sync !== false) {
      syncProfileToServer(normalized, settings.token);
    }

    return normalized;
  }

  function saveOrders(orders, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var normalized = normalizeOrders(orders);
    safeSave(getOrdersStorageKey(userId), normalized);
    notifyUi('orders');
    return normalized;
  }

  function saveAddress(addresses, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var normalized = normalizeAddresses(addresses);
    safeSave(getAddressStorageKey(userId), normalized);
    return normalized;
  }

  function savePreferences(preferences, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var normalized = normalizePreferences(preferences);
    safeSave(getPreferencesStorageKey(userId), normalized);
    return normalized;
  }

  function findCartItem(cartItems, identifier) {
    return cartItems.find(function (item) {
      return item.bookId === identifier ||
        item.id === identifier ||
        item.title === identifier;
    });
  }

  function addToCart(item, quantity, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var qtyToAdd = Math.max(1, Number(quantity) || 1);
    var cart = getCart(userId);
    var normalizedItem = normalizeCartItem(item);

    if (!normalizedItem) {
      warn('addToCart skipped invalid item');
      return cart;
    }

    var existing = findCartItem(cart, normalizedItem.bookId || normalizedItem.id || normalizedItem.title);
    if (existing) {
      existing.qty = Math.max(1, Number(existing.qty) || 1) + qtyToAdd;
    } else {
      normalizedItem.qty = qtyToAdd;
      cart.push(normalizedItem);
    }

    return saveCart(cart, settings);
  }

  function removeCartItem(identifier, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var cart = getCart(userId).filter(function (item) {
      return item.bookId !== identifier && item.id !== identifier && item.title !== identifier;
    });
    return saveCart(cart, settings);
  }

  function changeCartItemQuantity(identifier, delta, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var cart = getCart(userId);
    var item = findCartItem(cart, identifier);

    if (!item) {
      return cart;
    }

    item.qty = Math.max(1, (Number(item.qty) || 1) + (Number(delta) || 0));

    if (item.qty <= 0) {
      cart = cart.filter(function (entry) {
        return entry !== item;
      });
    }

    return saveCart(cart, settings);
  }

  function isInWishlist(identifier, userId) {
    return getWishlist(userId).some(function (item) {
      return item.bookId === identifier || item.id === identifier || item.title === identifier;
    });
  }

  function toggleWishlist(item, options) {
    var settings = options || {};
    var userId = settings.userId || getCurrentUserId();
    var wishlist = getWishlist(userId);
    var normalizedItem = normalizeWishlistItem(item);

    if (!normalizedItem) {
      warn('toggleWishlist skipped invalid item');
      return wishlist;
    }

    var identifier = normalizedItem.bookId || normalizedItem.id || normalizedItem.title;
    var index = wishlist.findIndex(function (entry) {
      return entry.bookId === identifier || entry.id === identifier || entry.title === identifier;
    });

    if (index === -1) {
      wishlist.push(normalizedItem);
    } else {
      wishlist.splice(index, 1);
    }

    return saveWishlist(wishlist, settings);
  }

  function fetchJsonWithAuth(path, options) {
    var sessionToken = getCurrentUserToken();
    var apiBase = readLocal(STORAGE_PREFIX + 'ApiBaseUrl') || 'http://localhost:5000';
    var requestOptions = options || {};
    var headers = new Headers(requestOptions.headers || {});

    if (sessionToken) {
      headers.set('Authorization', 'Bearer ' + sessionToken);
    }

    return fetch(apiBase + path, Object.assign({}, requestOptions, { headers: headers }));
  }

  function refreshCurrentUserFromServer(options) {
    var settings = options || {};
    var sessionToken = getCurrentUserToken();
    var userId = getCurrentUserId();

    if (!sessionToken || userId === 'guest') {
      return Promise.resolve(null);
    }

    log('Refreshing active user data from server for:', userId);

    var requests = [
      fetchJsonWithAuth('/api/user/profile'),
      fetchJsonWithAuth('/api/user/cart'),
      fetchJsonWithAuth('/api/user/wishlist'),
      fetchJsonWithAuth('/api/orders/my-orders')
    ];

    return Promise.allSettled(requests).then(function (results) {
      var profileResponse = results[0];
      var cartResponse = results[1];
      var wishlistResponse = results[2];
      var ordersResponse = results[3];

      if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
        return profileResponse.value.json().then(function (profileData) {
          saveProfile(profileData, { userId: userId, token: sessionToken, sync: false });
          if (profileData && profileData.addresses) {
            saveAddress(profileData.addresses, { userId: userId });
          }
          if (profileData && profileData.preferences) {
            savePreferences(profileData.preferences, { userId: userId });
          }
        }).catch(function (error) {
          warn('Profile refresh parse failed:', error);
        });
      }

      return null;
    }).then(function () {
      return Promise.allSettled([
        fetchJsonWithAuth('/api/user/cart'),
        fetchJsonWithAuth('/api/user/wishlist'),
        fetchJsonWithAuth('/api/orders/my-orders')
      ]).then(function (results) {
        if (results[0].status === 'fulfilled' && results[0].value.ok) {
          return results[0].value.json().then(function (cartData) {
            saveCart(cartData, { userId: userId, token: sessionToken, sync: false });
          }).catch(function (error) {
            warn('Cart refresh parse failed:', error);
          });
        }
        return null;
      }).then(function () {
        if (results[1].status === 'fulfilled' && results[1].value.ok) {
          return results[1].value.json().then(function (wishlistData) {
            saveWishlist(wishlistData, { userId: userId, token: sessionToken, sync: false });
          }).catch(function (error) {
            warn('Wishlist refresh parse failed:', error);
          });
        }
        return null;
      }).then(function () {
        if (results[2].status === 'fulfilled' && results[2].value.ok) {
          return results[2].value.json().then(function (ordersData) {
            saveOrders(ordersData, { userId: userId });
          }).catch(function (error) {
            warn('Orders refresh parse failed:', error);
          });
        }
        return null;
      });
    }).catch(function (error) {
      if (!settings.silent) {
        warn('refreshCurrentUserFromServer failed:', error);
      }
      return null;
    });
  }

  function persistLoginSession(session) {
    var payload = session || {};
    var token = String(payload.token || '').trim();
    var user = payload.user || {};
    var decoded = decodeJwtPayload(token) || {};
    var userId = normalizeUserId(decoded.userId || decoded.sub || decoded.id || user.id || user._id);

    if (!token) {
      throw new Error('A JWT token is required to persist the session');
    }

    writeLocal(TOKEN_KEY, token);
    writeLocal(LOGIN_FLAG_KEY, 'true');
    writeSession(ACTIVE_TOKEN_KEY, token);
    writeSession(ACTIVE_USER_ID_KEY, userId);

    if (user && typeof user === 'object') {
      if (user.name) writeLocal(USER_NAME_KEY, String(user.name));
      if (user.email) writeLocal(USER_EMAIL_KEY, String(user.email));
      if (user.profileImage) writeLocal(USER_PROFILE_IMAGE_KEY, String(user.profileImage));
      saveProfile(user, { userId: userId, token: token, sync: false });
      if (Array.isArray(user.cart)) saveCart(user.cart, { userId: userId, token: token, sync: false });
      if (Array.isArray(user.wishlist)) saveWishlist(user.wishlist, { userId: userId, token: token, sync: false });
      if (Array.isArray(user.orders)) saveOrders(user.orders, { userId: userId });
      if (Array.isArray(user.addresses)) saveAddress(user.addresses, { userId: userId });
      if (user.preferences) savePreferences(user.preferences, { userId: userId });
    }

    log('Persisted login session for user:', userId);

    refreshCurrentUserFromServer({ silent: true }).catch(function (error) {
      warn('Initial server refresh after login failed:', error);
    });

    notifyUi('cart');
    notifyUi('wishlist');
    return {
      token: token,
      userId: userId
    };
  }

  function clearSession(options) {
    var settings = options || {};
    var removeToken = settings.removeToken !== false;

    removeSession(ACTIVE_TOKEN_KEY);
    removeSession(ACTIVE_USER_ID_KEY);
    removeSession(GUEST_SESSION_ID_KEY);

    if (removeToken) {
      removeLocal(TOKEN_KEY);
    }

    removeLocal(LOGIN_FLAG_KEY);
    removeLocal(USER_NAME_KEY);
    removeLocal(USER_EMAIL_KEY);
    removeLocal(USER_PROFILE_IMAGE_KEY);

    log('Session cleared. Persisted user data was preserved.');
  }

  function isLoggedIn() {
    var token = getCurrentUserToken();
    return Boolean(token && decodeJwtPayload(token));
  }

  function getSessionSnapshot() {
    var token = getCurrentUserToken();
    var userId = getCurrentUserId();
    var profile = getProfile(userId);
    var guest = userId === 'guest';

    return {
      token: token,
      userId: userId,
      guest: guest,
      isLoggedIn: !guest && Boolean(token),
      userName: profile.name || readLocal(USER_NAME_KEY) || '',
      userEmail: profile.email || readLocal(USER_EMAIL_KEY) || '',
      profileImage: profile.profileImage || readLocal(USER_PROFILE_IMAGE_KEY) || '',
      profile: profile,
      cartCount: getCart(userId).reduce(function (sum, item) {
        return sum + (Number(item.qty) || 1);
      }, 0),
      wishlistCount: getWishlist(userId).length
    };
  }

  function resolveScopedEventUserId(key) {
    if (!key || typeof key !== 'string') {
      return null;
    }

    var patterns = [
      new RegExp('^' + STORAGE_PREFIX + 'Cart_(.+)$'),
      new RegExp('^' + STORAGE_PREFIX + 'Wishlist_(.+)$'),
      new RegExp('^' + STORAGE_PREFIX + 'Profile_(.+)$'),
      new RegExp('^' + STORAGE_PREFIX + 'Orders_(.+)$'),
      new RegExp('^' + STORAGE_PREFIX + 'Address_(.+)$'),
      new RegExp('^' + STORAGE_PREFIX + 'Preferences_(.+)$')
    ];

    for (var i = 0; i < patterns.length; i += 1) {
      var match = key.match(patterns[i]);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  function handleStorageEvent(event) {
    if (!event || !event.key) {
      return;
    }

    var currentUserId = getCurrentUserId();
    var affectedUserId = resolveScopedEventUserId(event.key);

    if (affectedUserId && affectedUserId === currentUserId) {
      if (event.key.indexOf(STORAGE_PREFIX + 'Cart_') === 0) {
        notifyUi('cart');
      } else if (event.key.indexOf(STORAGE_PREFIX + 'Wishlist_') === 0) {
        notifyUi('wishlist');
      } else if (event.key.indexOf(STORAGE_PREFIX + 'Profile_') === 0) {
        notifyUi('profile');
      } else if (event.key.indexOf(STORAGE_PREFIX + 'Orders_') === 0) {
        notifyUi('orders');
      }
    }
  }

  if (global.addEventListener) {
    global.addEventListener('storage', handleStorageEvent);
  }

  var api = {
    getCurrentUserId: getCurrentUserId,
    getCurrentUserToken: getCurrentUserToken,
    getCartStorageKey: getCartStorageKey,
    getWishlistStorageKey: getWishlistStorageKey,
    getProfileStorageKey: getProfileStorageKey,
    getOrdersStorageKey: getOrdersStorageKey,
    getAddressStorageKey: getAddressStorageKey,
    getPreferencesStorageKey: getPreferencesStorageKey,
    safeSave: safeSave,
    safeLoad: safeLoad,
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    removeCartItem: removeCartItem,
    changeCartItemQuantity: changeCartItemQuantity,
    getWishlist: getWishlist,
    saveWishlist: saveWishlist,
    toggleWishlist: toggleWishlist,
    isInWishlist: isInWishlist,
    getProfile: getProfile,
    saveProfile: saveProfile,
    getOrders: getOrders,
    saveOrders: saveOrders,
    getAddress: getAddress,
    saveAddress: saveAddress,
    getPreferences: getPreferences,
    savePreferences: savePreferences,
    persistLoginSession: persistLoginSession,
    clearSession: clearSession,
    isLoggedIn: isLoggedIn,
    getSessionSnapshot: getSessionSnapshot,
    refreshCurrentUserFromServer: refreshCurrentUserFromServer,
    syncCartToServer: syncCartToServer,
    syncWishlistToServer: syncWishlistToServer,
    syncProfileToServer: syncProfileToServer,
    fetchJsonWithAuth: fetchJsonWithAuth
  };

  global.TimelessPagesUserPersistence = api;

  if (getCurrentUserToken()) {
    log('Bootstrapping existing session from storage');
    refreshCurrentUserFromServer({ silent: true }).catch(function (error) {
      warn('Bootstrap refresh failed:', error);
    });
  } else {
    getGuestSessionId();
  }
})(window);
