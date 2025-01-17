const User = require('../models/user');
const Task = require('../models/task');

// Cantidad de usuarios, ubicaciones, Tareas, Puntos, Formularioss ->  Para el panel "Dashboard"
const getDashboardStats = async (req, res) => {
    try {
        const cantidadPersonas = await User.countDocuments(); // cantidad de personas

        const usuarios = await User.find({}, 'puntos_acumulados'); 
        const cantidadPuntos = usuarios.reduce((total, user) => total + (user.puntos_acumulados || 0), 0); // Suma de los puntos acumulados de todos los usuario

        const cantidadTareas = await Task.countDocuments(); //cantidad de tareas

        const tareas = await Task.find({}, 'formularios');
        const cantidadDocumentos = tareas.reduce((total, tarea) => total + (tarea.formularios.length || 0), 0); // Suma de cantidad de formularios, asociados a las tareas

        const cantidadUbicaciones = await Task.countDocuments({ latitud: { $exists: true }, longitud: { $exists: true } }); // Suma de ubicaciones (tareas con latitud y longitud)

        res.status(200).json({
            cantidadPersonas,
            cantidadUbicaciones,
            cantidadTareas,
            cantidadPuntos,
            cantidadDocumentos,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas del dashboard.' });
    }
};

// Ruta para obtener la lista personal
const getRecentTasks = async (req, res) => {
    try {
        const tareasRecientes = await Task.find({})
            .sort({ createdAt: -1 }) // Orden descendente por `createdAt`
            .limit(5) 
            .select('_id nombre descripcion createdAt'); 

        // Formatear las fechas
        const tareasFormateadas = tareasRecientes.map((tarea) => ({ ...tarea.toObject(),
            fechaCreada: tarea.createdAt.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }), // Ejemplo: "10 de enero de 2025, 15:45"
        }));
        res.status(200).json(tareasFormateadas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tareas recientes.', error });
    }
};

// Para mostrar en el Dashboard en general
const getListaPersonal = async (req, res) => {
    try {
        // Obtener todos los usuarios
        const users = await User.find()
            .select('nombre area puntos_acumulados logros_desbloqueados correo telefono historial_puntos')
            .lean();
        // Obtener el mes y año actuales
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        // Agregar datos adicionales sobre las tareas asociadas
        const listaPersonal = await Promise.all(
            users.map(async (user) => {
                // Calcular puntos del mes actual
                const punto_mes = user.historial_puntos
                    .filter(punto => punto.mes === currentMonth && punto.año === currentYear)
                    .reduce((total, punto) => total + punto.puntos, 0);
                // Buscar tareas del usuario
                const tareas = await Task.find({ id_usuario: user._id })
                    .select('estado_tarea') 
                    .lean();
                // Contar tareas según el estado
                const tareasEstado = {
                    pendiente: tareas.filter(t => t.estado_tarea === 'Pendiente').length,
                    completada: tareas.filter(t => t.estado_tarea === 'Completada').length,
                    validada: tareas.filter(t => t.estado_tarea === 'Validada').length,
                };

                return { _id: user._id, nombre: user.nombre, area: user.area, puntos_acumulados: user.puntos_acumulados, logros_desbloqueados: user.logros_desbloqueados, correo: user.correo, telefono: user.telefono,
                    punto_mes,
                    tareasEstado, 
                };
            })
        );

        res.status(200).json(listaPersonal);
    } catch (error) {
        console.error('Error al obtener la lista personal:', error);
        res.status(500).json({ message: 'Error al obtener la lista personal.', error });
    }
};



module.exports = {
    getDashboardStats,
    getRecentTasks,
    getListaPersonal,
};
