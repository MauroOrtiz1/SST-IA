const Task = require('../models/task');
const User = require('../models/user');
const bucket = require('../config/firebase'); // Configuración de Firebase
const multer = require('multer');
const mongoose = require('mongoose');
const enviarNotificacionPush = require('../services/fcmService');
const { asignarLogros } = require('../services/logroService');

const upload = multer({ storage: multer.memoryStorage() }); // Guardar en memoria temporalmente
// 
exports.uploadFormulario = async (req, res) => {    
    console.log('>> Datos recibidos:');
    console.log('Task ID:', req.params.taskId);
    console.log('Tipo de formulario:', req.body.tipo);
    console.log('Usuario:', req.body.usuario);
    console.log('Archivo recibido:', req.file);
    const { taskId } = req.params; // ID de la tarea
    const { tipo, usuario } = req.body; // Tipo de formulario y usuario que lo sube

    try {
        // Validaciones iniciales
        if (!req.file) {
            return res.status(400).json({ message: 'Archivo no encontrado.' });
        }
        if (!['ATS', 'IPERC', 'PET'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de formulario no válido.' });
        }
        // Busca la tarea
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Tarea no encontrada.' });
        }

        const fileName = `formularios/${tipo}/${Date.now()}_${req.file.originalname}`;
        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
            metadata: { contentType: req.file.mimetype },
        });

        blobStream.on('error', (error) => {
            console.error('Error al subir archivo:', error);
            res.status(500).json({ message: 'Error al subir archivo.' });
        });

        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            task.formularios.push({
                tipo,
                archivo: publicUrl,
                usuario: new mongoose.Types.ObjectId(usuario) // Asegura que es un ObjectId válido
            });
            await task.save();

            res.status(201).json({ message: 'Formulario subido con éxito.', url: publicUrl });
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error al manejar la subida:', error);
        res.status(500).json({ message: 'Error al manejar la subida.', error });
    }
};


// Enlistar como un historial todos los Formularios llenados (Nombre de la Tarea, Nombre del que la lleno, Fecha de Subida, )
exports.getFormulariosHistorial = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('formularios.usuario', 'nombre') // Incluye el nombre del usuario
            .select('nombre formularios');

        const historial = tasks.flatMap(task =>
            task.formularios.map(formulario => ({
                tarea: task.nombre,
                tipo: formulario.tipo,
                archivo: formulario.archivo,
                fecha_envio: formulario.fecha_envio,
                usuario: formulario.usuario?.nombre || 'Desconocido',
            }))
        );

        res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener el historial de formularios:', error);
        res.status(500).json({ message: 'Error al obtener el historial.', error });
    }
};

// Obtener formularios de una Tarea
exports.getFormulariosByTask = async (req, res) => {
    const { taskId } = req.params;

    try {
        const task = await Task.findById(taskId).populate('formularios.usuario', 'nombre');
        if (!task) {
            return res.status(404).json({ message: 'Tarea no encontrada.' });
        }

        res.status(200).json(task.formularios);
    } catch (error) {
        console.error('Error al obtener formularios:', error);
        res.status(500).json({ message: 'Error al obtener formularios.', error });
    }
};

// ---------------------- CRUD de Tareas ----------------------
// Crear una nueva tarea
exports.createTask = async (req, res) => {
    const { id_usuario, nombre, descripcion, puntos_asignados, latitud, longitud, nombre_cliente } = req.body;
    try {
        const newTask = new Task({ id_usuario, nombre, descripcion, puntos_asignados, latitud, longitud, nombre_cliente });
        await newTask.save();
        res.status(201).json({ message: 'Tarea creada con éxito.', task: newTask });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la tarea.', error });
    }
};

//Leer todas las tareas
// Leer todas las tareas con formularios
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('id_usuario', 'nombre correo') // Incluye datos del usuario (nombre y correo)
            .populate('formularios.usuario', 'nombre')
            .select('nombre descripcion puntos_asignados estado_tarea evidencias latitud longitud nombre_cliente formularios'); // Incluye los formularios

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las tareas.', error });
    }
};


// Leer tareas de un usuario específico
// Controlador para obtener tareas de un usuario específico
exports.getTasksByUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const tasks = await Task.find({ id_usuario: userId })
            .populate('formularios.usuario', 'nombre')
            .select('nombre descripcion puntos_asignados estado_tarea evidencias latitud longitud nombre_cliente formularios');

        res.status(200).json(tasks);
    } catch (error) {
        console.error(`Error al obtener las tareas del usuario:`, error);
        res.status(500).json({ message: 'Error al obtener las tareas del usuario.', error });
    }
};


