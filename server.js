const express = require("express");
const path = require("path");

const { conectar } = require("./config/db");

// =====================
// Importar rutas
// =====================

const loginRoutes = require("./routes/loginRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const medicamentosRoutes = require("./routes/medicamentosRoutes");
const categoriasRoutes = require("./routes/categoriasRoutes");

const app = express();

const PORT = 3000;

// =====================
// Middleware
// =====================

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// Conexión a la base de datos
// =====================

conectar();

// =====================
// Página principal
// =====================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

// =====================
// Rutas API
// =====================

app.use("/", loginRoutes);
app.use("/", dashboardRoutes);
app.use("/", inventarioRoutes);
app.use("/", usuarioRoutes);
app.use("/", medicamentosRoutes);
app.use("/", categoriasRoutes);

// =====================
// Vistas
// =====================

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/inventario", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "inventario.html"));
});

app.get("/usuarios", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "usuarios.html"));
});

// =====================
// Módulo Medicamentos
// =====================

// Registrar medicamento
app.get("/registrar-medicamento", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "medicamentos.html"));
});

// Lista de medicamentos
app.get("/lista-medicamentos", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "lista-medicamentos.html"));
});

// Categorías
app.get("/categorias", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "categorias.html"));
});

// =====================
// Iniciar servidor
// =====================

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});