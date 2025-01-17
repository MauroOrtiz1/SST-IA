const mongoose = require('mongoose');
require('dotenv').config();

//Conexion con la BD localmente 
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Conexión a MongoDB establecida');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
