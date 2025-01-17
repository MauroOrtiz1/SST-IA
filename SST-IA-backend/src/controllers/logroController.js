const Logro = require('../models/logro');
const User = require('../models/user');

// Crear un nuevo logro
exports.createLogro = async (req, res) => {
    const { nombre, descripcion, criterios } = req.body;
    try {
        const newLogro = new Logro({ nombre, descripcion, criterios });
        await newLogro.save();
        res.status(201).json({ message: 'Logro creado con éxito.', logro: newLogro });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear logro.', error });
    }
};

// Obtener todos los logros
exports.getAllLogros = async (req, res) => {
    try {
        const logros = await Logro.find();
        res.status(200).json(logros);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener logros.', error });
    }
};

// Obtener un logro por ID
exports.getLogroById = async (req, res) => {
    const { id } = req.params;
    try {
        const logro = await Logro.findById(id);
        if (!logro) {
            return res.status(404).json({ message: 'Logro no encontrado.' });
        }
        res.status(200).json(logro);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener logro.', error });
    }
};

// Actualizar un logro por ID
exports.updateLogro = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, criterios } = req.body;
    try {
        const updatedLogro = await Logro.findByIdAndUpdate(
            id,
            { nombre, descripcion, criterios },
            { new: true, runValidators: true }
        );
        if (!updatedLogro) {
            return res.status(404).json({ message: 'Logro no encontrado.' });
        }
        res.status(200).json({ message: 'Logro actualizado con éxito.', logro: updatedLogro });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar logro.', error });
    }
};

// Eliminar un logro por ID
exports.deleteLogro = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedLogro = await Logro.findByIdAndDelete(id);
        if (!deletedLogro) {
            return res.status(404).json({ message: 'Logro no encontrado.' });
        }
        res.status(200).json({ message: 'Logro eliminado con éxito.', logro: deletedLogro });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar logro.', error });
    }
};

// Obtener logros desbloqueados de un usuario
exports.getUserLogros = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).populate('logros_desbloqueados.id_logro');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(user.logros_desbloqueados);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los logros del usuario.', error });
    }
};

// Obtener logros por desbloquear de un usuario
exports.getLogrosPorDesbloquear = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const logros = await Logro.find();
        const desbloqueados = user.logros_desbloqueados.map(logro => logro.id_logro.toString());
        const logrosPorDesbloquear = logros.filter(logro => !desbloqueados.includes(logro._id.toString()));

        res.status(200).json(logrosPorDesbloquear);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener logros por desbloquear.', error });
    }
};

const { asignarLogros } = require('../services/logroService'); // Asegúrate de importar la función del servicio

// Asignar logros a un usuario basado en criterios acumulativos
exports.asignarLogrosEndpoint = async (req, res) => {
    const { userId } = req.params;
    try {
        const resultado = await asignarLogros(userId);
        res.status(200).json({
            message: 'Logros asignados con éxito.',
            nuevosLogros: resultado.nuevosLogros,
            user: resultado.user,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al asignar logros.', error: error.message });
    }
};
