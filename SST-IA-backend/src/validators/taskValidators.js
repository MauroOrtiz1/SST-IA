const { check, body } = require('express-validator');
const User = require('../models/user');

exports.createTaskValidator = [
    check('id_usuario', 'El ID de usuario es obligatorio y debe ser un ObjectId válido')
        .not()
        .isEmpty().withMessage('El ID de usuario no puede estar vacío.')
        .isMongoId()
        .bail()
        .custom(async (id) => {
            const userExists = await User.findById(id);
            if (!userExists) {
                throw new Error('El ID de usuario no existe en la base de datos.');
            }
            return true;
        }),
    check('nombre', 'El nombre de la tarea es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('puntos_asignados', 'Los puntos asignados son obligatorios y deben ser mayores a 0')
        .not()
        .isEmpty().withMessage('Los puntos asignados no pueden ser nulos.')
        .isInt({ gt: 0 }).withMessage('Los puntos asignados deben ser un número mayor a 0.'),
    check('latitud', 'La latitud debe ser un número válido')
        .optional()
        .isFloat(),
    check('longitud', 'La longitud debe ser un número válido')
        .optional()
        .isFloat(),
    body()
        .custom((value, { req }) => {
            if (req.body.latitud || req.body.longitud) {
                if (!req.body.nombre_cliente) {
                    throw new Error('El nombre del cliente es obligatorio si se proporcionan latitud o longitud.');
                }
            }
            return true;
        }),
];
