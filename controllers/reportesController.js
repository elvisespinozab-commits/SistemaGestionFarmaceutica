const { sql } = require("../config/db");

// ==================================================================
// GET /api/reportes/resumen
// Las 4 tarjetas de arriba: entradas, salidas, medicamentos activos
// y medicamentos con stock bajo (todo el histórico, sin filtrar por mes).
// ==================================================================
async function obtenerResumenReportes(req, res) {
    try {
        const entradas = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM entradas
        `);

        const salidas = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM salidas
        `);

        const medicamentos = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM medicamentos WHERE estado = 1
        `);

        const stockBajo = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE estado = 1 AND stock <= stock_minimo
        `);

        res.json({
            success: true,
            data: {
                entradas: entradas.recordset[0].total,
                salidas: salidas.recordset[0].total,
                medicamentos: medicamentos.recordset[0].total,
                stockBajo: stockBajo.recordset[0].total
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el resumen de reportes" });
    }
}

// ==================================================================
// GET /api/reportes/movimientos?tipo=todos|entrada|salida
// Historial completo (entradas UNION salidas), con código y nombre
// del medicamento y el usuario que hizo el movimiento.
// ==================================================================
async function obtenerMovimientos(req, res) {
    try {
        const { tipo } = req.query;

        const request = new sql.Request();
        let filtro = "";

        if (tipo === "entrada" || tipo === "salida") {
            filtro = "WHERE tipo = @tipo";
            request.input("tipo", sql.VarChar, tipo === "entrada" ? "ENTRADA" : "SALIDA");
        }

        const resultado = await request.query(`
            SELECT * FROM (
                SELECT 
                    e.id_entrada AS id,
                    e.fecha,
                    'ENTRADA' AS tipo,
                    m.codigo AS codigo,
                    m.nombre AS medicamento,
                    e.cantidad,
                    e.precio_unitario,
                    (e.cantidad * e.precio_unitario) AS valor,
                    CONCAT(u.nombres, ' ', u.apellidos) AS usuario
                FROM entradas e
                LEFT JOIN medicamentos m ON m.id_medicamento = e.id_medicamento
                LEFT JOIN [Usuarios] u ON u.id_usuario = e.id_usuario

                UNION ALL

                SELECT 
                    s.id_salida AS id,
                    s.fecha,
                    'SALIDA' AS tipo,
                    m.codigo AS codigo,
                    m.nombre AS medicamento,
                    s.cantidad,
                    s.precio_unitario,
                    (s.cantidad * s.precio_unitario) AS valor,
                    CONCAT(u.nombres, ' ', u.apellidos) AS usuario
                FROM salidas s
                LEFT JOIN medicamentos m ON m.id_medicamento = s.id_medicamento
                LEFT JOIN [Usuarios] u ON u.id_usuario = s.id_usuario
            ) AS movimientos
            ${filtro}
            ORDER BY fecha DESC
        `);

        res.json({ success: true, data: resultado.recordset });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener los movimientos" });
    }
}

module.exports = {
    obtenerResumenReportes,
    obtenerMovimientos
};