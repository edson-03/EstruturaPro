// ============================================================
//  EstruturaPRO — Teacher Dashboard Logic
// ============================================================

let currentTeacher = null;
let currentDetailStudentId = null;

document.addEventListener('DOMContentLoaded', () => {
  initDB();
  const session = getSession();
  if (!session || session.role !== 'teacher') {
    window.location.href = 'index.html';
    return;
  }
  currentTeacher = getUserById(session.userId);
  if (!currentTeacher) { clearSession(); window.location.href = 'index.html'; return; }

  initTeacherUI();
});

// ── Init ──────────────────────────────────────────────────
function initTeacherUI() {
  // User info
  const { name, avatar, avatarColor } = currentTeacher;
  document.getElementById('sidebar-avatar').textContent = avatar;
  document.getElementById('sidebar-avatar').style.background = avatarColor;
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('header-avatar').textContent = avatar;
  document.getElementById('header-avatar').style.background = avatarColor;
  document.getElementById('header-name').textContent = name.split(' ').slice(0,2).join(' ');

  setupNavigation();
  setupEventListeners();
  renderOverview();
}

// ── Navigation ────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.t-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view, studentId = null) {
  // Hide all views
  document.getElementById('view-overview').style.display        = 'none';
  document.getElementById('view-modules').style.display         = 'none';
  document.getElementById('view-student-detail').style.display  = 'none';
  if (document.getElementById('view-create-activity')) {
    document.getElementById('view-create-activity').style.display = 'none';
  }
  if (document.getElementById('view-students')) {
    document.getElementById('view-students').style.display = 'none';
  }

  // Deactivate nav
  document.querySelectorAll('.t-nav-item').forEach(n => n.classList.remove('active'));

  switch (view) {
    case 'overview':
      document.getElementById('view-overview').style.display = 'block';
      document.getElementById('nav-overview').classList.add('active');
      document.getElementById('header-title').textContent = 'Visão Geral da Turma';
      document.getElementById('header-subtitle').textContent = 'Acompanhe o progresso dos seus alunos';
      renderOverview();
      break;

    case 'modules':
      document.getElementById('view-modules').style.display = 'block';
      document.getElementById('nav-modules').classList.add('active');
      document.getElementById('header-title').textContent = 'Gerenciar Módulos';
      document.getElementById('header-subtitle').textContent = 'Libere ou bloqueie módulos por aluno';
      renderAccessMatrix();
      break;

    case 'create-activity':
      document.getElementById('view-create-activity').style.display = 'block';
      document.getElementById('nav-create-activity').classList.add('active');
      document.getElementById('header-title').textContent = 'Criar Atividade';
      document.getElementById('header-subtitle').textContent = 'Monte uma nova lista de exercícios';
      initCreateActivityView();
      break;

    case 'student-detail':
      document.getElementById('view-student-detail').style.display = 'block';
      document.getElementById('header-title').textContent = 'Detalhes do Aluno';
      document.getElementById('header-subtitle').textContent = 'Progresso detalhado e histórico de atividades';
      if (studentId) renderStudentDetail(studentId);
      break;

    case 'students':
      document.getElementById('view-students').style.display = 'block';
      document.getElementById('nav-students').classList.add('active');
      document.getElementById('header-title').textContent = 'Gerenciar Alunos';
      document.getElementById('header-subtitle').textContent = 'Cadastre e gerencie os alunos da turma';
      initStudentsView();
      break;
  }

  // Mobile: close sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ── Overview ──────────────────────────────────────────────
function renderOverview() {
  // Stats
  const stats = getOverallStats();
  document.getElementById('stat-total-students').textContent  = stats.totalStudents;
  document.getElementById('stat-total-completions').textContent = stats.totalCompletions;
  document.getElementById('stat-avg-rate').textContent = stats.avgCompletionRate + '%';
  document.getElementById('stat-total-modules').textContent   = stats.totalModules;

  // Students table
  renderStudentsTable();

  // Module completion overview
  renderModuleCompletionGrid();
}

function renderStudentsTable() {
  const students = getStudents();
  const tbody = document.getElementById('students-tbody');
  const allProgress = getAllProgress();

  document.getElementById('students-count-badge').textContent = `${students.length} alunos`;

  tbody.innerHTML = '';
  students.forEach(student => {
    const stats = getStudentStats(student.id);
    const pct   = Math.round((stats.completed / stats.total) * 100);

    const lastAccess = allProgress[student.id]?._lastAccess;
    const lastAccessStr = lastAccess
      ? formatRelativeTime(lastAccess)
      : 'Nunca acessou';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="s-avatar" style="background:${student.avatarColor};">${student.avatar}</div>
          <div>
            <div class="s-name">${student.name}</div>
            <div class="s-email">${student.email}</div>
          </div>
        </div>
      </td>
      <td class="progress-cell">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%;${pct===100?'background:var(--green);':''}" ></div>
        </div>
        <div class="progress-label">
          <span>${pct}%</span>
          <span>${stats.completed}/${stats.total}</span>
        </div>
      </td>
      <td>
        <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
          <span class="badge badge-primary">${stats.unlocked} liberados</span>
          <span class="badge badge-success">${stats.completed} concluídos</span>
        </div>
      </td>
      <td>
        <span style="font-weight:700;color:${stats.avgScore>=70?'var(--green)':stats.avgScore>=40?'var(--yellow)':'var(--text-muted)'}">
          ${stats.completed > 0 ? stats.avgScore + '%' : '—'}
        </span>
      </td>
      <td>
        <span style="font-size:0.82rem;color:var(--text-muted);">${lastAccessStr}</span>
      </td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-sm btn-ghost view-detail-btn" data-student-id="${student.id}" title="Ver detalhes">
            👁️ Ver
          </button>
          <button class="btn btn-sm" style="background:rgba(99,102,241,0.15);color:var(--accent-light);border:1px solid rgba(99,102,241,0.25);font-size:0.75rem;" 
            data-student-id="${student.id}" title="Gerenciar módulos" class="manage-btn">
            🔓
          </button>
        </div>
      </td>
    `;

    tr.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        switchView('student-detail', student.id);
      }
    });

    tr.querySelector('.view-detail-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      switchView('student-detail', student.id);
    });

    const manageBtn = tr.querySelector('[title="Gerenciar módulos"]');
    manageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      switchView('modules');
    });

    tbody.appendChild(tr);
  });
}

function renderModuleCompletionGrid() {
  const grid = document.getElementById('module-completion-grid');
  const modules = getModules();
  const students = getStudents();
  const allProgress = getAllProgress();

  grid.innerHTML = '';
  modules.forEach(mod => {
    const completedCount = students.filter(s => allProgress[s.id]?.[mod.id]?.completed).length;
    const accessCount    = students.filter(s => getStudentModuleAccess(s.id).includes(mod.id)).length;
    const pct = accessCount > 0 ? Math.round((completedCount / accessCount) * 100) : 0;

    const div = document.createElement('div');
    div.className = 'card';
    div.style.padding = '1rem';
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
        <div style="width:36px;height:36px;border-radius:8px;background:${mod.gradient};display:flex;align-items:center;justify-content:center;font-size:1rem;">${mod.emoji}</div>
        <div>
          <div style="font-size:0.85rem;font-weight:700;">${mod.title}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">${mod.difficulty}</div>
        </div>
        <div style="margin-left:auto;font-weight:800;font-size:1.1rem;color:${pct>=70?'var(--green)':pct>=40?'var(--yellow)':'var(--text-muted)'};">${pct}%</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${mod.gradient};"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:0.4rem;font-size:0.72rem;color:var(--text-muted);">
        <span>${completedCount}/${accessCount} alunos com acesso</span>
        <span>${completedCount} concluídos</span>
      </div>
    `;
    grid.appendChild(div);
  });
}

