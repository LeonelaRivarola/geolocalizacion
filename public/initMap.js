let currentInfoWindow = null;
let markers = []; // Guardará todos los marcadores

function initMap() {
  const urlParams = new URLSearchParams(window.location.search);
  const ruta = urlParams.get('ruta');

  if (!ruta) {
    alert("El parámetro de ruta no está definido en la URL");
    return;
  }

  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -35.663185, lng: -63.761511 },
    zoom: 15,
  });

  const modal = document.getElementById("locationModal");
  const span = document.getElementsByClassName("close")[0];
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  // Obtener ubicaciones del servidor
  fetch(`/get-locations?ruta=${ruta}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Datos obtenidos del servidor:", data);

      if (data.success) {
        data.locations.forEach((location) => {
          const { SUM_CLIENTE, SUM_ID, SUM_LATITUD, SUM_LONGITUD, SUM_CALLE, SUM_ALTURA, CLI_TITULAR } = location;
          const lat = parseFloat(SUM_LATITUD);
          const lng = parseFloat(SUM_LONGITUD);

          // Si lat y lng son (0, 0), utilizar las coordenadas promedio LAT_DEF y LONG_DEF
          if (lat === 0 && lng === 0) {
            lat = parseFloat(LAT_DEF);
            lng = parseFloat(LONG_DEF);
          }

          if (isNaN(lat) || isNaN(lng)) {
            console.error(`Valores inválidos para lat o lng: lat: ${lat}, lng: ${lng}`);
            return;
          }

          const calle = SUM_CALLE.trim().replace(/\s+/g, " ");
          const altura = SUM_ALTURA ? SUM_ALTURA : '';
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            draggable: true,
            title: `${calle} ${altura} * ${CLI_TITULAR}`,
          });

          markers.push(marker);

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div>
                <strong>${CLI_TITULAR}</strong><br>
                Dirección: ${calle} ${altura}<br>
                Lat: ${lat} - Lng: ${lng}
              </div>
            `,
          });



          marker.addListener("click", function () {
            console.log(`Clic en marcador ID: ${SUM_ID}, Cliente: ${SUM_CLIENTE}`);

            // Cargar los datos de la ubicación directamente del marcador en lugar de hacer una nueva llamada a la API
            const locationData = {
              lat: marker.getPosition().lat(),
              lng: marker.getPosition().lng(),
              direccion: `${calle} ${altura}`,
              titular: CLI_TITULAR,
              cliente: SUM_CLIENTE,
              sumin: SUM_ID,
            };


            // Modal y datos en los inputs
            modal.style.display = "block";
            document.getElementById("latitud").value = locationData.lat;
            document.getElementById("longitud").value = locationData.lng;
            document.getElementById("direccion").value = locationData.direccion;
            document.getElementById("titular").value = locationData.titular;
            document.getElementById("cliente").value = locationData.cliente;
            document.getElementById("sumin").value = locationData.sumin;


            cancelBtn.onclick = closeModal;
            span.onclick = closeModal;
            window.addEventListener("keydown", function (event) {
              if (event.key === "Escape") closeModal();
            });
          });

          let originalLat = marker.getPosition().lat();
          let originalLng = marker.getPosition().lng();

          marker.addListener("dragend", function () {
            const newLat = marker.getPosition().lat();
            const newLng = marker.getPosition().lng();

            // Cargar los nuevos valores en el modal
            document.getElementById("latitud").value = newLat;
            document.getElementById("longitud").value = newLng;
            document.getElementById("direccion").value = `${calle} ${altura}`;
            document.getElementById("titular").value = CLI_TITULAR;
            document.getElementById("cliente").value = SUM_CLIENTE;
            document.getElementById("sumin").value = SUM_ID;

            modal.style.display = "block";

            confirmBtn.onclick = function () {
              if (!isNaN(newLat) && !isNaN(newLng)) {
                // marker.setPosition({ lat: newLat, lng: newLng });
                // Si las nuevas coordenadas no son (0, 0), actualizamos en la base de datos
                if (newLat !== 0 && newLng !== 0) {
                  updateLocationInDatabase(SUM_CLIENTE, newLat, newLng);
                }
                // Actualizar la posición del marcador sin crear uno nuevo
                marker.setPosition({ lat: newLat, lng: newLng });
                // // Actualizar las variables de posición
                // originalLat = newLat;
                // originalLng = newLng;
                modal.style.display = "none";
              } else {
                alert("Ubicación no válida");
              }
            };

            cancelBtn.onclick = closeModal;
            span.onclick = closeModal;
            window.addEventListener("keydown", function (event) {
              if (event.key === "Escape") closeModal();
            });
          });

          function closeModal() {
            marker.setPosition({ lat: originalLat, lng: originalLng });
            modal.style.display = "none";
          }
        });
      } else {
        console.error("Error al obtener las ubicaciones del servidor");
      }
    })
    .catch((error) => {
      console.error("Error al cargar las ubicaciones:", error);
    });
}

// Actualizar ubicación en la base de datos
function updateLocationInDatabase(id, lat, lng) {
  fetch("/update-location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, lat, lng }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Ubicación actualizada:", data);
    })
    .catch((error) => {
      console.error("Error al actualizar la ubicación:", error);
    });
}



// Cargar datos en el modal
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

// Carga el mapa al cargar la página
window.addEventListener("load", initMap);
