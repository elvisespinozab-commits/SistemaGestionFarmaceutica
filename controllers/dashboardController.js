const { sql } = require("../config/db");

// ==================================================================
// GET /api/dashboard/resumen
// Devuelve las 5 tarjetas superiores: total medicamentos, entradas
// del mes, salidas del mes, valor de inventario y usuarios activos.
// ==================================================================
async function obtenerResumen(req, res) {
    try {
        const totalMedicamentos = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE estado = 1
        `);

        const entradasMes = await new sql.Request().query(`
            SELECT 
                ISNULL(SUM(cantidad), 0) AS unidades,
                ISNULL(SUM(cantidad * precio_unitario), 0) AS valor
            FROM entradas
            WHERE MONTH(fecha) = MONTH(GETDATE())
              AND YEAR(fecha) = YEAR(GETDATE())
        `);

        const salidasMes = await new sql.Request().query(`
            SELECT 
                ISNULL(SUM(cantidad), 0) AS unidades,
                ISNULL(SUM(cantidad * precio_unitario), 0) AS valor
            FROM salidas
            WHERE MONTH(fecha) = MONTH(GETDATE())
              AND YEAR(fecha) = YEAR(GETDATE())
        `);

        const valorInventario = await new sql.Request().query(`
            SELECT ISNULL(SUM(stock * precio_venta), 0) AS valor
            FROM medicamentos
            WHERE estado = 1
        `);

        const usuariosActivos = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM [Usuarios]
            WHERE estado = 1
        `);

        res.json({
            success: true,
            data: {
                totalMedicamentos: totalMedicamentos.recordset[0].total,
                entradasMes: {
                    unidades: entradasMes.recordset[0].unidades,
                    valor: entradasMes.recordset[0].valor
                },
                salidasMes: {
                    unidades: salidasMes.recordset[0].unidades,
                    valor: salidasMes.recordset[0].valor
                },
                valorInventario: valorInventario.recordset[0].valor,
                usuariosActivos: usuariosActivos.recordset[0].total
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el resumen del dashboard" });
    }
}

// ==================================================================
// GET /api/dashboard/movimientos-recientes
// Une entradas y salidas más recientes (mezcladas) para la tabla
// "Movimientos recientes".
// ==================================================================
async function obtenerMovimientosRecientes(req, res) {
    try {
        const resultado = await new sql.Request().query(`
            SELECT TOP 8 *
            FROM (
                SELECT 
                    e.fecha,
                    'ENTRADA' AS tipo,
                    m.nombre AS descripcion,
                    CONCAT('FAC-', RIGHT('00000' + CAST(e.id_entrada AS VARCHAR), 5)) AS referencia,
                    e.cantidad,
                    (e.cantidad * e.precio_unitario) AS valor,
                    CONCAT(u.nombres, ' ', u.apellidos) AS usuario
                FROM entradas e
                LEFT JOIN medicamentos m ON m.id_medicamento = e.id_medicamento
                LEFT JOIN [Usuarios] u ON u.id_usuario = e.id_usuario

                UNION ALL

                SELECT 
                    s.fecha,
                    'SALIDA' AS tipo,
                    m.nombre AS descripcion,
                    CONCAT('VEN-', RIGHT('00000' + CAST(s.id_salida AS VARCHAR), 5)) AS referencia,
                    s.cantidad,
                    (s.cantidad * s.precio_unitario) AS valor,
                    CONCAT(u.nombres, ' ', u.apellidos) AS usuario
                FROM salidas s
                LEFT JOIN medicamentos m ON m.id_medicamento = s.id_medicamento
                LEFT JOIN [Usuarios] u ON u.id_usuario = s.id_usuario
            ) AS movimientos
            ORDER BY fecha DESC
        `);

        res.json({ success: true, data: resultado.recordset });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener los movimientos recientes" });
    }
}

// ==================================================================
// GET /api/dashboard/grafico-mensual
// Suma de entradas y salidas (en S/) agrupadas por mes, para los
// últimos 6 meses (incluyendo el actual).
// ==================================================================
async function obtenerGraficoMensual(req, res) {
    try {
        const entradas = await new sql.Request().query(`
            SELECT 
                YEAR(fecha) AS anio,
                MONTH(fecha) AS mes,
                SUM(cantidad * precio_unitario) AS valor
            FROM entradas
            WHERE fecha >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
            GROUP BY YEAR(fecha), MONTH(fecha)
        `);

        const salidas = await new sql.Request().query(`
            SELECT 
                YEAR(fecha) AS anio,
                MONTH(fecha) AS mes,
                SUM(cantidad * precio_unitario) AS valor
            FROM salidas
            WHERE fecha >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
            GROUP BY YEAR(fecha), MONTH(fecha)
        `);

        // Construimos los últimos 6 meses (con ceros si no hay movimientos)
        const nombresMes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const hoy = new Date();
        const meses = [];

        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const anio = fecha.getFullYear();
            const mes = fecha.getMonth() + 1;

            const entradaMes = entradas.recordset.find(r => r.anio === anio && r.mes === mes);
            const salidaMes = salidas.recordset.find(r => r.anio === anio && r.mes === mes);

            meses.push({
                etiqueta: nombresMes[mes - 1],
                entradas: entradaMes ? Number(entradaMes.valor) : 0,
                salidas: salidaMes ? Number(salidaMes.valor) : 0
            });
        }

        res.json({ success: true, data: meses });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el gráfico mensual" });
    }
}

// ==================================================================
// GET /api/dashboard/stock-bajo
// Medicamentos activos cuyo stock actual es menor o igual al mínimo.
// ==================================================================
async function obtenerStockBajo(req, res) {
    try {
        const resultado = await new sql.Request().query(`
            SELECT TOP 6
                id_medicamento,
                nombre,
                stock,
                stock_minimo
            FROM medicamentos
            WHERE estado = 1
              AND stock <= stock_minimo
            ORDER BY stock ASC
        `);

        const total = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE estado = 1
              AND stock <= stock_minimo
        `);

        res.json({
            success: true,
            data: resultado.recordset,
            total: total.recordset[0].total
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el stock bajo" });
    }
}

module.exports = {
    obtenerResumen,
    obtenerMovimientosRecientes,
    obtenerGraficoMensual,
    obtenerStockBajo
};