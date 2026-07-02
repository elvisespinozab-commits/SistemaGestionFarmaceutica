const express = require("express");

const router = express.Router();

const {
    obtenerResumenUsuarios,
    obtenerRoles,
    obtenerListadoUsuarios
} = require("../controllers/usuarioController");

router.get("/api/usuarios/resumen", obtenerResumenUsuarios);
router.get("/api/usuarios/roles", obtenerRoles);
router.get("/api/usuarios/listado", obtenerListadoUsuarios);

module.exports = router;
