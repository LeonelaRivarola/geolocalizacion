const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const sql = require("mssql");

//conecto con la bd
const dbSettings = {
  user: "geacor",
  password: "gr24eo",
  server: "gea_pico",
  database: "GeaCorpico",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectionTimeout: 60000,
    requestTimeout: 60000,
  },
  pool: {
    idleTimeoutMillis: 300000,
    max: 1,
  },
};

// Crear la conexión al pool
const pool = new sql.ConnectionPool(dbSettings);

// Conexión a la base de datos
async function connectToDatabase() {
  try {
    await pool.connect();
    console.log("Conexión a la base de datos establecida");
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error.message);
  }
}

// Conectar al iniciar el servidor
connectToDatabase();


// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());

// Servir archivos estáticos (tu HTML y otros archivos)
app.use(express.static("public"));

// Ruta para actualizar la ubicación
app.post("/update-location", async (req, res) => {
  let { id, lat, lng } = req.body;

  // if (!id || isNaN(lat) || isNaN(lng)) {
  //   return res.status(400).json({ success: false, message: "Datos no válidos para actualizar la ubicación" });
  // }

  const query = `
    MERGE INTO SUMINISTRO AS target
    USING (VALUES (@id, @lat, @lng)) AS source (SUM_CLIENTE, SUM_LATITUD, SUM_LONGITUD)
    ON target.SUM_CLIENTE = source.SUM_CLIENTE
    WHEN MATCHED THEN
      UPDATE SET SUM_LATITUD = source.SUM_LATITUD, SUM_LONGITUD = source.SUM_LONGITUD;
  `;
  
  try {
    const request = pool.request();
    request.input("id", sql.Int, id);
    request.input("lat", sql.Float, lat);
    request.input("lng", sql.Float, lng);

    await request.query(query);
    console.log(`Ubicación actualizada correctamente para el ID ${id}`);
    res.json({ success: true, message: "Ubicación actualizada correctamente" });
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
    res.status(500).json({ success: false, message: "Error al actualizar la ubicación" });
  }
});



// Ruta para obtener los datos de una ubicación específica
app.get("/get-location/:id", async (req, res) => {
  const locationId = req.params.id;

  // Consulta a la base de datos para obtener los detalles de la ubicación
  let query = `
    SELECT 
      SUM_CLIENTE AS cliente, 
      SUM_LATITUD AS lat, 
      SUM_LONGITUD AS lng,
      CONCAT(
          RTRIM(LTRIM(SUM_CALLE)), ' ',
          CASE
              WHEN ISNULL(SUM_ALTURA, '') = '' THEN '' 
              ELSE RTRIM(LTRIM(SUM_ALTURA)) + ''
          END,
          CASE 
              WHEN ISNULL(SUM_PISO, '') <> '' THEN CONCAT('P', RTRIM(LTRIM(SUM_PISO))) 
              ELSE '' 
          END, 
          CASE 
              WHEN ISNULL(SUM_DEPARTAMENTO, '') <> '' THEN CONCAT('D', RTRIM(LTRIM(SUM_DEPARTAMENTO))) 
              ELSE '' 
          END,
          ' ',
          SUM_ANEXO
      ) AS direccion,
      CLI_TITULAR AS titular,
      SUM_ID AS sumin
    FROM SUMINISTRO
    JOIN CLIENTE ON SUM_CLIENTE = CLI_ID
    WHERE SUM_CLIENTE = @locationId;
  `;

  try {
    const request = pool.request();
    request.input("locationId", sql.Int, locationId);

    const result = await request.query(query);

    console.log("Resultados de la consulta:", result.recordset); // <-- Aquí ves los datos


    if (result.recordset.length > 0) {
      const location = result.recordset[0];

      res.json({ success: true, location });
    } else {
      res.status(404).json({ success: false, message: "Ubicación no encontrada" });
    }
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
    res.status(500).json({ success: false, message: "Error al obtener la ubicación" });
  }
});

app.get("/test-query", async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.query("SELECT TOP 10 * FROM SUMINISTRO"); 
    console.log("Datos obtenidos:", result.recordset);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error en la prueba de consulta:", error);
    res.status(500).json({ success: false, message: "Error en la consulta de prueba" });
  }
});


// Ruta para obtener las ubicaciones de una ruta específica
app.get('/get-locations', async (req, res) => {
  const ruta = req.query.ruta;  // Obtener el parámetro 'ruta' de la URL
  const singeo = req.query.singeo;

  if (!ruta) {
    return res.status(400).json({ error: 'Ruta es requerida' });
  }


  let query = `
    SELECT 
      SUM_CLIENTE,
      SUM_ID,
      SUM_LATITUD,
      SUM_LONGITUD ,
      LEFT(
        RTRIM(LTRIM(SUM_CALLE)) 
        + ' ' + RTRIM(LTRIM(ISNULL(SUM_ALTURA, ''))) 
        + ' ' + 
        CASE 
          WHEN ISNULL(SUM_PISO, '') <> '' THEN 'P' + RTRIM(LTRIM(SUM_PISO)) 
          ELSE '' 
        END 
        + CASE 
          WHEN ISNULL(SUM_DEPARTAMENTO, '') <> '' THEN 'D' + RTRIM(LTRIM(SUM_DEPARTAMENTO)) 
          ELSE '' 
        END 
        + ' ' + ISNULL(SUM_ANEXO, ''), 45
      ) AS DIRECCION,
      CLI_TITULAR,
      SUM_CALLE,
      SUM_ALTURA,
      LOC_DESCRIPCION,
      SUM_ORDEN_LECTURA
    FROM 
      SUMINISTRO
      JOIN SUMINISTRO_TIPO_EMPRESA ON STE_CLIENTE = SUM_CLIENTE AND STE_SUMINISTRO = SUM_ID AND STE_TIPO_EMPRESA = 3
      JOIN LOCALIDAD ON LOC_ID = SUM_LOCALIDAD
      JOIN CLIENTE ON SUM_CLIENTE = CLI_ID
    WHERE 
      ISNULL(SUM_RUTA, 0) = @ruta  -- Usamos el parámetro de la ruta
      AND (SUM_FACTURABLE = 'S' OR STE_ESTADO_OPE = 46)
  `;

  //si el parametro es 1 agregamos el filtro
  if(singeo === '1'){
    query += "AND (SUM_LATITUD = 0 OR SUM_LATITUD IS NULL)";
  }

  try {
    const request = pool.request();
    request.input("ruta", sql.Int, ruta); // Pasar el parámetro "ruta" como entero

    const result = await request.query(query);
    res.json({ success: true, locations: result.recordset });
  } catch (err) {
    console.error("Error al ejecutar la consulta:", err);
    res.status(500).json({ success: false, message: "Error al consultar las ubicaciones" });
  }
});



// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
