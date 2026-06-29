const sql = require("mssql");

const config = {
    user: "farmacia_app",
    password: "Farmacia2026!",

    server: "localhost\\SQLEXPRESS",

    database: "sistema",

    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function conectar() {
    try {
        await sql.connect(config);
        console.log("✅ SQL Server conectado correctamente");
    } catch (error) {
        console.log("❌ Error al conectar");
        console.log(error);
    }
}

module.exports = {
    sql,
    config,
    conectar
};