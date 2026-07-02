// ============================================================
// public/js/sidebar-nav.js
// Convierte cualquier elemento del sidebar con data-href en un
// enlace funcional. Así se puede "entrar a cualquier ventana
// desde cualquiera", igual que en el NetBeans.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-href]").forEach(el => {
        el.addEventListener("click", () => {
            window.location.href = el.dataset.href;
        });
    });
});