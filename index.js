const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON

// Prueba de que el servidor funciona
app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor del MEFCCA funcionando correctamente' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});