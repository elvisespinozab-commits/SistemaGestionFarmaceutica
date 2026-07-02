const { sql } = require("../config/db");

// ======================================================================
// NOTA SOBRE EL ESQUEMA ASUMIDO
// ----------------------------------------------------------------------
// Este controlador asume las siguientes tablas (ajusta los nombres de
// tabla/columna si en tu base de datos se llaman distinto):
//
//   medicamentos (
//       id_medicamento   INT PK,
//       nombre           VARCHAR,
//       presentacion     VARCHAR      -- ej: "Caja x 30 tab."
//       id_categoria     INT FK -> categorias.id_categoria,
//       stock            INT,
//       stock_minimo     INT,
//       precio_venta     DECIMAL,
//       estado           BIT          -- 1 = activo, 0 = inactivo
//   )
//
//   categorias (
//       id_categoria     INT PK,
//       nombre           VARCHAR
//   )
//
//   entradas / salidas  -- ya usadas en dashboardController.js
//       (id_..., fecha, cantidad, precio_unitario, id_medicamento, id_usuario)
// ======================================================================


// ==================================================================
// GET /api/inventario/resumen
// Tarjetas superiores: total productos, valor de inventario,
// stock bajo, agotados y movimientos de hoy.
// ==================================================================
async function obtenerResumenInventario(req, res) {
    try {
        const totalProductos = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE estado = 1
        `);

        const valorInventario = await new sql.Request().query(`
            SELECT ISNULL(SUM(stock * precio_venta), 0) AS valor
            FROM medicamentos
            WHERE estado = 1
        `);

        const stockBajo = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE estado = 1 AND stock > 0 AND stock <= stock_minimo
        `);

        const agotados = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE estado = 1 AND stock <= 0
        `);

        const movimientosHoy = await new sql.Request().query(`
            SELECT
                (SELECT COUNT(*) FROM entradas WHERE CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)) +
                (SELECT COUNT(*) FROM salidas  WHERE CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)) AS total
        `);

        res.json({
            success: true,
            data: {
                totalProductos: totalProductos.recordset[0].total,
                valorInventario: valorInventario.recordset[0].valor,
                stockBajo: stockBajo.recordset[0].total,
                agotados: agotados.recordset[0].total,
                movimientosHoy: movimientosHoy.recordset[0].total
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el resumen del inventario" });
    }
}


// ==================================================================
// GET /api/inventario/categorias
// Para llenar el <select> de categorías del filtro.
// ==================================================================
async function obtenerCategorias(req, res) {
    try {
        const resultado = await new sql.Request().query(`
            SELECT id_categoria, nombre
            FROM categorias
            ORDER BY nombre ASC
        `);

        res.json({ success: true, data: resultado.recordset });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener las categorías" });
    }
}


// ==================================================================
// GET /api/inventario/listado
// Tabla principal, con búsqueda, filtro de categoría/estado y
// paginación.
//
// Query params esperados:
//   ?pagina=1&limite=10&buscar=texto&categoria=3&estado=bajo
//   estado puede ser: "" | "en_stock" | "bajo" | "agotado"
// ==================================================================
async function obtenerListado(req, res) {
    try {
        const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
        const limite = Math.max(1, parseInt(req.query.limite) || 10);
        const offset = (pagina - 1) * limite;

        const buscar = (req.query.buscar || "").trim();
        const idCategoria = req.query.categoria || "";
        const estado = req.query.estado || "";

        const condiciones = ["m.estado = 1"];
        const request = new sql.Request();

        if (buscar) {
            condiciones.push(`(
                m.nombre LIKE @buscar
                OR CONCAT('MED-', RIGHT('0000' + CAST(m.id_medicamento AS VARCHAR), 4)) LIKE @buscar
            )`);
            request.input("buscar", sql.VarChar, `%${buscar}%`);
        }

        if (idCategoria) {
            condiciones.push("m.id_categoria = @idCategoria");
            request.input("idCategoria", sql.Int, idCategoria);
        }

        if (estado === "en_stock") {
            condiciones.push("m.stock > m.stock_minimo");
        } else if (estado === "bajo") {
            condiciones.push("m.stock > 0 AND m.stock <= m.stock_minimo");
        } else if (estado === "agotado") {
            condiciones.push("m.stock <= 0");
        }

        const whereSQL = condiciones.join(" AND ");

        request.input("offset", sql.Int, offset);
        request.input("limite", sql.Int, limite);

        const resultado = await request.query(`
            SELECT
                m.id_medicamento,
                CONCAT('MED-', RIGHT('0000' + CAST(m.id_medicamento AS VARCHAR), 4)) AS codigo,
                m.nombre,
                m.presentacion,
                c.nombre AS categoria,
                m.stock,
                m.stock_minimo,
                m.precio_venta
            FROM medicamentos m
            LEFT JOIN categorias c ON c.id_categoria = m.id_categoria
            WHERE ${whereSQL}
            ORDER BY m.nombre ASC
            OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
        `);

        // Segundo request para el total (no lleva OFFSET/FETCH)
        const totalRequest = new sql.Request();
        if (buscar) totalRequest.input("buscar", sql.VarChar, `%${buscar}%`);
        if (idCategoria) totalRequest.input("idCategoria", sql.Int, idCategoria);

        const totalResultado = await totalRequest.query(`
            SELECT COUNT(*) AS total
            FROM medicamentos m
            WHERE ${whereSQL}
        `);

        const total = totalResultado.recordset[0].total;

        res.json({
            success: true,
            data: resultado.recordset,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.max(1, Math.ceil(total / limite))
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el listado de inventario" });
    }
}


module.exports = {
    obtenerResumenInventario,
    obtenerCategorias,
    obtenerListado
};
