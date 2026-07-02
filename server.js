const express = require("express");
const path = require("path");

const { conectar } = require("./config/db");

// Importar rutas
const loginRoutes = require("./routes/loginRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});