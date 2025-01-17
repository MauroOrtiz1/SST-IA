const { check } = require('express-validator');

exports.registerValidator = [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('correo', 'Por favor, incluye un correo válido')
        .isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        }),
    check('contraseña', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('telefono', 'El teléfono es obligatorio').not().isEmpty(),
    check('telefono', 'El teléfono debe ser numérico').isNumeric(),
    check('area', 'El área es obligatoria').not().isEmpty(),
    check('rol', 'El rol es obligatorio').not().isEmpty(),
    check('rol', 'El rol debe ser uno de los valores permitidos: Admin, Trabajador, SST')
        .isIn(['Admin', 'Trabajador', 'SST']),
];

exports.loginValidator = [
    check('correo', 'Por favor, incluye un correo válido')
        .isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        }),
    check('contraseña', 'La contraseña es obligatoria').not().isEmpty(),
];
