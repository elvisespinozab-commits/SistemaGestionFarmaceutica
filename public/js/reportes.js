// ======================================
// REPORTES.JS
// Parte 4.1
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    cargarResumen();
    cargarMovimientos();
    cargarStockBajo();

});

// ======================================
// RESUMEN
// ======================================

async function cargarResumen() {

    try {

        const respuesta = await fetch("/api/reportes/resumen");

        const datos = await respuesta.json();

        document.getElementById("totalEntradas").textContent = datos.entradas;

        document.getElementById("totalSalidas").textContent = datos.salidas;

        document.getElementById("movimientosRecientes").textContent = datos.recientes;

    } catch (error) {

        console.error("Error al cargar el resumen", error);

    }

}

// ======================================
// TABLA MOVIMIENTOS
// ======================================

async function cargarMovimientos() {

    try {

        const respuesta = await fetch("/api/reportes/movimientos");

        const datos = await respuesta.json();

        const tabla = document.getElementById("tablaMovimientos");

        tabla.innerHTML = "";

        datos.forEach(movimiento => {

            tabla.innerHTML += `

            <tr>

                <td>${movimiento.IdMovimiento}</td>

                <td>${formatearFecha(movimiento.FechaMovimiento)}</td>

                <td>${formatearHora(movimiento.FechaMovimiento)}</td>

                <td>${movimiento.TipoMovimiento}</td>

                <td>${movimiento.CodigoMedicamento}</td>

                <td>${movimiento.NombreMedicamento}</td>

                <td>${movimiento.Cantidad}</td>

                <td>${movimiento.NombreUsuario}</td>

                <td>${movimiento.Estado}</td>

                <td>

                    <button class="btn-ver"
                        onclick="verMovimiento(${movimiento.IdMovimiento})">

                        <i class="bi bi-eye"></i>

                    </button>

                </td>

            </tr>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}

// ======================================
// STOCK BAJO
// ======================================

async function cargarStockBajo(){

    try{

        const respuesta=await fetch("/api/reportes/stock-bajo");

        const datos=await respuesta.json();

        const tabla=document.getElementById("tablaStock");

        tabla.innerHTML="";

        datos.forEach(item=>{

            tabla.innerHTML+=`

            <tr>

                <td>${item.NombreMedicamento}</td>

                <td>${item.StockActual}</td>

            </tr>

            `;

        });

    }

    catch(error){

        console.log(error);

    }

}

// ======================================
// FORMATEAR FECHA
// ======================================

function formatearFecha(fecha){

    const f=new Date(fecha);

    return f.toLocaleDateString();

}

// ======================================
// FORMATEAR HORA
// ======================================

function formatearHora(fecha){

    const f=new Date(fecha);

    return f.toLocaleTimeString();

}

// ======================================
// VER MOVIMIENTO
// ======================================

function verMovimiento(id){

    alert("Movimiento ID: "+id);

}
// ======================================
// REPORTES.JS
// Parte 4.2
// ======================================

// Cargar gráficos al iniciar
document.addEventListener("DOMContentLoaded", () => {

    cargarGraficoMensual();
    cargarGraficoCategorias();

});

// ======================================
// GRAFICO ENTRADAS VS SALIDAS
// ======================================

let graficoMensual = null;

async function cargarGraficoMensual() {

    try {

        const respuesta = await fetch("/api/reportes/grafico-mensual");

        const datos = await respuesta.json();

        const meses = [];
        const entradas = [];
        const salidas = [];

        datos.forEach(item => {

            meses.push("Mes " + item.Mes);
            entradas.push(item.Entradas);
            salidas.push(item.Salidas);

        });

        const ctx = document
            .getElementById("graficoMensual")
            .getContext("2d");

        if (graficoMensual) {

            graficoMensual.destroy();

        }

        graficoMensual = new Chart(ctx, {

            type: "bar",

            data: {

                labels: meses,

                datasets: [

                    {

                        label: "Entradas",

                        data: entradas,

                        backgroundColor: "#16a34a"

                    },

                    {

                        label: "Salidas",

                        data: salidas,

                        backgroundColor: "#dc2626"

                    }

                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        position: "top"

                    }

                }

            }

        });

    }

    catch (error) {

        console.error(error);

    }

}

// ======================================
// GRAFICO CATEGORIAS
// ======================================

let graficoCategorias = null;

async function cargarGraficoCategorias() {

    try {

        const respuesta = await fetch("/api/reportes/grafico-categorias");

        const datos = await respuesta.json();

        const categorias = [];
        const cantidades = [];

        datos.forEach(item => {

            categorias.push(item.NombreCategoria);

            cantidades.push(item.Total);

        });

        const ctx = document
            .getElementById("graficoCategorias")
            .getContext("2d");

        if (graficoCategorias) {

            graficoCategorias.destroy();

        }

        graficoCategorias = new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: categorias,

                datasets: [

                    {

                        data: cantidades,

                        backgroundColor: [

                            "#2563eb",
                            "#16a34a",
                            "#f59e0b",
                            "#dc2626",
                            "#8b5cf6",
                            "#06b6d4",
                            "#ec4899"

                        ]

                    }

                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

    }

    catch (error) {

        console.error(error);

    }

}
// ======================================
// REPORTES.JS
// Parte 4.3
// ======================================

// ===============================
// FILTRAR MOVIMIENTOS
// ===============================

document.getElementById("btnFiltrar").addEventListener("click", filtrarMovimientos);

async function filtrarMovimientos() {

    try {

        const tipo = document.getElementById("tipoMovimiento").value.toLowerCase();
        const estado = document.getElementById("estadoMovimiento").value.toLowerCase();

        const respuesta = await fetch("/api/reportes/movimientos");

        const datos = await respuesta.json();

        const tabla = document.getElementById("tablaMovimientos");

        tabla.innerHTML = "";

        const resultado = datos.filter(item => {

            const cumpleTipo =
                tipo === "" ||
                item.TipoMovimiento.toLowerCase() === tipo;

            const cumpleEstado =
                estado === "" ||
                item.Estado.toLowerCase() === estado;

            return cumpleTipo && cumpleEstado;

        });

        resultado.forEach(movimiento => {

            tabla.innerHTML += `

            <tr>

                <td>${movimiento.IdMovimiento}</td>

                <td>${formatearFecha(movimiento.FechaMovimiento)}</td>

                <td>${formatearHora(movimiento.FechaMovimiento)}</td>

                <td>${movimiento.TipoMovimiento}</td>

                <td>${movimiento.CodigoMedicamento}</td>

                <td>${movimiento.NombreMedicamento}</td>

                <td>${movimiento.Cantidad}</td>

                <td>${movimiento.NombreUsuario}</td>

                <td>${movimiento.Estado}</td>

                <td>

                    <button class="btn-ver"
                    onclick="verMovimiento(${movimiento.IdMovimiento})">

                        <i class="bi bi-eye"></i>

                    </button>

                </td>

            </tr>

            `;

        });

    }

    catch(error){

        console.log(error);

    }

}

// ===============================
// MODAL
// ===============================

const modal=document.getElementById("modalDetalle");

function verMovimiento(id){

    fetch("/api/reportes/movimientos")

    .then(res=>res.json())

    .then(datos=>{

        const movimiento=datos.find(m=>m.IdMovimiento==id);

        if(!movimiento) return;

        document.getElementById("detalleId").textContent=movimiento.IdMovimiento;

        document.getElementById("detalleFecha").textContent=formatearFecha(movimiento.FechaMovimiento);

        document.getElementById("detalleHora").textContent=formatearHora(movimiento.FechaMovimiento);

        document.getElementById("detalleTipo").textContent=movimiento.TipoMovimiento;

        document.getElementById("detalleMedicamento").textContent=movimiento.NombreMedicamento;

        document.getElementById("detalleCantidad").textContent=movimiento.Cantidad;

        document.getElementById("detalleUsuario").textContent=movimiento.NombreUsuario;

        document.getElementById("detalleEstado").textContent=movimiento.Estado;

        modal.classList.add("activo");

    });

}

// ===============================
// CERRAR MODAL
// ===============================

document.getElementById("cerrarModal").onclick=()=>{

    modal.classList.remove("activo");

};

document.getElementById("btnCerrar").onclick=()=>{

    modal.classList.remove("activo");

};

window.onclick=(e)=>{

    if(e.target===modal){

        modal.classList.remove("activo");

    }

};

// ===============================
// IMPRIMIR
// ===============================

document.getElementById("btnImprimir").addEventListener("click",()=>{

    window.print();

});

// ===============================
// DESCARGAR
// ===============================

document.getElementById("btnDescargar").addEventListener("click",()=>{

    alert("Aquí puedes integrar jsPDF para generar el PDF.");

});


function mostrarLoader(){

    document.getElementById("loader").classList.add("activo");

}

function ocultarLoader(){

    document.getElementById("loader").classList.remove("activo");

}



const nuevo=document.getElementById("nuevoMovimiento");

if(nuevo){

    nuevo.addEventListener("click",()=>{

        location.href="/movimientos";

    });

}



function actualizarTodo(){

    mostrarLoader();

    Promise.all([

        cargarResumen(),

        cargarMovimientos(),

        cargarStockBajo(),

        cargarGraficoMensual(),

        cargarGraficoCategorias()

    ])

    .finally(()=>{

        ocultarLoader();

    });

}

actualizarTodo();