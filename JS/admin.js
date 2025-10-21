// Renderiza el dashboard del administrador
function renderAdminDashboard() {
  const app = document.getElementById("app");
  const usuario = obtenerUsuarioActivo();

  // Botón de logout
  const botonLogout = `<button class="logout" onclick="cerrarSesion()">Cerrar sesión</button>`;

  // Estructura del dashboard
  app.innerHTML = `
    ${botonLogout}
    <section>
      <h2>Bienvenido, ${usuario.nombre}</h2>

      <form id="formMedico">
        <h3>Agregar profesional</h3>
        <label>Nombre</label>
        <input type="text" id="nombreMedico" required />
        <label>Especialidad</label>
        <input type="text" id="especialidadMedico" required />
        <button type="submit">Agregar médico</button>
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
        <button type="button" id="agregarHorario">Agregar otro horario</button>
        <button type="submit">Crear agenda</button>
      </form>

      <section id="turnosAdmin">
        <h3>Turnos activos</h3>
        <div id="listaTurnos"></div>
      </section>
    </section>
  `;

  // Cargar datos y renderizar médicos y turnos
  const datos = obtenerDatos();
  const selectMedico = document.getElementById("medicoAgenda");
  selectMedico.innerHTML = "";
  datos.medicos.forEach(function (medico) {
    const option = document.createElement("option");
    option.value = medico.id;
    option.textContent = `${medico.nombre} (${medico.especialidad})`;
    selectMedico.appendChild(option);
  });

  renderTurnosAdmin(datos);

  // Evento para agregar médico
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

  // Evento para agregar horarios dinámicos
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

  // Evento para crear agenda
  document
    .getElementById("formAgenda")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const medicoId = parseInt(document.getElementById("medicoAgenda").value);
      const fecha = document.getElementById("fechaAgenda").value;
      const horarios = Array.from(
        document.querySelectorAll(".horarioInput")
      ).map((input) => input.value);

      // Validar que no exista una agenda para ese médico en esa fecha
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

// Renderiza los turnos activos en el dashboard del administrador
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
      <p><strong>Fecha:</strong> ${agenda.fecha}</p>
      <p><strong>Horario:</strong> ${turno.horario}</p>
      <button class="cancelar-turno" onclick="cancelarTurno(${turno.id})">Cancelar turno</button>
    `;
    contenedor.appendChild(div);
  });
}

// Cancela un turno desde el dashboard del administrador
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

// Cierra la sesión del usuario
function cerrarSesion() {
  logout();
  renderLogin();
}

// Guarda los datos actualizados en localStorage
function guardarDatos(datos) {
  localStorage.setItem("datosSistema", JSON.stringify(datos));
}

// Obtiene los datos desde localStorage o desde datos.json si no hay persistencia
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
