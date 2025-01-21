function initMap() {
  const urlParams = new URLSearchParams(window.location.search);
  const ruta = urlParams.get('ruta');

  if (!ruta) {
    alert("El parámetro de ruta no está definido en la URL");
    return;
  }

  var map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -35.663185, lng: -63.761511 },
    zoom: 20
  });

  var modal = document.getElementById("locationModal");
  var span = document.getElementsByClassName("close")[0];
  var confirmBtn = document.getElementById("confirmBtn");
  var cancelBtn = document.getElementById("cancelBtn");

  // Obtener la ubicación desde el servidor
  fetch(`/get-locations?ruta=${ruta}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        data.locations.forEach(location => {
          let { SUM_CLIENTE, SUM_ID, SUM_LATITUD, SUM_LONGITUD, SUM_CALLE, CLI_TITULAR } = location;
          const lat = parseFloat(SUM_LATITUD);
          const lng = parseFloat(SUM_LONGITUD);

          if (isNaN(lat) || isNaN(lng)) {
            console.error(`Valores inválidos para lat o lng: lat: ${lat}, lng: ${lng}`);
            return;
          }

          var marker = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            draggable: true,
            title: 'Domicilio del Cliente',
            id: SUM_ID
          });

          var infoWindow = new google.maps.InfoWindow({
            content: `
              <div>
                <strong>${CLI_TITULAR}</strong><br>
                Dirección: ${SUM_CALLE}<br>
                Lat: ${lat} - Lng: ${lng}
              </div>
            `
          });

          let currentInfoWindow = null;

          marker.addListener('click', function () {
            if (currentInfoWindow) {
              currentInfoWindow.close();
            }
            infoWindow.open(map, marker);
            currentInfoWindow = infoWindow;

            // Abrir el modal y cargar los datos en los inputs
            modal.style.display = "block";
            loadLocationData(marker.id);  // Cargar datos del cliente

            // Modificar el evento de confirmación
            confirmBtn.onclick = function () {
              var newLat = parseFloat(document.getElementById("latitud").value);
              var newLng = parseFloat(document.getElementById("longitud").value);

              if (!isNaN(newLat) && !isNaN(newLng)) {
                // Mover el marcador a la nueva posición
                marker.setPosition({ lat: newLat, lng: newLng });

                // Actualizar la base de datos con las nuevas coordenadas
                updateLocationInDatabase(marker.id, newLat, newLng);

                // Cerrar el modal
                modal.style.display = "none";
              } else {
                alert("Ubicación no válida");
              }
            };

            // Evento para cancelar
            cancelBtn.onclick = function () {
              modal.style.display = "none";
            };

            // Cerrar el modal con la 'x'
            span.onclick = function () {
              modal.style.display = "none";
            };

            // Cerrar el modal con la tecla 'Escape'
            window.addEventListener("keydown", function (event) {
              if (event.key === "Escape") {
                modal.style.display = "none";
              }
            });
          });

          // Función para cargar los datos de la ubicación en el modal
          function loadLocationData(id) {
            fetch(`/get-location/${id}`)
              .then(response => response.json())
              .then(data => {
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
              .catch(error => {
                console.error('Error al cargar los datos de la ubicación:', error)
              });
          }

          // Función para actualizar la ubicación en la base de datos
          function updateLocationInDatabase(id, lat, lng) {
            fetch('/update-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id, lat: lat, lng: lng })
            })
              .then(response => response.json())
              .then(data => {
                console.log('Ubicación actualizada:', data);
              })
              .catch(error => {
                console.error('Error al actualizar la ubicación:', error);
              });
          }


          // let previousLat = marker.getPosition().lat(); // Guardar la latitud original
          // let previousLng = marker.getPosition().lng(); // Guardar la longitud original

          // Escuchar el evento 'dragend' para cuando el marcador es arrastrado
          marker.addListener('dragend', function () {
            const newLat = marker.getPosition().lat();
            const newLng = marker.getPosition().lng();

            console.log("lat y lon de el arrastre", newLat, newLng)

            // Actualizar los valores en los inputs del modal con las nuevas coordenadas
            document.getElementById("latitud").value = newLat;
            document.getElementById("longitud").value = newLng;

            // Abrir el modal cuando se termine de arrastrar el marcador
            modal.style.display = "block";

            // Cargar la información relacionada al marcador, si es necesario
            loadLocationData(marker.id);

            // Modificar el evento de confirmación después de arrastrar
            confirmBtn.onclick = function () {
              
              // var newLat = parseFloat(document.getElementById("latitud").value);
              // var newLng = parseFloat(document.getElementById("longitud").value);

              console.log("lat y lon de el arrastre en el confirmar", newLat, newLng)

              if (!isNaN(newLat) && !isNaN(newLng)) {
                // Mover el marcador a la nueva posición
                marker.setPosition({ lat: newLat, lng: newLng });

                

                // Actualizar la base de datos con las nuevas coordenadas
                updateLocationInDatabase(marker.id, newLat, newLng);

                // Cerrar el modal
                modal.style.display = "none";

                // // Actualizar las coordenadas previas
                // previousLat = newLat;
                // previousLng = newLng;
              } else {
                alert("Ubicación no válida");
              }
            };

            // Cancelar el modal
            cancelBtn.onclick = function () {
              // Restaurar la posición original del marcador si se cancela
              modal.style.display = "none";
              // marker.setPosition({ lat: previousLat, lng: previousLng });
            };
          });
        });
      } else {
        console.error('Error al obtener las ubicaciones del servidor');
      }
    })
    .catch(error => {
      console.error('Error al cargar las ubicaciones:', error);
    });
}

// Inicializa el mapa cuando la página carga
google.maps.event.addDomListener(window, 'load', initMap);
