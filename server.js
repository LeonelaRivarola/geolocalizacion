const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql2");
const port = 3000;

// Array de ubicaciones simuladas
// const locations = [
//   {
//     SUM_ID: 1,
//     SUM_CLIENTE: 1,
//     SUM_LATITUD: -35.662923,
//     SUM_LONGITUD: -63.761380,
//     SUM_CALLE: 'Calle 11',
//     SUM_ALTURA: 341,
//     SUM_PISO: 2,
//     SUM_DEPARTAMENTO: 'D',
//     SUM_ANEXO: 'Anexo A',
//     SUM_RUTA: 20,
//     SUM_FACTURABLE: 'S',
//     SUM_ORDER_LECTURA: 1,
//     SUM_LOCALIDAD: 1,
//     SUM_GRUPO: 1
//   },
//   {
//     SUM_ID: 2,
//     SUM_CLIENTE: 2,
//     SUM_LATITUD: -35.662683,
//     SUM_LONGITUD: -63.761075,
//     SUM_CALLE: 'Calle 10',
//     SUM_ALTURA: 495,
//     SUM_PISO: 5,
//     SUM_DEPARTAMENTO: 'B',
//     SUM_ANEXO: 'Anexo B',
//     SUM_RUTA: 20,
//     SUM_FACTURABLE: 'S',
//     SUM_ORDER_LECTURA: 2,
//     SUM_LOCALIDAD: 2,
//     SUM_GRUPO: 1
//   },
//   {
//     SUM_ID: 3,
//     SUM_CLIENTE: 3,
//     SUM_LATITUD: -35.663196,
//     SUM_LONGITUD: -63.761983,
//     SUM_CALLE: 'Calle 11',
//     SUM_ALTURA: 300,
//     SUM_PISO: 3,
//     SUM_DEPARTAMENTO: 'A',
//     SUM_ANEXO: 'Anexo C',
//     SUM_RUTA: 20,
//     SUM_FACTURABLE: 'S',
//     SUM_ORDER_LECTURA: 3,
//     SUM_LOCALIDAD: 3,
//     SUM_GRUPO: 1
//   },
//   {
//     SUM_ID: 4,
//     SUM_CLIENTE: 4,
//     SUM_LATITUD: -35.663457,
//     SUM_LONGITUD: -63.760349,
//     SUM_CALLE: 'Avenida Libertador',
//     SUM_ALTURA: 4000,
//     SUM_PISO: 3,
//     SUM_DEPARTAMENTO: 'A',
//     SUM_ANEXO: 'Anexo D',
//     SUM_RUTA: 19,
//     SUM_FACTURABLE: 'S',
//     SUM_ORDER_LECTURA: 4,
//     SUM_LOCALIDAD: 1,
//     SUM_GRUPO: 2
//   },
//   {
//     SUM_ID: 5,
//     SUM_CLIENTE: 5,
//     SUM_LATITUD: -35.663655,
//     SUM_LONGITUD: -63.761391,
//     SUM_CALLE: 'Calle Falsa',
//     SUM_ALTURA: 123,
//     SUM_PISO: 5,
//     SUM_DEPARTAMENTO: 'B',
//     SUM_ANEXO: 'Anexo E',
//     SUM_RUTA: 19,
//     SUM_FACTURABLE: 'S',
//     SUM_ORDER_LECTURA: 5,
//     SUM_LOCALIDAD: 2,
//     SUM_GRUPO: 2
//   },
//   {
//     SUM_ID: 6,
//     SUM_CLIENTE: 6,
//     SUM_LATITUD: -35.663726,
//     SUM_LONGITUD: -63.761831,
//     SUM_CALLE: 'Avenida de Mayo',
//     SUM_ALTURA: 2000,
//     SUM_PISO: 2,
//     SUM_DEPARTAMENTO: 'C',
//     SUM_ANEXO: 'Anexo F',
//     SUM_RUTA: 19,
//     SUM_FACTURABLE: 'S',
//     SUM_ORDER_LECTURA: 6,
//     SUM_LOCALIDAD: 3,
//     SUM_GRUPO: 2
//   }
// ];

//conecto con la bd
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "geoclientes",
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar con la base de datos: ", err);
  } else {
    console.log("Conexion a la base de datos establecida");
  }
});

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(bodyParser.json());

// Servir archivos estáticos (tu HTML y otros archivos)
app.use(express.static("public"));

// Ruta para actualizar la ubicación
app.post("/update-location", (req, res) => {
  let { id, lat, lng } = req.body;

  if (!id || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, message: "Datos no válidos para actualizar la ubicación" });
  }

  const query = `
    INSERT INTO SUMINISTRO (SUM_CLIENTE, SUM_LATITUD, SUM_LONGITUD)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE 
        SUM_LATITUD = VALUES(SUM_LATITUD), 
        SUM_LONGITUD = VALUES(SUM_LONGITUD)
  `;
  
  db.query(query, [id, lat, lng, lat, lng], (err, result) => {
    if (err) {
      console.error("Error al ejecutar la consulta:", err);
      res.status(500).json({ success: false, message: "Error al actualizar la ubicación", error: err });
    } else {
      console.log(`Ubicación actualizada correctamente para el ID ${id}`);
      res.json({ success: true, message: "Ubicación actualizada correctamente" });
    }
  });
});



