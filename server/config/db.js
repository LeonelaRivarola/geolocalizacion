const sql = require('mssql');

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

const poolPromise = new sql.ConnectionPool(dbSettings).connect();

const getLocationsByRoute = async (ruta) => {
  const pool = await poolPromise;
  const query = `
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
      LOC_DESCRIPCION,
      SUM_ORDEN_LECTURA
    FROM 
      SUMINISTRO
      JOIN SUMINISTRO_TIPO_EMPRESA ON STE_CLIENTE = SUM_CLIENTE AND STE_SUMINISTRO = SUM_ID AND STE_TIPO_EMPRESA = 3
      JOIN LOCALIDAD ON LOC_ID = SUM_LOCALIDAD
      JOIN CLIENTE ON SUM_CLIENTE = CLI_ID
    WHERE 
      ISNULL(SUM_RUTA, 0) = @ruta
      AND (SUM_FACTURABLE = 'S' OR STE_ESTADO_OPE = 46);
  `;
  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("ruta", sql.Int, ruta);
    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error("Error en getLocationsByRoute:", err);
    throw err;
  }
};

const updateLocation = async (id, lat, lng) => {
  const query = `
    MERGE INTO SUMINISTRO AS target
    USING (VALUES (@id, @lat, @lng)) AS source (SUM_CLIENTE, SUM_LATITUD, SUM_LONGITUD)
    ON target.SUM_CLIENTE = source.SUM_CLIENTE
    WHEN MATCHED THEN
      UPDATE SET SUM_LATITUD = source.SUM_LATITUD, SUM_LONGITUD = source.SUM_LONGITUD;
  `;

  const pool = await poolPromise;
  const request = pool.request();
  request.input("id", sql.Int, id);
  request.input("lat", sql.Float, lat);
  request.input("lng", sql.Float, lng);
  await request.query(query);
};

module.exports = { getLocationsByRoute, updateLocation };
