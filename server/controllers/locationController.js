const locationService = require('../services/locationService');

const getLocations = async(req, res) => {
    const {ruta} = req.query;
    try{
        const locations = await locationService.getLocationByRoute(ruta);
        res.json({success: true, locations});
    } catch(error){
        res.status(500).json({success: false, message: error.message})
    }
};

const updateLocation = async(req, res) => {
    const {id, lat, lng } = req. body;
    try{
        await locationService.updateLocation(id, lat, lng);
        res.json({success: true, message: 'Ubicacion actualziada correctamente'})
    } catch (error) { 
        res.status(500).json({success: false, message: error.message})
    }
};

module.exports = { getLocations, updateLocation};