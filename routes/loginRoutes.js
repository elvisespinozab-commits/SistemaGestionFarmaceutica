const express = require("express");

const router = express.Router();

const { iniciarSesion } = require("../controllers/loginController");

router.post("/login", iniciarSesion);

module.exports = router;