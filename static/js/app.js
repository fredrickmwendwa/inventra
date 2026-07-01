/* ============================================================
   INVENTRA — CORE INTERACTIONS
   Vanilla JS only. No framework. Progressive enhancement.
   ============================================================ */

(function () {
  'use strict';

  /* ────────────────────────────────────────────
     THEME  (light / dark)
  ──────────────────────────────────────────── */
  var THEME_KEY   = 'inventra-theme';
  var SIDEBAR_KEY = 'inventra-sidebar-collapsed';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* blocked */ }

    var icon = document.getElementById('themeIcon');
    if (icon) {
      icon.innerHTML = theme === 'dark'
        ? '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    }
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { /* noop */ }
    var prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(stored || (prefersDark ? 'dark' : 'light'));

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });
  }

  /* ────────────────────────────────────────────
     SIDEBAR COLLAPSE  (desktop)
  ──────────────────────────────────────────── */
  function initSidebar() {
    var shell = document.querySelector('.sf-shell');
    if (!shell) return;

    var collapsed = false;
    try { collapsed = localStorage.getItem(SIDEBAR_KEY) === '1'; } catch (e) { /* noop */ }
    if (collapsed) shell.classList.add('is-collapsed');

    document.querySelectorAll('[data-sidebar-collapse]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isCollapsed = shell.classList.toggle('is-collapsed');
        try { localStorage.setItem(SIDEBAR_KEY, isCollapsed ? '1' : '0'); } catch (e) { /* noop */ }
      });
    });

    document.querySelectorAll('[data-mobile-nav-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        shell.classList.toggle('is-mobile-nav-open');
      });
    });

    document.querySelectorAll('[data-mobile-nav-close], .sf-scrim').forEach(function (el) {
      el.addEventListener('click', function () {
        shell.classList.remove('is-mobile-nav-open');
      });
    });
  }

  /* ────────────────────────────────────────────
     ACTIVE NAV LINK
  ──────────────────────────────────────────── */
  function initActiveNav() {
    var path = window.location.pathname;
    document.querySelectorAll('.sf-nav-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href === '/') return;
      if (path === href || path.startsWith(href)) {
        link.classList.add('is-active');
      }
    });
  }

  /* ────────────────────────────────────────────
     DROPDOWNS
  ──────────────────────────────────────────── */
  function initDropdowns() {
    document.querySelectorAll('[data-dropdown-trigger]').forEach(function (trigger) {
      var targetId = trigger.getAttribute('data-dropdown-trigger');
      var menu     = document.getElementById(targetId);
      if (!menu) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = !menu.classList.contains('is-open');
        document.querySelectorAll('.sf-dropdown.is-open').forEach(function (m) {
          m.classList.remove('is-open');
        });
        if (willOpen) menu.classList.add('is-open');
      });
    });

    document.addEventListener('click', function () {
      document.querySelectorAll('.sf-dropdown.is-open').forEach(function (m) {
        m.classList.remove('is-open');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.sf-dropdown.is-open').forEach(function (m) {
          m.classList.remove('is-open');
        });
      }
    });
  }

  /* ────────────────────────────────────────────
     MODALS
  ──────────────────────────────────────────── */
  var lastFocusedTrigger = null;

  function openModal(modalId, trigger) {
    var overlay = document.getElementById(modalId);
    if (!overlay) return;
    lastFocusedTrigger = trigger || document.activeElement;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var focusTarget = overlay.querySelector('[autofocus]') ||
      overlay.querySelector('button, input, select, textarea, a[href]');
    if (focusTarget) {
      setTimeout(function () { focusTarget.focus(); }, 50);
    }
  }

  function closeModal(overlay) {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocusedTrigger && lastFocusedTrigger.focus) {
      lastFocusedTrigger.focus();
    }
  }

  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openModal(trigger.getAttribute('data-modal-open'), trigger);
      });
    });

    document.querySelectorAll('.sf-modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal(overlay);
      });
      overlay.querySelectorAll('[data-modal-close]').forEach(function (btn) {
        btn.addEventListener('click', function () { closeModal(overlay); });
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var open = document.querySelector('.sf-modal-overlay.is-open');
        if (open) closeModal(open);
      }
    });
  }

  /* ────────────────────────────────────────────
     ALERTS / TOAST DISMISS
  ──────────────────────────────────────────── */
  function dismissAlert(alert) {
    alert.style.transition = 'opacity 160ms ease, transform 160ms ease';
    alert.style.opacity    = '0';
    alert.style.transform  = 'translateY(-4px)';
    setTimeout(function () {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 170);
  }

  function initAlerts() {
    document.querySelectorAll('[data-alert-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var alert = btn.closest('.sf-alert');
        if (alert) dismissAlert(alert);
      });
    });

    document.querySelectorAll('.sf-toast-stack .sf-alert:not([data-persist])').forEach(function (alert) {
      setTimeout(function () { dismissAlert(alert); }, 6000);
    });
  }

  /* ────────────────────────────────────────────
     TOAST  (programmatic)
  ──────────────────────────────────────────── */
  function showToast(message, type) {
    type = type || 'info';

    var icons = {
      success: '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      danger:  '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      error:   '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      info:    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 8h.01M11 12h1v5h1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    };

    var stack = document.querySelector('.sf-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'sf-toast-stack';
      document.body.appendChild(stack);
    }

    var toast = document.createElement('div');
    toast.className = 'sf-alert sf-alert--' + type;
    toast.setAttribute('role', 'alert');
    toast.innerHTML =
      '<span class="sf-alert__icon" aria-hidden="true">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none">' +
      (icons[type] || icons.info) +
      '</svg></span>' +
      '<div class="sf-alert__body"><p class="sf-alert__message">' +
      message +
      '</p></div>' +
      '<button type="button" class="sf-alert__close" data-alert-close aria-label="Dismiss">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
      '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg></button>';

    stack.appendChild(toast);

    var closeBtn = toast.querySelector('[data-alert-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { dismissAlert(toast); });
    }

    setTimeout(function () { dismissAlert(toast); }, 6000);
  }

  /* ────────────────────────────────────────────
     DJANGO MESSAGES → TOASTS
  ──────────────────────────────────────────── */
  function initDjangoMessages() {
    document.querySelectorAll('.sf-dj-message').forEach(function (el) {
      var type = el.getAttribute('data-type') || 'info';
      var text = el.textContent.trim();
      if (text) showToast(text, type);
    });
  }

  /* ────────────────────────────────────────────
     CONFIRM  (data-confirm attribute)
  ──────────────────────────────────────────── */
  function initConfirm() {
    document.querySelectorAll('[data-confirm]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var msg = el.getAttribute('data-confirm') || 'Are you sure?';
        if (!window.confirm(msg)) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    });
  }

  /* ────────────────────────────────────────────
     CLICKABLE TABLE ROWS
  ──────────────────────────────────────────── */
  function initClickableRows() {
    document.querySelectorAll('tr[data-href]').forEach(function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.closest('a, button, input, select, textarea')) return;
        window.location.href = row.getAttribute('data-href');
      });
    });
  }

  /* ────────────────────────────────────────────
     COUNT-UP ANIMATION  (KPI values)
  ──────────────────────────────────────────── */
  function countUp(el, end, duration) {
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(end * eased).toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = end.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  }

  function initCountUp() {
    if (!window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el  = entry.target;
        var raw = el.getAttribute('data-count-to');
        if (!raw) return;
        var end = parseFloat(raw.replace(/,/g, ''));
        if (isNaN(end)) return;
        countUp(el, end, 900);
        observer.unobserve(el);
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('[data-count-up]').forEach(function (el) {
      var raw = el.textContent.replace(/,/g, '').trim();
      el.setAttribute('data-count-to', raw);
      el.textContent = '0';
      observer.observe(el);
    });
  }

  /* ────────────────────────────────────────────
     IMAGE PREVIEW  (product / profile forms)
  ──────────────────────────────────────────── */
  function initImagePreviews() {
    document.querySelectorAll('[data-image-input]').forEach(function (input) {
      var previewId = input.getAttribute('data-image-input');
      var preview   = document.getElementById(previewId);
      if (!preview) return;

      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
          preview.classList.add('is-visible');
        };
        reader.readAsDataURL(file);
      });
    });
  }

  /* ────────────────────────────────────────────
     PASSWORD VISIBILITY TOGGLE
  ──────────────────────────────────────────── */
  function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-toggle-password');
        var input    = document.getElementById(targetId);
        if (!input) return;
        var isHidden = input.type === 'password';
        input.type   = isHidden ? 'text' : 'password';
        btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      });
    });
  }

  /* ────────────────────────────────────────────
     PERIOD TOGGLE  (chart 7D / 30D / 90D)
  ──────────────────────────────────────────── */
  function initPeriodToggles() {
    document.querySelectorAll('.sf-period-toggle').forEach(function (group) {
      group.querySelectorAll('.sf-period-toggle__btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          group.querySelectorAll('.sf-period-toggle__btn').forEach(function (b) {
            b.classList.remove('is-active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        });
      });
    });
  }

  /* ────────────────────────────────────────────
     SWATCH PICKER  (category form)
  ──────────────────────────────────────────── */
  function initSwatchPicker() {
    document.querySelectorAll('.sf-swatch-option input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var picker = radio.closest('.sf-swatch-picker');
        if (!picker) return;
        picker.querySelectorAll('.sf-swatch-option').forEach(function (opt) {
          opt.classList.remove('is-selected');
        });
        radio.closest('.sf-swatch-option').classList.add('is-selected');
      });
    });
  }

  /* ────────────────────────────────────────────
     TAB PANELS
  ──────────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('[data-tab-trigger]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var targetId  = trigger.getAttribute('data-tab-trigger');
        var tabGroup  = trigger.closest('[data-tab-group]');

        if (tabGroup) {
          tabGroup.querySelectorAll('[data-tab-trigger]').forEach(function (t) {
            t.classList.remove('is-active');
            t.setAttribute('aria-selected', 'false');
          });
          tabGroup.querySelectorAll('.sf-tab-panel').forEach(function (p) {
            p.classList.remove('is-active');
          });
        }

        trigger.classList.add('is-active');
        trigger.setAttribute('aria-selected', 'true');

        var panel = document.getElementById(targetId);
        if (panel) panel.classList.add('is-active');
      });
    });
  }

  /* ────────────────────────────────────────────
     SALE LINE ITEMS
     Builds product rows dynamically in new/edit
     sale pages. The key fix: when a product is
     chosen, max="" is set to available stock so
     the browser itself blocks over-typing, and
     clampQuantity() enforces it programmatically.
  ──────────────────────────────────────────── */

  /* Build the <option> list for one product select */
  function buildProductOptions(products, selectedId) {
    var opts = '<option value="">Select product…</option>';
    products.forEach(function (p) {
      var sel = (p.id === selectedId) ? 'selected' : '';
      opts += '<option value="' + p.id + '" ' +
              'data-price="' + p.unit_price + '" ' +
              'data-stock="' + p.stock_quantity + '" ' + sel + '>' +
              p.name +
              (p.sku ? ' (' + p.sku + ')' : '') +
              ' — ' + p.stock_quantity + ' in stock' +
              '</option>';
    });
    return opts;
  }

  /* When a product is chosen from the dropdown:
     1. Auto-fill the unit price from data-price
     2. Set max on the qty input to available stock
     3. Recalculate the order summary */
  function onProductChange(select) {
    var option = select.options[select.selectedIndex];
    var price  = parseFloat(option.getAttribute('data-price'))  || 0;
    var stock  = parseInt(option.getAttribute('data-stock'), 10) || 0;
    var row    = select.closest('tr');
    if (!row) return;

    var priceInput = row.querySelector('input[name="unit_price"]');
    var qtyInput   = row.querySelector('input[name="quantity"]');

    if (priceInput) priceInput.value = price.toFixed(2);

    if (qtyInput) {
      if (stock > 0) {
        /* Cap max at available stock */
        qtyInput.max   = stock;
        /* If current value already exceeds stock, bring it down */
        var currentQty = parseInt(qtyInput.value, 10) || 1;
        if (currentQty > stock) {
          qtyInput.value = stock;
          showToast(
            'Quantity adjusted — only ' + stock + ' in stock for "' +
            (option.text || 'this product') + '".',
            'warning'
          );
        }
      } else {
        /* Stock is 0 — this shouldn't normally appear in the dropdown
           (the view filters them out) but handle defensively */
        qtyInput.max   = 0;
        qtyInput.value = 0;
        showToast(
          '"' + (option.text || 'This product') + '" is out of stock.',
          'danger'
        );
      }
    }

    updateOrderSummary();
  }

  /* Called on every keystroke in a qty input.
     Clamps the value down to the product's stock
     and shows a toast if it was clamped. */
  function clampQuantity(input) {
    var row    = input.closest('tr');
    if (!row) return;
    var select = row.querySelector('select[name="product_id"]');
    if (!select) return;
    var option = select.options[select.selectedIndex];
    if (!option || !option.value) return;

    var stock  = parseInt(option.getAttribute('data-stock'), 10) || 0;
    var wanted = parseInt(input.value, 10) || 0;

    if (wanted < 1) {
      input.value = 1;
      updateOrderSummary();
      return;
    }

    if (stock > 0 && wanted > stock) {
      input.value = stock;
      showToast(
        'Only ' + stock + ' in stock — quantity capped at ' + stock + '.',
        'warning'
      );
    }

    updateOrderSummary();
  }

  /* Remove a line item row */
  function removeRow(btn) {
    var row = btn.closest('tr');
    if (row) row.remove();
    updateOrderSummary();
  }

  /* Append a new blank line item row */
  function addLineItemRow(container, products, productId, qty, price) {
    var tr = document.createElement('tr');

    var qtyValue   = qty   || 1;
    var priceValue = price ? parseFloat(price).toFixed(2) : '';

    tr.innerHTML =
      '<td>' +
        '<select name="product_id" class="sf-select" ' +
                'onchange="Inventra.onProductChange(this)" required>' +
          buildProductOptions(products, productId || null) +
        '</select>' +
      '</td>' +
      '<td>' +
        '<input type="number" name="quantity" class="sf-input sf-num" ' +
               'value="' + qtyValue + '" min="1" step="1" ' +
               'oninput="Inventra.clampQuantity(this)" required>' +
      '</td>' +
      '<td>' +
        '<input type="number" name="unit_price" class="sf-input sf-num" ' +
               'value="' + priceValue + '" min="0" step="0.01" ' +
               'placeholder="0.00" oninput="Inventra.updateOrderSummary()" required>' +
      '</td>' +
      '<td class="sf-num" style="text-align:right; color:var(--color-ink);">0.00</td>' +
      '<td style="text-align:right;">' +
        '<button type="button" class="sf-line-items__remove" ' +
                'onclick="Inventra.removeRow(this)" aria-label="Remove row">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
            '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" ' +
                  'stroke-width="1.8" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
      '</td>';

    container.appendChild(tr);

    /* If we were given a pre-selected product, set max on qty right away */
    if (productId && qty) {
      var select = tr.querySelector('select[name="product_id"]');
      var qtyEl  = tr.querySelector('input[name="quantity"]');
      if (select && qtyEl) {
        var opt   = select.querySelector('option[value="' + productId + '"]');
        var stock = opt ? parseInt(opt.getAttribute('data-stock'), 10) || 0 : 0;
        if (stock > 0) qtyEl.max = stock;
      }
    }

    updateOrderSummary();
  }

  /* Recalculate the order summary sidebar */
  function updateOrderSummary() {
    var container = document.getElementById('sf-line-items-body');
    if (!container) return;

    var total     = 0;
    var itemCount = 0;

    container.querySelectorAll('tr').forEach(function (row) {
      var qtyEl   = row.querySelector('input[name="quantity"]');
      var priceEl = row.querySelector('input[name="unit_price"]');
      var subEl   = row.cells && row.cells[3];

      var qty   = qtyEl   ? parseFloat(qtyEl.value)   || 0 : 0;
      var price = priceEl ? parseFloat(priceEl.value)  || 0 : 0;
      var sub   = qty * price;

      if (subEl) subEl.textContent = sub.toFixed(2);

      total     += sub;
      itemCount += qty;
    });

    var totalEl = document.getElementById('sf-order-total');
    var itemsEl = document.getElementById('sf-order-items');
    if (totalEl) totalEl.textContent = 'KES ' + total.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (itemsEl) itemsEl.textContent = itemCount + ' item' + (itemCount !== 1 ? 's' : '');
  }

  /* Wire up the Add Product button and bootstrap
     any pre-existing rows (edit sale page) */
  function initSaleLineItems() {
    var container = document.getElementById('sf-line-items-body');
    var addBtn    = document.getElementById('sf-add-line-item');
    if (!container) return;

    /* Products are injected as a JSON script tag by the template */
    var productsEl = document.getElementById('sf-products-json');
    var products   = [];
    if (productsEl) {
      try {
        products = JSON.parse(productsEl.textContent);
      } catch (e) {
        console.error('Inventra: could not parse sf-products-json', e);
      }
    }

    /* Add blank row when + button is clicked */
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addLineItemRow(container, products);
      });
    }

    /* Bootstrap existing rows on edit sale page.
       The template injects sf-existing-items-json. */
    var existingEl = document.getElementById('sf-existing-items-json');
    if (existingEl) {
      var existing = [];
      try { existing = JSON.parse(existingEl.textContent); } catch (e) { /* empty */ }

      if (existing.length > 0) {
        existing.forEach(function (item) {
          addLineItemRow(container, products, item.productId, item.quantity, item.price);
        });
      } else if (addBtn) {
        addBtn.click(); /* Start with one empty row */
      }
    } else if (addBtn) {
      /* New sale page — start with one empty row */
      addBtn.click();
    }

    updateOrderSummary();
  }

  /* ────────────────────────────────────────────
     SEARCH SHORTCUT  (⌘K / Ctrl+K)
  ──────────────────────────────────────────── */
  function initSearchShortcut() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        var search = document.querySelector('.sf-topbar__search input');
        if (search) search.focus();
      }
    });
  }

  /* ────────────────────────────────────────────
     INIT
  ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    initActiveNav();
    initDropdowns();
    initModals();
    initAlerts();
    initDjangoMessages();
    initConfirm();
    initClickableRows();
    initCountUp();
    initImagePreviews();
    initPasswordToggles();
    initPeriodToggles();
    initSwatchPicker();
    initTabs();
    initSaleLineItems();
    initSearchShortcut();
  });

  /* ── Public API exposed to inline onclick handlers ── */
  window.Inventra = {
    showToast:          showToast,
    openModal:          openModal,
    closeModal: function (id) {
      var overlay = document.getElementById(id);
      if (overlay) closeModal(overlay);
    },
    onProductChange:    onProductChange,
    clampQuantity:      clampQuantity,
    removeRow:          removeRow,
    updateOrderSummary: updateOrderSummary,
  };

})();