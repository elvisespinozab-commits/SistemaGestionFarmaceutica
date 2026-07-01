const passwordInput = document.getElementById("password");
const mostrar = document.getElementById("mostrar");

// Mostrar u ocultar contraseña
mostrar.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        mostrar.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        mostrar.textContent = "👁";
    }
});

//==============================
// Función para mostrar mensajes
//==============================
function mostrarMensaje(tipo, texto) {
    const mensaje = document.getElementById("mensaje");
    const icono = document.getElementById("iconoMensaje");
    const contenido = document.getElementById("textoMensaje");

    mensaje.className = "mensaje";
    mensaje.classList.add(tipo);

    if (tipo === "error") icono.innerHTML = "❌";
    if (tipo === "correcto") icono.innerHTML = "✅";
    if (tipo === "cargando") icono.innerHTML = "⏳";

    contenido.textContent = texto;
}

//==============================
// LOGIN
//==============================
document.getElementById("btnLogin").addEventListener("click", async () => {
    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();

    if (usuario === "" || password === "") {
        mostrarMensaje("error", "Complete todos los campos.");
        return;
    }

    mostrarMensaje("cargando", "Verificando credenciales...");

    try {
        const respuesta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, password })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            // ✅ Guardar usuario en localStorage
            localStorage.setItem("usuarioSGF", JSON.stringify({
                id: datos.usuario.id_usuario,
                nombres: datos.usuario.nombres,
                apellidos: datos.usuario.apellidos,
                rol: datos.usuario.rol
            }));

            mostrarMensaje("correcto", "Bienvenido " + datos.usuario.nombres);
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1500);
        } else {
            mostrarMensaje("error", datos.mensaje);
        }
    } catch (error) {
        console.log(error);
        mostrarMensaje("error", "No fue posible conectar con el servidor.");
    }
});