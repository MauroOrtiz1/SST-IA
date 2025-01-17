const User = require('../models/user');
const Logro = require('../models/logro');
const mongoose = require('mongoose');

// Actualizar token FCM
exports.updateFcmToken = async (req, res) => {
    const { userId, fcmToken } = req.body;

    try {
        // Actualizar el token FCM del usuario
        const user = await User.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Token FCM actualizado correctamente.', user });
    } catch (error) {
        console.error('Error al actualizar el token FCM:', error.message);
        res.status(500).json({ message: 'Error al actualizar el token FCM.', error: error.message });
    }
};

// CRUD de Usuarios
// Conseguir todos los usuarios:
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios', error });
    }
};

//Leer Usuario por ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).populate('logros_desbloqueados.id_logro', 'nombre puntos_necesarios');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario.', error });
    }
};

// Actualizar usuario por ID  SIN Contraseña
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { nombre, correo, telefono, area } = req.body;

    // Verificar que el usuario tenga permisos (Admin o SST)
    if (req.user.rol !== 'Admin' && req.user.rol !== 'SST') {
        return res.status(403).json({ message: 'No tienes permisos para actualizar usuarios.' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { nombre, correo, telefono, area },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ message: 'Usuario actualizado con éxito.', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario.', error });
    }
};

//Eliminar Usuario
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ message: 'Usuario eliminado con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario.', error });
    }
};



// Funciones relacionadas con NOTIFICACIONES
// Agregar notificación:
const { getMessaging } = require("firebase-admin/messaging");

// Agregar notificación y enviarla mediante FCM
exports.addNotificacion = async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, fecha } = req.body;

    try {
        // Buscar al usuario
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Agregar notificación a la base de datos
        const nuevaNotificacion = { titulo, descripcion, fecha: fecha || new Date() };
        user.notificaciones.push(nuevaNotificacion);
        await user.save();

        // Intentar enviar la notificación push
        if (user.fcmToken) {
            const pushMessage = {
                notification: {
                    title: titulo,
                    body: descripcion,
                },
                token: user.fcmToken,
            };

            try {
                await getMessaging().send(pushMessage); // Enviar notificación
                return res.status(200).json({ message: 'Notificación registrada y enviada con éxito.', notificacion: nuevaNotificacion, });
            } catch (error) {
                console.error('Error al enviar notificación push:', error.message);
                return res.status(500).json({ message: 'Notificación registrada, pero no se pudo enviar la notificación push.', error: error.message, });
            }
        } else { console.log('El usuario no tiene un token FCM registrado.');
            return res.status(200).json({ message: 'Notificación registrada, pero no se pudo enviar la notificación push porque el usuario no tiene un token FCM.', notificacion: nuevaNotificacion, });
        }
    } catch (error) {
        console.error('Error al agregar notificación:', error.message);
        return res.status(500).json({ message: 'Error al agregar notificación.', error: error.message });
    }
};



//Leer notificaicones:
exports.getUserNotifications = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select('notificaciones');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(user.notificaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las notificaciones.', error });
    }
};


// ---------------------Historial de Puntos acumulados por meses (Lista de meses y sus punto acumulados)
exports.getUserPointsHistory  = async (req, res) => {
    const { userId } = req.params;

    try {
        // Buscar al usuario por su ID
        const user = await User.findById(userId).select('historial_puntos puntos_acumulados');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Formatear los datos de la respuesta
        const puntosDetalle = {
            historial: user.historial_puntos.map((entry) => ({
                mes: entry.mes,
                año: entry.año,
                puntos: entry.puntos,
            })),
            puntos_acumulados: user.puntos_acumulados,
        };

        res.status(200).json(puntosDetalle);
    } catch (error) {
        console.error('Error al obtener el detalle de puntos del usuario:', error);
        res.status(500).json({ message: 'Error al obtener el detalle de puntos del usuario.', error });
    }
};



//PERFIL DEL USUARIOS
exports.getUserProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id)
            .populate('logros_desbloqueados.id_logro', 'nombre puntos_necesarios') // Logros desbloqueados
            .select('nombre correo telefono area puntos_acumulados logros_desbloqueados');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el perfil del usuario.', error });
    }
};

