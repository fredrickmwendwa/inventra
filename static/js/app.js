/* ============================================================
   INVENTRA — CORE INTERACTIONS
   Vanilla JS only. No framework. Progressive enhancement.
   Every interaction degrades gracefully if JS fails to load.
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────
     THEME  (light / dark)
     Stored in localStorage so the toggle is
     instant — no flash on next page load.
  ────────────────────────────────────────── */
  var THEME_KEY   = 'inventra-theme';
  var SIDEBAR_KEY = 'inventra-sidebar-collapsed';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* blocked */ }

    /* Flip the moon/sun icon if present */
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

  /* ──────────────────────────────────────────
     SIDEBAR COLLAPSE  (desktop)
  ────────────────────────────────────────── */
  function initSidebar() {
    var shell = document.querySelector('.sf-shell');
    if (!shell) return;

    /* Restore saved state */
    var collapsed = false;
    try { collapsed = localStorage.getItem(SIDEBAR_KEY) === '1'; } catch (e) { /* noop */ }
    if (collapsed) shell.classList.add('is-collapsed');

    /* Desktop collapse toggle */
    document.querySelectorAll('[data-sidebar-collapse]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isCollapsed = shell.classList.toggle('is-collapsed');
        try { localStorage.setItem(SIDEBAR_KEY, isCollapsed ? '1' : '0'); } catch (e) { /* noop */ }
      });
    });

    /* Mobile open */
    document.querySelectorAll('[data-mobile-nav-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        shell.classList.toggle('is-mobile-nav-open');
      });
    });

    /* Mobile close — scrim click or explicit close button */
    document.querySelectorAll('[data-mobile-nav-close], .sf-scrim').forEach(function (el) {
      el.addEventListener('click', function () {
        shell.classList.remove('is-mobile-nav-open');
      });
    });
  }

  /* ──────────────────────────────────────────
     ACTIVE NAV LINK
     Matches current path prefix to href.
  ────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────
     DROPDOWNS
  ────────────────────────────────────────── */
  function initDropdowns() {
    document.querySelectorAll('[data-dropdown-trigger]').forEach(function (trigger) {
      var targetId = trigger.getAttribute('data-dropdown-trigger');
      var menu = document.getElementById(targetId);
      if (!menu) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = !menu.classList.contains('is-open');
        /* Close all open dropdowns first */
        document.querySelectorAll('.sf-dropdown.is-open').forEach(function (m) {
          m.classList.remove('is-open');
        });
        if (willOpen) menu.classList.add('is-open');
      });
    });

    /* Click outside closes all */
    document.addEventListener('click', function () {
      document.querySelectorAll('.sf-dropdown.is-open').forEach(function (m) {
        m.classList.remove('is-open');
      });
    });

    /* Escape key closes all */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.sf-dropdown.is-open').forEach(function (m) {
          m.classList.remove('is-open');
        });
      }
    });
  }

  /* ──────────────────────────────────────────
     MODALS
     Triggered via data-modal-open="<id>".
     Focus is trapped and returned on close.
  ────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────
     ALERTS / TOAST DISMISS
  ────────────────────────────────────────── */
  function dismissAlert(alert) {
    alert.style.transition = 'opacity ' + '160ms ease, transform 160ms ease';
    alert.style.opacity = '0';
    alert.style.transform = 'translateY(-4px)';
    setTimeout(function () { if (alert.parentNode) alert.parentNode.removeChild(alert); }, 170);
  }

  function initAlerts() {
    /* Manual dismiss */
    document.querySelectorAll('[data-alert-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var alert = btn.closest('.sf-alert');
        if (alert) dismissAlert(alert);
      });
    });

    /* Django messages → toasts (auto-dismissed after 6 s) */
    document.querySelectorAll('.sf-toast-stack .sf-alert:not([data-persist])').forEach(function (alert) {
      setTimeout(function () { dismissAlert(alert); }, 6000);
    });
  }

  /* ──────────────────────────────────────────
     SHOW TOAST  (programmatic API)
  ────────────────────────────────────────── */
  function showToast(message, type) {
    type = type || 'info';

    var icons = {
      success: '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      danger:  '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      error:   '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      info:    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 8h.01M11 12h1v5h1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    };

    /* Find or create the toast stack */
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
      '<div class="sf-alert__body"><p class="sf-alert__message">' + message + '</p></div>' +
      '<button type="button" class="sf-alert__close" data-alert-close aria-label="Dismiss">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
      '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg></button>';

    stack.appendChild(toast);

    /* Wire close button */
    var closeBtn = toast.querySelector('[data-alert-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { dismissAlert(toast); });
    }

    /* Auto-dismiss */
    setTimeout(function () { dismissAlert(toast); }, 6000);
  }

  /* ──────────────────────────────────────────
     DJANGO MESSAGES → TOASTS
     Hidden spans injected by base.html are
     picked up here and shown as toasts.
  ────────────────────────────────────────── */
  function initDjangoMessages() {
    document.querySelectorAll('.sf-dj-message').forEach(function (el) {
      var type = el.getAttribute('data-type') || 'info';
      var text = el.textContent.trim();
      if (text) showToast(text, type);
    });
  }

  /* ──────────────────────────────────────────
     CONFIRM (data-confirm attribute)
  ────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────
     CLICKABLE TABLE ROWS
  ────────────────────────────────────────── */
  function initClickableRows() {
    document.querySelectorAll('tr[data-href]').forEach(function (row) {
      row.addEventListener('click', function (e) {
        /* Don't trigger if user clicks a button/link inside the row */
        if (e.target.closest('a, button, input, select, textarea')) return;
        window.location.href = row.getAttribute('data-href');
      });
    });
  }

  /* ──────────────────────────────────────────
     COUNT-UP ANIMATION  (KPI values)
     Runs once when the element scrolls into view.
  ────────────────────────────────────────── */
  function countUp(el, end, duration) {
    var startTime = null;
    var startVal  = 0;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      /* Ease-out cubic */
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(startVal + (end - startVal) * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = end.toLocaleString();
    }

    requestAnimationFrame(step);
  }

  function initCountUp() {
    /* Only run if IntersectionObserver is supported */
    if (!window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el  = entry.target;
        var raw = el.getAttribute('data-count-to');
        if (!raw) return;
        var end = parseFloat(raw.replace(/,/g, ''));
        if (isNaN(end)) return;
        el.setAttribute('data-counting', '1');
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

  /* ──────────────────────────────────────────
     IMAGE PREVIEW  (product / profile forms)
  ────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────
     PASSWORD VISIBILITY TOGGLE
  ────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────
     PERIOD TOGGLE (chart 7D / 30D / 90D)
     Just handles the active class — chart
     update is wired in the dashboard template.
  ────────────────────────────────────────── */
  function initPeriodToggles() {
    document.querySelectorAll('.sf-period-toggle').forEach(function (group) {
      group.querySelectorAll('.sf-period-toggle__btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          group.querySelectorAll('.sf-period-toggle__btn').forEach(function (b) {
            b.classList.remove('is-active');
          });
          btn.classList.add('is-active');
        });
      });
    });
  }

  /* ──────────────────────────────────────────
     SWATCH PICKER (category form)
  ────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────
     TAB PANELS
  ────────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('[data-tab-trigger]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var targetId = trigger.getAttribute('data-tab-trigger');
        var tabGroup = trigger.closest('[data-tab-group]');

        /* Deactivate all tabs in this group */
        if (tabGroup) {
          tabGroup.querySelectorAll('[data-tab-trigger]').forEach(function (t) {
            t.classList.remove('is-active');
          });
          tabGroup.querySelectorAll('.sf-tab-panel').forEach(function (p) {
            p.classList.remove('is-active');
          });
        } else {
          document.querySelectorAll('[data-tab-trigger]').forEach(function (t) {
            t.classList.remove('is-active');
          });
          document.querySelectorAll('.sf-tab-panel').forEach(function (p) {
            p.classList.remove('is-active');
          });
        }

        /* Activate the clicked tab and its panel */
        trigger.classList.add('is-active');
        var panel = document.getElementById(targetId);
        if (panel) panel.classList.add('is-active');
      });
    });
  }

  /* ──────────────────────────────────────────
     SALE LINE ITEMS  (new / edit sale page)
     Adds/removes product rows dynamically.
  ────────────────────────────────────────── */
  function initSaleLineItems() {
    var container = document.getElementById('sf-line-items-body');
    var addBtn    = document.getElementById('sf-add-line-item');
    if (!container || !addBtn) return;

    var rowIndex = container.querySelectorAll('tr').length;

    addBtn.addEventListener('click', function () {
      rowIndex++;
      addLineItemRow(container, rowIndex);
      updateOrderSummary();
    });

    /* Wire existing rows (edit sale) */
    container.querySelectorAll('[data-remove-row]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('tr').remove();
        updateOrderSummary();
      });
    });
  }

  function addLineItemRow(container, index) {
    /* Products are injected as JSON by the template */
    var productsEl = document.getElementById('sf-products-json');
    var products   = productsEl ? JSON.parse(productsEl.textContent) : [];

    var options = '<option value="">Select product…</option>';
    products.forEach(function (p) {
      options += '<option value="' + p.id + '" data-price="' + p.unit_price + '">' +
        p.name + (p.sku ? ' (' + p.sku + ')' : '') + ' — ' + p.stock_quantity + ' in stock</option>';
    });

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' +
        '<select name="product_id" class="sf-select" onchange="Inventra.onProductChange(this)" required>' +
          options +
        '</select>' +
      '</td>' +
      '<td><input type="number" name="quantity" class="sf-input sf-num" value="1" min="1" step="1" oninput="Inventra.updateOrderSummary()" required></td>' +
      '<td><input type="number" name="unit_price" class="sf-input sf-num" value="" min="0" step="0.01" placeholder="0.00" oninput="Inventra.updateOrderSummary()" required></td>' +
      '<td class="sf-num" id="sf-row-subtotal-' + index + '">0.00</td>' +
      '<td>' +
        '<button type="button" class="sf-line-items__remove" data-remove-row aria-label="Remove row">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</td>';

    container.appendChild(tr);

    tr.querySelector('[data-remove-row]').addEventListener('click', function () {
      tr.remove();
      updateOrderSummary();
    });
  }

  function onProductChange(select) {
    var option = select.options[select.selectedIndex];
    var price  = option.getAttribute('data-price');
    if (!price) return;
    var row    = select.closest('tr');
    if (!row) return;
    var priceInput = row.querySelector('input[name="unit_price"]');
    if (priceInput) priceInput.value = parseFloat(price).toFixed(2);
    updateOrderSummary();
  }

  function updateOrderSummary() {
    var container = document.getElementById('sf-line-items-body');
    if (!container) return;

    var total     = 0;
    var itemCount = 0;

    container.querySelectorAll('tr').forEach(function (row) {
      var qtyInput   = row.querySelector('input[name="quantity"]');
      var priceInput = row.querySelector('input[name="unit_price"]');
      var qty   = qtyInput   ? parseFloat(qtyInput.value)   || 0 : 0;
      var price = priceInput ? parseFloat(priceInput.value) || 0 : 0;
      var sub   = qty * price;
      total     += sub;
      itemCount += qty;
    });

    var totalEl = document.getElementById('sf-order-total');
    var itemsEl = document.getElementById('sf-order-items');
    if (totalEl) totalEl.textContent = 'KES ' + total.toLocaleString('en-KE', { minimumFractionDigits: 2 });
    if (itemsEl) itemsEl.textContent = itemCount + ' item' + (itemCount !== 1 ? 's' : '');
  }

  /* ──────────────────────────────────────────
     SEARCH  (Ctrl/Cmd + K focuses topbar search)
  ────────────────────────────────────────── */
  function initSearchShortcut() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        var search = document.querySelector('.sf-topbar__search input');
        if (search) search.focus();
      }
    });
  }

  /* ──────────────────────────────────────────
     INIT
  ────────────────────────────────────────── */
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

  /* ── Public API ── */
  window.Inventra = {
    showToast:        showToast,
    openModal:        openModal,
    closeModal: function (id) {
      var overlay = document.getElementById(id);
      if (overlay) closeModal(overlay);
    },
    onProductChange:  onProductChange,
    updateOrderSummary: updateOrderSummary,
  };

})();