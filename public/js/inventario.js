// ======================================================================
// INVENTARIO.JS
// Controla la carga dinámica de la página de Inventario: tarjetas
// resumen, filtros, tabla paginada y acciones.
// ======================================================================

let filtroActual = { buscar: "", categoria: "", estado: "" };
let paginaActual = 1;
const LIMITE_POR_PAGINA = 10;

document.addEventListener("DOMContentLoaded", () => {

    verificarSesion();
    mostrarUsuario();
    configurarCerrarSesion();

    cargarResumenInventario();
    cargarCategorias();
    cargarInventario();

    configurarFiltros();

});

// ======================================================================
// Sesión (igual que en dashboard.js)
// ======================================================================
function verificarSesion() {
    const usuario = localStorage.getItem("usuarioSGF");
    if (!usuario) {
        window.location.href = "/";
    }
}

function obtenerUsuarioActual() {
    const usuario = localStorage.getItem("usuarioSGF");
    return usuario ? JSON.parse(usuario) : null;
}

function mostrarUsuario() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;

    const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`;

    const userNombre = document.getElementById("userNombre");
    const userRol = document.getElementById("userRol");

    if (userNombre) userNombre.textContent = nombreCompleto;
    if (userRol) userRol.textContent = usuario.rol;
}

function configurarCerrarSesion() {
    const btnLogout = document.querySelector(".logout");
    if (!btnLogout) return;

    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("usuarioSGF");
        window.location.href = "/";
    });
}

// ======================================================================
// Utilidades
// ======================================================================
function formatoMoneda(valor) {
    const numero = Number(valor) || 0;
    return "S/ " + numero.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function badgeEstado(stock, stockMinimo) {
    if (stock <= 0) return `<span class="badge badge-out">Agotado</span>`;
    if (stock <= stockMinimo) return `<span class="badge badge-low">Stock bajo</span>`;
    return `<span class="badge badge-ok">En stock</span>`;
}

function claseStock(stock, stockMinimo) {
    if (stock <= 0) return "stock-cell stock-out";
    if (stock <= stockMinimo) return "stock-cell stock-low";
    return "stock-cell stock-ok";
}

// ======================================================================
// Tarjetas resumen
// ======================================================================
async function cargarResumenInventario() {
    try {
        const respuesta = await fetch("/api/inventario/resumen");
        const datos = await respuesta.json();

        if (!datos.success) {
            console.log("No se pudo cargar el resumen:", datos.mensaje);
            return;
        }

        const r = datos.data;

        document.getElementById("cardTotalProductos").textContent = r.totalProductos;
        document.getElementById("cardValorInventario").textContent = formatoMoneda(r.valorInventario);
        document.getElementById("cardStockBajo").textContent = r.stockBajo;
        document.getElementById("cardAgotados").textContent = r.agotados;
        document.getElementById("cardMovimientosHoy").textContent = r.movimientosHoy;

    } catch (error) {
        console.log("Error al cargar el resumen de inventario:", error);
    }
}

// ======================================================================
// Select de categorías (filtro)
// ======================================================================
async function cargarCategorias() {
    const select = document.getElementById("selectCategoria");
    if (!select) return;

    try {
        const respuesta = await fetch("/api/inventario/categorias");
        const datos = await respuesta.json();

        if (!datos.success) return;

        datos.data.forEach(categoria => {
            const option = document.createElement("option");
            option.value = categoria.id_categoria;
            option.textContent = categoria.nombre;
            select.appendChild(option);
        });

    } catch (error) {
        console.log("Error al cargar categorías:", error);
    }
}

// ======================================================================
// Tabla principal de inventario
// ======================================================================
async function cargarInventario() {
    const tbody = document.getElementById("inventarioBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">Cargando inventario...</td></tr>`;

    try {
        const params = new URLSearchParams({
            pagina: paginaActual,
            limite: LIMITE_POR_PAGINA,
            buscar: filtroActual.buscar,
            categoria: filtroActual.categoria,
            estado: filtroActual.estado
        });

        const respuesta = await fetch(`/api/inventario/listado?${params.toString()}`);
        const datos = await respuesta.json();

        if (!datos.success) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">No se pudo cargar el inventario.</td></tr>`;
            return;
        }

        if (datos.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">No se encontraron productos con esos filtros.</td></tr>`;
            actualizarPaginacion(datos.paginacion);
            return;
        }

        tbody.innerHTML = "";

        datos.data.forEach(med => {
            const valorTotal = (Number(med.stock) * Number(med.precio_venta)).toFixed(2);

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${med.codigo}</td>
                <td class="med-name"><b>${med.nombre}</b><small>${med.presentacion || ""}</small></td>
                <td><span class="cat-tag">${med.categoria || "Sin categoría"}</span></td>
                <td class="${claseStock(med.stock, med.stock_minimo)}">${med.stock}</td>
                <td>${med.stock_minimo}</td>
                <td>${Number(med.precio_venta).toFixed(2)}</td>
                <td>${valorTotal}</td>
                <td>${badgeEstado(med.stock, med.stock_minimo)}</td>
                <td class="actions-cell">
                    <div class="action-icon" title="Ver"><i class="fa-solid fa-eye"></i></div>
                    <div class="action-icon" title="Editar"><i class="fa-solid fa-pen"></i></div>
                    <div class="action-icon danger" title="Eliminar" data-id="${med.id_medicamento}"><i class="fa-solid fa-trash"></i></div>
                </td>
            `;
            tbody.appendChild(fila);
        });

        actualizarPaginacion(datos.paginacion);

    } catch (error) {
        console.log("Error al cargar el inventario:", error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">Error al conectar con el servidor.</td></tr>`;
    }
}

