const app = require('./app'); // Carga app.js
const PORT = process.env.PORT || 3000;
//const { authenticate } = require('./middlewares/auth');
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