// ---------------------- Evidencias ----------------------
// Agregar evidencia con una imagen subida a Firebase
exports.uploadTaskEvidence = async (req, res) => {
    const { taskId } = req.params;
    const { titulo, comentario } = req.body;

    try {
        // Verificar si se recibió el archivo
        if (!req.file) {
            return res.status(400).json({ message: 'Archivo no encontrado.' });
        }

        // Verificar si se recibió el título
        if (!titulo) {
            return res.status(400).json({ message: 'El título de la evidencia es requerido.' });
        }

        // Validar tipo MIME (imágenes y videos permitidos)
        const mimeTypesPermitidos = ['image/jpeg', 'image/png', 'video/mp4', 'video/mkv'];
        if (!mimeTypesPermitidos.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Tipo de archivo no permitido.' });
        }

        // Buscar la tarea en la base de datos
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Tarea no encontrada.' });
        }

        // Validar límite de evidencias (5)
        if (task.evidencias.length >= 5) {
            return res.status(400).json({ message: 'Se alcanzó el límite de 5 evidencias para esta tarea.' });
        }

        // Subir el archivo a Firebase Storage
        const fileName = `evidencias/${Date.now()}_${req.file.originalname}`;
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        // Manejar errores al subir el archivo
        blobStream.on('error', (error) => {
            console.error('Error al subir archivo a Firebase:', error);
            return res.status(500).json({ message: 'Error al subir archivo a Firebase.', error });
        });

        // Finalizar la subida del archivo
        blobStream.on('finish', async () => {
            try {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                console.log('URL pública generada:', publicUrl);

                task.evidencias.push({
                    titulo,
                    archivo: publicUrl,
                    comentario,
                });

                // Cambiar el estado de la tarea a "Completada" si está en "Pendiente"
                if (task.estado_tarea === 'Pendiente') {
                    task.estado_tarea = 'Completada';
                }

                // Guardar los cambios en la base de datos
                await task.save();
                // Asignar logros al usuario 
                if (task.estado_tarea === 'Completada') {
                    await asignarLogros(task.id_usuario);
                }
                res.status(201).json({
                    message: 'Evidencia subida correctamente.',
                    task,
                });
            } catch (error) {
                console.error('Error al guardar evidencia:', error);
                res.status(500).json({ message: 'Error al guardar evidencia.', error });
            }
        });
        // Finalizar el flujo de datos
        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error al manejar la subida:', error);
        res.status(500).json({ message: 'Error al manejar la subida.', error });
    }
};


