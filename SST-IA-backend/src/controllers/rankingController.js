// controllers/rankingController.js
const User = require('../models/user');
const mongoose = require('mongoose');

// Obtener el ranking mensual actual
exports.getCurrentMonthlyRanking = async (req, res) => {
    try {
        // Obtener el mes y año actuales
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1; // Meses: 0-11, sumamos 1 para que sea 1-12
        const añoActual = fechaActual.getFullYear();

        // Obtener todos los usuarios
        const usuarios = await User.find();  

        // Calcular los puntos mensuales de cada usuario
        const ranking = usuarios
            .map((usuario) => {
                // Buscar los puntos del historial que coincidan con el mes y año actuales
                const historialMes = usuario.historial_puntos.find(
                    (entry) => entry.mes === mesActual && entry.año === añoActual
                );

                return {
                    nombre: usuario.nombre,
                    puntos: historialMes ? historialMes.puntos : 0, // Si no tiene puntos, asignar 0
                };
            })
            .sort((a, b) => b.puntos - a.puntos); // Ordenar el ranking por puntos en orden descendente

        // Asignar posición en el ranking
        const rankingConPosiciones = ranking.map((usuario, index) => ({
            posicion: index + 1, // Posición en el ranking (1-indexed)
            nombre: usuario.nombre,
            puntos: usuario.puntos,
        }));

        // Respuesta incluyendo el mes y el año
        res.status(200).json({
            mes: mesActual,
            año: añoActual,
            ranking: rankingConPosiciones,
        });
    } catch (error) {
        console.error('Error al obtener el ranking mensual:', error);
        res.status(500).json({ message: 'Error al obtener el ranking mensual.', error });
    }
};


// Obtener ranking global
exports.getRanking = async (req, res) => {
    try {
        // Obtener el Top 10 del ranking
        const users = await User.find()
            .sort({ puntos_acumulados: -1 })
            .select('_id nombre puntos_acumulados')
            .limit(10)
            .lean();
        // Asignar posiciones en el ranking
        const ranking = users.map((user, index) => ({
            posicion: index + 1,
            nombre: user.nombre,
            puntos_acumulados: user.puntos_acumulados,
        }));

        res.status(200).json(ranking);
    } catch (error) {
        console.error('Error al obtener el ranking global:', error);
        res.status(500).json({ message: 'Error al obtener el ranking global.', error });
    }
};

//

// Obtener ranking globak con la posición de un usuario específico (Maximo Top 10)
exports.getRankingWithUserPosition = async (req, res) => {
    const { userId } = req.params; 
    try {
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Formato de userId inválido.' });
        }
        // Obtener el Top 10 del ranking
        const users = await User.find()
            .sort({ puntos_acumulados: -1 })
            .select('_id nombre puntos_acumulados') // Seleccionar solo los campos relevantes
            .limit(10)
            .lean();
        // Asignar posiciones en el ranking
        const ranking = users.map((user, index) => ({
            _id: user._id.toString(),
            posicion: index + 1,
            nombre: user.nombre,
            puntos_acumulados: user.puntos_acumulados,
        }));

        // Verificar si el usuario está en el Top 10
        const userInTop10 = ranking.find((user) => user._id === userId);

        // Si no está en el Top 10, devolver un mensaje claro, este es para no hacer uana busqueda completa de usuarios en la base de datos
        let userOutsideRanking = null;
        if (!userInTop10) {
            console.log('Usuario no encontrado en el Top 10.');
            userOutsideRanking = "Estás fuera del Ranking de los primeros 10 usuarios.";
        }

        /*// Si no está en el Top 10, buscar al usuario fuera del ranking, busca entre todos los usuarios, mucha carga para la BD
        let userOutsideRanking = null;
        if (!userInTop10) {
            console.log('Usuario no encontrado en el Top 10, buscando posición completa...');

            // Buscar al usuario en toda la colección
            const user = await User.findById(userId).select('_id nombre puntos_acumulados').lean();
            if (user) {
                const totalUsers = await User.countDocuments();
                userOutsideRanking = {
                    posicion: totalUsers,
                    nombre: user.nombre,
                    puntos_acumulados: user.puntos_acumulados,
                };
                console.log('Usuario encontrado fuera del Top 10:', userOutsideRanking);
            } else {
                console.log('Usuario no encontrado en la base de datos.');
            }
        } else {
            console.log('Usuario encontrado en el Top 10:', userInTop10);
        }*/

        res.status(200).json({ ranking, userPositionLimit10: userInTop10 || userOutsideRanking });
    } catch (error) {
        console.error('Error al obtener el ranking con posición del usuario:', error);
        res.status(500).json({ message: 'Error al obtener el ranking con posición del usuario.', error });
    }
};

//
exports.getUserMonthlyRankingPosition = async (req, res) => {
    const { userId } = req.params; // Leer `userId` desde la ruta
    try {
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Formato de userId inválido.' });
        }

        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1; 
        const añoActual = fechaActual.getFullYear();

        const usuarios = await User.find();

        const ranking = usuarios.map((usuario) => {
            const historialMes = usuario.historial_puntos.find(
                (entry) => entry.mes === mesActual && entry.año === añoActual
            );

            return {
                nombre: usuario.nombre,
                puntos_acumulados: historialMes ? historialMes.puntos : 0
            };
        });

        // Ordenar el ranking por puntos acumulados
        ranking.sort((a, b) => b.puntos_acumulados - a.puntos_acumulados);

        // Asignar posición a cada usuario
        ranking.forEach((user, index) => {
            user.posicion = index + 1;
        });

        // Verificar si el usuario está en el Top 10
        const usuarioEnTop10 = ranking.slice(0, 10).find((user, index) => {
            const usuario = usuarios[index];
            return usuario._id.toString() === userId;
        });

        // Si no está en el Top 10, buscar la posición global
        let usuarioFueraDelTop10 = null;
        if (!usuarioEnTop10) {
            const usuarioGlobal = ranking.find((user, index) => {
                const usuario = usuarios[index];
                return usuario._id.toString() === userId;
            });
            if (usuarioGlobal) {
                usuarioFueraDelTop10 = {
                    posicion: usuarioGlobal.posicion,
                    nombre: usuarioGlobal.nombre,
                    puntos_acumulados: usuarioGlobal.puntos_acumulados
                };
            } else {
                return res.status(404).json({ message: 'Usuario no encontrado en el ranking.' });
            }
        }

        res.status(200).json({
            message: 'Ranking mensual y posición del usuario.',
            mes: mesActual,
            año: añoActual,
            ranking: ranking.slice(0, 10), // Top 10 del ranking
            posicionUsuario: usuarioEnTop10 || usuarioFueraDelTop10 
        });
    } catch (error) {
        console.error('Error al obtener el ranking mensual:', error);
        res.status(500).json({ message: 'Error al obtener el ranking mensual.', error });
    }
};

