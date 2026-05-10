const ADMIN_PROFILE = {
  username: 'marcos',
  password: 'marcos2011@',
};

const STORAGE_KEYS = {
  teachers: 'banos-registros:teachers',
  records: 'banos-registros:records',
};

const starterTeachers = ['Marcos'];
const app = document.querySelector('#app');

let state = {
  teachers: readStorage(STORAGE_KEYS.teachers, starterTeachers),
  records: readStorage(STORAGE_KEYS.records, []),
  session: { role: 'guest', name: '' },
};

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEYS.teachers, JSON.stringify(state.teachers));
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(state.records));
}

function updateState(partial) {
  state = { ...state, ...partial };
  persist();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function todayRecords() {
  const today = new Date().toISOString().slice(0, 10);
  return state.records
    .filter((record) => record.date === today)
    .sort((a, b) => b.departureAt.localeCompare(a.departureAt));
}

function makeRecord(studentName, teacherName) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    studentName: studentName.trim(),
    teacherName,
    date: now.slice(0, 10),
    departureAt: now,
    returnedAt: null,
    status: 'out',
  };
}

function loginTeacher(teacherName) {
  const cleanName = teacherName.trim();
  if (!cleanName) return;

  const teacherExists = state.teachers.some((teacher) => teacher.toLowerCase() === cleanName.toLowerCase());
  const teachers = teacherExists
    ? state.teachers
    : [...state.teachers, cleanName].sort((a, b) => a.localeCompare(b, 'es'));

  updateState({ teachers, session: { role: 'teacher', name: cleanName } });
}

function loginAdmin(username, password) {
  if (username === ADMIN_PROFILE.username && password === ADMIN_PROFILE.password) {
    updateState({ session: { role: 'admin', name: ADMIN_PROFILE.username } });
    return;
  }

  document.querySelector('#admin-error').textContent = 'Usuario o contraseña de administrador incorrectos.';
}

function logout() {
  updateState({ session: { role: 'guest', name: '' } });
}

function addTeacher(name) {
  const cleanName = name.trim();
  if (!cleanName || state.teachers.some((teacher) => teacher.toLowerCase() === cleanName.toLowerCase())) return;
  updateState({ teachers: [...state.teachers, cleanName].sort((a, b) => a.localeCompare(b, 'es')) });
}

function deleteTeacher(name) {
  updateState({ teachers: state.teachers.filter((teacher) => teacher !== name) });
}

function addRecord(studentName) {
  const cleanName = studentName.trim();
  if (!cleanName) return;
  updateState({ records: [makeRecord(cleanName, state.session.name), ...state.records] });
}

function markReturned(recordId) {
  const now = new Date().toISOString();
  updateState({
    records: state.records.map((record) =>
      record.id === recordId ? { ...record, returnedAt: now, status: 'returned' } : record,
    ),
  });
}

function render() {
  if (state.session.role === 'admin') {
    renderAdminPanel();
    return;
  }

  if (state.session.role === 'teacher') {
    renderTeacherPanel();
    return;
  }

  renderLogin();
}

function renderLogin() {
  const options = state.teachers
    .map((teacher) => `<option value="${escapeHtml(teacher)}">${escapeHtml(teacher)}</option>`)
    .join('');

  app.innerHTML = `
    <main class="auth-layout">
      <section class="hero-card">
        <div class="eyebrow">Registro diario</div>
        <h1>Control sencillo de salidas al baño</h1>
        <p>Los profesores registran la salida del alumno, la fecha se guarda automáticamente y solo tienen que marcar su regreso.</p>
      </section>

      <section class="panel auth-card">
        <h2>Iniciar como profesor</h2>
        <form id="teacher-login" class="stack">
          <label>
            Perfil guardado
            <select id="selected-teacher">${options}</select>
          </label>
          <label>
            O escribe tu nombre
            <input id="teacher-name" placeholder="Nombre del profesor" />
          </label>
          <button class="primary" type="submit">Entrar al panel</button>
        </form>

        <button class="admin-toggle" id="admin-toggle" type="button">Iniciar sesión como admin</button>

        <form id="admin-login" class="stack admin-form hidden">
          <label>
            Usuario admin
            <input id="admin-username" placeholder="marcos" />
          </label>
          <label>
            Contraseña
            <input id="admin-password" placeholder="Contraseña" type="password" />
          </label>
          <p class="error" id="admin-error" aria-live="polite"></p>
          <button class="secondary" type="submit">Acceder como administrador</button>
        </form>
      </section>
    </main>
  `;

  document.querySelector('#teacher-login').addEventListener('submit', (event) => {
    event.preventDefault();
    loginTeacher(document.querySelector('#teacher-name').value || document.querySelector('#selected-teacher').value);
  });

  document.querySelector('#admin-toggle').addEventListener('click', () => {
    document.querySelector('#admin-login').classList.toggle('hidden');
  });

  document.querySelector('#admin-login').addEventListener('submit', (event) => {
    event.preventDefault();
    loginAdmin(document.querySelector('#admin-username').value, document.querySelector('#admin-password').value);
  });
}

