/* ========================================
   INVENTRA — MAIN JS
   General utilities and interactions
======================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ---- Confirm delete links ----
  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      const msg = el.getAttribute('data-confirm') || 'Are you sure?';
      if (!confirm(msg)) {
        e.preventDefault();
      }
    });
  });

  // ---- Auto-hide alerts after 5 seconds ----
  document.querySelectorAll('.alert-auto-hide').forEach(function (alert) {
    setTimeout(function () {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(function () { alert.remove(); }, 500);
    }, 5000);
  });

  // ---- Number formatting in stat cards ----
  document.querySelectorAll('[data-format-number]').forEach(function (el) {
    const num = parseFloat(el.textContent.replace(/,/g, ''));
    if (!isNaN(num)) {
      el.textContent = num.toLocaleString();
    }
  });

  // ---- Table row clickable ----
  document.querySelectorAll('tr[data-href]').forEach(function (row) {
    row.style.cursor = 'pointer';
    row.addEventListener('click', function () {
      window.location.href = row.getAttribute('data-href');
    });
  });

});