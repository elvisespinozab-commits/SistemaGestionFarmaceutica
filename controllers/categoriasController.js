const { sql } = require("../config/db");

// ==================================================================
// GET /api/categorias
// Devuelve todas las categorías (para la tabla del módulo Categorías
// y para el <select> del formulario de Medicamentos).
// ==================================================================
async function listarCategorias(req, res) {
    try {
        const resultado = await new sql.Request().query(`
            SELECT id_categoria, nombre, descripcion, estado
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
// GET /api/categorias/:id
// ==================================================================
async function obtenerCategoria(req, res) {
    try {
        const { id } = req.params;

        const resultado = await new sql.Request()
            .input("id", sql.Int, id)
            .query(`
                SELECT id_categoria, nombre, descripcion, estado
                FROM categorias
                WHERE id_categoria = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ success: false, mensaje: "Categoría no encontrada" });
        }

        res.json({ success: true, data: resultado.recordset[0] });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener la categoría" });
    }
}

// ==================================================================
// POST /api/categorias
// ==================================================================
async function crearCategoria(req, res) {
    try {
        const { nombre, descripcion, estado } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, mensaje: "El nombre es obligatorio" });
        }

        const resultado = await new sql.Request()
            .input("nombre", sql.VarChar, nombre)
            .input("descripcion", sql.VarChar, descripcion || null)
            .input("estado", sql.Bit, estado === undefined ? 1 : estado)
            .query(`
                INSERT INTO categorias (nombre, descripcion, estado)
                OUTPUT INSERTED.id_categoria
                VALUES (@nombre, @descripcion, @estado)
            `);

        res.json({
            success: true,
            mensaje: "Categoría registrada correctamente",
            data: { id_categoria: resultado.recordset[0].id_categoria }
        });

    } catch (error) {
        console.log(error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ success: false, mensaje: "Ya existe una categoría con ese nombre" });
        }

        res.status(500).json({ success: false, mensaje: "Error al registrar la categoría" });
    }
}

// ==================================================================
// PUT /api/categorias/:id
// ==================================================================
async function actualizarCategoria(req, res) {
    try {
        const { id } = req.params;
        const { nombre, descripcion, estado } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, mensaje: "El nombre es obligatorio" });
        }

        const resultado = await new sql.Request()
            .input("id", sql.Int, id)
            .input("nombre", sql.VarChar, nombre)
            .input("descripcion", sql.VarChar, descripcion || null)
            .input("estado", sql.Bit, estado === undefined ? 1 : estado)
            .query(`
                UPDATE categorias SET
                    nombre = @nombre,
                    descripcion = @descripcion,
                    estado = @estado
                WHERE id_categoria = @id
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, mensaje: "Categoría no encontrada" });
        }

        res.json({ success: true, mensaje: "Categoría actualizada correctamente" });

    } catch (error) {
        console.log(error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ success: false, mensaje: "Ya existe una categoría con ese nombre" });
        }

        res.status(500).json({ success: false, mensaje: "Error al actualizar la categoría" });
    }
}

// ==================================================================
// DELETE /api/categorias/:id
// ==================================================================
async function eliminarCategoria(req, res) {
    try {
        const { id } = req.params;

        const resultado = await new sql.Request()
            .input("id", sql.Int, id)
            .query(`
                DELETE FROM categorias
                WHERE id_categoria = @id
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, mensaje: "Categoría no encontrada" });
        }

        res.json({ success: true, mensaje: "Categoría eliminada correctamente" });

    } catch (error) {
        console.log(error);

        // FK: hay medicamentos usando esta categoría
        if (error.number === 547) {
            return res.status(400).json({
                success: false,
                mensaje: "No se puede eliminar: hay medicamentos registrados con esta categoría"
            });
        }

        res.status(500).json({ success: false, mensaje: "Error al eliminar la categoría" });
    }
}

module.exports = {
    listarCategorias,
    obtenerCategoria,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
};