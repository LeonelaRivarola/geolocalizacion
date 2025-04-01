document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // lógica de autenticación real
    // simulacion del inicio de sesión

    if (username && password) { // Simula una validación de que los campos estan llenos.
        window.location.href = 'http://localhost:3000/GeolocalizarMapa';
    } else {
        alert('Por favor, ingrese usuario y contraseña.');
    }

});