const express = require("express");

const router = express.Router();

const {
    obtenerResumenInventario,
    obtenerCategorias,
    obtenerListado
} = require("../controllers/inventarioController");

router.get("/api/inventario/resumen", obtenerResumenInventario);
router.get("/api/inventario/categorias", obtenerCategorias);
router.get("/api/inventario/listado", obtenerListado);

module.exports = router;
