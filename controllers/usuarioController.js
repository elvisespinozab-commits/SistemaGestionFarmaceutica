const { sql } = require("../config/db");

// ======================================================================
// Basado en el esquema real (script.sql):
//
//   [Usuarios](id_usuario, nombres, apellidos, usuario, correo,
//              contraseña, rol, estado, fecha_creacion)
//
//   historial_login(id_historial, id_usuario, fecha, ip, exitoso)
//   -- se usa para calcular el "último acceso" de cada usuario
//
// La tabla se llama exactamente [Usuarios] (con mayúscula y entre
// corchetes), igual que ya la usa dashboardController.js.
// ======================================================================


// ==================================================================
// GET /api/usuarios/resumen
// Tarjetas superiores: total, administradores, activos, inactivos
// y nuevos en los últimos 30 días.
// ==================================================================
async function obtenerResumenUsuarios(req, res) {
    try {
        const total = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM [Usuarios]
        `);

        const administradores = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM [Usuarios] WHERE rol = 'Administrador'
        `);

        const activos = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM [Usuarios] WHERE estado = 1
        `);

        const inactivos = await new sql.Request().query(`
            SELECT COUNT(*) AS total FROM [Usuarios] WHERE estado = 0
        `);

        const nuevos = await new sql.Request().query(`
            SELECT COUNT(*) AS total
            FROM [Usuarios]
            WHERE fecha_creacion >= DATEADD(DAY, -30, GETDATE())
        `);

        res.json({
            success: true,
            data: {
                totalUsuarios: total.recordset[0].total,
                administradores: administradores.recordset[0].total,
                activos: activos.recordset[0].total,
                inactivos: inactivos.recordset[0].total,
                nuevos: nuevos.recordset[0].total
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener el resumen de usuarios" });
    }
}


// ==================================================================
// GET /api/usuarios/roles
// Roles realmente usados en la tabla (no vienen fijos porque "rol"
// es un varchar libre: por ahora hay "Administrador" y "Empleado",
// pero esto se adapta si agregas más).
// ==================================================================
async function obtenerRoles(req, res) {
    try {
        const resultado = await new sql.Request().query(`
            SELECT DISTINCT rol
            FROM [Usuarios]
            ORDER BY rol ASC
        `);

        res.json({ success: true, data: resultado.recordset.map(r => r.rol) });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al obtener los roles" });
    }
}


// ==================================================================
// GET /api/usuarios/listado
// Tabla principal con búsqueda, filtro de rol/estado y paginación.
// El "último acceso" se calcula desde historial_login (login
// exitoso más reciente).
//
// Query params esperados:
//   ?pagina=1&limite=10&buscar=texto&rol=Administrador&estado=activo
//   estado puede ser: "" | "activo" | "inactivo"
// ==================================================================
async function obtenerListadoUsuarios(req, res) {
    try {
        const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
        const limite = Math.max(1, parseInt(req.query.limite) || 10);
        const offset = (pagina - 1) * limite;

        const buscar = (req.query.buscar || "").trim();
        const rol = (req.query.rol || "").trim();
        const estado = req.query.estado || "";

        const condiciones = ["1 = 1"];
        const request = new sql.Request();

        if (buscar) {
            condiciones.push(`(
                u.nombres LIKE @buscar
                OR u.apellidos LIKE @buscar
                OR u.usuario LIKE @buscar
                OR u.correo LIKE @buscar
            )`);
            request.input("buscar", sql.VarChar, `%${buscar}%`);
        }

        if (rol) {
            condiciones.push("u.rol = @rol");
            request.input("rol", sql.VarChar, rol);
        }

        if (estado === "activo") {
            condiciones.push("u.estado = 1");
        } else if (estado === "inactivo") {
            condiciones.push("u.estado = 0");
        }

        const whereSQL = condiciones.join(" AND ");

        request.input("offset", sql.Int, offset);
        request.input("limite", sql.Int, limite);

        const resultado = await request.query(`
            SELECT
                u.id_usuario,
                u.nombres,
                u.apellidos,
                u.usuario,
                u.correo,
                u.rol,
                u.estado,
                u.fecha_creacion,
                (
                    SELECT MAX(h.fecha)
                    FROM historial_login h
                    WHERE h.id_usuario = u.id_usuario AND h.exitoso = 1
                ) AS ultimo_acceso
            FROM [Usuarios] u
            WHERE ${whereSQL}
            ORDER BY u.nombres ASC
            OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
        `);

        const totalRequest = new sql.Request();
        if (buscar) totalRequest.input("buscar", sql.VarChar, `%${buscar}%`);
        if (rol) totalRequest.input("rol", sql.VarChar, rol);

        const totalResultado = await totalRequest.query(`
            SELECT COUNT(*) AS total
            FROM [Usuarios] u
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
        res.status(500).json({ success: false, mensaje: "Error al obtener el listado de usuarios" });
    }
}

// ==================================================================
// DELETE /api/usuarios/:id
// Eliminación lógica del usuario (cambia estado a 0 para no romper
// la integridad referencial con el historial, entradas y salidas).
// ==================================================================
async function eliminarUsuario(req, res) {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        request.input("id", sql.Int, id);

        const resultado = await request.query(`
            UPDATE [Usuarios]
            SET estado = 0
            WHERE id_usuario = @id
        `);

        if (resultado.rowsAffected[0] > 0) {
            res.json({ success: true, mensaje: "Usuario eliminado (desactivado) correctamente" });
        } else {
            res.status(404).json({ success: false, mensaje: "Usuario no encontrado" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, mensaje: "Error al eliminar el usuario" });
    }
}

module.exports = {
    obtenerResumenUsuarios,
    obtenerRoles,
    obtenerListadoUsuarios,
    eliminarUsuario
};
