let currentInfoWindow = null;
let markers = []; // Guardará todos los marcadores
let modal, span, confirmBtn, cancelBtn; // Declaramos modal, span, confirmBtn y cancelBtn fuera de initMap
let ruta = null;
let singeo = null;
let rutaLat = null;
let rutaLng = null;
let newLat, newLng;

function initMap() {
  const urlParams = new URLSearchParams(window.location.search);
  ruta = urlParams.get('ruta');
  const singeo = urlParams.get('singeo');

  if (!ruta) {
    alert("El parámetro de ruta no está definido en la URL");
    return;
  }

  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -35.663185, lng: -63.761511 },
    zoom: 15,
  });

  modal = document.getElementById("locationModal");
  span = document.getElementsByClassName("close")[0];
  confirmBtn = document.getElementById("confirmBtn");
  cancelBtn = document.getElementById("cancelBtn");

  //para el parametro singeo
  let url = `/get-locations?ruta=${ruta}`;
  if (singeo === '1') {
    url += `&singeo=${singeo}`;
  }

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Ubicaciones obtenidas:", data.locations);
        data.locations.forEach(location => {
          const { SUM_CLIENTE, SUM_ID, SUM_LATITUD, SUM_LONGITUD, SUM_CALLE, SUM_ALTURA, CLI_TITULAR } = location;

          let lat = parseFloat(SUM_LATITUD);
          let lng = parseFloat(SUM_LONGITUD);

          const calle = SUM_CALLE.trim().replace(/\s+/g, " ");
          const altura = SUM_ALTURA ? SUM_ALTURA : '';

          // Si el singeo es 1, filtramos para que solo aparezcan los que no tienen coordenadas
          if (singeo === '1' && (isNaN(lat) || lat === 0 || isNaN(lng) || lng === 0)) {
            // Crear un marcador solo si las coordenadas son nulas o 0
            createMarker(lat, lng, calle, altura, CLI_TITULAR, SUM_CLIENTE, SUM_ID);
          } else if (singeo === '0' && !isNaN(lat) && lat !== 0 && !isNaN(lng) && lng !== 0) {
            // Si singeo es 0, solo mostrar marcadores con coordenadas válidas
            createMarker(lat, lng, calle, altura, CLI_TITULAR, SUM_CLIENTE, SUM_ID);
          }

        });
      } else {
        console.error("Error al obtener las ubicaciones del servidor");
      }
    })
    .catch((error) => {
      console.error("Error al cargar las ubicaciones:", error);
    });

  function createMarker(lat, lng, calle, altura, titular, cliente, sumin) {
    // Crear el marcador solo si no existe ya uno para esa ubicación
    let existingMarker = markers.find(marker => {
      return marker.position.lat() === lat && marker.position.lng() === lng;
    });

    if (existingMarker) {
      // Si el marcador ya existe, no crees uno nuevo, solo actualiza la posición
      return;
    }

    

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
      title: `${calle} ${altura} * ${titular}`,
    });

    markers.push(marker); // Solo se agrega el marcador a la lista de marcadores si es nuevo

    const infoWindow = new google.maps.InfoWindow({
      content: `  
              <div>
                  <strong>${titular}</strong><br>
                  Dirección: ${calle} ${altura}<br>
                  Lat: ${lat} - Lng: ${lng}
              </div>
          `,
    });

    marker.addListener("click", function () {
      console.log(`Clic en marcador ID: ${sumin}, Cliente: ${cliente}`);
      const locationData = {
        lat: marker.getPosition().lat(),
        lng: marker.getPosition().lng(),
        direccion: `${calle} ${altura}`,
        titular: titular,
        cliente: cliente,
        sumin: sumin,
        marker: marker
      };
      newLat = locationData.lat;
      newLng = locationData.lng;
      openModal(locationData);
    });

    marker.addListener("dragend", function () {
      const newLat = marker.getPosition().lat();
      const newLng = marker.getPosition().lng();

      console.log("Nueva latitud:", newLat, "Nueva longitud:", newLng);

      document.getElementById("latitud").value = newLat;
      document.getElementById("longitud").value = newLng;

      // Si el modal ya está abierto, actualizamos los valores
      if (modal.style.display === "block") {
        document.getElementById("latitud").value = newLat;
        document.getElementById("longitud").value = newLng;
      } else {
        // Si el modal no está abierto, lo mostramos con los nuevos valores
        const locationData = {
          lat: newLat,
          lng: newLng,
          direccion: `${calle} ${altura}`,
          titular: titular,
          cliente: cliente,
          sumin: sumin,
          marker: marker
        };
        openModal(locationData);
      }
    });

    marker.originalLat = marker.getPosition().lat();
    marker.originalLng = marker.getPosition().lng();
  }


  function closeModal(marker) {
    // Usa las coordenadas originales almacenadas en el marcador
    marker.setPosition({ lat: marker.originalLat, lng: marker.originalLng });
    modal.style.display = "none";
  }

  function openModal(locationData) {
    modal.style.display = "block";

    // Rellenar los campos del modal con los datos del marcador
    document.getElementById("latitud").value = locationData.lat;
    document.getElementById("longitud").value = locationData.lng;
    document.getElementById("direccion").value = locationData.direccion;
    document.getElementById("titular").value = locationData.titular;
    document.getElementById("cliente").value = locationData.cliente;
    document.getElementById("sumin").value = locationData.sumin;

    const marker = locationData.marker;

    confirmBtn.onclick = function () {
      newLat = parseFloat(document.getElementById("latitud").value);
      newLng = parseFloat(document.getElementById("longitud").value);

      if (!isNaN(newLat) && !isNaN(newLng)) {
        updateLocationInDatabase(locationData.cliente, newLat, newLng, locationData.sumin);  // Usa locationData.cliente
        marker.setPosition({ lat: newLat, lng: newLng });
        modal.style.display = "none";
      } else {
        alert("Ubicación no válida");
      }
    };

    cancelBtn.onclick = function () {
      closeModal(marker);
    };
    span.onclick = function () {
      closeModal(marker);
    };
    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal(marker);
    });
  }


  // Función para actualizar la ubicación en la base de datos
  function updateLocationInDatabase(cliente, lat, lng, sumin) {
    console.log(`Enviando actualización para ID: ${cliente}, lat: ${lat}, lng: ${lng}, sumin: ${sumin}`);

    fetch("/update-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cliente,
        lat: lat,
        lng: lng,
        sumin: sumin
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Ubicación actualizada:", data);
        // loadLocations(); // Recargar las ubicaciones después de la actualización
      })
      .catch((error) => {
        console.error("Error al actualizar la ubicación:", error);
      });
  }

  function loadLocationData(id) {
    fetch(`/get-location/${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const location = data.location;
          document.getElementById("latitud").value = location.lat;
          document.getElementById("longitud").value = location.lng;
          document.getElementById("direccion").value = location.direccion;
          document.getElementById("titular").value = location.titular;
          document.getElementById("cliente").value = location.cliente;
          document.getElementById("sumin").value = location.sumin;
        }
      })
      .catch((error) => {
        console.error("Error al cargar los datos de la ubicación:", error);
      });
  }


  // Obtener las coordenadas promedio de la ruta
  fetch(`/get-route-coordinates?ruta=${ruta}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        rutaLat = data.latDef;
        rutaLng = data.lngDef;
        console.log("Coordenadas de ruta obtenidas: ", rutaLat, rutaLng);
        // loadLocations();  // Después de obtener las coordenadas, cargar las ubicaciones
      } else {
        console.error("Error al obtener las coordenadas de la ruta");
      }
    })
    .catch(error => {
      console.error("Error al cargar las coordenadas de la ruta: ", error)
    });
}

// Carga el mapa al cargar la página
window.addEventListener("load", initMap);
