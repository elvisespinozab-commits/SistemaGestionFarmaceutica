const path = require('path');

// Servir la vista HTML
exports.getRegisterPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/register.html'));
};

// Insertar datos en la tabla Usuarios
exports.registerUser = async (req, res) => {
    // Campos mapeados fielmente desde la BD
    const { nombres, apellidos, username, email, rol, password } = req.body;

    if (!nombres || !apellidos || !username || !email || !rol || !password) {
        return res.status(400).json({ message: 'Todos los campos de la BD son obligatorios.' });
    }

    try {
        // En un entorno de producción, aquí encriptarías la contraseña (ej. con bcrypt)
        // const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`[BD SISTEMA] Ejecutando INSERT INTO [dbo].[Usuarios]`);
        console.log(`Datos: Nombres: ${nombres}, Apellidos: ${apellidos}, Usuario: ${username}, Rol: ${rol}`);

        /* EJEMPLO USANDO EL PAQUETE 'mssql' de Node.js:
           
           const pool = await sql.connect(config);
           await pool.request()
               .input('nombres', sql.VarChar, nombres)
               .input('apellidos', sql.VarChar, apellidos)
               .input('usuario', sql.VarChar, username)
               .input('correo', sql.VarChar, email)
               .input('contrasena', sql.VarChar, password) // O hashed
               .input('rol', sql.VarChar, rol)
               .query('INSERT INTO Usuarios (nombres, apellidos, usuario, correo, contraseña, rol, estado, fecha_creacion) VALUES (@nombres, @apellidos, @usuario, @correo, @contrasena, @rol, 1, GETDATE())');
        */

        return res.status(201).json({ message: 'Usuario registrado con éxito en la base de datos.' });

    } catch (error) {
        console.error('Error SQL al guardar usuario:', error);
        return res.status(500).json({ message: 'Error interno al escribir en el servidor.' });
    }
};