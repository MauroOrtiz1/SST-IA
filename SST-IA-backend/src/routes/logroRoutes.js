const express = require('express');
const router = express.Router();
const logroController = require('../controllers/logroController');

// Rutas para logros
// CRUD de logros
router.post('/', logroController.createLogro); // Crear un nuevo logro
router.get('/', logroController.getAllLogros); // Obtener todos los logros
router.get('/:id', logroController.getLogroById); // Obtener un logro por ID
router.put('/:id', logroController.updateLogro); // Actualizar un logro por ID
router.delete('/:id', logroController.deleteLogro); // Eliminar un logro por ID

// Funciones relacionadas con logros y usuarios
router.get('/user/:userId', logroController.getUserLogros); // Obtener logros desbloqueados de un usuario
router.get('/user/:userId/por-desbloquear', logroController.getLogrosPorDesbloquear); // Obtener logros pendientes de desbloqueo
//router.put('/user/:id/asignar', logroController.assignLogro); // Asignar logros al usuario se convirtio en una funcion general mejor

router.post('/asignar/:userId', logroController.asignarLogrosEndpoint);

    
module.exports = router;
