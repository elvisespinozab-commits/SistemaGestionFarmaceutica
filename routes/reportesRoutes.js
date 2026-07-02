const express = require("express");
const router = express.Router();

const reportesController = require("../controllers/reportesController");

// ==============================
// RESUMEN GENERAL
// ==============================

router.get(
    "/resumen",
    reportesController.obtenerResumen
);

// ==============================
// MOVIMIENTOS
// ==============================

router.get(
    "/movimientos",
    reportesController.obtenerMovimientos
);

// ==============================
// STOCK BAJO
// ==============================

router.get(
    "/stock-bajo",
    reportesController.obtenerStockBajo
);

// ==============================
// GRAFICO ENTRADAS
// ==============================

router.get(
    "/grafico-entradas",
    reportesController.graficoEntradas
);

// ==============================
// GRAFICO SALIDAS
// ==============================

router.get(
    "/grafico-salidas",
    reportesController.graficoSalidas
);

// ==============================
// GRAFICO CATEGORIAS
// ==============================

router.get(
    "/grafico-categorias",
    reportesController.graficoCategorias
);

module.exports = router;