// ── Access Matrix ─────────────────────────────────────────
function renderAccessMatrix() {
  const students = getStudents();
  const modules  = getModules();
  const table    = document.getElementById('access-table');

  // Header row
  const thead = `
    <thead>
      <tr>
        <th>Aluno</th>
        ${modules.map(m => `
          <th>
            <div class="module-header-cell">
              <span class="module-col-icon">${m.emoji}</span>
              <span class="module-col-name">${m.title.split(' ')[0]}</span>
            </div>
          </th>
        `).join('')}
        <th>Ações</th>
      </tr>
    </thead>
  `;

  // Body rows
  const rows = students.map(student => {
    const access = getStudentModuleAccess(student.id);
    const cells = modules.map(mod => {
      const checked = access.includes(mod.id) ? 'checked' : '';
      return `
        <td>
          <div class="toggle-wrap">
            <label class="access-toggle" title="${mod.title}">
              <input type="checkbox" ${checked}
                data-student-id="${student.id}"
                data-module-id="${mod.id}"
                class="access-checkbox">
              <span class="access-slider"></span>
            </label>
          </div>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td>
          <div class="student-row-info">
            <div class="s-avatar" style="background:${student.avatarColor};width:30px;height:30px;font-size:0.65rem;">${student.avatar}</div>
            <div>
              <div style="font-size:0.83rem;font-weight:600;">${student.name.split(' ')[0]} ${student.name.split(' ').slice(-1)[0]}</div>
            </div>
          </div>
        </td>
        ${cells}
        <td>
          <div style="display:flex;gap:0.35rem;">
            <button class="btn btn-sm" style="font-size:0.72rem;padding:0.3rem 0.6rem;background:rgba(16,185,129,0.1);color:var(--green);border:1px solid rgba(16,185,129,0.2);"
              data-action="unlock-all" data-student-id="${student.id}">Liberar tudo</button>
            <button class="btn btn-sm" style="font-size:0.72rem;padding:0.3rem 0.6rem;background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.2);"
              data-action="lock-all" data-student-id="${student.id}">Bloquear tudo</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  table.innerHTML = thead + `<tbody>${rows}</tbody>`;

  // Bind checkbox events
  table.querySelectorAll('.access-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const { studentId, moduleId } = e.target.dataset;
      toggleModuleAccess(studentId, moduleId);
      const mod = getModuleById(moduleId);
      const student = getUserById(studentId);
      if (e.target.checked) {
        showToast(`🔓 "${mod.title}" liberado para ${student.name.split(' ')[0]}`, 'success');
      } else {
        showToast(`🔒 "${mod.title}" bloqueado para ${student.name.split(' ')[0]}`, 'warning');
      }
    });
  });

  // Bind row action buttons
  table.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { action, studentId } = btn.dataset;
      const student = getUserById(studentId);
      if (action === 'unlock-all') {
        const allIds = getModules().map(m => m.id);
        setStudentModuleAccess(studentId, allIds);
        showToast(`🔓 Todos os módulos liberados para ${student.name.split(' ')[0]}`, 'success');
      } else if (action === 'lock-all') {
        setStudentModuleAccess(studentId, []);
        showToast(`🔒 Todos os módulos bloqueados para ${student.name.split(' ')[0]}`, 'warning');
      }
      renderAccessMatrix();
    });
  });
}

// ── Student Detail ────────────────────────────────────────
function renderStudentDetail(studentId) {
  currentDetailStudentId = studentId;
  const student  = getUserById(studentId);
  const stats    = getStudentStats(studentId);
  const progress = getStudentProgress(studentId);
  const access   = getStudentModuleAccess(studentId);
  const modules  = getModules();
  const log      = getActivityLog()[studentId] || [];

  // Header
  document.getElementById('detail-avatar').textContent = student.avatar;
  document.getElementById('detail-avatar').style.background = student.avatarColor;
  document.getElementById('detail-name').textContent  = student.name;
  document.getElementById('detail-email').textContent = student.email;

  // Stats
  document.getElementById('det-completed').textContent = stats.completed;
  document.getElementById('det-unlocked').textContent  = stats.unlocked;
  document.getElementById('det-score').textContent     = stats.completed > 0 ? stats.avgScore + '%' : '—';

  // Module cards
  const mgGrid = document.getElementById('detail-modules-grid');
  mgGrid.innerHTML = '';
  modules.forEach(mod => {
    const unlocked  = access.includes(mod.id);
    const prog      = progress[mod.id] || {};
    const completed = prog.completed;

    const card = document.createElement('div');
    card.className = `detail-module-card ${completed ? 'completed' : unlocked ? 'unlocked' : ''}`;

    let statusIcon = unlocked ? (completed ? '✅' : '🔄') : '🔒';
    let statusText = unlocked ? (completed ? 'Concluído' : prog.started ? 'Em andamento' : 'Iniciado') : 'Bloqueado';
    let statusColor = completed ? 'var(--green)' : unlocked ? 'var(--accent-light)' : 'var(--text-muted)';

    card.innerHTML = `
      <div class="dm-top">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:32px;height:32px;border-radius:8px;background:${mod.gradient};display:flex;align-items:center;justify-content:center;font-size:0.9rem;">${mod.emoji}</div>
        </div>
        <label class="access-toggle" title="Toggle acesso">
          <input type="checkbox" ${unlocked ? 'checked' : ''}
            class="det-access-cb" data-student-id="${studentId}" data-module-id="${mod.id}">
          <span class="access-slider"></span>
        </label>
      </div>
      <div class="dm-title">${mod.title}</div>
      <div class="dm-status" style="color:${statusColor};">${statusIcon} ${statusText}</div>
      ${completed ? `
        <div class="dm-score" style="color:${prog.score >= 70 ? 'var(--green)' : 'var(--yellow)'}">
          ${prog.score}% no quiz
        </div>
        ${prog.completedAt ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem;">${formatRelativeTime(prog.completedAt)}</div>` : ''}
      ` : `
        <div class="progress-bar" style="margin-top:0.75rem;">
          <div class="progress-fill" style="width:${completed?100:prog.started?20:0}%;background:${mod.gradient};"></div>
        </div>
      `}
    `;

    card.querySelector('.det-access-cb').addEventListener('change', (e) => {
      const { studentId, moduleId } = e.target.dataset;
      toggleModuleAccess(studentId, moduleId);
      const m = getModuleById(moduleId);
      if (e.target.checked) {
        showToast(`🔓 "${m.title}" liberado`, 'success');
      } else {
        showToast(`🔒 "${m.title}" bloqueado`, 'warning');
      }
      renderStudentDetail(studentId);
    });

    mgGrid.appendChild(card);
  });

  // Activity cards
  const actGrid = document.getElementById('detail-activities-grid');
  if (actGrid) {
    actGrid.innerHTML = '';
    const activities = getActivities();
    const studentAnswers = getStudentAnswers(studentId);
    
    if (activities.length === 0) {
      actGrid.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;padding:1rem;grid-column:1/-1;">Nenhuma atividade cadastrada no sistema.</div>`;
    } else {
      activities.forEach(act => {
        const answers = studentAnswers[act.id] || {};
        const answeredCount = Object.keys(answers).length;
        const totalCount = act.questions.length;
        const isDone = answeredCount === totalCount && totalCount > 0;
        const score = isDone ? getStudentActivityScore(studentId, act.id) : 0;
        
        const card = document.createElement('div');
        card.className = `detail-module-card ${isDone ? 'completed' : 'unlocked'}`;
        card.style.padding = '1rem';
        
        card.innerHTML = `
          <div style="font-size:0.85rem;font-weight:700;margin-bottom:0.25rem;">${act.title}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">
            📚 Módulo: ${act.moduleId ? (getModuleById(act.moduleId)?.title || act.moduleId) : 'Nenhum'}
          </div>
          <div style="font-size:0.78rem;color:${isDone ? 'var(--green)' : 'var(--yellow)'};font-weight:600;">
            ${isDone ? `Concluída (${score}% de acerto)` : answeredCount > 0 ? `Em andamento (${answeredCount}/${totalCount} resp.)` : 'Não resolvida'}
          </div>
        `;
        actGrid.appendChild(card);
      });
    }
  }

  // Activity log
  const actList = document.getElementById('activity-list');
  actList.innerHTML = '';
  if (!log.length) {
    actList.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;padding:1rem;">Nenhuma atividade registrada.</div>`;
  } else {
    log.slice(0, 10).forEach(entry => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-dot"></div>
        <span class="activity-msg">${entry.message}</span>
        <span class="activity-time">${formatRelativeTime(entry.timestamp)}</span>
      `;
      actList.appendChild(item);
    });
  }

  // Unlock all button
  document.getElementById('detail-unlock-all').onclick = () => {
    const allIds = getModules().map(m => m.id);
    setStudentModuleAccess(studentId, allIds);
    showToast(`🔓 Todos os módulos liberados para ${student.name.split(' ')[0]}!`, 'success');
    renderStudentDetail(studentId);
  };

  document.getElementById('btn-back-overview').onclick = () => switchView('overview');
}

// ── Event Listeners ───────────────────────────────────────
function setupEventListeners() {
  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  // Mobile sidebar
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('visible');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  });

  // Export Report
  document.getElementById('btn-export').addEventListener('click', exportReport);

  // Bulk actions
  document.getElementById('btn-unlock-all-all').addEventListener('click', () => {
    const students = getStudents();
    const allIds = getModules().map(m => m.id);
    students.forEach(s => setStudentModuleAccess(s.id, allIds));
    showToast('🔓 Todos os módulos liberados para todos os alunos!', 'success');
    renderAccessMatrix();
  });

  document.getElementById('btn-lock-all-all').addEventListener('click', () => {
    const students = getStudents();
    students.forEach(s => setStudentModuleAccess(s.id, []));
    showToast('🔒 Todos os módulos bloqueados para todos os alunos.', 'warning');
    renderAccessMatrix();
  });

  document.getElementById('btn-unlock-first').addEventListener('click', () => {
    const students = getStudents();
    const firstId = getModules()[0].id;
    students.forEach(s => {
      const access = getStudentModuleAccess(s.id);
      if (!access.includes(firstId)) {
        access.push(firstId);
        setStudentModuleAccess(s.id, access);
      }
    });
    showToast(`📖 Módulo "${getModules()[0].title}" liberado para todos!`, 'success');
    renderAccessMatrix();
  });
}

// ── Export Report ─────────────────────────────────────────
function exportReport() {
  const students = getStudents();
  const modules  = getModules();
  const now      = new Date().toLocaleString('pt-BR');

  let report = `EstruturaPRO — Relatório da Turma\n`;
  report    += `Gerado em: ${now}\n`;
  report    += `${'='.repeat(50)}\n\n`;

  students.forEach(student => {
    const stats    = getStudentStats(student.id);
    const progress = getStudentProgress(student.id);
    const access   = getStudentModuleAccess(student.id);

    report += `Aluno: ${student.name}\n`;
    report += `Email: ${student.email}\n`;
    report += `Módulos Liberados: ${stats.unlocked}/${stats.total}\n`;
    report += `Módulos Concluídos: ${stats.completed}/${stats.total}\n`;
    if (stats.completed > 0) report += `Média dos Quizzes: ${stats.avgScore}%\n`;
    report += `\nDetalhes por Módulo:\n`;

    modules.forEach(mod => {
      const unlocked  = access.includes(mod.id);
      const prog      = progress[mod.id] || {};
      const status    = prog.completed ? `Concluído (${prog.score}%)` : prog.started ? 'Em andamento' : unlocked ? 'Liberado, não iniciado' : 'Bloqueado';
      report += `  - ${mod.title}: ${status}\n`;
    });
    report += `\n${'─'.repeat(40)}\n\n`;
  });

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `estruturapro_relatorio_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Relatório exportado com sucesso!', 'success');
}

// ── Utilities ─────────────────────────────────────────────
function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'agora mesmo';
  if (mins < 60)  return `há ${mins} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
//  ✏️ Criar Atividade Logic
// ============================================================
let caInitialized = false;
const editorInstances = {};

function initCreateActivityView() {
  if (caInitialized) return;
  caInitialized = true;

  // Load modules select dropdown dynamically
  const moduleSelect = document.getElementById('act-module');
  if (moduleSelect) {
    moduleSelect.innerHTML = '<option value="">— Nenhum —</option>';
    getModules().forEach(mod => {
      const opt = document.createElement('option');
      opt.value = mod.id;
      opt.textContent = mod.title;
      moduleSelect.appendChild(opt);
    });
  }

  // Setup buttons
  document.getElementById('btn-add-theoretical').addEventListener('click', () => addQuestion('theoretical'));
  document.getElementById('btn-add-practical').addEventListener('click', () => addQuestion('practical'));
  document.getElementById('btn-ca-reset').addEventListener('click', resetCreateActivityForm);
  document.getElementById('btn-ca-preview').addEventListener('click', previewActivity);
  
  // Modal close
  document.getElementById('btn-close-preview').addEventListener('click', closePreviewModal);
  document.getElementById('btn-close-preview-2').addEventListener('click', closePreviewModal);

  // Submit form
  document.getElementById('activity-form').addEventListener('submit', saveActivitySubmit);
}

function addQuestion(type) {
  // Hide empty state
  document.getElementById('ca-empty-state').style.display = 'none';

  const qId = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const qNum = document.querySelectorAll('.ca-question-card').length + 1;

  const card = document.createElement('div');
  card.className = 'ca-question-card';
  card.id = qId;
  card.dataset.type = type;

  let content = '';

  if (type === 'theoretical') {
    content = `
      <button type="button" class="ca-q-remove" onclick="removeQuestionCard('${qId}')" title="Remover Pergunta">✕</button>
      <div class="ca-q-title-row">
        <span class="ca-q-number">${qNum}</span>
        <span class="ca-q-type-icon">📖</span>
        <span class="ca-q-type-label">Pergunta Teórica (Múltipla Escolha)</span>
      </div>
      <div class="ca-field ca-field-full">
        <label class="ca-label">Enunciado da Questão <span class="ca-required">*</span></label>
        <textarea class="ca-input ca-textarea q-prompt" placeholder="Digite a pergunta aqui..." required></textarea>
      </div>
      <div class="ca-options-grid">
        <div class="ca-opt-item">
          <span class="ca-opt-letter">A</span>
          <input type="text" class="ca-input q-opt-text" placeholder="Opção A" required style="flex:1;" />
          <input type="radio" name="correct_${qId}" value="0" class="ca-opt-correct-radio" checked title="Marcar como correta" />
        </div>
        <div class="ca-opt-item">
          <span class="ca-opt-letter">B</span>
          <input type="text" class="ca-input q-opt-text" placeholder="Opção B" required style="flex:1;" />
          <input type="radio" name="correct_${qId}" value="1" class="ca-opt-correct-radio" title="Marcar como correta" />
        </div>
        <div class="ca-opt-item">
          <span class="ca-opt-letter">C</span>
          <input type="text" class="ca-input q-opt-text" placeholder="Opção C" required style="flex:1;" />
          <input type="radio" name="correct_${qId}" value="2" class="ca-opt-correct-radio" title="Marcar como correta" />
        </div>
        <div class="ca-opt-item">
          <span class="ca-opt-letter">D</span>
          <input type="text" class="ca-input q-opt-text" placeholder="Opção D" required style="flex:1;" />
          <input type="radio" name="correct_${qId}" value="3" class="ca-opt-correct-radio" title="Marcar como correta" />
        </div>
      </div>
    `;
  } else if (type === 'practical') {
    content = `
      <button type="button" class="ca-q-remove" onclick="removeQuestionCard('${qId}')" title="Remover Pergunta">✕</button>
      <div class="ca-q-title-row">
        <span class="ca-q-number">${qNum}</span>
        <span class="ca-q-type-icon">💻</span>
        <span class="ca-q-type-label">Pergunta Prática (JavaScript)</span>
      </div>

      <div class="ca-field ca-field-full">
        <label class="ca-label">Instruções / Enunciado <span class="ca-required">*</span></label>
        <textarea class="ca-input ca-textarea q-prompt" placeholder="Descreva o que a função deve fazer, os parâmetros esperados e o valor de retorno..." required></textarea>
      </div>

      <!-- ▸ IDE Panel -->
      <div class="ide-wrapper" style="margin-top:1rem;">

        <!-- Toolbar -->
        <div class="ide-toolbar">
          <div class="ide-toolbar-dots">
            <div class="ide-dot ide-dot-red"></div>
            <div class="ide-dot ide-dot-yellow"></div>
            <div class="ide-dot ide-dot-green"></div>
          </div>
          <span class="ide-filename">solucao_${qNum}.js</span>
          <span class="ide-lang-badge">JS</span>
          <button type="button" class="ide-run-btn" id="run_${qId}" onclick="runPracticalQuestion('${qId}')">
            <span class="ide-run-icon">▶</span> Executar
          </button>
        </div>

        <!-- Editor area -->
        <div class="ide-editor-area">
          <textarea class="q-template-code" id="template_${qId}"></textarea>
        </div>

        <!-- Output panel -->
        <div class="ide-output-panel">
          <div class="ide-output-tabs">
            <div class="ide-tab active" id="tab-console-${qId}" onclick="switchIDETab('${qId}','console')">Console</div>
            <div class="ide-tab" id="tab-tests-${qId}"  onclick="switchIDETab('${qId}','tests')">Testes</div>
          </div>

          <!-- Console pane -->
          <div class="ide-output-pane active" id="pane-console-${qId}">
            <div class="ide-console-empty">// Execute o código para ver a saída aqui</div>
          </div>

          <!-- Test results pane -->
          <div class="ide-output-pane" id="pane-tests-${qId}">
            <div class="ide-console-empty">// Execute o código para ver os resultados dos testes</div>
          </div>
        </div>

        <!-- Test case inputs -->
        <div class="ide-testcase-input-section">
          <div class="ide-testcase-input-header">
            <span class="ide-testcase-input-title">📋 Casos de Teste (mínimo 1)</span>
            <button type="button" class="btn btn-sm btn-ghost" style="padding:0.25rem 0.65rem;font-size:0.7rem;" onclick="addTestCaseRow('${qId}')">+ Adicionar</button>
          </div>
          <div class="q-test-cases-list" id="testcases_${qId}">
            <!-- injected by addTestCaseRow -->
          </div>
        </div>

      </div><!-- /ide-wrapper -->
    `;
  }

  card.innerHTML = content;
  document.getElementById('questions-container').appendChild(card);

  // Initialize CodeMirror if practical
  if (type === 'practical') {
    const textarea = document.getElementById(`template_${qId}`);
    // Default template
    textarea.value = `function minhaFuncao(a, b) {\n  // Escreva sua solução aqui\n  return;\n}`;
    const editor = CodeMirror.fromTextArea(textarea, {
      mode: 'javascript',
      theme: 'dracula',
      lineNumbers: true,
      tabSize: 2,
      indentWithTabs: false,
      lineWrapping: false,
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      hintOptions: { completeSingle: false },
      extraKeys: {
        'Ctrl-Enter':  () => runPracticalQuestion(qId),
        'Cmd-Enter':   () => runPracticalQuestion(qId),
        'Ctrl-Space':  (cm) => cm.showHint({ hint: CodeMirror.hint.javascript }),
        'Ctrl-/':      (cm) => cm.toggleComment(),
        Tab: (cm) => {
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('  ', 'end');
        },
        'Shift-Tab': (cm) => cm.indentSelection('subtract')
      }
    });
    editorInstances[qId] = editor;

    // Add first test case row automatically
    addTestCaseRow(qId);
  }

  // Focus prompt
  card.querySelector('.q-prompt').focus();
}

function addTestCaseRow(qId, expression = '', expected = '') {
  const container = document.getElementById(`testcases_${qId}`);
  const rowId = 'tc_' + Date.now() + '_' + Math.floor(Math.random() * 100);
  
  const div = document.createElement('div');
  div.className = 'ca-test-case-row';
  div.id = rowId;
  div.innerHTML = `
    <input type="text" class="ca-input tc-expression" placeholder="Ex: minhaFuncao(2, 3)" value="${expression}" required />
    <span style="color:var(--text-muted);font-size:0.85rem;">===</span>
    <input type="text" class="ca-input tc-expected" placeholder="Resultado esperado. Ex: 5" value="${expected}" required />
    <button type="button" class="ca-test-case-remove" onclick="removeTestCaseRow('${rowId}')" title="Excluir caso de teste">✕</button>
  `;
  container.appendChild(div);
}

function removeTestCaseRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
}

function removeQuestionCard(qId) {
  const card = document.getElementById(qId);
  if (card) {
    card.remove();
    if (editorInstances[qId]) {
      delete editorInstances[qId];
    }
    recalculateQuestionNumbers();
  }
}

function recalculateQuestionNumbers() {
  const cards = document.querySelectorAll('.ca-question-card');
  if (cards.length === 0) {
    document.getElementById('ca-empty-state').style.display = 'block';
  } else {
    cards.forEach((card, idx) => {
      card.querySelector('.ca-q-number').textContent = idx + 1;
    });
  }
}

function readActivityForm() {
  const title = document.getElementById('act-title').value;
  const moduleId = document.getElementById('act-module').value;
  const deadline = document.getElementById('act-deadline').value;
  const description = document.getElementById('act-description').value;

  const questions = [];
  const cards = document.querySelectorAll('.ca-question-card');
  cards.forEach((card) => {
    const qId = card.id;
    const type = card.dataset.type;
    const prompt = card.querySelector('.q-prompt').value;

    if (type === 'theoretical') {
      const optionInputs = card.querySelectorAll('.q-opt-text');
      const options = Array.from(optionInputs).map(inp => inp.value);
      const correctRadio = card.querySelector(`input[name="correct_${qId}"]:checked`);
      const correct = correctRadio ? parseInt(correctRadio.value) : 0;
      
      questions.push({
        id: qId,
        type: 'theoretical',
        subtype: 'multiple',
        question: prompt,
        options: options,
        correct: correct
      });
    } else if (type === 'practical') {
      const editor = editorInstances[qId];
      const template = editor ? editor.getValue() : '';
      
      const tcRows = card.querySelectorAll('.ca-test-case-row');
      const testCases = Array.from(tcRows).map(row => {
        return {
          expression: row.querySelector('.tc-expression').value,
          expected: row.querySelector('.tc-expected').value
        };
      });

      questions.push({
        id: qId,
        type: 'practical',
        question: prompt,
        template: template,
        testCases: testCases
      });
    }
  });

  return {
    title,
    moduleId,
    deadline,
    description,
    questions
  };
}

function renderActivityPreview(activity) {
  const body = document.getElementById('ca-preview-body');
  
  let html = `
    <div class="cap-title">${activity.title || 'Atividade Sem Título'}</div>
    <div class="cap-meta">
      <span>📚 Módulo: ${activity.moduleId ? (getModuleById(activity.moduleId)?.title || activity.moduleId) : 'Nenhum'}</span>
      <span>📅 Prazo: ${activity.deadline ? new Date(activity.deadline).toLocaleString('pt-BR') : 'Sem prazo'}</span>
      <span>❓ Questões: ${activity.questions.length}</span>
    </div>
    ${activity.description ? `<div class="cap-desc">${activity.description}</div>` : ''}
  `;

  if (!activity.questions.length) {
    html += `<div style="text-align:center;color:var(--text-muted);padding:1.5rem;">Nenhuma pergunta criada.</div>`;
  } else {
    activity.questions.forEach((q, idx) => {
      html += `
        <div class="cap-q-card">
          <div class="cap-q-num">Questão ${idx + 1} — ${q.type === 'theoretical' ? 'Teórica' : 'Prática'}</div>
          <div class="cap-q-text">${q.question || 'Sem enunciado'}</div>
      `;

      if (q.type === 'theoretical') {
        html += `<div class="cap-options">`;
        q.options.forEach((opt, oIdx) => {
          const isCorrect = oIdx === q.correct;
          html += `
            <div class="cap-option-btn ${isCorrect ? 'correct' : ''}">
              <span class="cap-option-badge">${['A','B','C','D'][oIdx]}</span>
              <span>${opt || `Opção ${['A','B','C','D'][oIdx]}`}</span>
              ${isCorrect ? '<span style="margin-left:auto;font-size:0.8rem;font-weight:700;">Correta</span>' : ''}
            </div>
          `;
        });
        html += `</div>`;
      } else if (q.type === 'practical') {
        html += `
          <div class="cap-practical-label">Código Inicial:</div>
          <pre class="code-block" style="background:#0a0c17;padding:0.75rem;border-radius:6px;font-family:var(--font-mono);font-size:0.8rem;color:#e2e8f0;margin-bottom:1rem;overflow-x:auto;">${q.template}</pre>
          <div class="cap-practical-label">Casos de Teste Assertivos:</div>
          <div style="background:rgba(0,0,0,0.25);padding:0.75rem;border-radius:6px;border:1px solid var(--border);">
            ${q.testCases.map(tc => `
              <div style="font-family:var(--font-mono);font-size:0.78rem;margin:0.25rem 0;display:flex;gap:0.5rem;align-items:center;">
                <span style="color:var(--accent-light);">${tc.expression}</span> 
                <span style="color:var(--text-secondary);">===</span> 
                <span style="color:var(--green-light);">${tc.expected}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      html += `</div>`;
    });
  }

  body.innerHTML = html;
}

function previewActivity() {
  const activity = readActivityForm();
  renderActivityPreview(activity);
  
  const modal = document.getElementById('ca-preview-modal');
  modal.classList.add('open');
}

function closePreviewModal() {
  const modal = document.getElementById('ca-preview-modal');
  modal.classList.remove('open');
}

function saveActivitySubmit(e) {
  e.preventDefault();
  
  const cards = document.querySelectorAll('.ca-question-card');
  if (cards.length === 0) {
    showToast('⚠️ Adicione pelo menos uma pergunta à atividade!', 'warning');
    return;
  }

  const activity = readActivityForm();
  activity.id = 'act_' + Date.now();
  activity.createdAt = new Date().toISOString();
  activity.createdBy = currentTeacher.id;

  saveActivity(activity);
  showToast('💾 Atividade criada e salva com sucesso!', 'success');

  // Notify students in activity logs
  const students = getStudents();
  students.forEach(s => {
    logActivity(s.id, `Nova atividade "${activity.title}" foi publicada!`);
  });

  resetCreateActivityForm();
  switchView('overview');
}

function resetCreateActivityForm() {
  document.getElementById('activity-form').reset();
  
  const cards = document.querySelectorAll('.ca-question-card');
  cards.forEach(card => {
    const qId = card.id;
    if (editorInstances[qId]) {
      delete editorInstances[qId];
    }
    card.remove();
  });
  
  document.getElementById('ca-empty-state').style.display = 'block';
  showToast('🗑️ Formulário redefinido com sucesso.', 'info');
}

// ── IDE: Switch tabs ────────────────────────────────────────
function switchIDETab(qId, tab) {
  const consoleTab = document.getElementById(`tab-console-${qId}`);
  const testsTab   = document.getElementById(`tab-tests-${qId}`);
  const consolePane = document.getElementById(`pane-console-${qId}`);
  const testsPane   = document.getElementById(`pane-tests-${qId}`);

  if (!consoleTab) return;

  consoleTab.classList.toggle('active', tab === 'console');
  testsTab.classList.toggle('active',   tab === 'tests');
  consolePane.classList.toggle('active', tab === 'console');
  testsPane.classList.toggle('active',   tab === 'tests');
}

// ── IDE: Run code and validate test cases ──────────────────
function runPracticalQuestion(qId) {
  const editor = editorInstances[qId];
  if (!editor) return;

  const runBtn = document.getElementById(`run_${qId}`);
  const consolePane = document.getElementById(`pane-console-${qId}`);
  const testsPane   = document.getElementById(`pane-tests-${qId}`);
  if (!consolePane || !testsPane) return;

  // Collect test case inputs
  const card    = document.getElementById(qId);
  const tcRows  = card ? card.querySelectorAll('.ca-test-case-row') : [];
  const tests   = Array.from(tcRows).map(row => ({
    expression: row.querySelector('.tc-expression')?.value?.trim() || '',
    expected:   row.querySelector('.tc-expected')?.value?.trim()   || ''
  })).filter(t => t.expression);

  // Animate run button
  if (runBtn) {
    runBtn.classList.add('running');
    runBtn.innerHTML = '<span class="ide-run-icon">⏳</span> Executando...';
  }

  // Capture console output
  const logs = [];
  const fakeConsole = {
    log:   (...args) => logs.push({ type: 'log',   msg: args.map(safeStringify).join(' ') }),
    warn:  (...args) => logs.push({ type: 'warn',  msg: args.map(safeStringify).join(' ') }),
    error: (...args) => logs.push({ type: 'error', msg: args.map(safeStringify).join(' ') }),
    info:  (...args) => logs.push({ type: 'info',  msg: args.map(safeStringify).join(' ') })
  };

  const code = editor.getValue();
  let execError = null;
  let sandboxFn = null;

  try {
    // Build sandbox function that exposes fakeConsole
    // eslint-disable-next-line no-new-func
    sandboxFn = new Function('console', code + '\n; return typeof minhaFuncao !== "undefined" ? minhaFuncao : undefined;');
    sandboxFn = sandboxFn(fakeConsole);
  } catch (err) {
    execError = err;
    logs.push({ type: 'error', msg: '⛔ Erro de compilação: ' + err.message });
  }

  // ── Render Console ──
  if (logs.length === 0 && !execError) {
    consolePane.innerHTML = '<div class="ide-console-empty">// sem saída de console</div>';
  } else {
    consolePane.innerHTML = logs.map(l => `
      <div class="ide-console-line ${l.type}">
        <span class="ide-console-prompt">›</span>
        <span>${escapeHtml(l.msg)}</span>
      </div>
    `).join('');
  }

  // ── Run Test Cases ──
  let passCount = 0;
  let failCount = 0;
  const testResults = tests.map(tc => {
    if (execError || typeof sandboxFn !== 'function') {
      return { ...tc, status: 'error', got: execError ? execError.message : 'Função não encontrada' };
    }
    try {
      // We need to run the full code so user-defined functions are in scope
      // Re-run with the test expression appended
      // eslint-disable-next-line no-new-func
      const evalFn = new Function('console', code + '\n; return (' + tc.expression + ');');
      const got = evalFn(fakeConsole);
      const gotStr      = safeStringify(got);
      const expectedStr = tc.expected.trim();
      // Try numeric & strict string comparison
      let pass = false;
      try {
        // eslint-disable-next-line no-eval
        const expectedVal = JSON.parse(expectedStr);
        pass = JSON.stringify(got) === JSON.stringify(expectedVal);
      } catch {
        pass = gotStr === expectedStr;
      }
      if (pass) passCount++; else failCount++;
      return { ...tc, status: pass ? 'pass' : 'fail', got: gotStr };
    } catch (err) {
      failCount++;
      return { ...tc, status: 'fail', got: '⛔ ' + err.message };
    }
  });

  // ── Render Test Pane ──
  if (tests.length === 0) {
    testsPane.innerHTML = '<div class="ide-console-empty">// Adicione casos de teste para validar sua solução.</div>';
  } else {
    let html = `<div class="ide-tests-summary">`;
    html += `<span class="pass-count">✓ ${passCount} passou${passCount !== 1 ? 'ram' : ''}</span>`;
    if (failCount > 0) html += `<span class="fail-count">✗ ${failCount} falhou${failCount !== 1 ? 'ram' : ''}</span>`;
    html += `<span style="color:var(--text-muted);">(${tests.length} total)</span></div>`;

    html += testResults.map(r => {
      const statusClass = r.status === 'pass' ? 'pass' : 'fail';
      const statusIcon  = r.status === 'pass' ? '✓' : '✗';
      let rowHtml = `
        <div class="ide-test-case-row">
          <div class="ide-tc-status ${statusClass}">${statusIcon}</div>
          <span class="ide-tc-expr" title="${escapeHtml(r.expression)}">${escapeHtml(r.expression)}</span>
          <span class="ide-tc-sep">===</span>
          <span class="ide-tc-expected">${escapeHtml(r.expected)}</span>
      `;
      if (r.status === 'fail' && r.got !== undefined) {
        rowHtml += `<span class="ide-tc-sep" style="margin-left:0.25rem;">obtido:</span><span class="ide-tc-got">${escapeHtml(String(r.got))}</span>`;
      }
      rowHtml += `</div>`;
      return rowHtml;
    }).join('');

    testsPane.innerHTML = html;
  }

  // Switch to correct tab based on result
  if (tests.length > 0) {
    switchIDETab(qId, 'tests');
  } else {
    switchIDETab(qId, 'console');
  }

  // Restore run button
  setTimeout(() => {
    if (runBtn) {
      runBtn.classList.remove('running');
      runBtn.innerHTML = '<span class="ide-run-icon">▶</span> Executar';
    }
  }, 400);
}

function safeStringify(val) {
  if (val === undefined) return 'undefined';
  if (val === null)      return 'null';
  try { return JSON.stringify(val); } catch { return String(val); }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Bind globally for inline event handlers
window.removeQuestionCard = removeQuestionCard;
window.addTestCaseRow = addTestCaseRow;
window.removeTestCaseRow = removeTestCaseRow;
window.runPracticalQuestion = runPracticalQuestion;
window.switchIDETab = switchIDETab;

// ============================================================
//  👥 Gerenciar Alunos Logic
// ============================================================
let studentsViewInitialized = false;

function initStudentsView() {
  renderStudentsManagementTable();

  if (studentsViewInitialized) return;
  studentsViewInitialized = true;

  // Avatar preview on color change
  document.getElementById('stud-color').addEventListener('input', (e) => {
    document.getElementById('stud-avatar-preview').style.background = e.target.value;
  });
  document.getElementById('stud-name').addEventListener('input', (e) => {
    const initials = e.target.value.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
    document.getElementById('stud-avatar-preview').textContent = initials || 'AL';
  });

  // Manual register form
  document.getElementById('student-register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('stud-name').value.trim();
    const email = document.getElementById('stud-email').value.trim();
    const password = document.getElementById('stud-password').value.trim() || '1234';
    const avatarColor = document.getElementById('stud-color').value;

    const result = addStudent({ name, email, password, avatarColor });
    if (!result.ok) {
      showToast(`❌ ${result.error}`, 'error');
      return;
    }
    showToast(`✅ Aluno "${name}" cadastrado com sucesso!`, 'success');
    document.getElementById('student-register-form').reset();
    document.getElementById('stud-color').value = '#6366f1';
    document.getElementById('stud-avatar-preview').style.background = '#6366f1';
    document.getElementById('stud-avatar-preview').textContent = 'AL';
    renderStudentsManagementTable();
    renderOverview();
  });

  // CSV file loader
  document.getElementById('stud-csv-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('stud-csv-text').value = ev.target.result;
    };
    reader.readAsText(file, 'UTF-8');
  });

  // CSV import
  document.getElementById('btn-import-csv').addEventListener('click', () => {
    const raw = document.getElementById('stud-csv-text').value.trim();
    if (!raw) { showToast('⚠️ Cole os dados CSV antes de importar.', 'warning'); return; }
    const lines = raw.split('\n').filter(l => l.trim());
    let imported = 0;
    let errors = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) {
        errors.push(`Linha ${idx + 1}: formato inválido (esperado: nome,email[,senha])`);
        return;
      }
      const [name, email, password = '1234'] = parts;
      if (!name || !email) {
        errors.push(`Linha ${idx + 1}: nome ou email vazio`);
        return;
      }
      const result = addStudent({ name, email, password, avatarColor: randomAvatarColor() });
      if (!result.ok) {
        errors.push(`Linha ${idx + 1} (${email}): ${result.error}`);
      } else {
        imported++;
      }
    });

    const resultEl = document.getElementById('csv-import-result');
    let html = '';
    if (imported > 0) {
      html += `<div style="color:var(--green);font-weight:600;margin-bottom:0.35rem;">✅ ${imported} aluno(s) importado(s) com sucesso!</div>`;
    }
    if (errors.length > 0) {
      html += `<div style="color:var(--red);font-weight:600;» margin-bottom:0.25rem;">❌ ${errors.length} erro(s):</div>`;
      html += errors.map(e => `<div style="font-size:0.75rem;color:var(--text-muted);padding-left:0.75rem;">- ${e}</div>`).join('');
    }
    resultEl.innerHTML = html;

    if (imported > 0) {
      showToast(`📊 ${imported} aluno(s) importado(s) via CSV!`, 'success');
      document.getElementById('stud-csv-text').value = '';
      renderStudentsManagementTable();
      renderOverview();
    }
  });

  // Edit modal close
  document.getElementById('btn-stud-edit-close').addEventListener('click', closeStudentEditModal);
  document.getElementById('btn-stud-edit-cancel').addEventListener('click', closeStudentEditModal);

  // Edit color preview
  document.getElementById('edit-stud-color').addEventListener('input', (e) => {
    document.getElementById('edit-stud-avatar-preview').style.background = e.target.value;
  });
  document.getElementById('edit-stud-name').addEventListener('input', (e) => {
    const initials = e.target.value.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
    document.getElementById('edit-stud-avatar-preview').textContent = initials || 'AL';
  });

  // Edit save
  document.getElementById('btn-stud-edit-save').addEventListener('click', () => {
    const id = document.getElementById('edit-stud-id').value;
    const name = document.getElementById('edit-stud-name').value.trim();
    const email = document.getElementById('edit-stud-email').value.trim();
    const password = document.getElementById('edit-stud-password').value.trim();
    const avatarColor = document.getElementById('edit-stud-color').value;
    if (!name || !email) { showToast('⚠️ Preencha nome e email.', 'warning'); return; }
    const result = updateStudent(id, { name, email, password: password || undefined, avatarColor });
    if (!result.ok) { showToast(`❌ ${result.error}`, 'error'); return; }
    showToast('✅ Aluno atualizado com sucesso!', 'success');
    closeStudentEditModal();
    renderStudentsManagementTable();
    renderOverview();
  });
}

