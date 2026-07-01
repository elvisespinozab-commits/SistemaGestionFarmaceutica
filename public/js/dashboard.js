// ======================================================================
// DASHBOARD.JS
// Controla la carga dinámica de todos los datos de la página de Inicio
// ======================================================================

document.addEventListener("DOMContentLoaded", () => {

    verificarSesion();
    mostrarUsuario();
    mostrarFechaHoy();

    cargarResumen();
    cargarMovimientosRecientes();
    cargarGraficoMensual();
    cargarStockBajo();

    configurarCerrarSesion();

});

// ======================================================================
// Sesión: si no hay usuario guardado, regresamos al login
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
    const userNombreSaludo = document.getElementById("userNombreSaludo");

    if (userNombre) userNombre.textContent = nombreCompleto;
    if (userRol) userRol.textContent = usuario.rol;
    if (userNombreSaludo) userNombreSaludo.textContent = usuario.nombres;
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
// Fecha y hora actual (en español)
// ======================================================================
function mostrarFechaHoy() {
    const ahora = new Date();

    const opcionesFecha = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    let textoFecha = ahora.toLocaleDateString("es-PE", opcionesFecha);
    textoFecha = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);

    const textoHora = ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

    const fechaHoy = document.getElementById("fechaHoy");
    const horaActualizacion = document.getElementById("horaActualizacion");

    if (fechaHoy) fechaHoy.textContent = textoFecha;
    if (horaActualizacion) horaActualizacion.textContent = textoHora;
}

// ======================================================================
// Formateo de moneda (Soles)
// ======================================================================
function formatoMoneda(valor) {
    const numero = Number(valor) || 0;
    return "S/ " + numero.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatoFechaHora(fechaISO) {
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, "0");
    const min = String(fecha.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
}

// ======================================================================
// Tarjetas resumen (parte superior)
// ======================================================================
async function cargarResumen() {
    try {
        const respuesta = await fetch("/api/dashboard/resumen");
        const datos = await respuesta.json();

        if (!datos.success) {
            console.log("No se pudo cargar el resumen:", datos.mensaje);
            return;
        }

        const r = datos.data;

        document.getElementById("cardTotalMedicamentos").textContent = r.totalMedicamentos;

        document.getElementById("cardEntradasMes").textContent = r.entradasMes.unidades;
        document.getElementById("cardEntradasValor").textContent = formatoMoneda(r.entradasMes.valor);

        document.getElementById("cardSalidasMes").textContent = r.salidasMes.unidades;
        document.getElementById("cardSalidasValor").textContent = formatoMoneda(r.salidasMes.valor);

        document.getElementById("cardValorInventario").textContent = formatoMoneda(r.valorInventario);

        document.getElementById("cardUsuariosActivos").textContent = r.usuariosActivos;

    } catch (error) {
        console.log("Error al cargar el resumen:", error);
    }
}

// ======================================================================
// Tabla: Movimientos recientes
// ======================================================================
async function cargarMovimientosRecientes() {
    const tbody = document.getElementById("movimientosBody");

    try {
        const respuesta = await fetch("/api/dashboard/movimientos-recientes");
        const datos = await respuesta.json();

        if (!datos.success) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No se pudieron cargar los movimientos.</td></tr>`;
            return;
        }

        if (datos.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Aún no hay movimientos registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        datos.data.forEach(mov => {
            const claseTipo = mov.tipo === "ENTRADA" ? "entrada" : "salida";

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${formatoFechaHora(mov.fecha)}</td>
                <td><span class="${claseTipo}">${mov.tipo}</span></td>
                <td>${mov.descripcion || "-"}</td>
                <td>${mov.referencia}</td>
                <td>${mov.cantidad}</td>
                <td>${Number(mov.valor).toFixed(2)}</td>
                <td>${mov.usuario || "-"}</td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.log("Error al cargar movimientos recientes:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Error al conectar con el servidor.</td></tr>`;
    }
}

// ======================================================================
// Gráfico: Entradas y salidas por mes
// ======================================================================
async function cargarGraficoMensual() {
    const contenedor = document.getElementById("graficoMensual");

    try {
        const respuesta = await fetch("/api/dashboard/grafico-mensual");
        const datos = await respuesta.json();

        if (!datos.success || datos.data.length === 0) {
            contenedor.innerHTML = `<p style="text-align:center; width:100%; color:#94a3b8;">No hay datos suficientes para el gráfico.</p>`;
            return;
        }

        const meses = datos.data;

        // Escala: la barra más alta ocupa 190px, el resto es proporcional
        const ALTURA_MAXIMA = 190;
        const valorMaximo = Math.max(...meses.map(m => Math.max(m.entradas, m.salidas)), 1);

        contenedor.innerHTML = "";

        meses.forEach(mes => {
            const alturaEntrada = Math.max(4, Math.round((mes.entradas / valorMaximo) * ALTURA_MAXIMA));
            const alturaSalida = Math.max(4, Math.round((mes.salidas / valorMaximo) * ALTURA_MAXIMA));

            const divMes = document.createElement("div");
            divMes.className = "month";
            divMes.title = `Entradas: ${formatoMoneda(mes.entradas)} | Salidas: ${formatoMoneda(mes.salidas)}`;
            divMes.innerHTML = `
                <div class="bars">
                    <div class="chart-bar chart-entry" style="height:${alturaEntrada}px"></div>
                    <div class="chart-bar chart-output" style="height:${alturaSalida}px"></div>
                </div>
                <p>${mes.etiqueta}</p>
            `;
            contenedor.appendChild(divMes);
        });

    } catch (error) {
        console.log("Error al cargar el gráfico mensual:", error);
        contenedor.innerHTML = `<p style="text-align:center; width:100%; color:#94a3b8;">Error al conectar con el servidor.</p>`;
    }
}

// ======================================================================
// Tabla: Medicamentos con stock bajo
// ======================================================================
async function cargarStockBajo() {
    const tbody = document.getElementById("stockBajoBody");
    const contador = document.getElementById("stockBajoCount");

    try {
        const respuesta = await fetch("/api/dashboard/stock-bajo");
        const datos = await respuesta.json();

        if (!datos.success) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">No se pudo cargar el stock bajo.</td></tr>`;
            return;
        }

        if (contador) contador.textContent = datos.total;

        if (datos.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">✅ Ningún medicamento tiene stock bajo.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        datos.data.forEach(med => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${med.nombre}</td>
                <td class="danger-number">${med.stock}</td>
                <td>${med.stock_minimo}</td>
                <td><span class="status">Bajo</span></td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.log("Error al cargar el stock bajo:", error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Error al conectar con el servidor.</td></tr>`;
    }
}