const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/userValidators');
const { validateRequest } = require('../validators/validateRequest');

// Rutas de autenticación
router.post('/register', registerValidator, validateRequest, authController.register); // Registro
router.post('/login', loginValidator, validateRequest, authController.login); // Login
router.post('/forget-password', authController.forgetPassword); // Solicitar reseteo de contraseña
router.get('/reset-password', authController.resetPassword); // Restablecer contraseña

module.exports = router;
