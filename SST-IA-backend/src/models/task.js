const mongoose = require('mongoose');

const evidenciaSchema = new mongoose.Schema({
    titulo: { type: String, required: true }, // Título de la evidencias (Subida por el trabajador)
    archivo: { type: String, required: true }, // URL del archivo
    comentario: { type: String, required: false }, // Comentario opcional
    fecha_envio: { type: Date, default: Date.now }, // Fecha de envío de la evidencia
    estado_validacion: { type: String, enum: ['Pendiente', 'Aprobada', 'Rechazada'], default: 'Pendiente' }, // Estado de la evidencia
    comentario_retroalimentacion: { type: String, required: false }, // Comentario sobre la validación
});

const formularioSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['ATS', 'IPERC', 'PET'], required: true },
    archivo: { type: String, required: true }, // URL pública del archivo Excel
    fecha_envio: { type: Date, default: Date.now }, 
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const taskSchema = new mongoose.Schema({
    id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nombre: { type: String, required: true }, 
    descripcion: { type: String, required: true }, 
    categoria: { type: String, required: false }, /// Tipo de esquema
    puntos_asignados: { type: Number, required: true, min: [1, 'Los puntos asignados deben ser mayores a 0.']  }, 
    estado_tarea: { type: String, enum: ['Pendiente', 'Completada', 'Validada'], default: 'Pendiente' }, 
    evidencias: [evidenciaSchema], // Lista de evidencias asociadas
    formularios: [formularioSchema], // Formularios ATS, IPERC, PET asociados a la tarea

    // direccion: 
    // Campos Para Mapas
    latitud: { type: Number, required: false },
    longitud: { type: Number, required: false },
    nombre_cliente: { type: String, required: false },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);

//Juntar mapas. 