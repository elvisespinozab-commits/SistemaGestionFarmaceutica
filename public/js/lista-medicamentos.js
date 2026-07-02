// ============================================================
// public/js/lista-medicamentos.js
// Carga y filtra la tabla de medicamentos. El lápiz de cada fila
// manda a /registrar-medicamento?id=X (modo edición). El basurero
// elimina directo (con confirmación).
// ============================================================

const tbody = document.getElementById("tablaMedicamentosBody");
const inputBuscar = document.getElementById("buscarMedicamento");
const btnNuevoMedicamento = document.getElementById("btnNuevoMedicamento");

let medicamentosCache = [];

document.addEventListener("DOMContentLoaded", cargarMedicamentos);

btnNuevoMedicamento.addEventListener("click", () => {
    window.location.href = "/registrar-medicamento";
});

// ------------------------------------------------------------
// Listado
// ------------------------------------------------------------
async function cargarMedicamentos() {
    try {
        const resp = await fetch("/api/medicamentos");
        const json = await resp.json();

        if (!json.success) {
            mostrarToast(json.mensaje || "No se pudo cargar el listado de medicamentos");
            return;
        }

        medicamentosCache = json.data;
        renderizarTabla(medicamentosCache);

    } catch (error) {
        console.log("Error al cargar medicamentos:", error);
        mostrarToast("No se pudo conectar con el servidor");
    }
}

function renderizarTabla(lista) {
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align:center;color:#94a3b8;">
                    Sin medicamentos registrados
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach(med => {
        const tr = document.createElement("tr");
        tr.dataset.id = med.id_medicamento;

        tr.innerHTML = `
            <td>${med.codigo ?? "-"}</td>
            <td>${med.nombre}</td>
            <td>${med.categoria ?? "-"}</td>
            <td>${med.laboratorio ?? "-"}</td>
            <td>${med.presentacion ?? "-"}</td>
            <td>${Number(med.precio_venta ?? 0).toFixed(2)}</td>
            <td>${med.stock ?? 0}</td>
            <td>${med.stock_minimo ?? 0}</td>
            <td>${formatearFecha(med.fecha_vencimiento)}</td>
            <td>${badgeEstado(med)}</td>
            <td>
                <div class="row-actions">
                    <button type="button" class="icon-btn icon-edit" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="icon-btn icon-delete" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tr.querySelector(".icon-edit").addEventListener("click", () => {
            window.location.href = `/registrar-medicamento?id=${med.id_medicamento}`;
        });

        tr.querySelector(".icon-delete").addEventListener("click", () => {
            eliminarMedicamento(med.id_medicamento);
        });

        tbody.appendChild(tr);
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-PE");
}

function badgeEstado(med) {
    if (med.estado === false || med.estado === 0) {
        return `<span class="badge badge-off">Inactivo</span>`;
    }
    if (med.stock <= med.stock_minimo) {
        return `<span class="badge badge-low">Stock bajo</span>`;
    }
    return `<span class="badge badge-ok">Activo</span>`;
}

// ------------------------------------------------------------
// Eliminar
// ------------------------------------------------------------
async function eliminarMedicamento(id) {
    const confirmado = confirm("¿Seguro que deseas eliminar este medicamento? Esta acción no se puede deshacer.");
    if (!confirmado) return;

    try {
        const resp = await fetch(`/api/medicamentos/${id}`, { method: "DELETE" });
        const json = await resp.json();

        if (!json.success) {
            mostrarToast(json.mensaje || "No se pudo eliminar el medicamento");
            return;
        }

        mostrarToast("Medicamento eliminado correctamente", "success");

        await cargarMedicamentos();

    } catch (error) {
        console.log("Error al eliminar:", error);
        mostrarToast("No se pudo conectar con el servidor");
    }
}

// ------------------------------------------------------------
// Buscador (filtro local)
// ------------------------------------------------------------
inputBuscar.addEventListener("input", () => {
    const t = inputBuscar.value.toLowerCase();
    const filtrado = medicamentosCache.filter(m =>
        (m.nombre ?? "").toLowerCase().includes(t) ||
        (m.codigo ?? "").toLowerCase().includes(t)
    );
    renderizarTabla(filtrado);
});