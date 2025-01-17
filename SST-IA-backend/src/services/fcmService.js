const { getMessaging } = require('firebase-admin/messaging');

/**
 * Función para enviar notificaciones push mediante FCM con manejo robusto de errores.
 */
const enviarNotificacionPush = async ({ token, title, body = "", data = {} }) => {
    if (!token) {
        console.warn('El usuario no tiene un token FCM registrado. Notificación no enviada.');
        return;
    }

    const message = {
        notification: {
            title,
            body,
        },
        token,
        data,
    };

    try {
        // Enviar mensaje con tiempo de espera (timeout)
        await Promise.race([
            getMessaging().send(message),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout en Firebase')), 5000)),
        ]);

        console.log('Notificación push enviada con éxito.');
    } catch (error) {
        console.error('Error al enviar notificación push:', error.message);

        // Manejo de errores específicos de Firebase Messaging
        if (error.code) {
            switch (error.code) {
                case 'messaging/invalid-registration-token':
                    console.warn('El token FCM es inválido. Podrías considerar eliminarlo de la base de datos.');
                    break;
                case 'messaging/registration-token-not-registered':
                    console.warn('El token FCM no está registrado. Considera notificar al usuario o eliminarlo.');
                    break;
                default:
                    console.error('Error desconocido al enviar notificación:', error.code);
            }
        } else {
            // Log para errores genéricos (como el timeout)
            console.error('Error genérico al enviar notificación:', error);
        }
    }
};

module.exports = enviarNotificacionPush;
