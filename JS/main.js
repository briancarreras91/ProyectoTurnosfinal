function iniciarAplicacion() {
  const usuario = obtenerUsuarioActivo();

  if (!usuario) {
    renderLogin();
  } else if (usuario.rol === "admin") {
    renderAdminDashboard();
  } else if (usuario.rol === "user") {
    renderUserDashboard();
  } else {
    console.error("Rol desconocido:", usuario.rol);
    renderLogin();
  }
}

// Ejecutar al cargar el script
document.addEventListener("DOMContentLoaded", iniciarAplicacion);
