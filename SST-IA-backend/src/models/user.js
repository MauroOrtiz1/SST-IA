const mongoose = require('mongoose');

// Subdocumento para el historial de puntos
const historialSchema = new mongoose.Schema({
    mes: { type: Number, required: true }, // Mes (1-12)
    año: { type: Number, required: true }, // Año
    puntos: { type: Number, default: 0 }, // Puntos obtenidos en ese mes
});

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    contraseña: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    telefono: { type: String, required: true, unique: true },
    area: { type: String, required: true },
    puntos_acumulados: { type: Number, default: 0 },
    logros_desbloqueados: [
        {
            id_logro: { type: mongoose.Schema.Types.ObjectId, ref: 'Logro' },
            nombre_logro: { type: String }, // Guardamos el nombre directamente
            fecha_desbloqueo: { type: Date, default: Date.now },
        },
    ],
    notificaciones: [
        {
            titulo: { type: String, required: true },
            descripcion: { type: String, required: true },
            fecha: { type: Date, default: Date.now },
        },
    ],
    historial_puntos: [historialSchema], // Historial mensual de puntos
    fcmToken: { type: String }, // Alamcenamiento del token FCM (La funcion para actualziarlo es: '/api/users/update-token')
    rol: {
        type: String,
        enum: ["Admin", "Trabajador", "SST"], // Valores permitidos
        default: "Trabajador", 
    },
    resetToken: { type: String, default:'' }, // Token temporal para resetear contraseña
    resetTokenExpires: { type: Date }, // Fecha de expiración del token
});

module.exports = mongoose.model('User', userSchema);
