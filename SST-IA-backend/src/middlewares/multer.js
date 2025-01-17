const multer = require('multer');

const storage = multer.memoryStorage(); // Para almacenar archivos en memoria y enviarlos a Firebase
const upload = multer({ storage });

module.exports = { upload };
