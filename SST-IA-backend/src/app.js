const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const firebase = require('./config/firebase.js')

const rankingRoutes = require('./routes/rankingRoutes'); // Importamos las rutas de ranking
const authRoutes = require('./routes/authRoutes');

//const { swaggerUi, swaggerSpec } = require('./config/swagger');
//const { authenticate } = require('./middlewares/auth'); // PARA RUTAS PROTEGIDAS

// Variables de entorno
require('dotenv').config();

const app = express();

// Conexión a la base de datos
connectDB();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Registrar Swagger
//app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));    
app.use((req, res, next) => {
    console.log(`Solicitud entrante: ${req.method} ${req.path}`);
    next();
});
// ----------------------------------
// RUTAS
//Rutas de autentificacion -> 
app.use('/api/auth', authRoutes);
// Rutas de rankings:
app.use('/api/ranking', rankingRoutes); // Rutas de ranking

// Relacionadas con usuarios: 
app.use('/api/users', require('./routes/userRoutes'));

//Rutas para las las tareas
app.use('/api/tasks', require('./routes/taskRoutes'));

// Relacionadas con logros:
app.use('/api/logros', require('./routes/logroRoutes'));

// Ruta para obtener los datos de manera especifica para el Dashboard de SST
app.use('/api/dashboard', require('./routes/dashboardRoutes'));



console.log('Archivo app.js cargado correctamente');



// --------------------------------------------------
// PRUEBAS PARA EL ENVÍO DE NOTIFICACIONES
// --------------------------------------------------

const { getMessaging } = require("firebase-admin/messaging");


app.post("/send", function (req, res) {
    
    const userToken = req.body.token; // Token recibido desde el cliente Android

    if (!userToken) {
        return res.status(400).json({ message: "Token no proporcionado" });
    }

    const message = {
        notification: {
            title: "Notificación de prueba",
            body: "Esto es una notificación simulada desde el servidor"
        },
        token: userToken, // Usa el token
    };

    getMessaging()
        .send(message) // Enviar notificación
        .then((response) => {
            res.status(200).json({
                message: "Notificación enviada con éxito",
                response: response
            });
            console.log("Notificación enviada:", response);
        })
        .catch((error) => {
            res.status(500).json({
                message: "Error al enviar la notificación",
                error: error.message
            });
            console.error("Error al enviar la notificación:", error);
        });
});


module.exports = app;
