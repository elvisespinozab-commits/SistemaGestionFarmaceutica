// ============================================================
// public/js/toast.js
// Reemplazo del alert() nativo del navegador. Muestra un mensaje
// con el mismo estilo que la caja de error del login (icono +
// caja de color), en la esquina superior derecha, y se oculta solo.
//
// Uso: mostrarToast("Selecciona un medicamento de la lista primero");
//      mostrarToast("Medicamento guardado correctamente", "success");
// ============================================================

function mostrarToast(mensaje, tipo = "error") {
    let contenedor = document.getElementById("toastContainer");

    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "toastContainer";
        contenedor.className = "toast-container";
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;

    const icono = tipo === "success" ? "fa-circle-check" : "fa-circle-xmark";

    toast.innerHTML = `
        <i class="fa-solid ${icono}"></i>
        <span>${mensaje}</span>
    `;

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-oculto");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}