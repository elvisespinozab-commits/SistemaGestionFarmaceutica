document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const rol = document.getElementById('rol').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombres, apellidos, username, email, rol, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('¡Usuario creado con éxito en la base de datos!');
            window.location.href = '/login';
        } else {
            alert(data.message || 'Error al intentar guardar el usuario.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el backend.');
    }
});