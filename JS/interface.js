// ----------  Devuelve el usuario activo desde localStorage ----------
function obtenerUsuarioActivo() {
  const usuario = localStorage.getItem("usuarioActivo");
  return usuario ? JSON.parse(usuario) : null;
}

// ----------  Elimina la sesion activa del usuario ----------
function logout() {
  localStorage.removeItem("usuarioActivo");
}
