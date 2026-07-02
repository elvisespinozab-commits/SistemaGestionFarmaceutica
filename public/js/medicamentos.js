// ============================================================
// public/js/medicamentos.js
// Conecta el formulario y la tabla de la vista Medicamentos a
// los endpoints reales de /api/medicamentos y /api/categorias.
// Guardar, Editar y Eliminar quedan persistidos en SQL Server.
// ============================================================

const form = document.getElementById("formMedicamento");
const inputId = document.getElementById("idMedicamento");
const selectCategoria = document.getElementById("idCategoria");
const selectEstado = document.getElementById("estado");
const tbody = document.getElementById("tablaMedicamentosBody");
const inputBuscar = document.getElementById("buscarMedicamento");

const btnNuevo = document.getElementById("btnNuevo");
const btnEditar = document.getElementById("btnEditar");
const btnEliminar = document.getElementById("btnEliminar");
const btnActualizar = document.getElementById("btnActualizar");

let medicamentosCache = [];
let medicamentoSeleccionado = null;

// ------------------------------------------------------------
// Carga inicial
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    cargarMedicamentos();
});

// ------------------------------------------------------------
// Categorías (para el <select> del formulario)
// ------------------------------------------------------------
async function cargarCategorias() {
    try {
        const resp = await fetch("/api/categorias");
        const json = await resp.json();

        if (!json.success) return;

        selectCategoria.innerHTML = '<option value="" selected disabled>Seleccione...</option>';

        json.data.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.id_categoria;
            opt.textContent = cat.nombre;
            selectCategoria.appendChild(opt);
        });

    } catch (error) {
        console.log("Error al cargar categorías:", error);
    }
}

// ------------------------------------------------------------
// Listado de medicamentos
// ------------------------------------------------------------
async function cargarMedicamentos() {
    try {
        const resp = await fetch("/api/medicamentos");
        const json = await resp.json();

        if (!json.success) {
            alert(json.mensaje || "No se pudo cargar el listado de medicamentos");
            return;
        }

        medicamentosCache = json.data;
        renderizarTabla(medicamentosCache);

    } catch (error) {
        console.log("Error al cargar medicamentos:", error);
        alert("No se pudo conectar con el servidor");
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

        if (medicamentoSeleccionado && medicamentoSeleccionado.id_medicamento === med.id_medicamento) {
            tr.classList.add("selected-row");
        }

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

        // Clic en la fila -> la selecciona (resalta) sin tocar el formulario
        tr.addEventListener("click", () => seleccionarFila(med));

        // Lápiz -> selecciona Y carga los datos al formulario
        tr.querySelector(".icon-edit").addEventListener("click", (e) => {
            e.stopPropagation();
            seleccionarFila(med);
            cargarEnFormulario(med);
        });

        // Basurero -> elimina directo (con confirmación)
        tr.querySelector(".icon-delete").addEventListener("click", (e) => {
            e.stopPropagation();
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
// Selección de fila (resalta y guarda referencia para
// Editar/Eliminar desde los botones de arriba)
// ------------------------------------------------------------
function seleccionarFila(med) {
    medicamentoSeleccionado = med;
    renderizarTabla(inputBuscar.value ? filtrar(inputBuscar.value) : medicamentosCache);
}

// ------------------------------------------------------------
// Botones superiores
// ------------------------------------------------------------
btnNuevo.addEventListener("click", () => {
    form.reset();
    inputId.value = "";
    selectEstado.value = "1";
    medicamentoSeleccionado = null;
    renderizarTabla(inputBuscar.value ? filtrar(inputBuscar.value) : medicamentosCache);
});

btnEditar.addEventListener("click", () => {
    if (!medicamentoSeleccionado) {
        alert("Selecciona un medicamento de la lista primero");
        return;
    }
    cargarEnFormulario(medicamentoSeleccionado);
});

btnEliminar.addEventListener("click", () => {
    if (!medicamentoSeleccionado) {
        alert("Selecciona un medicamento de la lista primero");
        return;
    }
    eliminarMedicamento(medicamentoSeleccionado.id_medicamento);
});

btnActualizar.addEventListener("click", cargarMedicamentos);

// ------------------------------------------------------------
// Cargar datos de un medicamento en el formulario (modo edición)
// ------------------------------------------------------------
function cargarEnFormulario(med) {
    inputId.value = med.id_medicamento;
    document.getElementById("codigo").value = med.codigo ?? "";
    document.getElementById("nombre").value = med.nombre ?? "";
    selectCategoria.value = med.id_categoria ?? "";
    document.getElementById("laboratorio").value = med.laboratorio ?? "";
    document.getElementById("presentacion").value = med.presentacion ?? "";
    document.getElementById("concentracion").value = med.concentracion ?? "";
    document.getElementById("precioCompra").value = med.precio_compra ?? "";
    document.getElementById("precioVenta").value = med.precio_venta ?? "";
    document.getElementById("stock").value = med.stock ?? "";
    document.getElementById("stockMinimo").value = med.stock_minimo ?? "";
    document.getElementById("fechaVencimiento").value = med.fecha_vencimiento
        ? String(med.fecha_vencimiento).substring(0, 10)
        : "";
    selectEstado.value = (med.estado === false || med.estado === 0) ? "0" : "1";
}

// ------------------------------------------------------------
// Guardar (POST si es nuevo, PUT si venía de "Editar")
// ------------------------------------------------------------
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        idCategoria: selectCategoria.value || null,
        laboratorio: document.getElementById("laboratorio").value.trim(),
        presentacion: document.getElementById("presentacion").value.trim(),
        concentracion: document.getElementById("concentracion").value.trim(),
        precioCompra: document.getElementById("precioCompra").value || 0,
        precioVenta: document.getElementById("precioVenta").value || 0,
        stock: document.getElementById("stock").value || 0,
        stockMinimo: document.getElementById("stockMinimo").value || 10,
        fechaVencimiento: document.getElementById("fechaVencimiento").value || null,
        estado: selectEstado.value
    };

    if (!datos.nombre) {
        alert("El nombre es obligatorio");
        return;
    }

    const id = inputId.value;
    const esEdicion = !!id;

    try {
        const resp = await fetch(esEdicion ? `/api/medicamentos/${id}` : "/api/medicamentos", {
            method: esEdicion ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const json = await resp.json();

        if (!json.success) {
            alert(json.mensaje || "No se pudo guardar el medicamento");
            return;
        }

        form.reset();
        inputId.value = "";
        selectEstado.value = "1";
        medicamentoSeleccionado = null;

        await cargarMedicamentos();

    } catch (error) {
        console.log("Error al guardar:", error);
        alert("No se pudo conectar con el servidor");
    }
});

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
            alert(json.mensaje || "No se pudo eliminar el medicamento");
            return;
        }

        if (medicamentoSeleccionado && medicamentoSeleccionado.id_medicamento === id) {
            medicamentoSeleccionado = null;
            form.reset();
            inputId.value = "";
        }

        await cargarMedicamentos();

    } catch (error) {
        console.log("Error al eliminar:", error);
        alert("No se pudo conectar con el servidor");
    }
}

// ------------------------------------------------------------
// Buscador (filtro local sobre lo ya cargado, sin más requests)
// ------------------------------------------------------------
function filtrar(texto) {
    const t = texto.toLowerCase();
    return medicamentosCache.filter(m =>
        (m.nombre ?? "").toLowerCase().includes(t) ||
        (m.codigo ?? "").toLowerCase().includes(t)
    );
}

inputBuscar.addEventListener("input", () => {
    renderizarTabla(filtrar(inputBuscar.value));
});