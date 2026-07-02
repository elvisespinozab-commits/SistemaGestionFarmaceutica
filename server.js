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

// NUEVAS RUTAS (reportes y register)
const reportesRoutes = require("./routes/reportesRoutes");
const registerRoutes = require("./routes/registerRoutes");

// =====================
// APP
// =====================

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
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

// =====================
// RUTAS API
// =====================

app.use("/", loginRoutes);
app.use("/", dashboardRoutes);
app.use("/", inventarioRoutes);
app.use("/", usuarioRoutes);
app.use("/", medicamentosRoutes);
app.use("/", categoriasRoutes);

// NUEVAS RUTAS API
app.use("/", reportesRoutes);
app.use("/", registerRoutes);

// =====================
// VISTAS
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
// MEDICAMENTOS
// =====================

app.get("/registrar-medicamento", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "medicamentos.html"));
});

app.get("/lista-medicamentos", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "lista-medicamentos.html"));
});

// =====================
// CATEGORÍAS
// =====================

app.get("/categorias", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "categorias.html"));
});

// =====================
// NUEVAS VISTAS
// =====================

// Registro de usuario
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

// Reportes
app.get("/reportes", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "reportes.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});