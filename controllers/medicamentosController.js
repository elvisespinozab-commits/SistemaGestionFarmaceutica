const { sql } = require("../config/db");

// ==================================================================
// GET /api/medicamentos
// Devuelve el listado completo de medicamentos con el nombre de su
// categoría (join), para pintar la tabla del listado.
// ==================================================================
async function listarMedicamentos(req, res) {
    try {
        const resultado = await new sql.Request().query(`
            SELECT 
                m.id_medicamento,
                m.codigo,
                m.nombre,
                m.descripcion,
                m.laboratorio,
                m.presentacion,
                m.concentracion,
                m.precio_compra,
                m.precio_venta,
                m.stock,
                m.stock_minimo,
                m.fecha_vencimiento,
                m.id_categoria,
                c.nombre AS categoria,
                m.estado
            FROM medicamentos m
            LEFT JOIN categorias c ON c.id_categoria = m.id_categoria
            ORDER BY m.nombre ASC
        `);

        res.json({ success: true, data: resultado.recordset });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el listado de medicamentos" });
    }
}

// ==================================================================
// GET /api/medicamentos/:id
// Devuelve un solo medicamento (para precargar el formulario al
// editar).
// ==================================================================
async function obtenerMedicamento(req, res) {
    try {
        const { id } = req.params;

        const resultado = await new sql.Request()
            .input("id", sql.Int, id)
            .query(`
                SELECT *
                FROM medicamentos
                WHERE id_medicamento = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ success: false, mensaje: "Medicamento no encontrado" });
        }

        res.json({ success: true, data: resultado.recordset[0] });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el medicamento" });
    }
}

// ==================================================================
// POST /api/medicamentos
// Crea un medicamento nuevo.
// ==================================================================
async function crearMedicamento(req, res) {
    try {
        const {
            codigo, nombre, descripcion, laboratorio, presentacion,
            concentracion, precioCompra, precioVenta, stock,
            stockMinimo, fechaVencimiento, idCategoria, estado
        } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, mensaje: "El nombre es obligatorio" });
        }

        const resultado = await new sql.Request()
            .input("codigo", sql.VarChar, codigo || null)
            .input("nombre", sql.VarChar, nombre)
            .input("descripcion", sql.VarChar, descripcion || null)
            .input("laboratorio", sql.VarChar, laboratorio || null)
            .input("presentacion", sql.VarChar, presentacion || null)
            .input("concentracion", sql.VarChar, concentracion || null)
            .input("precioCompra", sql.Decimal(10, 2), precioCompra || 0)
            .input("precioVenta", sql.Decimal(10, 2), precioVenta || 0)
            .input("stock", sql.Int, stock || 0)
            .input("stockMinimo", sql.Int, stockMinimo || 10)
            .input("fechaVencimiento", sql.Date, fechaVencimiento || null)
            .input("idCategoria", sql.Int, idCategoria || null)
            .input("estado", sql.Bit, estado === undefined ? 1 : estado)
            .query(`
                INSERT INTO medicamentos
                    (codigo, nombre, descripcion, laboratorio, presentacion,
                     concentracion, precio_compra, precio_venta, stock,
                     stock_minimo, fecha_vencimiento, id_categoria, estado)
                OUTPUT INSERTED.id_medicamento
                VALUES
                    (@codigo, @nombre, @descripcion, @laboratorio, @presentacion,
                     @concentracion, @precioCompra, @precioVenta, @stock,
                     @stockMinimo, @fechaVencimiento, @idCategoria, @estado)
            `);

        res.json({
            success: true,
            mensaje: "Medicamento registrado correctamente",
            data: { id_medicamento: resultado.recordset[0].id_medicamento }
        });

    } catch (error) {
        console.log(error);

        // Violación del índice único de "codigo"
        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ success: false, mensaje: "Ya existe un medicamento con ese código" });
        }

        res.status(500).json({ success: false, mensaje: "Error al registrar el medicamento" });
    }
}

// ==================================================================
// PUT /api/medicamentos/:id
// Actualiza un medicamento existente.
// ==================================================================
async function actualizarMedicamento(req, res) {
    try {
        const { id } = req.params;
        const {
            codigo, nombre, descripcion, laboratorio, presentacion,
            concentracion, precioCompra, precioVenta, stock,
            stockMinimo, fechaVencimiento, idCategoria, estado
        } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, mensaje: "El nombre es obligatorio" });
        }

        const resultado = await new sql.Request()
            .input("id", sql.Int, id)
            .input("codigo", sql.VarChar, codigo || null)
            .input("nombre", sql.VarChar, nombre)
            .input("descripcion", sql.VarChar, descripcion || null)
            .input("laboratorio", sql.VarChar, laboratorio || null)
            .input("presentacion", sql.VarChar, presentacion || null)
            .input("concentracion", sql.VarChar, concentracion || null)
            .input("precioCompra", sql.Decimal(10, 2), precioCompra || 0)
            .input("precioVenta", sql.Decimal(10, 2), precioVenta || 0)
            .input("stock", sql.Int, stock || 0)
            .input("stockMinimo", sql.Int, stockMinimo || 10)
            .input("fechaVencimiento", sql.Date, fechaVencimiento || null)
            .input("idCategoria", sql.Int, idCategoria || null)
            .input("estado", sql.Bit, estado === undefined ? 1 : estado)
            .query(`
                UPDATE medicamentos SET
                    codigo = @codigo,
                    nombre = @nombre,
                    descripcion = @descripcion,
                    laboratorio = @laboratorio,
                    presentacion = @presentacion,
                    concentracion = @concentracion,
                    precio_compra = @precioCompra,
                    precio_venta = @precioVenta,
                    stock = @stock,
                    stock_minimo = @stockMinimo,
                    fecha_vencimiento = @fechaVencimiento,
                    id_categoria = @idCategoria,
                    estado = @estado
                WHERE id_medicamento = @id
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, mensaje: "Medicamento no encontrado" });
        }

        res.json({ success: true, mensaje: "Medicamento actualizado correctamente" });

    } catch (error) {
        console.log(error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ success: false, mensaje: "Ya existe un medicamento con ese código" });
        }

        res.status(500).json({ success: false, mensaje: "Error al actualizar el medicamento" });
    }
}

