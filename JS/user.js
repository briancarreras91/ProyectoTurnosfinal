// ----------  Renderiza el dashboard del usuario (paciente o administrador) ----------
function renderUserDashboard() {
  const app = document.getElementById("app");
  const usuario = obtenerUsuarioActivo();

  //  ---------- Boton de logout ----------
  const botonLogout = `<button class="logout" onclick="cerrarSesion()">Cerrar sesión</button>`;

  //  ---------- Etiqueta visual si el usuario es administrador ----------
  const etiquetaAdmin =
    usuario.rol === "admin"
      ? `<p class="etiqueta-admin">Estás tomando turnos como administrador</p>`
      : "";

  //  ---------- Estructura del dashboard ----------
  app.innerHTML = `
    ${botonLogout}
    <section>
      <h2>Bienvenido, ${usuario.nombre}</h2>
      ${etiquetaAdmin}
      <div id="agendasDisponibles"></div>
      <div id="misTurnos"></div>
    </section>
  `;

  //  ---------- Cargar datos y renderizar agendas y turnos del usuario ----------
  const datos = obtenerDatos();
  renderAgendasDisponibles(datos, usuario);
  renderTurnosUsuario(datos, usuario);
}

//  ---------- Renderiza las agendas disponibles para reservar turnos ----------
function renderAgendasDisponibles(datos, usuario) {
  const contenedor = document.getElementById("agendasDisponibles");
  contenedor.innerHTML = "<h3>Agendas disponibles</h3>";

  const hoy = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD

  datos.agendas.forEach(function (agenda) {
    //  ---------- Ocultar agendas de fechas pasadas ----------
    if (agenda.fecha < hoy) return;

    const medico = datos.medicos.find((m) => m.id === agenda.medicoId);

    const div = document.createElement("div");
    div.className = "agenda";
    div.innerHTML = `
      <p><strong>Profesional:</strong> ${medico.nombre}</p>
      <p><strong>Especialidad:</strong> ${medico.especialidad}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(agenda.fecha)}</p>
      <ul>
        ${agenda.horarios
          .map((horario) => {
            const turno = datos.turnos.find(
              (t) => t.agendaId === agenda.id && t.horario === horario
            );
            if (turno) {
              const paciente = datos.usuarios.find(
                (u) => u.id === turno.usuarioId
              );
              return `<li>${horario} - <em>Ocupado por ${paciente.nombre}</em></li>`;
            } else {
              return `<li>${horario} <button data-agenda="${agenda.id}" data-horario="${horario}">Reservar</button></li>`;
            }
          })
          .join("")}
      </ul>
    `;
    contenedor.appendChild(div);
  });

  //  ---------- Evento para reservar turno ----------
  contenedor.querySelectorAll("button[data-agenda]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      const agendaId = parseInt(boton.getAttribute("data-agenda"));
      const horario = boton.getAttribute("data-horario");

      reservarTurno(usuario.id, agendaId, horario);
    });
  });
}

//  ---------- Reserva un turno para el usuario (paciente o administrador) ----------
function reservarTurno(usuarioId, agendaId, horario) {
  const datos = obtenerDatos();

  const agenda = datos.agendas.find((a) => a.id === agendaId);
  const hoy = new Date().toISOString().split("T")[0];

  //  ---------- Validar que la fecha no sea pasada ----------
  if (agenda.fecha < hoy) {
    Swal.fire({
      title: "Fecha inválida",
      text: "No se pueden tomar turnos en fechas pasadas.",
      icon: "error",
    });
    return;
  }

  //  ---------- Validar que el turno no este ocupado ----------
  const ocupado = datos.turnos.some(function (t) {
    return t.agendaId === agendaId && t.horario === horario;
  });

  if (ocupado) {
    Swal.fire({
      title: "Turno ocupado",
      text: "Ese horario ya fue reservado por otro paciente.",
      icon: "error",
    });
    return;
  }

  //  ---------- Validar que el usuario no tenga otro turno ese mismo dia ----------
  const yaTieneTurnoEseDia = datos.turnos.some(function (t) {
    const a = datos.agendas.find((ag) => ag.id === t.agendaId);
    return t.usuarioId === usuarioId && a.fecha === agenda.fecha;
  });

  if (yaTieneTurnoEseDia) {
    Swal.fire({
      title: "Límite de turnos",
      text: "Ya tenés un turno reservado para ese día.",
      icon: "warning",
    });
    return;
  }

  //  ---------- Crear y guardar el nuevo turno ----------
  const nuevoTurno = {
    id: Date.now(),
    usuarioId,
    agendaId,
    horario,
  };

  datos.turnos.push(nuevoTurno);
  guardarDatos(datos);

  Toastify({
    text: "Turno reservado correctamente",
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: "#00cfcf",
  }).showToast();

  renderUserDashboard();
}

//  ---------- Renderiza los turnos activos del usuario ----------
function renderTurnosUsuario(datos, usuario) {
  const contenedor = document.getElementById("misTurnos");
  contenedor.innerHTML = "<h3>Mis turnos</h3>";

  const turnos = datos.turnos.filter((t) => t.usuarioId === usuario.id);

  if (turnos.length === 0) {
    contenedor.innerHTML += "<p>No tenés turnos reservados.</p>";
    return;
  }

  turnos.forEach(function (turno) {
    const agenda = datos.agendas.find((a) => a.id === turno.agendaId);
    const medico = datos.medicos.find((m) => m.id === agenda.medicoId);

    const div = document.createElement("div");
    div.className = "agenda";
    div.innerHTML = `
      <p><strong>Profesional:</strong> ${medico.nombre}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(agenda.fecha)}</p>
      <p><strong>Horario:</strong> ${turno.horario}</p>
      <button class="cancelar-turno" onclick="cancelarTurnoUsuario(${
        turno.id
      })">Cancelar turno</button>
    `;
    contenedor.appendChild(div);
  });
}

// ----------  Cancela un turno del usuario ----------
function cancelarTurnoUsuario(idTurno) {
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

      renderUserDashboard();
    }
  });
}

//  ---------- Cierra la sesion del usuario ----------
function cerrarSesion() {
  logout();
  renderLogin();
}

// ----------  Guarda los datos actualizados en localStorage ----------
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

//  ---------- Convierte una fecha en formato aaaa-mm-dd a dd/mm/aaaa ----------
function formatearFecha(fechaISO) {
  const [año, mes, día] = fechaISO.split("-");
  return `${día}/${mes}/${año}`;
}
