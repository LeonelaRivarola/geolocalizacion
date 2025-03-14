async function fetchRoutes() {
    try {
        const response = await fetch('/get-routes'); // Realiza la petición GET al servidor
        const data = await response.json(); // Parsea la respuesta en formato JSON

        if (data.success) {
            const routesData = data.routes; // Los datos de las rutas vienen en la propiedad "routes"
            loadRoutes(routesData); // Llama a la función que carga las rutas en la tabla
        } else {
            console.error("Error al obtener las rutas", data.message);
        }
    } catch (error) {
        console.error("Error al hacer la petición", error);
    }
}

// Función para agregar las filas de las rutas a la tabla
function loadRoutes(routesData) {
    const tableBody = document.getElementById("routeTableBody");
    tableBody.innerHTML = '';  // Limpia la tabla antes de llenarla

    routesData.forEach(route => {
        const row = document.createElement("tr");

        // Crear celdas para cada columna
        const grupoCell = document.createElement("td");
        grupoCell.textContent = route.RUT_GRUPO;
        row.appendChild(grupoCell);

        const idRutaCell = document.createElement("td");
        idRutaCell.textContent = route.RUT_ID;
        row.appendChild(idRutaCell);

        const descripcionCell = document.createElement("td");
        descripcionCell.textContent = route.RUT_DESCRIPCION;
        row.appendChild(descripcionCell);

        // Celda para el conteo de suministros sin geolocalización
        const sinGeoCell = document.createElement("td");
        sinGeoCell.textContent = route.sinGeolocalizar; // Muestra el conteo específico por cada ruta
        row.appendChild(sinGeoCell);

        // Crear el botón con el enlace al mapa-singeo
        const mapaButtonSingeo = document.createElement("td");
        const mapaButton = document.createElement("button");
        mapaButton.textContent = "Mapa";
        mapaButton.classList.add("btn", "btn-primary"); // Estilo de botón usando Bootstrap
        mapaButton.onclick = function() {
            const rutaId = route.RUT_ID;
                const singeo = 1;  // Si hay suministros sin geolocalizar, usamos 1
            
            // Redirigir al mapa con los parámetros
            window.location.href = `http://localhost:3000/?ruta=${rutaId}&singeo=${singeo}`;

  //          window.location.href = `http://localhost:3000/GeolocalizarMapa?ruta=${rutaId}&singeo=${singeo}`;
        };

        mapaButtonSingeo.appendChild(mapaButton);
        row.appendChild(mapaButtonSingeo);

        // Crear el botón con el enlace al mapa
        const mapaButtonCongeo = document.createElement("td");
        const mapaButton2 = document.createElement("button");
        mapaButton2.textContent = "Mapa";
        mapaButton2.classList.add("btn", "btn-primary"); // Estilo de botón usando Bootstrap
        mapaButton2.onclick = function() {
            const rutaId = route.RUT_ID;
                const singeo = 0;  // Si hay suministros sin geolocalizar, usamos 1
            

            // Redirigir al mapa con los parámetros
            window.location.href = `http://localhost:3000/?ruta=${rutaId}&singeo=${singeo}`;
            //window.location.href = `http://localhost:3000/GeolocalizarMapa?ruta=${rutaId}&singeo=${singeo}`;
        };

        mapaButtonCongeo.appendChild(mapaButton2);
        row.appendChild(mapaButtonCongeo);

        tableBody.appendChild(row);
    });
}

// Función para actualizar el conteo de suministros sin geolocalización
function updateSinGeolocalizarCount(routesData) {
    let totalSinGeo = 0;
    
    // Sumar todos los conteos de suministros sin geolocalización
    routesData.forEach(route => {
        totalSinGeo += route.sinGeolocalizar; // Asegúrate de que "sinGeolocalizar" es un número
    });

    // Mostrar el total en el encabezado de la tabla
    const sinGeoHeader = document.getElementById("sinGeoHeader");
    sinGeoHeader.textContent = `SIN GEOLOCALIZAR (${totalSinGeo})`; // Actualiza el encabezado
}

window.onload = fetchRoutes;