// ==================================================================
// DELETE /api/medicamentos/:id
// Elimina un medicamento.
// ==================================================================
async function eliminarMedicamento(req, res) {
    try {
        const { id } = req.params;

        const resultado = await new sql.Request()
            .input("id", sql.Int, id)
            .query(`
                DELETE FROM medicamentos
                WHERE id_medicamento = @id
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, mensaje: "Medicamento no encontrado" });
        }

        res.json({ success: true, mensaje: "Medicamento eliminado correctamente" });

    } catch (error) {
        console.log(error);

        // FK: el medicamento tiene entradas/salidas registradas (no se puede borrar)
        if (error.number === 547) {
            return res.status(400).json({
                success: false,
                mensaje: "No se puede eliminar: el medicamento tiene entradas o salidas registradas"
            });
        }

        res.status(500).json({ success: false, mensaje: "Error al eliminar el medicamento" });
    }
}

// ==================================================================
// GET /api/categorias
// Devuelve las categorías activas, para llenar el <select> del
// formulario de medicamentos.
// ==================================================================
async function listarCategorias(req, res) {
    try {
        const resultado = await new sql.Request().query(`
            SELECT id_categoria, nombre
            FROM categorias
            WHERE estado = 1
            ORDER BY nombre ASC
        `);

        res.json({ success: true, data: resultado.recordset });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener las categorías" });
    }
}

module.exports = {
    listarMedicamentos,
    obtenerMedicamento,
    crearMedicamento,
    actualizarMedicamento,
    eliminarMedicamento,
    listarCategorias
};