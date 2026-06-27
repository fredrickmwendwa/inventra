/* ========================================
   INVENTRA — SIDEBAR & UI INTERACTIONS
======================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ---- Sidebar Collapse (Desktop) ----
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const toggleBtn = document.getElementById('sidebarToggle');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
      if (mainContent) {
        mainContent.classList.toggle('sidebar-collapsed');
      }
      // Save state
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);

      // Flip arrow
      const arrow = toggleBtn.querySelector('.toggle-arrow');
      if (arrow) {
        arrow.textContent = isCollapsed ? '›' : '‹';
      }
    });

    // Restore saved state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      sidebar.classList.add('collapsed');
      if (mainContent) mainContent.classList.add('sidebar-collapsed');
      const arrow = toggleBtn.querySelector('.toggle-arrow');
      if (arrow) arrow.textContent = '›';
    }
  }

  // ---- Mobile Sidebar ----
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', function () {
      sidebar.classList.toggle('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function () {
      if (sidebar) sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // ---- Dropdown Menus ----
  const dropdownTriggers = document.querySelectorAll('[data-dropdown]');

  dropdownTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const targetId = trigger.getAttribute('data-dropdown');
      const menu = document.getElementById(targetId);
      if (!menu) return;

      // Close all other dropdowns first
      document.querySelectorAll('.dropdown-menu.open').forEach(function (m) {
        if (m !== menu) m.classList.remove('open');
      });

      menu.classList.toggle('open');
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown-menu.open').forEach(function (m) {
      m.classList.remove('open');
    });
  });

  // ---- Modal ----
  // Open modal
  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-modal-open');
      const overlay = document.getElementById(id);
      if (overlay) overlay.classList.add('open');
    });
  });

  // Close modal
  document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-modal-close');
      const overlay = document.getElementById(id);
      if (overlay) overlay.classList.remove('open');
    });
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  // ---- Auto-dismiss Django messages as toasts ----
  const djangoMessages = document.querySelectorAll('.django-message');
  djangoMessages.forEach(function (msg) {
    const type = msg.getAttribute('data-type') || 'info';
    const text = msg.textContent.trim();
    showToast(text, type);
  });

  // ---- Active nav link ----
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(function (item) {
    const href = item.getAttribute('href');
    if (href && currentPath.startsWith(href) && href !== '/') {
      item.classList.add('active');
    }
  });

});

// ---- Toast Function ----
function showToast(message, type) {
  type = type || 'info';

  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
    '<span>' + message + '</span>';

  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('hiding');
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 4000);
}