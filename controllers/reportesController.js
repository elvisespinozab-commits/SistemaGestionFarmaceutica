const sql = require("mssql");
const db = require("../config/db");

// =====================================
// RESUMEN GENERAL
// =====================================

const obtenerResumen = async (req, res) => {

    try {

        const pool = await db.poolPromise;

        const entradas = await pool.request().query(`
            SELECT COUNT(*) total
            FROM entradas
        `);

        const salidas = await pool.request().query(`
            SELECT COUNT(*) total
            FROM salidas
        `);

        const medicamentos = await pool.request().query(`
            SELECT COUNT(*) total
            FROM medicamentos
        `);

        const stockBajo = await pool.request().query(`
            SELECT COUNT(*) total
            FROM medicamentos
            WHERE stock<=stock_minimo
        `);

        res.json({

            entradas: entradas.recordset[0].total,
            salidas: salidas.recordset[0].total,
            medicamentos: medicamentos.recordset[0].total,
            stockBajo: stockBajo.recordset[0].total

        });

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

};

// =====================================
// MOVIMIENTOS
// =====================================

const obtenerMovimientos = async (req, res) => {

    try {

        const pool = await db.poolPromise;

        const consulta = await pool.request().query(`

SELECT

e.id_entrada id,
'Entrada' tipo,
e.fecha,
m.codigo,
m.nombre medicamento,
e.cantidad,
u.usuario,
e.observacion

FROM entradas e

INNER JOIN medicamentos m
ON e.id_medicamento=m.id_medicamento

LEFT JOIN Usuarios u
ON e.id_usuario=u.id_usuario

UNION ALL

SELECT

s.id_salida,
'Salida',
s.fecha,
m.codigo,
m.nombre,
s.cantidad,
u.usuario,
s.observacion

FROM salidas s

INNER JOIN medicamentos m
ON s.id_medicamento=m.id_medicamento

LEFT JOIN Usuarios u
ON s.id_usuario=u.id_usuario

ORDER BY fecha DESC

`);

        res.json(consulta.recordset);

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

};

// =====================================
// STOCK BAJO
// =====================================

const obtenerStockBajo = async (req, res) => {

    try {

        const pool = await db.poolPromise;

        const consulta = await pool.request().query(`

SELECT

codigo,
nombre,
stock,
stock_minimo

FROM medicamentos

WHERE stock<=stock_minimo

ORDER BY stock

`);

        res.json(consulta.recordset);

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

};

// =====================================
// GRAFICO ENTRADAS
// =====================================

const graficoEntradas = async (req, res) => {

    try {

        const pool = await db.poolPromise;

        const consulta = await pool.request().query(`

SELECT

MONTH(fecha) mes,
SUM(cantidad) total

FROM entradas

GROUP BY MONTH(fecha)

ORDER BY mes

`);

        res.json(consulta.recordset);

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

};

// =====================================
// GRAFICO SALIDAS
// =====================================

const graficoSalidas = async (req, res) => {

    try {

        const pool = await db.poolPromise;

        const consulta = await pool.request().query(`

SELECT

MONTH(fecha) mes,
SUM(cantidad) total

FROM salidas

GROUP BY MONTH(fecha)

ORDER BY mes

`);

        res.json(consulta.recordset);

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

};

// =====================================
// GRAFICO CATEGORIAS
// =====================================

const graficoCategorias = async (req, res) => {

    try {

        const pool = await db.poolPromise;

        const consulta = await pool.request().query(`

SELECT

c.nombre categoria,
COUNT(*) total

FROM medicamentos m

INNER JOIN categorias c
ON m.id_categoria=c.id_categoria

GROUP BY c.nombre

ORDER BY total DESC

`);

        res.json(consulta.recordset);

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

};

module.exports = {

    obtenerResumen,
    obtenerMovimientos,
    obtenerStockBajo,
    graficoEntradas,
    graficoSalidas,
    graficoCategorias

};