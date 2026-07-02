const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');

// Ruta GET para servir la nueva interfaz clara de registro
router.get('/register', registerController.getRegisterPage);

// Ruta POST para procesar los datos estructurados para tu tabla [Usuarios]
router.post('/register', registerController.registerUser);

module.exports = router;