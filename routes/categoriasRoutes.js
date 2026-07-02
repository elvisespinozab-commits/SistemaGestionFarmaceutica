const express = require("express");

const router = express.Router();

const {
    listarCategorias,
    obtenerCategoria,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} = require("../controllers/categoriasController");

router.get("/api/categorias", listarCategorias);
router.get("/api/categorias/:id", obtenerCategoria);
router.post("/api/categorias", crearCategoria);
router.put("/api/categorias/:id", actualizarCategoria);
router.delete("/api/categorias/:id", eliminarCategoria);

module.exports = router;