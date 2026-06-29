const { sql } = require("../config/db");

async function iniciarSesion(req, res) {

    const { usuario, password } = req.body;

    try {

        const resultado = await sql.query`
            SELECT *
            FROM Usuarios
            WHERE usuario = ${usuario}
            AND contraseña = ${password}
            AND estado = 1
        `;

        if (resultado.recordset.length > 0) {

            res.json({
                success: true,
                mensaje: "Bienvenido",
                usuario: resultado.recordset[0]
            });

        } else {

            res.json({
                success: false,
                mensaje: "Usuario o contraseña incorrectos"
            });

        }

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            mensaje: "Error del servidor"
        });

    }

}

module.exports = {
    iniciarSesion
};