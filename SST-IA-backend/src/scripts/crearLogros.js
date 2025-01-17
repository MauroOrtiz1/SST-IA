const mongoose = require('mongoose');
const Logro = require('../models/logro');

// URI de conexión corregida
mongoose.connect('mongodb://localhost:27017/MejicorpSST', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conexión exitosa a la base de datos.');
}).catch((err) => {
    console.error('Error al conectar a la base de datos:', err);
});

const logros = [];

// Logros por puntos acumulados
for (let i = 100; i <= 1000; i += 100) {
    logros.push({
        nombre: `Logro ${i} puntos`,
        descripcion: `Acumula ${i} puntos.`,
        criterios: {
            puntos_acumulados: i,
        },
    });
}

// Logros por tareas completadas
for (let i = 1; i <= 30; i += (i === 1 ? 4 : 5)) {
    logros.push({
        nombre: `Logro ${i} tareas completadas`,
        descripcion: `Completa ${i} tareas.`,
        criterios: {
            tareas_completadas: i,
        },
    });
}

// Logros por evidencias validadas  
for (let i = 1; i <= 30; i += (i === 1 ? 4 : 5)) {
    logros.push({
        nombre: `Logro ${i} evidencias validadas`,
        descripcion: `Valida ${i} evidencias.`,
        criterios: {
            evidencias_aprobadas: i,
        },
    });
}

// Función para cargar los logros
async function cargarLogros() {
    try {
        for (const logro of logros) {
            const existe = await Logro.findOne({
                'criterios.puntos_acumulados': logro.criterios.puntos_acumulados || null,
                'criterios.tareas_completadas': logro.criterios.tareas_completadas || null,
                'criterios.evidencias_aprobadas': logro.criterios.evidencias_aprobadas || null,
            });

            if (!existe) {
                await Logro.create(logro);
                console.log(`Logro creado: ${logro.nombre}`);
            } else {
                console.log(`Logro ya existe: ${logro.nombre}`);
            }
        }
        console.log('Carga de logros completada.');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error al cargar los logros:', error);
        mongoose.disconnect();
    }
}

cargarLogros();
