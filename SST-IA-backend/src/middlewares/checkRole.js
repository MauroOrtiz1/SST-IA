
//-----------Verifica si el rol del usuario autenticado es válido para la acción solicitada--------------
exports.checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        const { rol } = req.user; // `req.user` viene del middleware de autenticación JWT

        if (!rolesPermitidos.includes(rol)) {
            return res.status(403).json({ message: 'No tienes permiso para acceder a esta ruta.' });
        }

        next();
    };
};
