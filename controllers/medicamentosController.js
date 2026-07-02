const express = require("express");

const router = express.Router();

const {
    listarMedicamentos,
    obtenerMedicamento,
    crearMedicamento,
    actualizarMedicamento,
    eliminarMedicamento
} = require("../controllers/medicamentosController");

router.get("/api/medicamentos", listarMedicamentos);
router.get("/api/medicamentos/:id", obtenerMedicamento);
router.post("/api/medicamentos", crearMedicamento);
router.put("/api/medicamentos/:id", actualizarMedicamento);
router.delete("/api/medicamentos/:id", eliminarMedicamento);

module.exports = router;