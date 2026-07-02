const express = require("express");
const router = express.Router();

const {
    obtenerResumenUsuarios,
    obtenerRoles,
    obtenerListadoUsuarios,
    eliminarUsuario
} = require("../controllers/usuarioController");

router.get("/api/usuarios/resumen", obtenerResumenUsuarios);
router.get("/api/usuarios/roles", obtenerRoles);
router.get("/api/usuarios/listado", obtenerListadoUsuarios);
// Agrega esta nueva ruta para eliminar
router.delete("/api/usuarios/:id", eliminarUsuario);

module.exports = router;