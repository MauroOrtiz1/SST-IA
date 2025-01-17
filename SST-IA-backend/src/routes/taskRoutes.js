const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const mapaController = require("../controllers/mapaController"); /// Endopoints para los Mapas, para dividirlo del manejo de las tareas
const { upload } = require('../middlewares/multer');
const { createTaskValidator } = require('../validators/taskValidators');
const { validateRequest } = require('../validators/validateRequest');

// Rutas para tareas
router.post('/', createTaskValidator, validateRequest, taskController.createTask); // Crear una nueva tarea
router.get('/', taskController.getAllTasks); // Leer todas las tareas
router.get('/users/:userId', taskController.getTasksByUser); // Leer tareas de un usuario por su ID

// ----------------------RUTAS PARA EVIDENICIA
// Sube ua evidencia (esta pensado para que lo suban los trabajadores desde la aplicacion movil)
router.post('/:taskId/evidences', upload.single('file'), taskController.uploadTaskEvidence);// Agregar evidencia a una tarea

router.get('/evidences', taskController.getAllEvidences); // Obtener todas las evidencias
router.get('/:taskId/evidences', taskController.getEvidences); // Leer evidencias de una tarea
router.delete('/:taskId/evidences/:evidenceId', taskController.deleteEvidence); // Eliminar una evidencia de una tarea

 // Aprobar o Rechazar evidencia (incluye validación)
router.put('/:taskId/evidences/:evidenceId', taskController.validateTaskEvidence);

// PARA EL DASHBOARD Get evidencias
//router.get('/evidences', taskController.getEvidencesWithFilters); // Leer evidencias con filtros

//Excel : Ruta para subir formularios (ATS, IPERC, PET)
router.post('/:taskId/upload-formulario', upload.single('file'), taskController.uploadFormulario);
router.get('/formularios-historial', taskController.getFormulariosHistorial);
router.get('/:taskId/formularios', taskController.getFormulariosByTask); // Obtener formularios de una tarea


// Rutas de Mapas, prefijo para las rutas con '/mapas'
router.get('/mapas', mapaController.getPuntos); // Obtener todas las tareas con puntos (latitud, longitud, cliente)
router.put('/mapas/:id', mapaController.updatePunto); // Actualizar puntos para una tarea existente
router.put('/mapas/:id/clear', mapaController.clearPunto); // Limpiar los puntos de una tarea

module.exports = router;