// Actualizar evidencia (aprobar/rechazar)
exports.validateTaskEvidence = async (req, res) => {
    const { taskId, evidenceId } = req.params;
    const { estado_validacion, comentario_retroalimentacion } = req.body;

    try {
        // Buscar la tarea
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        // Buscar la evidencia dentro de la tarea
        const evidence = task.evidencias.id(evidenceId);
        if (!evidence) return res.status(404).json({ message: 'Evidencia no encontrada.' });

        //Validaciones
        // Validar si la evidencia ya fue aprobada o rechazada
        if (evidence.estado_validacion && evidence.estado_validacion !== 'Pendiente') {
            return res.status(400).json({ message: 'La evidencia ya fue validada. No puedes realizar esta acción nuevamente.' });
        }
        // Validar si el nuevo estado es el mismo que el actual (evitar duplicados)
        if (evidence.estado_validacion === estado_validacion) {
            return res.status(400).json({ message: `La evidencia ya está ${estado_validacion.toLowerCase()}. No puedes volver a realizar esta acción.` });
        }

        // Actualizar estado y comentarios
        evidence.estado_validacion = estado_validacion;
        evidence.comentario_retroalimentacion = comentario_retroalimentacion;

        // Guardar la tarea con la evidencia actualizada
        await task.save();

        // Revisa si todas las evidencias están aprobadas
        const todasAprobadas = task.evidencias.every(ev => ev.estado_validacion === 'Aprobada');

        if (todasAprobadas) {
            // Cambiar el estado de la tarea a "Validada"
            task.estado_tarea = 'Validada';

            // Asignar puntos al usuario
            const user = await User.findById(task.id_usuario);
            if (user) {
                const puntosAsignados = task.puntos_asignados || 10;

                // Sumar puntos acumulados
                user.puntos_acumulados += puntosAsignados;

                // Actualizar historial de puntos mensuales
                const fechaActual = new Date();
                const mesActual = fechaActual.getMonth() + 1;
                const añoActual = fechaActual.getFullYear();

                const historial = user.historial_puntos.find(h => h.mes === mesActual && h.año === añoActual);
                if (historial) {
                    historial.puntos += puntosAsignados;
                } else {
                    user.historial_puntos.push({
                        mes: mesActual,
                        año: añoActual,
                        puntos: puntosAsignados,
                    });
                }

                // Guardar usuario con puntos actualizados
                await user.save();

                // Asignar logros al usuario
                await asignarLogros(user._id);

                // Crear y enviar la notificación (solo una vez)
                const mensajeNotificacion = {
                    titulo: 'Tarea Validada',
                    descripcion: `Todas las evidencias de la tarea "${task.nombre}" han sido aprobadas.`,
                    fecha: new Date(),
                };

                user.notificaciones.push(mensajeNotificacion);

                if (user.fcmToken) {
                    await enviarNotificacionPush({
                        token: user.fcmToken,
                        title: mensajeNotificacion.titulo,
                        body: mensajeNotificacion.descripcion,
                    });
                }

                // Guardar los cambios en el usuario
                await user.save();
            }
        }
        // Guardar los cambios en la tarea
        await task.save();

        res.status(200).json({ message: 'Evidencia actualizada con éxito.', evidence });
    } catch (error) {
        console.error('Error al actualizar evidencia:', error);
        res.status(500).json({ message: 'Error al actualizar evidencia.', error });
    }
};


// Leer evidencias de una tarea
exports.getEvidences = async (req, res) => {
    const { taskId } = req.params; // Usar el nombre correcto
    try {
        const task = await Task.findById(taskId).populate('id_usuario', 'nombre correo');
        if (!task) {
            return res.status(404).json({ message: 'Tarea no encontrada.' });
        }

        res.status(200).json(task.evidencias); // Devolver solo las evidencias
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las evidencias.', error });
    }
};


// Eliminar evidencia de una tarea
exports.deleteEvidence = async (req, res) => {
    const { taskId, evidenceId } = req.params;
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Tarea no encontrada.' });
        }

        // Filtrar para eliminar la evidencia
        task.evidencias = task.evidencias.filter(evidence => evidence._id.toString() !== evidenceId);
        await task.save();

        res.status(200).json({ message: 'Evidencia eliminada con éxito.', task });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la evidencia.', error });
    }
};

// Obtener todas las evidencias organizadas por tarea
exports.getAllEvidences = async (req, res) => {
    try {
        // Buscar todas las tareas con sus evidencias
        const tasks = await Task.find()
            .populate('id_usuario', 'nombre correo') // datos del usuario relacionado
            .select('nombre evidencias id_usuario'); //  nombre de tarea, usuario y evidencias

        res.status(200).json(tasks); // Devolver las tareas con sus evidencias
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener todas las evidencias.', error });
    }
};


//FALTA RUTAS (Todavia no se en que usalo es solo sumar puntos tanto en el acumulado como en el actual historial mensual)
// -------------------------addPoints-----------------------------------
exports.addPoints = async (req, res) => {
    const { userId } = req.params;
    const { puntos_obtenidos } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        // Obtener el mes y el año actuales
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1; // Mes actual (1-12)
        const añoActual = fechaActual.getFullYear();  // Año actual

        // Buscar o crear el registro del historial para el mes actual
        const historial = user.historial_puntos.find(
            (entry) => entry.mes === mesActual && entry.año === añoActual
        );

        if (historial) {
            // Si ya existe el registro mensual, sumar los puntos
            historial.puntos += puntos_obtenidos;
        } else {
            // Si no existe, crear un nuevo registro mensual
            user.historial_puntos.push({
                mes: mesActual,
                año: añoActual,
                puntos: puntos_obtenidos,
            });
        }

        // Actualizar los puntos acumulados
        user.puntos_acumulados += puntos_obtenidos;

        await user.save();
        res.status(200).json({ message: 'Puntos agregados correctamente.', user });
    } catch (error) {
        console.error('Error al agregar puntos:', error);
        res.status(500).json({ message: 'Error al agregar puntos.', error });
    }
};
