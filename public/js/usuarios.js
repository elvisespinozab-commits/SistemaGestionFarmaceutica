// ======================================================================
// USUARIOS.JS
// Controla la carga dinámica de la página de Usuarios: tarjetas
// resumen, filtros, tabla paginada y acciones.
// ======================================================================

let filtroActual = { buscar: "", rol: "", estado: "" };
let paginaActual = 1;
const LIMITE_POR_PAGINA = 10;

document.addEventListener("DOMContentLoaded", () => {

    verificarSesion();
    mostrarUsuario();
    configurarCerrarSesion();

    cargarResumenUsuarios();
    cargarRoles();
    cargarUsuarios();

    configurarFiltros();

});

// ======================================================================
// Sesión (igual que en dashboard.js / inventario.js)
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
function iniciales(nombres, apellidos) {
    const n = (nombres || "").trim().charAt(0);
    const a = (apellidos || "").trim().charAt(0);
    return (n + a).toUpperCase() || "US";
}

// Asigna un color de avatar de forma consistente según el id de usuario
function claseAvatar(idUsuario) {
    const colores = ["avatar-a", "avatar-b", "avatar-c", "avatar-d", "avatar-e", "avatar-f"];
    return colores[idUsuario % colores.length];
}

function claseRol(rol) {
    if (rol === "Administrador") return "rol-tag rol-admin";
    if (rol === "Empleado") return "rol-tag rol-empleado";
    return "rol-tag rol-otro";
}

function badgeEstadoUsuario(estado) {
    return estado
        ? `<span class="badge badge-ok">Activo</span>`
        : `<span class="badge badge-out">Inactivo</span>`;
}

function formatoUltimoAcceso(fecha) {
    if (!fecha) return "Nunca";

    const f = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - f;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const hora = f.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

    if (diffDias === 0) return `Hoy, ${hora}`;
    if (diffDias === 1) return `Ayer, ${hora}`;
    if (diffDias < 7) return `Hace ${diffDias} días`;
    if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semana(s)`;
    return f.toLocaleDateString("es-PE");
}

// ======================================================================
// Select de roles (filtro) — se llenan dinámicamente porque "rol" es
// un campo libre en la base de datos, no una lista fija.
// ======================================================================
async function cargarRoles() {
    const select = document.getElementById("selectRol");
    if (!select) return;

    try {
        const respuesta = await fetch("/api/usuarios/roles");
        const datos = await respuesta.json();

        if (!datos.success) return;

        datos.data.forEach(rol => {
            const option = document.createElement("option");
            option.value = rol;
            option.textContent = rol;
            select.appendChild(option);
        });

    } catch (error) {
        console.log("Error al cargar roles:", error);
    }
}

// ======================================================================
// Tarjetas resumen
// ======================================================================
async function cargarResumenUsuarios() {
    try {
        const respuesta = await fetch("/api/usuarios/resumen");
        const datos = await respuesta.json();

        if (!datos.success) {
            console.log("No se pudo cargar el resumen:", datos.mensaje);
            return;
        }

        const r = datos.data;

        document.getElementById("cardTotalUsuarios").textContent = r.totalUsuarios;
        document.getElementById("cardAdministradores").textContent = r.administradores;
        document.getElementById("cardActivos").textContent = r.activos;
        document.getElementById("cardInactivos").textContent = r.inactivos;
        document.getElementById("cardNuevos").textContent = r.nuevos;

    } catch (error) {
        console.log("Error al cargar el resumen de usuarios:", error);
    }
}

// ======================================================================
// Tabla principal de usuarios
// ======================================================================
async function cargarUsuarios() {
    const tbody = document.getElementById("usuariosBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando usuarios...</td></tr>`;

    try {
        const params = new URLSearchParams({
            pagina: paginaActual,
            limite: LIMITE_POR_PAGINA,
            buscar: filtroActual.buscar,
            rol: filtroActual.rol,
            estado: filtroActual.estado
        });

        const respuesta = await fetch(`/api/usuarios/listado?${params.toString()}`);
        const datos = await respuesta.json();

        if (!datos.success) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No se pudo cargar el listado de usuarios.</td></tr>`;
            return;
        }

        if (datos.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No se encontraron usuarios con esos filtros.</td></tr>`;
            actualizarPaginacion(datos.paginacion);
            return;
        }

        tbody.innerHTML = "";

        datos.data.forEach(usr => {
            const nombreCompleto = `${usr.nombres} ${usr.apellidos}`;

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td class="user-cell">
                    <div class="avatar-circle ${claseAvatar(usr.id_usuario)}">${iniciales(usr.nombres, usr.apellidos)}</div>
                    <div class="user-cell-name"><b>${nombreCompleto}</b><small>@${usr.usuario}</small></div>
                </td>
                <td>${usr.correo}</td>
                <td><span class="${claseRol(usr.rol)}">${usr.rol}</span></td>
                <td>${badgeEstadoUsuario(usr.estado)}</td>
                <td>${formatoUltimoAcceso(usr.ultimo_acceso)}</td>
                <td class="actions-cell">
                    <div class="action-icon" title="Ver"><i class="fa-solid fa-eye"></i></div>
                    <div class="action-icon" title="Editar"><i class="fa-solid fa-pen"></i></div>
                    <div class="action-icon danger" title="Eliminar" data-id="${usr.id_usuario}"><i class="fa-solid fa-trash"></i></div>
                </td>
            `;
            tbody.appendChild(fila);
        });

        actualizarPaginacion(datos.paginacion);

    } catch (error) {
        console.log("Error al cargar los usuarios:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Error al conectar con el servidor.</td></tr>`;
    }
}

// ======================================================================
// Paginación
// ======================================================================
function actualizarPaginacion(paginacion) {
    const info = document.getElementById("usuariosInfo");
    const contenedor = document.getElementById("usuariosPaginacion");
    const subtitulo = document.getElementById("usuariosSubtitulo");
    if (!paginacion || !contenedor) return;

    const { pagina, limite, total, totalPaginas } = paginacion;
    const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
    const hasta = Math.min(pagina * limite, total);

    if (info) info.textContent = `Mostrando ${desde}-${hasta} de ${total} usuarios`;
    if (subtitulo) subtitulo.textContent = `${total} usuarios registrados`;

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
            cargarUsuarios();
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
                cargarUsuarios();
            })
        );
    }

    contenedor.appendChild(
        crearBoton('<i class="fa-solid fa-angle-right"></i>', pagina >= totalPaginas, false, () => {
            paginaActual++;
            cargarUsuarios();
        })
    );
}

// ======================================================================
// Filtros (búsqueda, rol, estado)
// ======================================================================
function configurarFiltros() {
    const inputBuscar = document.getElementById("inputBuscar");
    const selectRol = document.getElementById("selectRol");
    const selectEstado = document.getElementById("selectEstado");
    const btnFiltrar = document.getElementById("btnFiltrar");

    const aplicarFiltros = () => {
        filtroActual = {
            buscar: inputBuscar ? inputBuscar.value.trim() : "",
            rol: selectRol ? selectRol.value : "",
            estado: selectEstado ? selectEstado.value : ""
        };
        paginaActual = 1;
        cargarUsuarios();
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