// ======================================================================
// Paginación
// ======================================================================
function actualizarPaginacion(paginacion) {
    const info = document.getElementById("inventarioInfo");
    const contenedor = document.getElementById("inventarioPaginacion");
    const subtitulo = document.getElementById("inventarioSubtitulo");
    if (!paginacion || !contenedor) return;

    const { pagina, limite, total, totalPaginas } = paginacion;
    const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
    const hasta = Math.min(pagina * limite, total);

    if (info) info.textContent = `Mostrando ${desde}-${hasta} de ${total} productos`;
    if (subtitulo) subtitulo.textContent = `${total} productos registrados`;

    contenedor.innerHTML = "";

    const crearBoton = (contenidoHTML, deshabilitado, activo, alHacerClic) => {
        const boton = document.createElement("button");
        boton.innerHTML = contenidoHTML;
        if (activo) boton.classList.add("active");
        boton.disabled = deshabilitado;
        boton.addEventListener("click", alHacerClic);
        return boton;
    };

    contenedor.appendChild(
        crearBoton('<i class="fa-solid fa-angle-left"></i>', pagina <= 1, false, () => {
            paginaActual--;
            cargarInventario();
        })
    );

    for (let i = 1; i <= totalPaginas; i++) {
        const esBorde = i === 1 || i === totalPaginas;
        const cercaDeActual = Math.abs(i - pagina) <= 1;

        if (totalPaginas > 6 && !esBorde && !cercaDeActual) {
            if (i === 2 || i === totalPaginas - 1) {
                const puntos = document.createElement("button");
                puntos.textContent = "…";
                puntos.disabled = true;
                contenedor.appendChild(puntos);
            }
            continue;
        }

        contenedor.appendChild(
            crearBoton(i, false, i === pagina, () => {
                paginaActual = i;
                cargarInventario();
            })
        );
    }

    contenedor.appendChild(
        crearBoton('<i class="fa-solid fa-angle-right"></i>', pagina >= totalPaginas, false, () => {
            paginaActual++;
            cargarInventario();
        })
    );
}

// ======================================================================
// Filtros (búsqueda, categoría, estado)
// ======================================================================
function configurarFiltros() {
    const inputBuscar = document.getElementById("inputBuscar");
    const selectCategoria = document.getElementById("selectCategoria");
    const selectEstado = document.getElementById("selectEstado");
    const btnFiltrar = document.getElementById("btnFiltrar");

    const aplicarFiltros = () => {
        filtroActual = {
            buscar: inputBuscar ? inputBuscar.value.trim() : "",
            categoria: selectCategoria ? selectCategoria.value : "",
            estado: selectEstado ? selectEstado.value : ""
        };
        paginaActual = 1;
        cargarInventario();
    };

    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", aplicarFiltros);
    }

    if (inputBuscar) {
        inputBuscar.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter") aplicarFiltros();
        });
    }
}
