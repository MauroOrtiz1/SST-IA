const mongoose = require('mongoose');

const logroSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true }, // Breve descripción del logro

    /*icono: { type: String }, // URL para el ícono del logro
    categoria: { 
        type: String, 
        enum: [
            'Revisiones de Campo',
            'Seguridad en el Trabajo',
            'Aprendizaje y Mejora'
        ], 
        required: true 
    },*/

    criterios: {
        tareas_completadas: { type: Number, default: null }, // Cantidad de tareas específicas
        evidencias_aprobadas: { type: Number, default: null }, // Cantidad de evidencias aprobadas
        puntos_acumulados: { type: Number, default: null }, // Total de puntos necesarios
    },
});

module.exports = mongoose.model('Logro', logroSchema);
    