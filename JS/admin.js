//  ---------- Renderiza el dashboard del administrador con acceso completo ----------
function renderAdminDashboard() {
  const app = document.getElementById("app");
  const usuario = obtenerUsuarioActivo();

  // Boton de logout
  const botonLogout = `<button class="logout" onclick="cerrarSesion()">Cerrar sesión</button>`;

  //  ---------- Estructura del panel administrativo ----------
  const seccionAdmin = `
    <section id="adminPanel">
      <h2>Panel administrativo</h2>

      <form id="formMedico">
        <h3>Agregar profesional</h3>
        <label>Nombre</label>
        <input type="text" id="nombreMedico" required />
        <label>Especialidad</label>
        <input type="text" id="especialidadMedico" required />
        <button type="submit" class="form-button">Agregar médico</button>
      </form>

      <form id="formAgenda">
        <h3>Crear agenda</h3>
        <label>Médico</label>
        <select id="medicoAgenda"></select>
        <label>Fecha</label>
        <input type="date" id="fechaAgenda" required />
        <div id="horariosContainer">
          <label>Horario</label>
          <input type="time" class="horarioInput" required />
        </div>
        <button type="button" id="agregarHorario" class="form-button">Agregar otro horario</button>
        <button type="submit" class="form-button">Crear agenda</button>
      </form>

      <section id="turnosAdmin">
        <h3>Turnos activos</h3>
        <div id="listaTurnos"></div>
      </section>
    </section>
  `;

  // ----------  Renderiza ambas secciones: administrativa y de turnos ----------
  app.innerHTML = `
    ${botonLogout}
    ${seccionAdmin}
    <section id="userPanel"></section>
  `;

  //  ---------- Renderiza el dashboard de turnos del administrador dentro de userPanel ----------
  renderUserDashboardEnContenedor("userPanel");

  //  ---------- Cargar datos y renderizar medicos en el selector ----------
  const datos = obtenerDatos();
  const selectMedico = document.getElementById("medicoAgenda");
  selectMedico.innerHTML = "";
  datos.medicos.forEach(function (medico) {
    const option = document.createElement("option");
    option.value = medico.id;
    option.textContent = `${medico.nombre} (${medico.especialidad})`;
    selectMedico.appendChild(option);
  });

  //  ---------- Renderiza los turnos activos ----------
  renderTurnosAdmin(datos);

  //  ---------- Evento para agregar medico ----------
  document
    .getElementById("formMedico")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const nombre = document.getElementById("nombreMedico").value.trim();
      const especialidad = document
        .getElementById("especialidadMedico")
        .value.trim();

      const nuevoMedico = {
        id: Date.now(),
        nombre,
        especialidad,
      };

      datos.medicos.push(nuevoMedico);
      guardarDatos(datos);

      Toastify({
        text: "Médico agregado correctamente",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#00cfcf",
      }).showToast();

      renderAdminDashboard();
    });

  //  ---------- Evento para agregar horarios dinamicos ----------
  document
    .getElementById("agregarHorario")
    .addEventListener("click", function () {
      const container = document.getElementById("horariosContainer");
      const input = document.createElement("input");
      input.type = "time";
      input.className = "horarioInput";
      input.required = true;
      container.appendChild(input);
    });

  //  ---------- Evento para crear agenda ----------
  document
    .getElementById("formAgenda")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const medicoId = parseInt(document.getElementById("medicoAgenda").value);
      const fecha = document.getElementById("fechaAgenda").value;
      const horarios = Array.from(
        document.querySelectorAll(".horarioInput")
      ).map((input) => input.value);

      // ----------  Validar que no exista una agenda para ese medico en esa fecha ----------
      const datos = obtenerDatos();
      const existe = datos.agendas.some(function (a) {
        return a.medicoId === medicoId && a.fecha === fecha;
      });

      if (existe) {
        Swal.fire({
          title: "Agenda duplicada",
          text: "Ya existe una agenda para ese médico en esa fecha.",
          icon: "error",
        });
        return;
      }

      const nuevaAgenda = {
        id: Date.now(),
        medicoId,
        fecha,
        horarios,
      };

      datos.agendas.push(nuevaAgenda);
      guardarDatos(datos);

      Toastify({
        text: "Agenda creada correctamente",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#a87ff0",
      }).showToast();

      renderAdminDashboard();
    });
}
//  ---------- Renderiza los turnos activos en el dashboard del administrador ----------
function renderTurnosAdmin(datos) {
  const contenedor = document.getElementById("listaTurnos");
  contenedor.innerHTML = "";

  datos.turnos.forEach(function (turno) {
    const usuario = datos.usuarios.find((u) => u.id === turno.usuarioId);
    const agenda = datos.agendas.find((a) => a.id === turno.agendaId);
    const medico = datos.medicos.find((m) => m.id === agenda.medicoId);

    const div = document.createElement("div");
    div.className = "agenda";
    div.innerHTML = `
      <p><strong>Paciente:</strong> ${usuario.nombre}</p>
      <p><strong>Profesional:</strong> ${medico.nombre}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(agenda.fecha)}</p>
      <p><strong>Horario:</strong> ${turno.horario}</p>
      <button class="cancelar-turno" onclick="cancelarTurno(${
        turno.id
      })">Cancelar turno</button>
    `;
    contenedor.appendChild(div);
  });

  // ----------  Renderiza agendas con opcion de eliminacion ----------
  const agendasContainer = document.createElement("section");
  agendasContainer.innerHTML = "<h3>Agendas creadas</h3>";

  datos.agendas.forEach(function (agenda) {
    const medico = datos.medicos.find((m) => m.id === agenda.medicoId);
    const div = document.createElement("div");
    div.className = "agenda";
    div.innerHTML = `
      <p><strong>Profesional:</strong> ${medico.nombre}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(agenda.fecha)}</p>
      <p><strong>Horarios:</strong> ${agenda.horarios.join(", ")}</p>
      <button class="cancelar-turno" onclick="eliminarAgenda(${
        agenda.id
      })">Eliminar agenda</button>
    `;
    agendasContainer.appendChild(div);
  });

  document.getElementById("turnosAdmin").appendChild(agendasContainer);
}

