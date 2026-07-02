const express = require("express");
const path = require("path");

const { conectar } = require("./config/db");

// Importar rutas
const loginRoutes = require("./routes/loginRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
// Si tienes configurados los archivos en tu carpeta routes, puedes importarlos aquí:
// const medicamentosRoutes = require("./routes/medicamentosRoutes");
// const inventarioRoutes = require("./routes/inventarioRoutes");

const app = express();

const PORT = 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a SQL Server
conectar();

// Ruta principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Rutas del sistema
app.use("/", loginRoutes);
app.use("/", dashboardRoutes);

app.get("/dashboard",(req,res)=>{
    res.sendFile(path.join(__dirname,"views","dashboard.html"));
});

// Ruta de inventario
app.get("/inventario", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "inventario.html"));
});

// ---> ¡NUEVO! Ruta de medicamentos (Esto es lo que faltaba) <---
app.get("/medicamentos", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "medicamentos.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});