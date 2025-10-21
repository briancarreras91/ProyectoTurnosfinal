// Renderiza el formulario de login y gestiona la autenticación
function renderLogin() {
  const app = document.getElementById("app");

  // Estructura del formulario de login
  app.innerHTML = `
    <section class="login">
      <h2>Ingreso al sistema</h2>
      <form id="formLogin">
        <label for="email">Email</label>
        <input type="email" id="email" required />

        <label for="password">Contraseña</label>
        <input type="password" id="password" required />

        <button type="submit">Ingresar</button>
      </form>
    </section>
  `;

  // Evento de envío del formulario
  document.getElementById("formLogin").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Carga de datos desde datos.json
    cargarDatos().then(function (datos) {
      const usuario = datos.usuarios.find(function (u) {
        return u.email === email && u.password === password;
      });

      // Si no se encuentra el usuario, mostrar error
      if (!usuario) {
        Swal.fire({
          title: "Acceso denegado",
          text: "Email o contraseña incorrectos.",
          icon: "error",
        });
        return;
      }

      // Guardar usuario activo en localStorage
      localStorage.setItem("usuarioActivo", JSON.stringify(usuario));

      // Notificación rápida con Toastify
      Toastify({
        text: `Bienvenido ${usuario.nombre}`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#a87ff0",
      }).showToast();

      // Redirigir al dashboard correspondiente
      if (usuario.rol === "admin") {
        renderAdminDashboard();
      } else {
        renderUserDashboard();
      }
    });
  });
}
