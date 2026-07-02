// ============================================================
// public/js/categorias.js
// CRUD completo del módulo Categorías: guardar, editar y
// eliminar quedan persistidos en SQL Server.
// ============================================================

const form = document.getElementById("formCategoria");
const inputId = document.getElementById("idCategoria");
const selectEstado = document.getElementById("estado");
const tbody = document.getElementById("tablaCategoriasBody");
const inputBuscar = document.getElementById("buscarCategoria");

const btnNuevo = document.getElementById("btnNuevo");
const btnEditar = document.getElementById("btnEditar");
const btnEliminar = document.getElementById("btnEliminar");
const btnActualizar = document.getElementById("btnActualizar");

let categoriasCache = [];
let categoriaSeleccionada = null;

document.addEventListener("DOMContentLoaded", cargarCategorias);

// ------------------------------------------------------------
// Listado
// ------------------------------------------------------------
async function cargarCategorias() {
    try {
        const resp = await fetch("/api/categorias");
        const json = await resp.json();

        if (!json.success) {
            mostrarToast(json.mensaje || "No se pudo cargar el listado de categorías");
            return;
        }

        categoriasCache = json.data;
        renderizarTabla(categoriasCache);

    } catch (error) {
        console.log("Error al cargar categorías:", error);
        mostrarToast("No se pudo conectar con el servidor");
    }
}

function renderizarTabla(lista) {
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;color:#94a3b8;">
                    Sin categorías registradas
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach(cat => {
        const tr = document.createElement("tr");
        tr.dataset.id = cat.id_categoria;

        if (categoriaSeleccionada && categoriaSeleccionada.id_categoria === cat.id_categoria) {
            tr.classList.add("selected-row");
        }

        const badge = (cat.estado === false || cat.estado === 0)
            ? `<span class="badge badge-off">Inactivo</span>`
            : `<span class="badge badge-ok">Activo</span>`;

        tr.innerHTML = `
            <td>${cat.nombre}</td>
            <td>${cat.descripcion ?? "-"}</td>
            <td>${badge}</td>
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

        tr.addEventListener("click", () => seleccionarFila(cat));

        tr.querySelector(".icon-edit").addEventListener("click", (e) => {
            e.stopPropagation();
            seleccionarFila(cat);
            cargarEnFormulario(cat);
        });

        tr.querySelector(".icon-delete").addEventListener("click", (e) => {
            e.stopPropagation();
            eliminarCategoria(cat.id_categoria);
        });

        tbody.appendChild(tr);
    });
}

// ------------------------------------------------------------
// Selección de fila
// ------------------------------------------------------------
function seleccionarFila(cat) {
    categoriaSeleccionada = cat;
    renderizarTabla(inputBuscar.value ? filtrar(inputBuscar.value) : categoriasCache);
}

// ------------------------------------------------------------
// Botones superiores
// ------------------------------------------------------------
btnNuevo.addEventListener("click", () => {
    form.reset();
    inputId.value = "";
    selectEstado.value = "1";
    categoriaSeleccionada = null;
    renderizarTabla(inputBuscar.value ? filtrar(inputBuscar.value) : categoriasCache);
});

btnEditar.addEventListener("click", () => {
    if (!categoriaSeleccionada) {
        mostrarToast("Selecciona una categoría de la lista primero");
        return;
    }
    cargarEnFormulario(categoriaSeleccionada);
});

btnEliminar.addEventListener("click", () => {
    if (!categoriaSeleccionada) {
        mostrarToast("Selecciona una categoría de la lista primero");
        return;
    }
    eliminarCategoria(categoriaSeleccionada.id_categoria);
});

btnActualizar.addEventListener("click", cargarCategorias);

function cargarEnFormulario(cat) {
    inputId.value = cat.id_categoria;
    document.getElementById("nombre").value = cat.nombre ?? "";
    document.getElementById("descripcion").value = cat.descripcion ?? "";
    selectEstado.value = (cat.estado === false || cat.estado === 0) ? "0" : "1";
}

// ------------------------------------------------------------
// Guardar (POST si es nuevo, PUT si venía de "Editar")
// ------------------------------------------------------------
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        estado: selectEstado.value
    };

    if (!datos.nombre) {
        mostrarToast("El nombre es obligatorio");
        return;
    }

    const id = inputId.value;
    const esEdicion = !!id;

    try {
        const resp = await fetch(esEdicion ? `/api/categorias/${id}` : "/api/categorias", {
            method: esEdicion ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const json = await resp.json();

        if (!json.success) {
            mostrarToast(json.mensaje || "No se pudo guardar la categoría");
            return;
        }

        form.reset();
        inputId.value = "";
        selectEstado.value = "1";
        categoriaSeleccionada = null;

        mostrarToast(esEdicion ? "Categoría actualizada correctamente" : "Categoría registrada correctamente", "success");

        await cargarCategorias();

    } catch (error) {
        console.log("Error al guardar:", error);
        mostrarToast("No se pudo conectar con el servidor");
    }
});

// ------------------------------------------------------------
// Eliminar
// ------------------------------------------------------------
async function eliminarCategoria(id) {
    try {
        const resp = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
        const json = await resp.json();

        if (!json.success) {
            mostrarToast(json.mensaje || "No se pudo eliminar la categoría");
            return;
        }

        if (categoriaSeleccionada && categoriaSeleccionada.id_categoria === id) {
            categoriaSeleccionada = null;
            form.reset();
            inputId.value = "";
        }

        mostrarToast("Categoría eliminada correctamente", "success");

        await cargarCategorias();

    } catch (error) {
        console.log("Error al eliminar:", error);
        mostrarToast("No se pudo conectar con el servidor");
    }
}

// ------------------------------------------------------------
// Buscador (filtro local)
// ------------------------------------------------------------
function filtrar(texto) {
    const t = texto.toLowerCase();
    return categoriasCache.filter(c => (c.nombre ?? "").toLowerCase().includes(t));
}

inputBuscar.addEventListener("input", () => {
    renderizarTabla(filtrar(inputBuscar.value));
});