//  ---------- Cancela un turno desde el dashboard del administrador ----------
function cancelarTurno(idTurno) {
  Swal.fire({
    title: "¿Cancelar turno?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "No",
  }).then(function (resultado) {
    if (resultado.isConfirmed) {
      const datos = obtenerDatos();
      const turno = datos.turnos.find((t) => t.id === idTurno);
      datos.turnos = datos.turnos.filter((t) => t.id !== idTurno);
      datos.turnosCancelados.push(turno);
      guardarDatos(datos);

      Toastify({
        text: "Turno cancelado",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#ff4d4d",
      }).showToast();

      renderAdminDashboard();
    }
  });
}

//  ---------- Elimina una agenda y sus turnos asociados ----------
function eliminarAgenda(idAgenda) {
  Swal.fire({
    title: "¿Eliminar agenda?",
    text: "Esta acción eliminará todos los turnos asociados.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "No",
  }).then(function (resultado) {
    if (resultado.isConfirmed) {
      const datos = obtenerDatos();
      datos.agendas = datos.agendas.filter((a) => a.id !== idAgenda);
      datos.turnos = datos.turnos.filter((t) => t.agendaId !== idAgenda);
      guardarDatos(datos);

      Toastify({
        text: "Agenda eliminada",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#ff4d4d",
      }).showToast();

      renderAdminDashboard();
    }
  });
}

//  ---------- Renderiza el dashboard de turnos dentro de un contenedor especifico ----------
function renderUserDashboardEnContenedor(idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  const usuario = obtenerUsuarioActivo();

  const etiquetaAdmin =
    usuario.rol === "admin"
      ? `<p class="etiqueta-admin">Estás tomando turnos como administrador</p>`
      : "";

  contenedor.innerHTML = `
    <section>
      <h2>Turnos personales</h2>
      ${etiquetaAdmin}
      <div id="agendasDisponibles"></div>
      <div id="misTurnos"></div>
    </section>
  `;

  const datos = obtenerDatos();
  renderAgendasDisponibles(datos, usuario);
  renderTurnosUsuario(datos, usuario);
}

//  ---------- Cierra la sesion del usuario ----------
function cerrarSesion() {
  logout();
  renderLogin();
}

//  ---------- Guarda los datos actualizados en localStorage ----------
function guardarDatos(datos) {
  localStorage.setItem("datosSistema", JSON.stringify(datos));
}

//  ---------- Obtiene los datos desde localStorage o desde datos.json si no hay persistencia ----------
function obtenerDatos() {
  const datosGuardados = localStorage.getItem("datosSistema");
  return datosGuardados
    ? JSON.parse(datosGuardados)
    : {
        usuarios: [],
        medicos: [],
        agendas: [],
        turnos: [],
        turnosCancelados: [],
      };
}

// Convierte una fecha en formato aaaa-mm-dd a dd/mm/aaaa ----------
function formatearFecha(fechaISO) {
  const [año, mes, día] = fechaISO.split("-");
  return `${día}/${mes}/${año}`;
}
