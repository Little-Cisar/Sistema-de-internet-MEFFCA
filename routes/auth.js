const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Tu conexión a PostgreSQL
require('dotenv').config();

const router = express.Router();

// CU-04: Registrar usuario
router.post('/registro', async (req, res) => {
    try {
        const { email, password, rol } = req.body;

        // Validar que el rol sea uno de los permitidos (o Cliente por defecto)
        const rolUsuario = rol || 'Cliente';

        // Verificar si el usuario ya existe
        const usuarioExistente = await pool.query('SELECT * FROM USUARIOS WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({ mensaje: 'La cuenta ya está registrada' });
        }

        // Generar hash seguro de la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Guardar el nuevo usuario en PostgreSQL
        const nuevoUsuario = await pool.query(
            'INSERT INTO USUARIOS (email, password_hash, rol) VALUES ($1, $2, $3) RETURNING id_usuario, email, rol',
            [email, passwordHash, rolUsuario]
        );

        res.status(201).json({ 
            mensaje: 'Usuario registrado correctamente',
            usuario: nuevoUsuario.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al registrar usuario' });
    }
});

// CU-05: Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar el registro en PostgreSQL
        const usuario = await pool.query('SELECT * FROM USUARIOS WHERE email = $1', [email]);
        if (usuario.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        // Verificar hash de contraseña con bcrypt
        const contraseñaCorrecta = await bcrypt.compare(password, usuario.rows[0].password_hash);
        if (!contraseñaCorrecta) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        // Generar token de sesión JWT con rol y expiración
        const token = jwt.sign(
            { 
                id_usuario: usuario.rows[0].id_usuario, 
                rol: usuario.rows[0].rol 
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // El token dura 2 horas
        );

        res.status(200).json({
            mensaje: 'Autenticación exitosa',
            token: token,
            rol: usuario.rows[0].rol
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al iniciar sesión' });
    }
});

module.exports = router;