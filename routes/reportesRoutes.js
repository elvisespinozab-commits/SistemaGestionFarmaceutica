const express = require("express");

const router = express.Router();

const {
    obtenerResumenReportes,
    obtenerMovimientos
} = require("../controllers/reportesController");

router.get("/api/reportes/resumen", obtenerResumenReportes);
router.get("/api/reportes/movimientos", obtenerMovimientos);

module.exports = router;