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


//-----------------GET--------------------------------------

// Ruta para la página de inicio
app.get("/GeolocalizarMapa", (req, res) => {
  res.sendFile(__dirname + "/public/geolocalizar.html"); // Asegúrate de que geolocalizar.html esté en la carpeta "public"
});

app.get("/GeolocalizarRutas", (req, res) => {
   res.sendFile(__dirname + "/public/RutasGeolocalizacion.html");
});


app.get("/GeolocalizarSup", (req, res) => {
  res.sendFile(__dirname + "/public/SupGeolocalizacion.html"); // Asegúrate de que geolocalizar.html esté en la carpeta "public"
});

app.get("/GeolocalizarRutasMapa", (req, res) => {
  const { ruta, singeo } = req.query;
  console.log(ruta, singeo);
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/GeolocalizarSupMapa", (req, res) => {
  const { ruta, singeo } = req.query;
  console.log(ruta, singeo);
  res.sendFile(__dirname + "/public/index.html");
});

// ----------------------------------POST--------------------------------------

// Ruta para actualizar la ubicación
app.post("/update-location", async (req, res) => {
  let { id, lat, lng, sumin } = req.body;

  if (!id || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, message: "Datos no válidos para actualizar la ubicación" });
  }
   
  let fixLat = parseFloat(lat).toFixed(7);
  let fixLng = parseFloat(lng).toFixed(7);

  const query = ``;

  try {
    const request = pool.request();
    request.input("id", sql.Int, id);
    request.input("lat", sql.Float, fixLat);
    request.input("lng", sql.Float, fixLng);
    request.input("sumin", sql.Int, sumin);

    console.log(new Date().toLocaleString().slice(0,24) + ` -- Actualizando ubicación cliente: ${id}, sumin: ${sumin}, lat: ${fixLat}, lng: ${fixLng}`);

    await request.query('UPDATE SUMINISTRO SET SUM_LATITUD = @lat, SUM_LONGITUD = @lng WHERE SUM_CLIENTE = @id AND SUM_ID = @sumin;');
    console.log(new Date().toLocaleString().slice(0,24) + ` -- Ubicación actualizada OK cliente: ${id}, sumin: ${sumin}`); 

    res.json({ success: true, message: "Ubicación actualizada correctamente" });
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
    res.status(500).json({ success: false, message: "Error al actualizar la ubicación" });
  }
});

// Ruta para obtener los datos de una ubicación específica
app.get("/get-location/:idcli/:idsum", async (req, res) => {
  const locIdCli = req.params.idcli;
  const locIdSum = req.params.idsum

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
    WHERE SUM_CLIENTE = @locIdCli and SUM_ID = @locIdSum;
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
  const ruta = req.query.ruta;
  const nsup = req.query.nsup;
  const singeo = req.query.singeo;

  if (!ruta && !nsup) {
    return res.status(400).json({ error: 'Ruta o SUP es requerida' });
  }

  let query = `
    SELECT
      SUM_CLIENTE,
      SUM_ID,
      SUM_LATITUD,
      SUM_LONGITUD,
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
      SUM_ANEXO,
      LOC_DESCRIPCION,
      SUM_ORDEN_LECTURA,
      LAT_DEF,
      LONG_DEF
    FROM
      SUMINISTRO
      JOIN SUMINISTRO_TIPO_EMPRESA ON STE_CLIENTE = SUM_CLIENTE AND STE_SUMINISTRO = SUM_ID AND STE_TIPO_EMPRESA = 3
      JOIN LOCALIDAD ON LOC_ID = SUM_LOCALIDAD
      JOIN CLIENTE ON SUM_CLIENTE = CLI_ID
  `;

  if (ruta) {
    query += `
      JOIN RUTAS_CENTRO_GEOGRAFICO ON RUT_GRUPO = ISNULL(SUM_GRUPO,0) AND RUT_ID = ISNULL(SUM_RUTA,0)
      WHERE
        ISNULL(SUM_RUTA, 0) = @ruta AND (SUM_FACTURABLE = 'S' OR STE_ESTADO_OPE = 46)
    `;
  } else if (nsup) {
    query += `
      JOIN SUB_UNIDAD_PROVEEDORA SUB ON SUB.SUP_EMPRESA = STE_EMPRESA AND SUB.SUP_UNIDAD_PROVEEDORA = STE_UNIDAD_PROVEEDORA AND SUB.SUP_ID = STE_SUB_UNIDAD_PROVEEDORA
      JOIN SUP_CENTRO_GEOGRAFICO SCG ON SCG.SUP_UNIDAD_PROVEEDORA = STE_UNIDAD_PROVEEDORA AND SCG.SUP_ID = STE_SUB_UNIDAD_PROVEEDORA
      WHERE
        ISNULL(SUB.SUP_DESCRIPCION,'') = @nsup AND (SUM_FACTURABLE = 'S' OR STE_ESTADO_OPE = 46)
    `;
  }

  // Filtrar por las coordenadas dependiendo del valor de singeo
  if (singeo === '0') {
    query += ` AND (SUM_LATITUD IS NOT NULL AND SUM_LATITUD != 0) AND (SUM_LONGITUD IS NOT NULL AND SUM_LONGITUD != 0)`;
  } else if (singeo === '1') {
    query += ` AND (SUM_LATITUD IS NULL OR SUM_LATITUD = 0) AND (SUM_LONGITUD IS NULL OR SUM_LONGITUD = 0)`;
  }

  try {
    const request = pool.request();
    if (ruta) {
      request.input("ruta", sql.Int, ruta);
    } else if (nsup) {
      request.input("nsup", sql.VarChar(30), nsup);
    }

    console.log("Consulta SQL:", query);
    console.log("Parámetros:", { ruta, nsup, singeo });

    const result = await request.query(query);
    res.json({ success: true, locations: result.recordset });
    console.log(new Date().toLocaleString().slice(0, 24) + ` -- Consulta RUTA ${ruta} SUB ${nsup} finalizada OK`);
  } catch (err) {
    console.error("Error al ejecutar la consulta:", err);
    res.status(500).json({ success: false, message: "Error al consultar las ubicaciones" });
  }
});