function renderTeacherPanel() {
  const teacherRecords = todayRecords().filter((record) => record.teacherName === state.session.name);
  const activeRecords = teacherRecords.filter((record) => record.status === 'out');

  app.innerHTML = `
    <main class="app-shell">
      ${headerTemplate(`Hola, ${escapeHtml(state.session.name)}`, formatDate(new Date()))}

      <section class="grid two-columns">
        <article class="panel highlight-panel">
          <h2>Registrar salida</h2>
          <p>Escribe el nombre del alumno. La fecha y la hora se guardarán automáticamente.</p>
          <form id="record-form" class="inline-form">
            <input id="student-name" placeholder="Nombre del alumno" autofocus />
            <button class="primary" type="submit">Registrar salida</button>
          </form>
        </article>

        <article class="panel stat-panel">
          <span>Alumnos fuera ahora</span>
          <strong>${activeRecords.length}</strong>
          <small>${todayRecords().length} registros totales hoy</small>
        </article>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <h2>Registros de hoy</h2>
            <p>Marca “Ha vuelto” cuando el alumno regrese.</p>
          </div>
        </div>
        ${recordsTableTemplate(teacherRecords, true)}
      </section>
    </main>
  `;

  bindHeader();
  document.querySelector('#record-form').addEventListener('submit', (event) => {
    event.preventDefault();
    addRecord(document.querySelector('#student-name').value);
  });

  document.querySelectorAll('[data-return-id]').forEach((button) => {
    button.addEventListener('click', () => markReturned(button.dataset.returnId));
  });
}

function renderAdminPanel() {
  const activeCount = state.records.filter((record) => record.status === 'out').length;
  const teachers = state.teachers
    .map(
      (teacher) => `
        <li>
          <span>${escapeHtml(teacher)}</span>
          <button class="danger" data-delete-teacher="${escapeHtml(teacher)}" type="button">Borrar</button>
        </li>`,
    )
    .join('');
  const recordsJson = encodeURIComponent(JSON.stringify(state.records, null, 2));

  app.innerHTML = `
    <main class="app-shell">
      ${headerTemplate('Panel de administrador', 'Gestiona perfiles y consulta todos los detalles')}

      <section class="grid three-columns">
        ${statTemplate('Profesores', state.teachers.length)}
        ${statTemplate('Registros guardados', state.records.length)}
        ${statTemplate('Alumnos sin volver', activeCount)}
      </section>

      <section class="grid two-columns admin-grid">
        <article class="panel">
          <h2>Perfiles de profesores</h2>
          <form id="teacher-form" class="inline-form compact">
            <input id="new-teacher" placeholder="Nuevo profesor" />
            <button class="primary" type="submit">Añadir</button>
          </form>
          <ul class="teacher-list">${teachers}</ul>
        </article>

        <article class="panel info-panel">
          <h2>Preparado para crecer</h2>
          <p>Ahora los datos se guardan en este navegador con localStorage. La lógica está separada para poder cambiarla más adelante por una base de datos compartida como Supabase, Firebase o PostgreSQL.</p>
          <a class="secondary link-button" href="data:application/json;charset=utf-8,${recordsJson}" download="registros-banos.json">Descargar registros JSON</a>
        </article>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <h2>Todos los detalles</h2>
            <p>Incluye profesor, alumno, fecha, hora de salida, regreso y estado.</p>
          </div>
        </div>
        ${recordsTableTemplate(state.records)}
      </section>
    </main>
  `;

  bindHeader();
  document.querySelector('#teacher-form').addEventListener('submit', (event) => {
    event.preventDefault();
    addTeacher(document.querySelector('#new-teacher').value);
  });

  document.querySelectorAll('[data-delete-teacher]').forEach((button) => {
    button.addEventListener('click', () => deleteTeacher(button.dataset.deleteTeacher));
  });
}

function headerTemplate(title, subtitle) {
  return `
    <header class="topbar">
      <div>
        <div class="eyebrow">Baños Registros</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <button class="secondary" id="logout" type="button">Cerrar sesión</button>
    </header>
  `;
}

function bindHeader() {
  document.querySelector('#logout').addEventListener('click', logout);
}

function statTemplate(title, value) {
  return `
    <article class="panel stat-panel">
      <span>${title}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function recordsTableTemplate(records, withActions = false) {
  if (!records.length) {
    return '<p class="empty-state">Todavía no hay registros guardados.</p>';
  }

  const rows = records
    .map(
      (record) => `
        <tr>
          <td>${escapeHtml(record.studentName)}</td>
          <td>${escapeHtml(record.teacherName)}</td>
          <td>${formatDateTime(record.departureAt)}</td>
          <td>${record.returnedAt ? formatDateTime(record.returnedAt) : 'Pendiente'}</td>
          <td><span class="status ${record.status}">${record.status === 'out' ? 'Fuera' : 'Ha vuelto'}</span></td>
          ${
            withActions
              ? `<td>${
                  record.status === 'out'
                    ? `<button class="success" data-return-id="${record.id}" type="button">Ha vuelto</button>`
                    : '<span class="muted">Completado</span>'
                }</td>`
              : ''
          }
        </tr>`,
    )
    .join('');

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Profesor</th>
            <th>Salida</th>
            <th>Regreso</th>
            <th>Estado</th>
            ${withActions ? '<th>Acción</th>' : ''}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

render();
