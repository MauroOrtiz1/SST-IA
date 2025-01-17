const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth'); // Para validar el token, rutas protegidas (incio de sesion)


// Crud de usuarios (Register esta en authRoutes.js)
router.get(
    '/',
    userController.getAllUsers
);
// Leer usuario por ID
router.get(
    '/:id',
    userController.getUserById
);
// Actualizar usuario por ID
router.put(
    '/:id',
    authenticate, 
    userController.updateUser
);
// Eliminar usuario
router.delete(
    '/:id',
    userController.deleteUser
);

//-------Ruta para el historial de puntos por mes
router.get(
    '/:userId/historial-puntos-mensuales',
    userController.getUserPointsHistory 
);

// Ruta para mostrar los datos exactos del Profile de la aplicacion Movil
router.get(
    '/:id/profile',
    userController.getUserProfile
);


// -------------------Rutas relacionadas con notificaciones y usuarios
// Crear notificación para un usuario, Incluye el envio FCM (No tiene uso)
router.post(
    '/:id/notifications',
    userController.addNotificacion
);

// Leer notificaciones del usuario
router.get(
    '/:id/notifications',
    userController.getUserNotifications
);


// Actualizar token FCM del usuario al iniciar sesion o registrarse en la aplicacion movil
router.post(
    '/update-token',
    userController.updateFcmToken
);


//Consegui token FCM:
router.get('/')

module.exports = router;
    