// Ruta para obtener los datos de una ubicación específica
app.get("/get-location/:id", (req, res) => {
  const locationId = req.params.id;

  // Consulta a la base de datos para obtener los detalles de la ubicación
  const query = `
    SELECT 
      SUM_CLIENTE AS cliente, 
      SUM_LATITUD AS lat, 
      SUM_LONGITUD AS lng,
      CONCAT(
          RTRIM(LTRIM(SUM_CALLE)), ' ',
          RTRIM(LTRIM(IFNULL(SUM_ALTURA, 0))), ' ',
          CASE 
              WHEN IFNULL(SUM_PISO, '') <> '' THEN CONCAT('P', RTRIM(LTRIM(SUM_PISO))) 
              ELSE '' 
          END, 
          CASE 
              WHEN IFNULL(SUM_DEPARTAMENTO, '') <> '' THEN CONCAT('D', RTRIM(LTRIM(SUM_DEPARTAMENTO))) 
              ELSE '' 
          END,
          ' ',
          SUM_ANEXO
      ) AS direccion,
      CLI_TITULAR AS titular,
      SUM_ORDER_LECTURA AS sumin
      
    FROM SUMINISTRO
    JOIN CLIENTE ON SUM_CLIENTE = CLI_ID
    WHERE SUM_CLIENTE = ?
  `;

  db.query(query, [locationId], (err, results) => {
    if (err) {
      console.error("Error al ejecutar la consulta:", err);
      return res.status(500).json({ success: false, message: "Error al obtener la ubicación" });
    }

    if (results.length > 0) {
      // Asegurarse de que lat y lng sean números
      const location = results[0];
      res.json({ success: true, location });
    } else {
      res.status(404).json({ success: false, message: "Ubicación no encontrada" });
    }
  });
});



// Ruta para obtener las ubicaciones de una ruta específica
app.get('/get-locations', (req, res) => {
  const ruta = req.query.ruta;  // Obtener el parámetro 'ruta' de la URL

  if (!ruta) {
    return res.status(400).json({ error: 'Ruta es requerida' });
  }


  // Filtrar las ubicaciones por la ruta
  const filteredLocations = locations.filter(location => location.SUM_RUTA === parseInt(ruta));

  // Verificar si hay ubicaciones para la ruta especificada
  if (filteredLocations.length === 0) {
    return res.status(404).json({ error: 'No se encontraron ubicaciones para la ruta especificada' });
  }

  // // Responder con las ubicaciones filtradas
  // res.json({ success: true, locations: filteredLocations });


  const query = `
    SELECT 
      SUM_CLIENTE,
      SUM_ID,
      SUM_LATITUD,
      SUM_LONGITUD,
      LEFT(
        RTRIM(LTRIM(SUM_CALLE)) 
        || ' ' || RTRIM(LTRIM(IFNULL(SUM_ALTURA, ''))) 
        || ' ' || 
        CASE 
          WHEN IFNULL(SUM_PISO, '') <> '' THEN CONCAT('P', RTRIM(LTRIM(SUM_PISO))) 
          ELSE '' 
        END 
        || CASE 
          WHEN IFNULL(SUM_DEPARTAMENTO, '') <> '' THEN CONCAT('D', RTRIM(LTRIM(SUM_DEPARTAMENTO))) 
          ELSE '' 
        END 
        || ' ' || IFNULL(SUM_ANEXO, ''), 45
      ) AS DIRECCION,
      CLI_TITULAR,
      SUM_CALLE,
      SUM_ALTURA,
      LOC_DESCRIPCION,
      SUM_ORDER_LECTURA
    FROM 
      SUMINISTRO
      JOIN SUMINISTRO_TIPO_EMPRESA ON STE_CLIENTE = SUM_CLIENTE AND STE_SUMINISTRO = SUM_ID AND STE_TIPO_EMPRESA = 3
      JOIN LOCALIDAD ON LOC_ID = SUM_LOCALIDAD
      JOIN CLIENTE ON SUM_CLIENTE = CLI_ID
    WHERE 
      IFNULL(SUM_RUTA, 0) = ?  -- Usamos el parámetro de la ruta
      AND (SUM_FACTURABLE = 'S' OR STE_ESTADO_OPE = 46);
  `;

  // Ejecutar la consulta pasando la ruta como parámetro
  db.query(query, [ruta], (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      return res.status(500).json({ error: 'Error al consultar las ubicaciones' });
    }

    res.json({ success: true, locations: results });
  });
});



// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
