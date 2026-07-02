// ============================================================
// public/js/reportes.js
// Llena las 4 tarjetas, el gráfico mensual (mismo endpoint que
// ya usa el dashboard) y el historial completo de movimientos.
// ============================================================

const graficoMensual = document.getElementById("graficoMensual");
const tbody = document.getElementById("tablaMovimientosBody");
const filtroTipo = document.getElementById("filtroTipo");
const btnFiltrar = document.getElementById("btnFiltrar");

document.addEventListener("DOMContentLoaded", () => {
    cargarResumen();
    cargarGraficoMensual();
    cargarMovimientos("todos");
});

btnFiltrar.addEventListener("click", () => {
    cargarMovimientos(filtroTipo.value);
});

// ------------------------------------------------------------
// Tarjetas
// ------------------------------------------------------------
async function cargarResumen() {
    try {
        const resp = await fetch("/api/reportes/resumen");
        const json = await resp.json();

        if (!json.success) {
            mostrarToast(json.mensaje || "No se pudo cargar el resumen");
            return;
        }

        document.getElementById("totalEntradas").textContent = json.data.entradas;
        document.getElementById("totalSalidas").textContent = json.data.salidas;
        document.getElementById("totalMedicamentos").textContent = json.data.medicamentos;
        document.getElementById("totalStockBajo").textContent = json.data.stockBajo;

    } catch (error) {
        console.log("Error al cargar el resumen:", error);
        mostrarToast("No se pudo conectar con el servidor");
    }
}

// ------------------------------------------------------------
// Gráfico mensual (reutiliza /api/dashboard/grafico-mensual,
// que ya existe y ya usa el Dashboard)
// ------------------------------------------------------------
async function cargarGraficoMensual() {
    try {
        const resp = await fetch("/api/dashboard/grafico-mensual");
        const json = await resp.json();

        if (!json.success || json.data.length === 0) {
            graficoMensual.innerHTML = `<p class="chart-vacio">Sin movimientos en los últimos meses</p>`;
            return;
        }

        const ALTO_MAXIMO = 180; // debe coincidir con la altura de .bars en dashboard.css
        const valores = json.data.flatMap(m => [m.entradas, m.salidas]);
        const maximo = Math.max(...valores, 1);

        graficoMensual.innerHTML = "";

        json.data.forEach(mes => {
            const altoEntrada = Math.max(Math.round((mes.entradas / maximo) * ALTO_MAXIMO), 2);
            const altoSalida = Math.max(Math.round((mes.salidas / maximo) * ALTO_MAXIMO), 2);

            const divMes = document.createElement("div");
            divMes.className = "month";
            divMes.innerHTML = `
                <div class="bars">
                    <div class="chart-bar chart-entry" style="height:${altoEntrada}px" title="Entradas: S/ ${mes.entradas.toFixed(2)}"></div>
                    <div class="chart-bar chart-output" style="height:${altoSalida}px" title="Salidas: S/ ${mes.salidas.toFixed(2)}"></div>
                </div>
                <p>${mes.etiqueta}</p>
            `;

            graficoMensual.appendChild(divMes);
        });

    } catch (error) {
        console.log("Error al cargar el gráfico mensual:", error);
        graficoMensual.innerHTML = `<p class="chart-vacio">No se pudo cargar el gráfico</p>`;
    }
}

// ------------------------------------------------------------
// Historial de movimientos
// ------------------------------------------------------------
async function cargarMovimientos(tipo) {
    try {
        const resp = await fetch(`/api/reportes/movimientos?tipo=${tipo}`);
        const json = await resp.json();

        if (!json.success) {
            mostrarToast(json.mensaje || "No se pudo cargar el historial de movimientos");
            return;
        }

        renderizarTabla(json.data);

    } catch (error) {
        console.log("Error al cargar movimientos:", error);
        mostrarToast("No se pudo conectar con el servidor");
    }
}

function renderizarTabla(lista) {
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;color:#94a3b8;">
                    Sin movimientos registrados
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach(mov => {
        const tr = document.createElement("tr");

        const badge = mov.tipo === "ENTRADA"
            ? `<span class="badge badge-ok">ENTRADA</span>`
            : `<span class="badge badge-low">SALIDA</span>`;

        tr.innerHTML = `
            <td>${mov.id}</td>
            <td>${formatearFecha(mov.fecha)}</td>
            <td>${badge}</td>
            <td>${mov.codigo ?? "-"}</td>
            <td>${mov.medicamento ?? "-"}</td>
            <td>${mov.cantidad ?? 0}</td>
            <td>${Number(mov.precio_unitario ?? 0).toFixed(2)}</td>
            <td>${Number(mov.valor ?? 0).toFixed(2)}</td>
            <td>${mov.usuario ?? "-"}</td>
        `;

        tbody.appendChild(tr);
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "-";
    const f = new Date(fecha);
    return f.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}