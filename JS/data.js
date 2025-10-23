//  ---------- Carga los datos del sistema desde localStorage o desde datos.json si es la primera vez ----------
function cargarDatos() {
  const datosGuardados = localStorage.getItem("datosSistema");

  if (datosGuardados) {
    //  ---------- Si hay datos guardados, devolverlos como objeto ----------
    return Promise.resolve(JSON.parse(datosGuardados));
  } else {
    //  ---------- Si no hay datos guardados, cargar desde datos.json ----------
    return fetch("./JS/datos.json")
      .then(function (respuesta) {
        if (!respuesta.ok) {
          throw new Error(`Error al cargar datos: ${respuesta.status}`);
        }
        return respuesta.json();
      })
      .then(function (datosIniciales) {
        //  ---------- Guardar los datos iniciales en localStorage ----------
        localStorage.setItem("datosSistema", JSON.stringify(datosIniciales));
        return datosIniciales;
      })
      .catch(function (error) {
        console.error("Error al cargar datos desde datos.json:", error);
        return {
          usuarios: [],
          medicos: [],
          agendas: [],
          turnos: [],
          turnosCancelados: [],
        };
      });
  }
}