function renderStudentsManagementTable() {
  const students = getStudents();
  const tbody = document.getElementById('stud-mgmt-tbody');
  const badge = document.getElementById('stud-count-badge');
  const empty = document.getElementById('stud-mgmt-empty');

  badge.textContent = `${students.length} aluno${students.length !== 1 ? 's' : ''}`;

  if (students.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = '';
  students.forEach(student => {
    const tr = document.createElement('tr');
    const createdAt = student.createdAt ? new Date(student.createdAt).toLocaleDateString('pt-BR') : '—';
    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="s-avatar" style="background:${student.avatarColor};">${student.avatar}</div>
          <div>
            <div class="s-name">${student.name}</div>
          </div>
        </div>
      </td>
      <td><span style="font-size:0.82rem;color:var(--text-secondary);">${student.email}</span></td>
      <td>
        <span style="font-family:var(--font-mono);font-size:0.78rem;background:rgba(255,255,255,0.05);padding:0.2rem 0.5rem;border-radius:4px;letter-spacing:0.05em;">${student.password || '••••'}</span>
      </td>
      <td><span style="font-size:0.8rem;color:var(--text-muted);">${createdAt}</span></td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-sm btn-ghost" data-edit-id="${student.id}" title="Editar aluno">✏️ Editar</button>
          <button class="btn btn-sm" style="background:rgba(239,68,68,0.12);color:var(--red);border:1px solid rgba(239,68,68,0.25);font-size:0.75rem;"
            data-remove-id="${student.id}" title="Remover aluno">🗑️ Remover</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-edit-id]').addEventListener('click', () => openStudentEditModal(student.id));
    tr.querySelector('[data-remove-id]').addEventListener('click', () => confirmRemoveStudent(student.id, student.name));

    tbody.appendChild(tr);
  });
}

