const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const config = require('../config/config');

//Registro
exports.register = async (req, res) => {
    const { nombre, correo, contraseña, telefono, area, rol } = req.body;

    try {
        // Cifrar la contraseña con bcrypt
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // Obtener el mes y el año actuales
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1;
        const añoActual = fechaActual.getFullYear();

        // Crear un nuevo usuario con la contraseña cifrada
        const newUser = new User({
            nombre,
            correo,
            contraseña: hashedPassword,
            telefono,
            area,
            rol,
            logros_desbloqueados: [],
            notificaciones: [],
            historial_puntos: [{ mes: mesActual, año: añoActual, puntos: 0 }],
        });

        await newUser.save();

        console.log("Usuario creado con éxito:", newUser);
        res.status(201).json({ message: 'Usuario creado con éxito', user: newUser });
    } catch (error) {
        console.error("Error en el registro del usuario:", error);

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Correo o teléfono ya registrado.' });
        }
        res.status(500).json({ message: 'Error al registrar usuario.', error });
    }
};


// Iniciar sesión:
exports.login = async (req, res) => {
    const { correo, contraseña } = req.body;
    try {
        const user = await User.findOne({ correo });
        if (!user) {
            return res.status(401).json({ message: 'Correo no registrado.' });
        }
        // Comparar contraseñas (bcrypt)
        const isMatch = await bcrypt.compare(contraseña, user.contraseña);
        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        // Generar un token JWT sin expiración 
        const token = jwt.sign(
            // JWT a : ID usuario, correo del usuario y el, Rol del usuario (Admin, Trabajador, SST)
            { id: user._id, correo: user.correo, rol: user.rol },
            process.env.JWT_SECRET || 'secret_key' // Clave secreta 
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso.', token,
            user: {
                id: user._id, nombre: user.nombre, correo: user.correo, telefono: user.telefono, area: user.area, rol: user.rol
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error });
    }
};


// Endpoints para el reseteo de la contraseña mediante correo:
exports.forgetPassword = async (req, res) => {
    try {
        const correo = req.body.correo; // Obtén el email del cuerpo de la solicitud
        const userData = await User.findOne({ correo });

        if (userData) {
            // Generar un token aleatorio
            const randomString = randomstring.generate();
            const expiresIn = new Date(Date.now() + 3600000); // Dato para la expiracion del token 1 hora desde ahora
            // Actualizar el usuario con el token generado
            await User.updateOne({ correo }, { $set: { resetToken: randomString, resetTokenExpires: expiresIn } });

            sendResetPasswordMail(userData.nombre, userData.correo, randomString);

            res.status(200).send({ message: "Correo de reseteo enviado. Revisa tu bandeja de entrada." });
        } else {
            res.status(200).send({ message: "Correo no encontrado." });
        }
    } catch (error) {
        res.status(400).send({ message: 'Error al solicitar el reseteo de contraseña.', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {

    try {
        const resetToken = req.query.resetToken;
        const tokenData = await User.findOne({
            resetToken,
            resetTokenExpires: { $gt: new Date() }, // Verifica que el token no esté expirado -> resetTokenExpires > new Date()
        });

        if (tokenData) {
            const { contraseña } = req.body;
            if (!contraseña || contraseña.length < 6) {
                return res.status(400).send({
                    success: false,
                    msg: "La nueva contraseña es requerida y debe tener al menos 6 caracteres."
                });
            }
            // Cifrar la nueva contraseña
            const nuevaContraseña = await securePassword(contraseña.toString());
            // Actualizar la contraseña del usuario y eliminar el token
            const userData = await User.findByIdAndUpdate(
                tokenData._id,
                {
                    $set: { contraseña: nuevaContraseña, resetToken: '', resetTokenExpires: null }
                },
                { new: true }
            );

            res.status(200).send({ success: true, msg: "Contraseña restablecida exitosamente.", data: userData });
        } else {
            res.status(400).send({ message: 'Enlace de reseteo inválido o expirado.' });
        }
    } catch (error) {
        res.status(400).send({ message: 'Error al restablecer la contraseña.', error: error.message });
    }

}
// Función para cifrar la contraseña en bcrypt
const securePassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// ----------------RESETEO DE CONTRASEÑA (envio al correo un token para resetearlo) ---->>> Cuando se instancie cambiar el direccionamiento a una con su dominio
const sendResetPasswordMail = async (name, email, token) => {
    try {
        // Configurar el transporte de nodemailer
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true para 465, false para otros puertos
            requireTLS: true,
            auth: {
                user: config.emailUser, // Reemplaza con tu correo
                pass: config.emailPassword, // Reemplaza con tu contraseña o clave de aplicación
            },
        });

        // AQUI SE CAMBIA EL DOMINIO (localhost POR -> EL DOMINIO)
        const resetUrl = `http://localhost:3000/api/auth/reset-password?resetToken=${token}`;
        // Configurar el contenido del correo
        const mailOptions = {
            from: config.emailUser, // Remitente
            to: email, // Destinatario
            subject: 'Restablecer contraseña',
            html: `<p>Hola ${name},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el enlace para continuar:</p>
                <a href="${resetUrl}">Restablecer contraseña</a>
                <p>Si no solicitaste esto, ignora este mensaje.</p>`,
        };

        // Enviar el correo
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.status(500).send({ message: 'Error al enviar correo de reseteo.' });
            } else {
                console.log("Correo enviado: ", info.response);
            }
        });
    } catch (error) {
        console.error('Error al enviar el correo:', error.message);
        throw new Error('No se pudo enviar el correo');
    }
};