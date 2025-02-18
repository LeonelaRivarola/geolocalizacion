marker.addListener("click", function () {
    console.log(`Clic en marcador ID: ${SUM_ID}, Cliente: ${SUM_CLIENTE}`);
  
    // Cargar los datos del marcador
    const locationData = {
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng(),
      direccion: `${calle} ${altura}`,
      titular: CLI_TITULAR,
      cliente: SUM_CLIENTE,
      sumin: SUM_ID,
    };
  
    newLat = locationData.lat;
    newLng = locationData.lng;
  
    // Mostrar el modal
    openModal(locationData);
  });
  
  // Función para abrir el modal y cargar los datos
  function openModal(locationData) {
    modal.style.display = "block";
  
    // Rellenar los campos del modal con los datos del marcador
    document.getElementById("latitud").value = locationData.lat;
    document.getElementById("longitud").value = locationData.lng;
    document.getElementById("direccion").value = locationData.direccion;
    document.getElementById("titular").value = locationData.titular;
    document.getElementById("cliente").value = locationData.cliente;
    document.getElementById("sumin").value = locationData.sumin;
  
    confirmBtn.onclick = function () {
      newLat = parseFloat(document.getElementById("latitud").value);
      newLng = parseFloat(document.getElementById("longitud").value);
      
      if (!isNaN(newLat) && !isNaN(newLng)) {
        updateLocationInDatabase(SUM_CLIENTE, newLat, newLng, SUM_ID);
        marker.setPosition({ lat: newLat, lng: newLng });
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
  }
  
  marker.addListener("dragend", function () {
    const newLat = marker.getPosition().lat();
    const newLng = marker.getPosition().lng();
  
    console.log("Nueva latitud:", newLat, "Nueva longitud:", newLng);
  
    // Actualizar los valores en el modal al finalizar el arrastre
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
        titular: CLI_TITULAR,
        cliente: SUM_CLIENTE,
        sumin: SUM_ID,
      };
      openModal(locationData);
    }
  });
  