function openStudentEditModal(studentId) {
  const student = getUserById(studentId);
  if (!student) return;
  document.getElementById('edit-stud-id').value = studentId;
  document.getElementById('edit-stud-name').value = student.name;
  document.getElementById('edit-stud-email').value = student.email;
  document.getElementById('edit-stud-password').value = '';
  document.getElementById('edit-stud-color').value = student.avatarColor || '#6366f1';
  document.getElementById('edit-stud-avatar-preview').style.background = student.avatarColor || '#6366f1';
  document.getElementById('edit-stud-avatar-preview').textContent = student.avatar || 'AL';
  document.getElementById('stud-edit-modal').classList.add('open');
}

function closeStudentEditModal() {
  document.getElementById('stud-edit-modal').classList.remove('open');
}

function confirmRemoveStudent(studentId, studentName) {
  if (!confirm(`Tem certeza que deseja remover o aluno "${studentName}"?\nEsta ação apagará todo o progresso e respostas desse aluno.`)) return;
  removeStudent(studentId);
  showToast(`🗑️ Aluno "${studentName}" removido.`, 'warning');
  renderStudentsManagementTable();
  renderOverview();
}

function randomAvatarColor() {
  const colors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ec4899','#3b82f6','#ef4444','#14b8a6'];
  return colors[Math.floor(Math.random() * colors.length)];
}
