const Task = require('../models/task');

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

module.exports = {
    obtenerTareasCompletadas,
    obtenerEvidenciasAprobadas,
};
