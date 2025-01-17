const Logro = require('../models/logro');
const User = require('../models/user');
const Task = require('../models/task'); // Ajusta la ruta según tu estructura de carpetas

/**
 * Asignar logros al usuario basado en criterios acumulativos.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<{ nuevosLogros: string[], user: object }>} - Nombres de los nuevos logros asignados y el usuario actualizado.
 */
exports.asignarLogros = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Usuario no encontrado.');
    }

    const tareasCompletadas = await obtenerTareasCompletadas(userId);
    const evidenciasAprobadas = await obtenerEvidenciasAprobadas(userId);

    const logros = await Logro.find();
    const logrosDesbloqueadosIds = user.logros_desbloqueados.map(logro => logro.id_logro.toString());

    const nuevosLogros = logros.filter(logro => 
        (!logro.criterios.tareas_completadas || tareasCompletadas >= logro.criterios.tareas_completadas) &&
        (!logro.criterios.evidencias_aprobadas || evidenciasAprobadas >= logro.criterios.evidencias_aprobadas) &&
        (!logro.criterios.puntos_acumulados || user.puntos_acumulados >= logro.criterios.puntos_acumulados) &&
        !logrosDesbloqueadosIds.includes(logro._id.toString())
    );

    if (nuevosLogros.length > 0) {
        nuevosLogros.forEach(logro => {
            user.logros_desbloqueados.push({
                id_logro: logro._id,
                nombre_logro: logro.nombre,
                fecha_desbloqueo: new Date(),
            });
        });
        await user.save();
    }

    return {
        nuevosLogros: nuevosLogros.map(logro => logro.nombre),
        user,
    };
};


const obtenerTareasCompletadas = async (userId) => {
    const tareasCompletadas = await Task.countDocuments({
        id_usuario: userId,
        estado_tarea: { $in: ['Completada', 'Validada'] },
    });
    return tareasCompletadas;
};

const obtenerEvidenciasAprobadas = async (userId) => {
    const tareas = await Task.find({ id_usuario: userId });
    let evidenciasAprobadas = 0;

    tareas.forEach((tarea) => {
        evidenciasAprobadas += tarea.evidencias.filter(evidencia => evidencia.estado_validacion === 'Aprobada').length;
    });

    return evidenciasAprobadas;
};