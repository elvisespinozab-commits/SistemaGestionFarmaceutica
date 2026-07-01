const express = require("express");

const router = express.Router();

const {
    obtenerResumen,
    obtenerMovimientosRecientes,
    obtenerGraficoMensual,
    obtenerStockBajo
} = require("../controllers/dashboardController");

router.get("/api/dashboard/resumen", obtenerResumen);
router.get("/api/dashboard/movimientos-recientes", obtenerMovimientosRecientes);
router.get("/api/dashboard/grafico-mensual", obtenerGraficoMensual);
router.get("/api/dashboard/stock-bajo", obtenerStockBajo);

module.exports = router;