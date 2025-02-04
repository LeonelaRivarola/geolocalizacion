const express = require("express");
const router = express.Router();
const { getLocationsByRoute, updateLocation } = require('../config/db'); // Importar funciones de db.js

// Ruta para obtener las ubicaciones de una ruta específica
router.get('/get-locations', async (req, res) => {
  const ruta = req.query.ruta;  // Obtener el parámetro 'ruta' de la URL

  if (!ruta) {
    return res.status(400).json({ error: 'Ruta es requerida' });
  }

  try {
    const locations = await getLocationsByRoute(ruta);
    res.json({ success: true, locations });
  } catch (err) {
    console.error("Error al obtener las ubicaciones:", err);
    res.status(500).json({ success: false, message: "Error al consultar las ubicaciones" });
  }
});

// Ruta para actualizar la ubicación
router.post("/update-location", async (req, res) => {
  let { id, lat, lng } = req.body;

  if (!id || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, message: "Datos no válidos para actualizar la ubicación" });
  }

  try {
    await updateLocation(id, lat, lng);
    console.log(`Ubicación actualizada correctamente para el ID ${id}`);
    res.json({ success: true, message: "Ubicación actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar la ubicación:", error);
    res.status(500).json({ success: false, message: "Error al actualizar la ubicación" });
  }
});

module.exports = router;
