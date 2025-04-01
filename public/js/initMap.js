let currentInfoWindow = null;
let markers = [];
let modal, span, confirmBtn, cancelBtn;
let ruta = null;
let nsup = null;
let singeo = null;
let rutaLat = null;
let rutaLng = null;
let newLat, newLng;

function initMap() {
  const urlParams = new URLSearchParams(window.location.search);
  ruta = urlParams.get('ruta');
  nsup = urlParams.get('nsup')
  singeo = urlParams.get('singeo');


  if (!ruta && !nsup) {
    alert(`El parámetro de ruta = ${ruta} o nsup = ${nsup} no está definido en la URL`);
    return;
  }
  if (ruta && nsup) {
    alert("El parámetro de ruta y nsup son de opcion excluyente");
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

  console.log('ruta ' + ruta)
  console.log('nsup ' + nsup)

  let url = '/get-locations?' //  let url = `${window.location.origin}/GeolocalizarMapa?`;

  if (ruta) {
    url += `ruta=${ruta}`;
  }

  if (nsup) {
    url += `nsup=${nsup}`;
  }

  if (singeo === '1') {
    url += `&singeo=${singeo}`;
  }
  console.log(url)

  let lngInc = 0;
  let noGeo = 0;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Ubicaciones obtenidas:", data.locations);
        data.locations.forEach(location => {
          const { SUM_CLIENTE, SUM_ID, SUM_LATITUD, SUM_LONGITUD, SUM_CALLE, SUM_ALTURA, SUM_ANEXO, CLI_TITULAR, LAT_DEF, LONG_DEF } = location;

          let lat = parseFloat(SUM_LATITUD);
          let lng = parseFloat(SUM_LONGITUD);
          //console.log("ubicacion " + lat + " " + lng)
          rutaLat = parseFloat(LAT_DEF)
          rutaLng = parseFloat(LONG_DEF)

          noGeo = 0
          if (isNaN(lat) || lat === 0 || isNaN(lng) || lng === 0) {
            lat = rutaLat
            lng = rutaLng + (0.0002 * lngInc)
            lngInc = lngInc + 1
            //console.log("se asigno pos centro ruta " + lat + " " + lng)
            noGeo = 1

          }
          const calle = SUM_CALLE.trim().replace(/\s+/g, " ");
          const altura = SUM_ALTURA ? SUM_ALTURA : '';
          const anexo = SUM_ANEXO ? SUM_ANEXO : '';

          createMarker(lat, lng, calle, altura, anexo, CLI_TITULAR, SUM_CLIENTE, SUM_ID, noGeo);

        });  //end data success
        // Verificar si rutaLat y rutaLng son números válidos antes de centrar el mapa
        if (!isNaN(rutaLat) && !isNaN(rutaLng)) {
          map.setCenter({ lat: rutaLat, lng: rutaLng });
        } else {
          // Establecer un centro predeterminado si rutaLat o rutaLng no son válidos
          map.setCenter({ lat: -35.663185, lng: -63.761511 }); // Centro predeterminado
          console.warn("rutaLat o rutaLng no son válidos. Se usó el centro predeterminado.");
        }
      } else {
        console.error("Error al obtener las ubicaciones del servidor");
      }
    })
    .catch((error) => {
      console.error("Error al cargar las ubicaciones:", error);
    });

  // Crear el botón "Volver"
  const backButton = document.createElement('button');
  backButton.textContent = 'Volver';
  backButton.classList.add('back-button');

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(backButton);

  backButton.addEventListener('click', function () {
    window.history.back();
  });

  // Estilos
  const style = document.createElement('style');
  style.textContent = `
    .back-button {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 10px;
        cursor: pointer;
    }
`;
  document.head.appendChild(style);

  function createMarker(lat, lng, calle, altura, anexo, titular, cliente, sumin, noGeo) {

    // Crear el marcador solo si no existe ya uno para esa ubicación
    let existingMarker = markers.find(marker => {
      return marker.position.lat() === lat && marker.position.lng() === lng;
    });

    if (existingMarker) {
      // Si el marcador ya existe, no crees uno nuevo, solo actualiza la posición
      return;
    }

    let mescala = 8
    let mcolor = '#D35400'  //default suministro de cliente
    let mcontorno = '#454545'


    if (noGeo == 1) {
      mescala = 12;
      mcolor = '#000000';
      mcontorno = '#FFFF00';
    }
    else {
      switch (true) {
        case (anexo == 'COLUMNA AP'): {
          mescala = 8;
          mcolor = '#3864E2';
          break;
        }
        case (anexo == 'CENTRO CALLE AP'): {
          mescala = 8;
          mcolor = '#3498DB';
          break;
        }
        case (anexo.includes('ORNAMENTAL')): {
          mescala = 8;
          mcolor = '#AED6F1';
          break;
        }
        case (anexo == 'TABLERO SE' && titular.includes('der')): {
          mescala = 8;
          mcolor = '#FFC0CB';
          break;
        }
        case (anexo == 'TABLERO SE' && titular.includes('dist')): {
          mescala = 8;
          mcolor = '#800080';
          break;
        }
        case (anexo == 'CAPACITOR SE'): {
          mescala = 10;
          mcolor = '#808080';
          break;
        }
        case (anexo.includes('LINEA') && titular.includes('/D')): {
          mescala = 10;
          mcolor = '#008000';
          break;
        }
        case (anexo == 'SUBESTACION SE'): {
          mescala = 10;
          mcolor = '#F4D03F';
          break;
        }
      }
    }

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
      title: `${calle} ${altura} * ${titular}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: mescala,
        fillColor: mcolor,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: mcontorno
      }
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


  function loadLocationData(idCli, idSum) {
    fetch(`/get-location/${idCli}/${idSum}`)
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
}

// Carga el mapa al cargar la página
window.addEventListener("load", initMap);
