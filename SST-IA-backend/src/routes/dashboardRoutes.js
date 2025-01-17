const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// RUTAS ESPECIFICAS PARA LA OBTENCION DE DATOS EN EL DASHBOARD 
// Cantidad de usuarios, ubicaciones, Tareas, Puntos, Formularioss ->  Para el panel "Dashboard"
router.get('/stats', dashboardController.getDashboardStats);
// Endpoint para tareas recientes
router.get('/recent-tasks', dashboardController.getRecentTasks);


// RUTA LISTA PERSONAL
router.get('/listaPersonal', dashboardController.getListaPersonal);

// PANEL PARA LAS EVIDENCIAS 
// ya hay 2 Rutas que cumplen esto:
// http://localhost:3000/api/tasks/evidences       --->> para obtener las evidenias (quien lo manda y la tarea) 
// http://localhost:3000/api/tasks/:taskId/evidences/:evidenceId     --->>  Aprobar y rechazar

// PANEL PARA REGISTRAR PERSONAL 
// ya esta el Registter en authController

//  PANEL PARA RECEPCION DE DOCUMENTOS -
// >> esta ya esta en el http://localhost:3000/api/tasks/formularios-historial

// PANEL PARA ASIGNAR TAREAS --> ya estan implementados las rutas:
// http://localhost:3000/api/tasks (para conseguir la lista de tareas) 
// http://localhost:3000/api/users (para seleccionar a que usuario se le va a seleccionar la tarea)
// http://localhost:3000/api/tasks (para crear la tarea (la longitud, latitud y cliente son ))


// PANEL PARA ASIGNAR MAPAS:
// Este ya hay 3 Endpoints en mapaController- ->> los que sirven son :
// http://localhost:3000/api/tasks/mapas  ->>> ver los mapas y tambien puedes sacar las ids de las tareas, nombre de las tareas para actualziar la tarea y asi crear el mapa
// http://localhost:3000/api/tasks/mapas/:id_tarea} ->>> Con esto puedes actualziar la tarea pero solo la parte de los mapas (latitud, longitud y cliente)

module.exports = router;
