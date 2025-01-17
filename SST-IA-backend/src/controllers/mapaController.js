// lAS RUTAS DE LOS MAPAS ESTAN EN TASKCONTROLLER

const Task = require("../models/task");

// Obtener todos los puntos (tareas con latitud, longitud y cliente)
exports.getPuntos = async (req, res) => {
    try {
        const puntos = await Task.find().select("nombre_cliente latitud longitud nombre");
        res.status(200).json(puntos);
    } catch (error) {
        console.error("Error al obtener puntos:", error);
        res.status(500).json({ message: "Error al obtener los puntos.", error });
    }
};

// Actualizar puntos (latitud, longitud, cliente) para una tarea existente
exports.updatePunto = async (req, res) => {
    const { id } = req.params; // ID de la tarea
    const { latitud, longitud, nombre_cliente } = req.body;

    try {
        // Buscar y actualizar los puntos de la tarea
        const tareaActualizada = await Task.findByIdAndUpdate(
            id,
            { latitud, longitud, nombre_cliente },
            { new: true, runValidators: true } // Devuelve la tarea actualizada y valida datos
        );

        if (!tareaActualizada) {
            return res.status(404).json({ message: "Tarea no encontrada." });
        }

        res.status(200).json({ message: "Puntos actualizados con éxito.", tarea: tareaActualizada });
    } catch (error) {
        console.error("Error al actualizar los puntos:", error);
        res.status(500).json({ message: "Error al actualizar los puntos.", error });
    }
};

// Limpiar (borrar) puntos de una tarea
exports.clearPunto = async (req, res) => {
    const { id } = req.params; // ID de la tarea

    try {
        // Limpiar los valores de los puntos
        const tareaActualizada = await Task.findByIdAndUpdate(
            id,
            { $unset: { latitud: "", longitud: "", nombre_cliente: "" } },
            { new: true }
        );  

        if (!tareaActualizada) {
            return res.status(404).json({ message: "Tarea no encontrada." });
        }

        res.status(200).json({ message: "Puntos eliminados con éxito.", tarea: tareaActualizada });
    } catch (error) {
        console.error("Error al limpiar los puntos:", error);
        res.status(500).json({ message: "Error al limpiar los puntos.", error });
    }
};
