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

  //ubicación desde el servidor
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

            //modal y datos en los inputs
            modal.style.display = "block";
            loadLocationData(marker.id);  

            // Modificar
            confirmBtn.onclick = function () {
              var newLat = parseFloat(document.getElementById("latitud").value);
              var newLng = parseFloat(document.getElementById("longitud").value);

              if (!isNaN(newLat) && !isNaN(newLng)) {

                // nueva pos
                marker.setPosition({ lat: newLat, lng: newLng });
                //Actualiza
                updateLocationInDatabase(marker.id, newLat, newLng);
                modal.style.display = "none";

              } else {
                alert("Ubicación no válida");
              }
            };

            //cancelar
            cancelBtn.onclick = function () {
              modal.style.display = "none";
            };

            // Cerrar 'x'
            span.onclick = function () {
              modal.style.display = "none";
            };

            // Cerrar 'Escape'
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

          //actualizar la ubicación en la base de datos
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


          let previousLat = marker.getPosition().lat(); // latitud original
          let previousLng = marker.getPosition().lng(); // longitud original

          // marcador es arrastrado
          marker.addListener('dragend', function () {
            const newLat = marker.getPosition().lat();
            const newLng = marker.getPosition().lng();


            // inputs del modal con las nuevas coordenadas
            document.getElementById("latitud").value = newLat;
            document.getElementById("longitud").value = newLng;

            console.log("lat y lon de el arrastre", document.getElementById("latitud").value, document.getElementById("longitud").value)
            //modal se abre
            modal.style.display = "block";
            loadLocationData(marker.id);
            //funcion del boton confirmar
            confirmBtn.onclick = function () {

              console.log("lat y lon de el arrastre en el confirmar", newLat, newLng)

              if (!isNaN(newLat) && !isNaN(newLng)) {
                marker.setPosition({ lat: newLat, lng: newLng });
                updateLocationInDatabase(marker.id, newLat, newLng);

                modal.style.display = "none";
                
                previousLat = newLat;
                previousLng = newLng;
              } else {
                alert("Ubicación no válida");
              }
            };

            // Cancelar el modal
            cancelBtn.onclick = function () {
              // Restaurar 
              modal.style.display = "none";
              marker.setPosition({ lat: previousLat, lng: previousLng });
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

// Inicializa el mapa
google.maps.event.addDomListener(window, 'load', initMap);