app.get('/get-route-coordinates', async (req, res) => {
  const ruta = req.query.ruta;

  if (!ruta) {
    return res.status(400).json({ error: 'Ruta es requerida' });
  }

  const query = `
    SELECT 
      RUT_GRUPO, 
      RUT_ID, 
      RUT_DESCRIPCION,
      (SELECT AVG(SUM_LATITUD) FROM SUMINISTRO WHERE SUM_RUTA = RUT_ID AND SUM_LATITUD <> 0) AS LAT_DEF,
      (SELECT AVG(SUM_LONGITUD) FROM SUMINISTRO WHERE SUM_RUTA = RUT_ID AND SUM_LONGITUD <> 0) AS LONG_DEF
    FROM RUTA 
    WHERE RUT_ID = @ruta
  `;

  try {
    const request = pool.request();
    request.input("ruta", sql.Int, ruta); // Pasar el parámetro "ruta" como entero


    const result = await request.query(query);

    if (result.recordset.length > 0) {
      let { LAT_DEF, LONG_DEF } = result.recordset[0];

      // Verificar si LAT_DEF y LONG_DEF son números válidos
      LAT_DEF = isNaN(LAT_DEF) ? 0 : LAT_DEF;
      LONG_DEF = isNaN(LONG_DEF) ? 0 : LONG_DEF;

      res.json({ success: true, latDef: LAT_DEF, lngDef: LONG_DEF });
    } else {
      res.status(404).json({ success: false, message: "Coordenadas no encontradas para la ruta" });
    }
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
    res.status(500).json({ success: false, message: "Error al obtener las coordenadas de la ruta" });
  }
});


app.get('/get-routes', async (req, res) => {

  const query = `
SELECT RUT_GRUPO,RUT_ID,RUT_DESCRIPCION,
SUM(CASE WHEN SUM_LATITUD IS NULL OR SUM_LATITUD = 0 OR SUM_LONGITUD IS NULL OR SUM_LONGITUD = 0 THEN 1 ELSE 0 END) AS sinGeolocalizar
FROM RUTA 
INNER JOIN SUMINISTRO ON SUM_GRUPO = RUT_GRUPO AND SUM_RUTA = RUT_ID 
INNER JOIN SUMINISTRO_TIPO_EMPRESA ON STE_EMPRESA = SUM_EMPRESA AND STE_CLIENTE = SUM_CLIENTE AND STE_SUMINISTRO = SUM_ID AND STE_TIPO_EMPRESA = 3 
WHERE SUM_FACTURABLE = 'S' OR STE_ESTADO_OPE = 46
GROUP BY RUT_GRUPO, RUT_ID, RUT_DESCRIPCION
ORDER BY RUT_GRUPO, RUT_ID
 `;

  try {
    const request = pool.request();
    const result = await request.query(query);

    // Asegúrate de enviar los datos correctamente
    res.json({
      success: true,
      routes: result.recordset // Aquí se asume que el resultado de la consulta es un array
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al consultar las rutas", error: error.message });
  }

});

app.get('/get-subestaciones', async (req, res) => {
  const query = `
SELECT 
  SUB.SUP_UNIDAD_PROVEEDORA,
  SUB.SUP_ID,
  SUB.SUP_DESCRIPCION,
  COUNT(CASE WHEN SUM_LATITUD IS NULL OR SUM_LATITUD = 0 OR SUM_LONGITUD IS NULL OR SUM_LONGITUD = 0 THEN 1 ELSE 0 END) AS sinGeolocalizar
FROM 
  SUB_UNIDAD_PROVEEDORA SUB
  INNER JOIN SUMINISTRO_TIPO_EMPRESA STE ON SUB.SUP_EMPRESA = STE_EMPRESA AND SUB.SUP_UNIDAD_PROVEEDORA = STE_UNIDAD_PROVEEDORA AND SUB.SUP_ID = STE_SUB_UNIDAD_PROVEEDORA
  INNER JOIN SUMINISTRO ON STE_CLIENTE = SUM_CLIENTE AND STE_SUMINISTRO = SUM_ID AND STE_TIPO_EMPRESA = 3
WHERE SUM_FACTURABLE = 'S' OR STE_ESTADO_OPE = 46
GROUP BY SUB.SUP_UNIDAD_PROVEEDORA, SUB.SUP_ID, SUB.SUP_DESCRIPCION
ORDER BY SUB.SUP_UNIDAD_PROVEEDORA, SUB.SUP_ID
  `;

  try {
      const request = pool.request();
      const result = await request.query(query);

      res.json({
          success: true,
          subestaciones: result.recordset
      });
  } catch (error) {
      res.status(500).json({ success: false, message: "Error al consultar las subestaciones", error: error.message });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
