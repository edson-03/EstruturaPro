// ============================================================
//  EstruturaPRO — Teacher Dashboard Logic
// ============================================================

let currentTeacher = null;
let currentDetailStudentId = null;
let modTheoryEditor = null;
let modCodeEditor = null;
let theoryFullscreenActive = false;
let focusModeActive = false;

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

  setTimeout(() => {
    if (typeof initModulesCrud === 'function') {
      initModulesCrud();
    }
  }, 200);

  // Ctrl+S / Cmd+S salva o módulo direto, sem precisar rolar até o botão —
  // só quando o formulário de criar/editar módulo está aberto.
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
    const formSec = document.getElementById('modules-crud-form-sec');
    if (!formSec || formSec.style.display === 'none') return;
    e.preventDefault();
    saveModuleCrudForm();
  });
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
  if (typeof setupModulesCrudEvents === 'function') {
    setupModulesCrudEvents();
  }
  switchView('overview');
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
  if (document.getElementById('view-performance')) {
    document.getElementById('view-performance').style.display = 'none';
  }
  if (document.getElementById('view-settings')) {
    document.getElementById('view-settings').style.display = 'none';
  }
  if (document.getElementById('view-modules-crud')) {
    document.getElementById('view-modules-crud').style.display = 'none';
  }
  if (document.getElementById('view-questions-crud')) {
    document.getElementById('view-questions-crud').style.display = 'none';
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

    case 'modules-crud':
      document.getElementById('view-modules-crud').style.display = 'block';
      document.getElementById('nav-modules-crud').classList.add('active');
      document.getElementById('header-title').textContent = 'Módulos de Aula';
      document.getElementById('header-subtitle').textContent = 'Gerencie o conteúdo teórico e os questionários (quizzes)';
      renderModulesCrudList();
      break;

    case 'questions-crud':
      if (document.getElementById('view-questions-crud')) {
        document.getElementById('view-questions-crud').style.display = 'block';
      }
      if (document.getElementById('nav-questions-crud')) {
        document.getElementById('nav-questions-crud').classList.add('active');
      }
      document.getElementById('header-title').textContent = 'Banco de Questões';
      document.getElementById('header-subtitle').textContent = 'Organize, crie e gerencie as questões para simulação aleatória';
      renderQuestionsCrud();
      break;

    case 'create-activity':
      document.getElementById('view-create-activity').style.display = 'block';
      document.getElementById('nav-create-activity').classList.add('active');
      document.getElementById('header-title').textContent = 'Criar Atividade';
      document.getElementById('header-subtitle').textContent = 'Monte uma nova lista de exercícios';
      initCreateActivityView();
      renderCreatedActivitiesList();
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

    case 'performance':
      document.getElementById('view-performance').style.display = 'block';
      document.getElementById('nav-performance').classList.add('active');
      document.getElementById('header-title').textContent = 'Desempenho';
      document.getElementById('header-subtitle').textContent = 'Pontuação, conquistas e análise detalhada de cada aluno';
      renderPerformancePage();
      break;

    case 'settings':
      document.getElementById('view-settings').style.display = 'block';
      document.getElementById('nav-settings').classList.add('active');
      document.getElementById('header-title').textContent = 'Configurações';
      document.getElementById('header-subtitle').textContent = 'Gerencie todos os aspectos da plataforma';
      initSettingsView();
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
          <div class="s-avatar" style="background:${student.avatarColor};">${escapeHtml(student.avatar)}</div>
          <div>
            <div class="s-name">${escapeHtml(student.name)}</div>
            <div class="s-email">${escapeHtml(student.email)}</div>
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
        <div style="width:36px;height:36px;border-radius:8px;background:${mod.gradient};display:flex;align-items:center;justify-content:center;font-size:1rem;">${escapeHtml(mod.emoji)}</div>
        <div>
          <div style="font-size:0.85rem;font-weight:700;">${escapeHtml(mod.title)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">${escapeHtml(mod.difficulty)}</div>
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
              <span class="module-col-icon">${escapeHtml(m.emoji)}</span>
              <span class="module-col-name">${escapeHtml(m.title.split(' ')[0])}</span>
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
            <label class="access-toggle" title="${escapeHtml(mod.title)}">
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
            <div class="s-avatar" style="background:${student.avatarColor};width:30px;height:30px;font-size:0.65rem;">${escapeHtml(student.avatar)}</div>
            <div>
              <div style="font-size:0.83rem;font-weight:600;">${escapeHtml(student.name.split(' ')[0])} ${escapeHtml(student.name.split(' ').slice(-1)[0])}</div>
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
          <div style="width:32px;height:32px;border-radius:8px;background:${mod.gradient};display:flex;align-items:center;justify-content:center;font-size:0.9rem;">${escapeHtml(mod.emoji)}</div>
        </div>
        <label class="access-toggle" title="Toggle acesso">
          <input type="checkbox" ${unlocked ? 'checked' : ''}
            class="det-access-cb" data-student-id="${studentId}" data-module-id="${mod.id}">
          <span class="access-slider"></span>
        </label>
      </div>
      <div class="dm-title">${escapeHtml(mod.title)}</div>
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
      ${isModuleUsingSteps(mod) && Object.keys(prog.stepProgress || {}).length > 0
        ? `<button class="btn btn-sm btn-ghost btn-step-answers" style="margin-top:0.6rem;width:100%;">📝 Respostas das etapas</button>`
        : ''}
    `;

    const stepAnswersBtn = card.querySelector('.btn-step-answers');
    if (stepAnswersBtn) stepAnswersBtn.addEventListener('click', () => openStepAnswersModal(studentId, mod.id));

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
          <div style="font-size:0.85rem;font-weight:700;margin-bottom:0.25rem;">${escapeHtml(act.title)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">
            📚 Módulo: ${escapeHtml(act.moduleId ? (getModuleById(act.moduleId)?.title || act.moduleId) : 'Nenhum')}
          </div>
          <div style="font-size:0.78rem;color:${isDone ? 'var(--green)' : 'var(--yellow)'};font-weight:600;">
            ${isDone ? `Concluída (${score}% de acerto)` : answeredCount > 0 ? `Em andamento (${answeredCount}/${totalCount} resp.)` : 'Não resolvida'}
          </div>
          ${answeredCount > 0 ? `<button class="btn btn-sm btn-ghost btn-view-answers" style="margin-top:0.6rem;width:100%;">👁️ Ver Respostas</button>` : ''}
        `;

        const viewBtn = card.querySelector('.btn-view-answers');
        if (viewBtn) {
          viewBtn.addEventListener('click', () => openActivityAnswersModal(studentId, act.id));
        }

        actGrid.appendChild(card);
      });
    }
  }

  // Question Bank cards
  const qbGrid = document.getElementById('detail-qb-grid');
  if (qbGrid) {
    qbGrid.innerHTML = '';
    const mList = getModules();
    const studentScores = getStudentBankScores(studentId);

    if (studentScores.length === 0) {
      qbGrid.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;padding:1rem;grid-column:1/-1;">Nenhum simulado realizado por este aluno.</div>`;
    } else {
      mList.forEach(mod => {
        const modScores = studentScores.filter(s => s.module_id === mod.id);
        if (modScores.length === 0) return;
        
        const bestScore = Math.max(...modScores.map(s => s.score));
        const totalAttempts = modScores.length;
        const lastAttempt = modScores[modScores.length - 1];

        const card = document.createElement('div');
        card.className = `detail-module-card completed`;
        card.style.padding = '1rem';
        
        card.innerHTML = `
          <div style="font-size:0.85rem;font-weight:700;margin-bottom:0.25rem;">${escapeHtml(mod.title)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">
            Tentativas: <strong>${totalAttempts}</strong>
          </div>
          <div style="font-size:0.78rem;color:var(--green);font-weight:600;">
            Melhor Pontuação: <strong style="color:var(--green-light)">${bestScore}%</strong>
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem;">
            Última: ${formatRelativeTime(lastAttempt.completed_at)} (${lastAttempt.score}%)
          </div>
        `;
        qbGrid.appendChild(card);
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

  // Fechar o modal de prévia compartilhado (atividade, descrição, teoria de etapa) —
  // vinculado aqui (roda sempre, uma vez, no carregamento da página) em vez de dentro de
  // initCreateActivityView(), que só roda se o professor abrir a aba "Criar Atividade"
  // pelo menos uma vez; sem isso, abrir a prévia a partir de "Módulos" funcionava, mas
  // os botões "✕"/"Fechar" nunca tinham sido vinculados.
  document.getElementById('btn-close-preview').addEventListener('click', closePreviewModal);
  document.getElementById('btn-close-preview-2').addEventListener('click', closePreviewModal);

  // Mesmo motivo: modais de entregas/respostas de atividade, abertos de várias views.
  document.getElementById('btn-close-activity-answers').onclick = closeActivityAnswersModal;
  document.getElementById('btn-close-activity-answers-2').onclick = closeActivityAnswersModal;
  document.getElementById('btn-close-activity-submissions').onclick = closeActivitySubmissionsModal;
  document.getElementById('btn-close-activity-submissions-2').onclick = closeActivitySubmissionsModal;

  // Mesmo motivo/padrão acima, agora para o modal de importar perguntas via texto.
  document.getElementById('btn-close-quiz-import').addEventListener('click', closeQuizImportModal);
  document.getElementById('btn-close-quiz-import-2').addEventListener('click', closeQuizImportModal);
  document.getElementById('btn-quiz-import-confirm').addEventListener('click', confirmQuizImport);

  document.getElementById('btn-copy-suap-prompt').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById('suap-prompt-text').textContent);
      showToast('✓ Prompt copiado!');
    } catch (e) {
      showToast('❌ Não foi possível copiar — selecione o texto manualmente.', 'error');
    }
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
  document.getElementById('btn-export-pdf').addEventListener('click', exportReportPDF);

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

  // Question Bank Event Listeners
  const btnAddQ = document.getElementById('btn-qb-add-question');
  if (btnAddQ) btnAddQ.addEventListener('click', () => openQuestionModal());

  const btnCloseModal = document.getElementById('btn-qb-modal-close');
  if (btnCloseModal) btnCloseModal.addEventListener('click', () => closeQuestionModal());
  const btnCancelModal = document.getElementById('btn-qb-modal-cancel');
  if (btnCancelModal) btnCancelModal.addEventListener('click', () => closeQuestionModal());
  const btnSaveModal = document.getElementById('btn-qb-modal-save');
  if (btnSaveModal) btnSaveModal.addEventListener('click', saveQuestionFromForm);

  // Type change inside modal to update fields
  const modalTypeSelect = document.getElementById('qb-modal-type');
  if (modalTypeSelect) {
    modalTypeSelect.addEventListener('change', (e) => {
      renderDynamicModalOptions(e.target.value);
    });
  }

  // Filters
  const filterModuleSelect = document.getElementById('qb-filter-module');
  if (filterModuleSelect) filterModuleSelect.addEventListener('change', renderQuestionsTable);
  const filterTypeSelect = document.getElementById('qb-filter-type');
  if (filterTypeSelect) filterTypeSelect.addEventListener('change', renderQuestionsTable);
  const searchKeywordInput = document.getElementById('qb-search-keyword');
  if (searchKeywordInput) searchKeywordInput.addEventListener('input', debounce(renderQuestionsTable));

  // CSV Import Modals
  const btnOpenCSV = document.getElementById('btn-qb-open-csv-modal');
  if (btnOpenCSV) btnOpenCSV.addEventListener('click', openCSVImportModal);
  const btnCloseCSV = document.getElementById('btn-qb-csv-modal-close');
  if (btnCloseCSV) btnCloseCSV.addEventListener('click', closeCSVImportModal);
  const btnCancelCSV = document.getElementById('btn-qb-csv-modal-cancel');
  if (btnCancelCSV) btnCancelCSV.addEventListener('click', closeCSVImportModal);
  const btnImportCSV = document.getElementById('btn-qb-csv-modal-import');
  if (btnImportCSV) btnImportCSV.addEventListener('click', importQuestionsFromCSV);

  // CSV file loader helper
  const csvFileInput = document.getElementById('qb-csv-file');
  if (csvFileInput) {
    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('qb-csv-text').value = ev.target.result;
      };
      reader.readAsText(file, 'UTF-8');
    });
  }
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

// ── Export Report PDF ──────────────────────────────────────
function exportReportPDF() {
  const students = getStudents();
  const modules  = getModules();
  const now      = new Date().toLocaleString('pt-BR');
  const s        = getSettings();

  const instName       = s.instName || 'EstruturaPRO';
  const instSemester   = s.instSemester || 'Semestre Atual';
  const instDiscipline = s.instDiscipline || 'Estrutura de Dados';
  const instTeacher    = s.instTeacher || 'Professor Responsável';
  
  // Calculate general stats
  const totalStudents = students.length;
  let totalCompletions = 0;
  students.forEach(st => {
    const progress = getStudentProgress(st.id) || {};
    totalCompletions += Object.values(progress).filter(p => p && p.completed).length;
  });
  const avgCompletionRate = totalStudents > 0
    ? Math.round((totalCompletions / (totalStudents * modules.length)) * 100)
    : 0;

  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatorio_Turma_${new Date().toISOString().slice(0,10)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 2.5rem;
      background: #ffffff;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .header-container {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .logo-badge {
      background: #6366f1;
      color: #ffffff;
      padding: 0.4rem 1rem;
      border-radius: 8px;
      font-weight: 800;
      font-size: 1.1rem;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    
    .inst-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }
    
    .inst-subtitle {
      font-size: 1rem;
      color: #64748b;
      margin: 0;
      font-weight: 500;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
    
    .meta-item {
      display: flex;
      gap: 0.5rem;
    }
    
    .meta-label {
      font-weight: 600;
      color: #475569;
    }
    
    .meta-value {
      color: #0f172a;
    }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
    }
    
    .stat-val {
      font-size: 2rem;
      font-weight: 800;
      color: #6366f1;
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    
    .stat-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      margin-top: 2rem;
    }
    
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }
    
    .report-table th, .report-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .report-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    .report-table tr:hover {
      background: #f8fafc;
    }
    
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
    }
    
    .status-completed { background: #dcfce7; color: #15803d; }
    .status-started { background: #fef9c3; color: #a16207; }
    .status-notstarted { background: #f1f5f9; color: #475569; }
    .status-locked { background: #fee2e2; color: #b91c1c; }
    
    .page-break {
      page-break-before: always;
    }
    
    .student-detail-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      background: #ffffff;
      page-break-inside: avoid;
    }
    
    .student-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }
    
    .student-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    
    .student-email {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0.1rem;
    }
    
    .student-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    
    .student-summary-item {
      background: #f8fafc;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
    }
    
    .student-summary-lbl {
      color: #64748b;
      font-weight: 500;
      margin-bottom: 0.15rem;
    }
    
    .student-summary-val {
      font-weight: 700;
      color: #0f172a;
    }
    
    .modules-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .module-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    
    .module-title {
      font-weight: 600;
      color: #334155;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
    
    .print-btn-container {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }
    
    .btn-print {
      background: #6366f1;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99,102,241,0.25);
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #4f46e5;
    }
  </style>
</head>
<body>

  <div class="print-btn-container no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
  </div>

  <div class="header-container">
    <div>
      <span class="logo-badge">EstruturaPRO</span>
      <h1 class="inst-title">${escapeHtml(instName)}</h1>
      <p class="inst-subtitle">${escapeHtml(instDiscipline)} — ${escapeHtml(instSemester)}</p>
    </div>
    <div style="text-align: right; font-size: 0.85rem; color: #64748b;">
      <div><strong>Relatório de Desempenho</strong></div>
      <div>Gerado em: ${now}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">Professor:</span>
      <span class="meta-value">${escapeHtml(instTeacher)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Disciplina:</span>
      <span class="meta-value">${escapeHtml(instDiscipline)}</span>
    </div>
  </div>
  
  <h2 class="section-title">📊 Resumo Geral da Turma</h2>
  
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-val">${totalStudents}</div>
      <div class="stat-label">Total de Alunos</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${totalCompletions}</div>
      <div class="stat-label">Conclusões de Módulos</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${avgCompletionRate}%</div>
      <div class="stat-label">Média de Conclusão</div>
    </div>
  </div>

  <h2 class="section-title">👥 Visão Geral dos Alunos</h2>
  
  <table class="report-table">
    <thead>
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Módulos Concluídos</th>
        <th>Média Quizzes</th>
        <th>Acesso</th>
      </tr>
    </thead>
    <tbody>
      ${students.map(st => {
        const stats = getStudentStats(st.id);
        const lastDate = stats.lastAccess ? new Date(stats.lastAccess).toLocaleDateString('pt-BR') : 'Sem acesso';
        return `
          <tr>
            <td style="font-weight: 600; color: #0f172a;">${escapeHtml(st.name)}</td>
            <td>${escapeHtml(st.email)}</td>
            <td><strong>${stats.completed}</strong> de ${stats.total}</td>
            <td><strong>${stats.completed > 0 ? stats.avgScore + '%' : '—'}</strong></td>
            <td style="font-size: 0.85rem; color: #64748b;">${lastDate}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2 class="section-title">🔍 Detalhamento por Aluno</h2>

  ${students.map(st => {
    const stats    = getStudentStats(st.id);
    const progress = getStudentProgress(st.id);
    const access   = getStudentModuleAccess(st.id);

    return `
      <div class="student-detail-card">
        <div class="student-header">
          <div>
            <h3 class="student-name">${escapeHtml(st.name)}</h3>
            <div class="student-email">${escapeHtml(st.email)}</div>
          </div>
          <span class="status-badge ${stats.completed === stats.total ? 'status-completed' : 'status-started'}">
            ${stats.completed === stats.total ? 'Concluído' : 'Em Progresso'}
          </span>
        </div>

        <div class="student-summary-grid">
          <div class="student-summary-item">
            <div class="student-summary-lbl">Módulos Concluídos</div>
            <div class="student-summary-val">${stats.completed} / ${stats.total}</div>
          </div>
          <div class="student-summary-item">
            <div class="student-summary-lbl">Média do Quiz</div>
            <div class="student-summary-val">${stats.completed > 0 ? stats.avgScore + '%' : '—'}</div>
          </div>
          <div class="student-summary-item">
            <div class="student-summary-lbl">Último Acesso</div>
            <div class="student-summary-val">${stats.lastAccess ? new Date(stats.lastAccess).toLocaleString('pt-BR') : 'Sem acesso'}</div>
          </div>
        </div>

        <div class="modules-list">
          ${modules.map(mod => {
            const unlocked = access.includes(mod.id);
            const prog     = progress[mod.id] || {};
            
            let statusText = 'Bloqueado';
            let badgeClass = 'status-locked';
            
            if (prog.completed) {
              statusText = `Concluído (${prog.score}%)`;
              badgeClass = 'status-completed';
            } else if (prog.started) {
              statusText = 'Em andamento';
              badgeClass = 'status-started';
            } else if (unlocked) {
              statusText = 'Liberado, não iniciado';
              badgeClass = 'status-notstarted';
            }

            return `
              <div class="module-row">
                <span class="module-title">${escapeHtml(mod.title)}</span>
                <span class="status-badge ${badgeClass}">${statusText}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('')}

  <script>
    // Automatically trigger print dialog once loaded
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    showToast('📄 Relatório PDF gerado!', 'success');
  } else {
    showToast('❌ Pop-up bloqueado! Permita pop-ups para gerar o PDF.', 'error');
  }
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

  // Descrição/Instruções em Markdown: importar de arquivo .md ou prévia inline
  // (mesmo padrão já usado na prévia de teoria de etapa do módulo).
  const descFileInput = document.getElementById('act-description-md-file');
  document.getElementById('btn-act-description-import').addEventListener('click', () => descFileInput.click());
  descFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('act-description').value = ev.target.result;
    };
    reader.readAsText(file, 'UTF-8');
    descFileInput.value = '';
  });
  document.getElementById('btn-act-description-preview').addEventListener('click', () => {
    const text = document.getElementById('act-description').value;
    document.getElementById('ca-preview-title').textContent = 'Prévia da Descrição';
    document.getElementById('ca-preview-body').innerHTML = renderMarkdown(text) || '<p style="color:var(--text-muted);">Nada para mostrar ainda.</p>';
    document.getElementById('ca-preview-modal').classList.add('open');
  });

  // Submit form
  document.getElementById('activity-form').addEventListener('submit', saveActivitySubmit);
}

function addQuestion(type) {
  // Hide empty state
  document.getElementById('ca-empty-state').style.display = 'none';

  const qId = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const qNum = document.querySelectorAll('#questions-container .ca-question-card').length + 1;

  const card = document.createElement('div');
  card.className = 'ca-question-card';
  card.id = qId;
  card.dataset.type = type;

  let content = '';

  if (type === 'theoretical') {
    content = `
      <button type="button" class="ca-q-remove" title="Remover Pergunta">✕</button>
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
      <button type="button" class="ca-q-remove" title="Remover Pergunta">✕</button>
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
          <button type="button" class="ide-run-btn" id="run_${qId}">
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
            <div class="ide-tab active" id="tab-console-${qId}">Console</div>
            <div class="ide-tab" id="tab-tests-${qId}">Testes</div>
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
            <button type="button" class="btn btn-sm btn-ghost btn-add-testcase" style="padding:0.25rem 0.65rem;font-size:0.7rem;">+ Adicionar</button>
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

  card.querySelector('.ca-q-remove').addEventListener('click', () => removeQuestionCard(qId));

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

    card.querySelector(`#run_${qId}`).addEventListener('click', () => runPracticalQuestion(qId));
    card.querySelector(`#tab-console-${qId}`).addEventListener('click', () => switchIDETab(qId, 'console'));
    card.querySelector(`#tab-tests-${qId}`).addEventListener('click', () => switchIDETab(qId, 'tests'));
    card.querySelector('.btn-add-testcase').addEventListener('click', () => addTestCaseRow(qId));

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
    <button type="button" class="ca-test-case-remove" title="Excluir caso de teste">✕</button>
  `;
  div.querySelector('.ca-test-case-remove').addEventListener('click', () => removeTestCaseRow(rowId));
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
  const cards = document.querySelectorAll('#questions-container .ca-question-card');
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
  const cards = document.querySelectorAll('#questions-container .ca-question-card');
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
    <div class="cap-title">${escapeHtml(activity.title) || 'Atividade Sem Título'}</div>
    <div class="cap-meta">
      <span>📚 Módulo: ${escapeHtml(activity.moduleId ? (getModuleById(activity.moduleId)?.title || activity.moduleId) : 'Nenhum')}</span>
      <span>📅 Prazo: ${activity.deadline ? new Date(activity.deadline).toLocaleString('pt-BR') : 'Sem prazo'}</span>
      <span>❓ Questões: ${activity.questions.length}</span>
    </div>
    ${activity.description ? `<div class="cap-desc">${renderMarkdown(activity.description)}</div>` : ''}
  `;

  if (!activity.questions.length) {
    html += `<div style="text-align:center;color:var(--text-muted);padding:1.5rem;">Nenhuma pergunta criada.</div>`;
  } else {
    activity.questions.forEach((q, idx) => {
      html += `
        <div class="cap-q-card">
          <div class="cap-q-num">Questão ${idx + 1} — ${q.type === 'theoretical' ? 'Teórica' : 'Prática'}</div>
          <div class="cap-q-text">${escapeHtml(q.question) || 'Sem enunciado'}</div>
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

  document.getElementById('ca-preview-title').textContent = 'Prévia da Atividade';
  const modal = document.getElementById('ca-preview-modal');
  modal.classList.add('open');
}

function closePreviewModal() {
  const modal = document.getElementById('ca-preview-modal');
  modal.classList.remove('open');
}

// ── Modal: importar perguntas de quiz via texto (Quiz do Módulo e Questionário de Etapa) ──
let quizImportTargetContainer = null;

function openQuizImportModal(targetContainer) {
  quizImportTargetContainer = targetContainer;
  document.getElementById('quiz-import-text').value = '';
  document.getElementById('quiz-import-modal').classList.add('open');
}

function closeQuizImportModal() {
  document.getElementById('quiz-import-modal').classList.remove('open');
  quizImportTargetContainer = null;
}

// Formato esperado: Markdown do AVA SUAP (ver exemplo e prompt de referência no próprio
// modal). Cada questão:
//   ## Questão N
//   (linha em branco)
//   Texto da pergunta
//   (linha em branco)
//   - Pontuação: X.XX        ← lido mas ignorado (aqui todas as perguntas valem igual)
//   - Obrigatória: Sim       ← lido mas ignorado (aqui toda pergunta é respondida)
//   - Tipo: Escolha Única
//   - Feedback: texto        ← vira a explicação mostrada ao aluno
//   (linha em branco)
//   ### Opções
//   (linha em branco)
//   1. [ ] opção
//   2. [x] opção correta
//   3. [ ] opção
//   4. [ ] opção
// Só é aceita 1 resposta marcada com [x] e exatamente 4 opções — nosso quiz não suporta
// múltipla escolha com mais de uma correta nem número variável de alternativas.
function parseMarkdownQuiz(text) {
  const blocks = text.split(/(?=^##\s*Quest(?:ã|a)o\s+\d+)/im).map(b => b.trim()).filter(Boolean);
  const questions = [];
  const errors = [];

  if (blocks.length === 0 || !/^##\s*Quest/im.test(text)) {
    errors.push('Não encontrei nenhum cabeçalho "## Questão N" no texto colado.');
    return { questions, errors };
  }

  blocks.forEach((block, bi) => {
    const headerMatch = block.match(/^##\s*Quest(?:ã|a)o\s+(\d+)/i);
    const label = headerMatch ? `Questão ${headerMatch[1]}` : `Bloco ${bi + 1}`;

    const optSplit = block.split(/###\s*Op[cç][õo]es/i);
    if (optSplit.length < 2) {
      errors.push(`${label}: não encontrei a seção "### Opções".`);
      return;
    }

    const bodyLines = optSplit[0]
      .replace(/^##\s*Quest(?:ã|a)o\s+\d+/i, '')
      .split('\n').map(l => l.trim()).filter(Boolean);

    let explanation = '';
    const questionTextLines = [];
    bodyLines.forEach(line => {
      const metaM = line.match(/^-\s*(Pontua[cç][ãa]o|Obrigat[óo]ria|Tipo|Feedback)\s*:\s*(.+)$/i);
      if (metaM) {
        if (/feedback/i.test(metaM[1])) explanation = metaM[2].trim();
        return;
      }
      questionTextLines.push(line);
    });
    const question = questionTextLines.join(' ').trim();
    if (!question) { errors.push(`${label}: texto da pergunta vazio.`); return; }

    const optionsPart = optSplit.slice(1).join('### Opções');
    const options = [];
    let correctCount = 0;
    let correctIndex = -1;
    optionsPart.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
      const m = line.match(/^\d+\.\s*\[( |x|X)\]\s*(.+)$/);
      if (!m) return;
      if (m[1].toLowerCase() === 'x') { correctIndex = options.length; correctCount++; }
      options.push(m[2].trim());
    });

    if (options.length !== 4) {
      errors.push(`${label}: tem ${options.length} ${options.length !== 1 ? 'opções' : 'opção'}, mas o sistema só aceita exatamente 4 por pergunta.`);
      return;
    }
    if (correctCount !== 1) {
      errors.push(`${label}: tem ${correctCount} resposta(s) marcada(s) com [x] — só é aceita 1 correta por pergunta (Múltipla Escolha ainda não é suportada aqui).`);
      return;
    }

    questions.push({ question, options, correct: correctIndex, explanation });
  });

  return { questions, errors };
}

function confirmQuizImport() {
  if (!quizImportTargetContainer) return;
  const text = document.getElementById('quiz-import-text').value;
  if (!text.trim()) {
    showToast('⚠️ Cole o texto das perguntas antes de importar.', 'warning');
    return;
  }

  const { questions, errors } = parseMarkdownQuiz(text);

  if (questions.length === 0) {
    showToast(`❌ Nenhuma pergunta reconhecida. ${errors[0] || ''}`, 'error');
    return;
  }

  questions.forEach(q => addQuizQuestionEditor(quizImportTargetContainer, q));

  if (errors.length > 0) {
    showToast(`⚠️ ${questions.length} pergunta${questions.length !== 1 ? 's' : ''} importada${questions.length !== 1 ? 's' : ''}, mas ${errors.length} bloco${errors.length !== 1 ? 's' : ''} não foi reconhecido: ${errors[0]}`, 'warning');
  } else {
    showToast(`✓ ${questions.length} pergunta${questions.length !== 1 ? 's' : ''} importada${questions.length !== 1 ? 's' : ''} com sucesso!`, 'success');
  }

  closeQuizImportModal();
}

// ── Lista de atividades criadas (tela "Criar Atividade") ──
function renderCreatedActivitiesList() {
  const list = document.getElementById('created-activities-list');
  if (!list) return;
  const activities = getActivities().slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const students = getStudents();
  list.innerHTML = '';

  if (activities.length === 0) {
    list.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;">Nenhuma atividade criada ainda.</div>`;
    return;
  }

  activities.forEach(act => {
    const doneCount = students.filter(s => getActivityStatus(act, s.id) === 'completed').length;
    const moduleTitle = act.moduleId ? (getModuleById(act.moduleId)?.title || act.moduleId) : 'Nenhum módulo';
    const deadlineText = act.deadline ? new Date(act.deadline).toLocaleString('pt-BR') : 'Sem prazo';

    const row = document.createElement('button');
    row.type = 'button';
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:1rem;width:100%;text-align:left;padding:0.85rem 1rem;border:1px solid var(--border);border-radius:var(--radius-md);background:transparent;color:inherit;cursor:pointer;font:inherit;';
    row.innerHTML = `
      <div>
        <div style="font-weight:700;font-size:0.9rem;">${escapeHtml(act.title)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">📚 ${escapeHtml(moduleTitle)} · 📅 ${escapeHtml(deadlineText)} · ${act.questions.length} pergunta${act.questions.length !== 1 ? 's' : ''}</div>
      </div>
      <div style="font-size:0.85rem;font-weight:700;white-space:nowrap;color:${doneCount === students.length && students.length > 0 ? 'var(--green)' : 'var(--text-secondary)'};">✅ ${doneCount}/${students.length}</div>
    `;
    row.onclick = () => openActivitySubmissionsModal(act.id);
    list.appendChild(row);
  });
}

// ── Modal: quem fez / não fez uma atividade ──
function openActivitySubmissionsModal(activityId) {
  const act = getActivities().find(a => a.id === activityId);
  if (!act) return;
  const students = getStudents().slice().sort((a, b) => a.name.localeCompare(b.name));
  const total = act.questions.length;

  const rows = students.map(s => {
    const answered = Object.keys(getStudentAnswers(s.id)[act.id] || {}).length;
    const status = getActivityStatus(act, s.id);
    return { s, answered, status };
  });
  const done = rows.filter(r => r.status === 'completed');
  const notDone = rows.filter(r => r.status !== 'completed');

  const studentRow = ({ s, answered, status }) => {
    let info;
    if (status === 'completed') {
      const late = getActivityCompletion(s.id, act.id)?.late;
      info = `<span style="color:var(--green);font-weight:600;">${getStudentActivityScore(s.id, act.id)}% de acerto</span>${late ? ' <span style="color:var(--red);font-weight:600;">· entregue com atraso</span>' : ''}`;
    } else {
      info = answered > 0
        ? `<span style="color:var(--yellow);font-weight:600;">Em andamento (${answered}/${total})</span>`
        : `<span style="color:var(--text-muted);">Não iniciou</span>`;
      if (status === 'overdue') info += ' <span style="color:var(--red);font-weight:600;">· prazo vencido</span>';
    }
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;padding:0.6rem 0.75rem;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:0.4rem;">
        <div style="display:flex;align-items:center;gap:0.6rem;min-width:0;">
          <div class="perf-student-dot" style="background:${s.avatarColor};border-color:transparent;flex-shrink:0;width:32px;height:32px;font-size:0.7rem;">${escapeHtml(s.avatar)}</div>
          <div style="min-width:0;">
            <div style="font-weight:600;font-size:0.88rem;">${escapeHtml(s.name)}</div>
            <div style="font-size:0.75rem;">${info}</div>
          </div>
        </div>
        ${answered > 0 ? `<button type="button" class="btn btn-ghost btn-sm btn-sub-view-answers" data-student-id="${escapeHtml(s.id)}">👁️ Ver respostas</button>` : ''}
      </div>`;
  };

  document.getElementById('activity-submissions-title').textContent = `Entregas — ${act.title}`;
  const body = document.getElementById('activity-submissions-body');
  body.innerHTML = `
    <h4 style="margin:0 0 0.6rem 0;color:var(--green);">✅ Fizeram (${done.length})</h4>
    ${done.length ? done.map(studentRow).join('') : '<div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.5rem;">Nenhum aluno concluiu ainda.</div>'}
    <h4 style="margin:1.25rem 0 0.6rem 0;color:var(--red);">⏳ Não fizeram (${notDone.length})</h4>
    ${notDone.length ? notDone.map(studentRow).join('') : '<div style="font-size:0.82rem;color:var(--text-muted);">Todos os alunos concluíram.</div>'}
  `;
  body.querySelectorAll('.btn-sub-view-answers').forEach(btn => {
    btn.onclick = () => openActivityAnswersModal(btn.dataset.studentId, act.id);
  });

  document.getElementById('activity-submissions-modal').classList.add('open');
}

function closeActivitySubmissionsModal() {
  document.getElementById('activity-submissions-modal').classList.remove('open');
}

// ── Modal: respostas de um aluno nos questionários das etapas de um módulo ──
// Reaproveita a janela de respostas de atividade. As respostas ficam em
// progress[moduleId].stepProgress[stepId].answers (última tentativa do aluno).
function openStepAnswersModal(studentId, moduleId) {
  const mod = getModuleById(moduleId);
  if (!mod) return;
  const student = getUserById(studentId);
  const stepProgress = getStudentProgress(studentId)[moduleId]?.stepProgress || {};
  const box = 'border:1px solid var(--border);border-radius:var(--radius-md);padding:1rem 1.25rem;margin-bottom:1rem;';

  document.getElementById('activity-answers-title').textContent =
    `Respostas das etapas — ${mod.title} (${student ? student.name : 'Aluno'})`;

  document.getElementById('activity-answers-body').innerHTML = mod.steps.map((step, sIdx) => {
    const sp = stepProgress[step.id];
    const header = `
      <h4 style="margin:0 0 0.75rem 0;">Etapa ${sIdx + 1}: ${escapeHtml(step.title)}
        ${sp ? `<span style="font-size:0.8rem;font-weight:700;color:${sp.completed ? 'var(--green)' : 'var(--red)'};"> · ${sp.score}% ${sp.completed ? '(aprovada)' : '(não aprovada)'}</span>` : ''}
      </h4>`;
    if (!sp) return `<div style="margin-bottom:1.5rem;">${header}<div style="font-size:0.82rem;color:var(--text-muted);">Ainda não respondida.</div></div>`;
    if (!Array.isArray(sp.answers)) return `<div style="margin-bottom:1.5rem;">${header}<div style="font-size:0.82rem;color:var(--text-muted);">Respostas não registradas (etapa feita antes de as respostas serem guardadas).</div></div>`;

    const questionsHtml = (step.quiz || []).map((q, qIdx) => {
      const ans = sp.answers.find(a => a && a.questionId && a.questionId === q.id) || sp.answers[qIdx];
      const type = q.type || 'multiple';
      const title = `<div style="font-weight:700;font-size:0.9rem;margin-bottom:0.6rem;">${qIdx + 1}. ${escapeHtml(q.question)}</div>`;
      if (!ans) return `<div style="${box}">${title}<div style="font-size:0.82rem;color:var(--text-muted);">⚠️ Não respondida.</div></div>`;

      if (type === 'essay') {
        return `<div style="${box}">${title}
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:0.3rem;">📝 Resposta do aluno</div>
          <div style="white-space:pre-wrap;word-break:break-word;font-size:0.88rem;background:rgba(0,0,0,0.15);border-radius:8px;padding:0.75rem;">${escapeHtml(ans.text || '')}</div>
        </div>`;
      }
      if (type === 'code') {
        return `<div style="${box}">${title}
          <div style="font-size:0.8rem;font-weight:700;margin-bottom:0.5rem;color:${ans.correct ? 'var(--green)' : 'var(--red)'};">${ans.correct ? '✅ Passou nos testes' : '❌ Não passou nos testes'}</div>
          <pre style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:0.85rem;font-family:var(--font-mono);font-size:0.82rem;color:#e6edf3;overflow-x:auto;white-space:pre-wrap;word-break:break-word;margin:0;">${escapeHtml(ans.code || '')}</pre>
        </div>`;
      }
      const chosen = ans.chosen;
      return `<div style="${box}">${title}
        ${(q.options || []).map((opt, oIdx) => {
          let style = 'padding:0.5rem 0.8rem;border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:0.35rem;font-size:0.85rem;';
          let tag = '';
          if (oIdx === q.correct) { style += 'border-color:var(--green);background:rgba(16,185,129,0.08);'; tag = oIdx === chosen ? ' <strong style="color:var(--green);">✓ Resposta do aluno (correta)</strong>' : ' <strong style="color:var(--green);">✓ Correta</strong>'; }
          else if (oIdx === chosen) { style += 'border-color:var(--red);background:rgba(239,68,68,0.08);'; tag = ' <strong style="color:var(--red);">✗ Resposta do aluno</strong>'; }
          return `<div style="${style}">${['A','B','C','D'][oIdx]}) ${escapeHtml(opt)}${tag}</div>`;
        }).join('')}
      </div>`;
    }).join('');

    return `<div style="margin-bottom:1.5rem;">${header}${questionsHtml}</div>`;
  }).join('');

  document.getElementById('activity-answers-modal').classList.add('open');
}

// ── Modal: respostas de um aluno numa atividade (teóricas + práticas) ──
function openActivityAnswersModal(studentId, activityId) {
  const activity = getActivities().find(a => a.id === activityId);
  if (!activity) return;
  const student = getUserById(studentId);
  const answers = getStudentAnswers(studentId)[activityId] || {};

  document.getElementById('activity-answers-title').textContent =
    `Respostas — ${activity.title} (${student ? student.name : 'Aluno'})`;

  const body = document.getElementById('activity-answers-body');
  body.innerHTML = activity.questions.map((q, idx) => {
    const ans = answers[q.id];
    const header = `
      <div class="cap-q-num" style="color:var(--text-muted);font-weight:700;font-size:0.75rem;margin-bottom:0.5rem;text-transform:uppercase;">
        Questão ${idx + 1} — ${q.type === 'theoretical' ? 'Teórica' : 'Prática'}
      </div>
      <div class="cap-q-text" style="font-size:0.95rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary);">${escapeHtml(q.question)}</div>
    `;

    if (!ans) {
      return `<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1.25rem;">
        ${header}
        <div style="font-size:0.82rem;color:var(--text-muted);">⚠️ Não respondida.</div>
      </div>`;
    }

    if (q.type === 'theoretical') {
      const chosen = parseInt(ans.chosen);
      const correct = parseInt(q.correct);
      const isCorrect = chosen === correct;
      const options = q.options.map((opt, oIdx) => {
        const wasChosen = oIdx === chosen;
        const isTheCorrect = oIdx === correct;
        let style = 'padding:0.6rem 0.85rem;border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:0.4rem;font-size:0.85rem;display:flex;align-items:center;gap:0.5rem;';
        if (isTheCorrect) style += 'border-color:var(--green);background:rgba(16,185,129,0.08);';
        else if (wasChosen) style += 'border-color:var(--red);background:rgba(239,68,68,0.08);';
        let tag = '';
        if (wasChosen && isTheCorrect) tag = ' <strong style="color:var(--green);">✓ Resposta do aluno (correta)</strong>';
        else if (wasChosen) tag = ' <strong style="color:var(--red);">✗ Resposta do aluno</strong>';
        else if (isTheCorrect) tag = ' <strong style="color:var(--green);">✓ Correta</strong>';
        return `<div style="${style}"><span>${['A','B','C','D'][oIdx]}</span><span>${escapeHtml(opt)}</span>${tag}</div>`;
      }).join('');
      return `<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1.25rem;">
        ${header}
        <div style="font-size:0.8rem;font-weight:700;margin-bottom:0.6rem;color:${isCorrect ? 'var(--green)' : 'var(--red)'};">
          ${isCorrect ? '✅ Acertou' : '❌ Errou'}
        </div>
        ${options}
      </div>`;
    }

    // Prática (código)
    return `<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1.25rem;">
      ${header}
      <div style="font-size:0.8rem;font-weight:700;margin-bottom:0.6rem;color:${ans.correct ? 'var(--green)' : 'var(--red)'};">
        ${ans.correct ? '✅ Passou nos testes' : '❌ Não passou nos testes'}
      </div>
      <pre style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:0.85rem;font-family:var(--font-mono);font-size:0.82rem;color:#e6edf3;overflow-x:auto;white-space:pre-wrap;word-break:break-word;margin:0;">${escapeHtml(ans.code || '')}</pre>
    </div>`;
  }).join('');

  document.getElementById('activity-answers-modal').classList.add('open');
}

function closeActivityAnswersModal() {
  document.getElementById('activity-answers-modal').classList.remove('open');
}

function saveActivitySubmit(e) {
  e.preventDefault();
  
  const cards = document.querySelectorAll('#questions-container .ca-question-card');
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

  const cards = document.querySelectorAll('#questions-container .ca-question-card');
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
// Executa a prévia de questão prática num Web Worker dedicado (js/practice-worker.js)
// em vez de new Function() direto — bloqueado pela CSP (script-src sem 'unsafe-eval').
// Mesmo worker usado por testStudentCode() (js/student.js), motores mantidos separados
// de propósito (ver PLANO_CORRECAO_AUDITORIA.md); a comparação com o valor esperado roda
// dentro do worker, que devolve só ok/pass/texto, nunca o valor bruto (pode não ser
// serializável via postMessage).
function runInPracticeWorker(worker, payload) {
  return new Promise((resolve) => {
    const handler = (e) => {
      const data = e.data;
      if (!data || !data.__execResult) return;
      worker.removeEventListener('message', handler);
      resolve(data);
    };
    worker.addEventListener('message', handler);
    worker.postMessage(Object.assign({ __exec: true }, payload));
  });
}

async function runPracticalQuestion(qId) {
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

  const worker = new Worker('js/practice-worker.js?v=2');
  const logs = [];
  const addLines = (workerLines) => {
    (workerLines || []).forEach(l => logs.push({ type: l.type === 'info' ? 'info' : l.type, msg: l.text }));
  };

  const code = editor.getValue();
  let execError = null;
  let functionDefined = false;

  const checkResult = await runInPracticeWorker(worker, { kind: 'checkFunctionDefined', code });
  addLines(checkResult.lines);
  if (!checkResult.ok) {
    execError = { message: checkResult.error };
    logs.push({ type: 'error', msg: '⛔ Erro de compilação: ' + checkResult.error });
  } else {
    functionDefined = checkResult.functionDefined;
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
  const testResults = [];
  for (const tc of tests) {
    if (execError || !functionDefined) {
      testResults.push({ ...tc, status: 'error', got: execError ? execError.message : 'Função não encontrada' });
      continue;
    }
    const caseResult = await runInPracticeWorker(worker, { kind: 'runTeacherTestCase', code, expression: tc.expression, expected: tc.expected });
    addLines(caseResult.lines);
    if (caseResult.ok) {
      if (caseResult.pass) passCount++; else failCount++;
      testResults.push({ ...tc, status: caseResult.pass ? 'pass' : 'fail', got: caseResult.gotFormatted });
    } else {
      failCount++;
      testResults.push({ ...tc, status: 'fail', got: '⛔ ' + caseResult.error });
    }
  }

  worker.terminate();

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
  document.getElementById('student-register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('stud-name').value.trim();
    const email = document.getElementById('stud-email').value.trim();
    const password = document.getElementById('stud-password').value.trim() || '1234';
    const avatarColor = document.getElementById('stud-color').value;

    const result = await addStudent({ name, email, password, avatarColor });
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
  document.getElementById('btn-import-csv').addEventListener('click', async () => {
    const raw = document.getElementById('stud-csv-text').value.trim();
    if (!raw) { showToast('⚠️ Cole os dados CSV antes de importar.', 'warning'); return; }
    const lines = raw.split('\n').filter(l => l.trim());
    let imported = 0;
    let errors = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const parts = lines[idx].split(',').map(p => p.trim());
      if (parts.length < 2) {
        errors.push(`Linha ${idx + 1}: formato inválido (esperado: nome,email[,senha])`);
        continue;
      }
      const [name, email, password = '1234'] = parts;
      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Linha ${idx + 1}: nome ou e-mail inválido`);
        continue;
      }
      const result = await addStudent({ name, email, password, avatarColor: randomAvatarColor() });
      if (!result.ok) {
        errors.push(`Linha ${idx + 1} (${email}): ${result.error}`);
      } else {
        imported++;
      }
    }

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
  document.getElementById('btn-stud-edit-save').addEventListener('click', async () => {
    const id = document.getElementById('edit-stud-id').value;
    const name = document.getElementById('edit-stud-name').value.trim();
    const email = document.getElementById('edit-stud-email').value.trim();
    const password = document.getElementById('edit-stud-password').value.trim();
    const avatarColor = document.getElementById('edit-stud-color').value;
    if (!name || !email) { showToast('⚠️ Preencha nome e email.', 'warning'); return; }
    const result = await updateStudent(id, { name, email, password: password || undefined, avatarColor });
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
          <div class="s-avatar" style="background:${student.avatarColor};">${escapeHtml(student.avatar)}</div>
          <div>
            <div class="s-name">${escapeHtml(student.name)}</div>
          </div>
        </div>
      </td>
      <td><span style="font-size:0.82rem;color:var(--text-secondary);">${escapeHtml(student.email)}</span></td>
      <td>
        <span style="font-family:var(--font-mono);font-size:0.78rem;background:rgba(255,255,255,0.05);padding:0.2rem 0.5rem;border-radius:4px;letter-spacing:0.05em;">${escapeHtml(student.password) || '••••'}</span>
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

async function confirmRemoveStudent(studentId, studentName) {
  if (!confirm(`Tem certeza que deseja remover o aluno "${studentName}"?\nEsta ação apagará todo o progresso e respostas desse aluno.`)) return;
  const result = await removeStudent(studentId);
  if (!result.ok) return;
  showToast(`🗑️ Aluno "${studentName}" removido.`, 'warning');
  renderStudentsManagementTable();
  renderOverview();
}

function randomAvatarColor() {
  const colors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ec4899','#3b82f6','#ef4444','#14b8a6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================================
//  👨‍🏫 Gerenciar Professores Logic (aba Segurança)
// ============================================================
function renderTeachersManagementTable() {
  const tbody = document.getElementById('teach-mgmt-tbody');
  const empty = document.getElementById('teach-mgmt-empty');
  if (!tbody) return; // painel ainda não renderizado

  const teachers = getTeachers();
  const currentId = getSession()?.userId;

  if (teachers.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = '';
  teachers.forEach(t => {
    const tr = document.createElement('tr');
    const createdAt = t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR') : '—';
    const isSelf = t.id === currentId;
    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="s-avatar" style="background:${t.avatarColor || '#6366f1'};">${escapeHtml(t.avatar || 'PR')}</div>
          <div>
            <div class="s-name">${escapeHtml(t.name)}${isSelf ? ' <span style="color:var(--text-muted);font-weight:400;font-size:0.75rem;">(você)</span>' : ''}</div>
          </div>
        </div>
      </td>
      <td><span style="font-size:0.82rem;color:var(--text-secondary);">${escapeHtml(t.email)}</span></td>
      <td><span style="font-size:0.8rem;color:var(--text-muted);">${createdAt}</span></td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-sm btn-ghost" data-edit-id="${t.id}" title="Editar professor">✏️ Editar</button>
          <button class="btn btn-sm btn-ghost" data-reset-id="${t.id}" title="Redefinir senha">🔑 Trocar Senha</button>
          <button class="btn btn-sm" style="background:rgba(239,68,68,0.12);color:var(--red);border:1px solid rgba(239,68,68,0.25);font-size:0.75rem;"
            data-remove-id="${t.id}" title="Excluir professor" ${isSelf ? 'disabled' : ''}>🗑️ Excluir</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-edit-id]').addEventListener('click', () => openTeacherEditModal(t.id));
    tr.querySelector('[data-reset-id]').addEventListener('click', () => openTeacherResetModal(t.id));
    const removeBtn = tr.querySelector('[data-remove-id]');
    if (!isSelf) removeBtn.addEventListener('click', () => confirmRemoveTeacher(t.id, t.name));

    tbody.appendChild(tr);
  });
}

function openTeacherEditModal(teacherId) {
  const teacher = getUserById(teacherId);
  if (!teacher) return;
  document.getElementById('edit-teach-id').value = teacherId;
  document.getElementById('edit-teach-name').value = teacher.name;
  document.getElementById('edit-teach-email').value = teacher.email;
  document.getElementById('teach-edit-modal').classList.add('open');
}

function closeTeacherEditModal() {
  document.getElementById('teach-edit-modal').classList.remove('open');
}

function openTeacherResetModal(teacherId) {
  document.getElementById('teach-reset-id').value = teacherId;
  document.getElementById('teach-reset-new-pass').value = '';
  document.getElementById('teach-reset-confirm-pass').value = '';
  document.getElementById('teach-reset-pass-modal').classList.add('open');
}

function closeTeacherResetModal() {
  document.getElementById('teach-reset-pass-modal').classList.remove('open');
}

function confirmRemoveTeacher(teacherId, teacherName) {
  requireDangerPassword({
    icon: '🗑️',
    title: 'Excluir Professor',
    subtitle: 'Ação irreversível — confirme sua senha',
    warning: `⚠️ Isso removerá permanentemente a conta de <strong>${escapeHtml(teacherName)}</strong>. Esta ação não pode ser desfeita.`,
    confirmLabel: '🗑️ Excluir Professor',
    onConfirm: async () => {
      const result = await removeTeacher(teacherId);
      if (!result.ok) { showToast(`❌ ${result.error}`, 'error'); return; }
      showToast(`🗑️ Professor "${teacherName}" removido.`, 'warning');
      renderTeachersManagementTable();
    },
  });
}

// ============================================================
//  🏆 DESEMPENHO — Performance Page Logic
// ============================================================

// ── Scoring System ──────────────────────────────────────────
// calculateStudentPoints(), getRankLabel() e BADGES moraram aqui antes — mudaram pra
// js/data.js (compartilhado) pra dar pro aluno ver o próprio ranking/pontos também,
// não só o professor. Ver js/data.js.

// ── Main render ──────────────────────────────────────────────
let perfCurrentBadgeStudent = null;
let perfCurrentTimelineStudent = null;
let perfRankFilter = 'points';

function renderPerformancePage() {
  const students  = getStudents();
  const modules   = getModules();
  const allProgress = getAllProgress();

  // Compute data for all students
  const studentData = students.map(s => ({
    student: s,
    perf: calculateStudentPoints(s.id),
  }));

  // ── KPIs ──
  const totalPoints     = studentData.reduce((a, d) => a + d.perf.points, 0);
  const avgAccuracy     = students.length > 0
    ? Math.round(studentData.reduce((a, d) => a + d.perf.avgScore, 0) / students.length)
    : 0;
  const totalAttempts   = studentData.reduce((a, d) => a + d.perf.totalAttempts, 0);
  const totalBadges     = studentData.reduce((a, d) => a + BADGES.filter(b => b.condition(d.perf)).length, 0);
  const activities      = getActivities();
  const overdueCount    = students.reduce((a, s) =>
    a + activities.filter(act => getActivityStatus(act, s.id) === 'overdue').length, 0);

  document.getElementById('kpi-total-points').textContent   = totalPoints.toLocaleString('pt-BR');
  document.getElementById('kpi-avg-accuracy').textContent   = avgAccuracy + '%';
  document.getElementById('kpi-quiz-attempts').textContent  = totalAttempts;
  document.getElementById('kpi-badges-earned').textContent  = totalBadges;
  document.getElementById('kpi-overdue-activities').textContent = overdueCount;

  // Animate kpi counters
  animateKpiCounters();

  // ── Ranking ──
  renderRanking(studentData, perfRankFilter);

  // Filter buttons
  document.querySelectorAll('.perf-filter-btn').forEach(btn => {
    btn.onclick = () => {
      perfRankFilter = btn.dataset.filter;
      document.querySelectorAll('.perf-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderRanking(studentData, perfRankFilter);
    };
  });

  // ── Module stats ──
  renderModulePerformance(modules, students, allProgress);

  // ── Activity stats ──
  renderActivityPerformance(activities, students);

  // ── Quiz analysis ──
  renderQuizAnalysis(modules, students, allProgress);

  // ── Badges ──
  if (students.length > 0) {
    perfCurrentBadgeStudent = perfCurrentBadgeStudent || students[0].id;
    renderBadgesSelector(studentData);
    renderBadges(perfCurrentBadgeStudent, studentData);
  }

  // ── Timeline ──
  if (students.length > 0) {
    perfCurrentTimelineStudent = perfCurrentTimelineStudent || students[0].id;
    renderTimelineSelector(studentData);
    renderTimeline(perfCurrentTimelineStudent, studentData);
  }
}

function animateKpiCounters() {
  document.querySelectorAll('.perf-kpi-value').forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'kpiPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both';
  });
}

// ── Ranking ─────────────────────────────────────────────────
function renderRanking(studentData, filter) {
  const sorted = [...studentData].sort((a, b) => {
    if (filter === 'points')   return b.perf.points - a.perf.points;
    if (filter === 'accuracy') return b.perf.avgScore - a.perf.avgScore;
    if (filter === 'modules')  return b.perf.completed - a.perf.completed;
    return 0;
  });

  const list = document.getElementById('perf-ranking-list');
  const medals = ['🥇', '🥈', '🥉'];

  list.innerHTML = '';

  if (sorted.length === 0) {
    list.innerHTML = `<div class="perf-empty">👤 Nenhum aluno cadastrado ainda.</div>`;
    return;
  }

  sorted.forEach((d, idx) => {
    const rank = getRankLabel(d.perf.points);
    const medal = medals[idx] || `#${idx + 1}`;
    const pct = filter === 'points'
      ? (sorted[0].perf.points > 0 ? Math.round((d.perf.points / sorted[0].perf.points) * 100) : 0)
      : filter === 'accuracy' ? d.perf.avgScore
      : (getModules().length > 0 ? Math.round((d.perf.completed / getModules().length) * 100) : 0);

    const mainValue = filter === 'points'
      ? `${d.perf.points} pts`
      : filter === 'accuracy' ? `${d.perf.avgScore}%`
      : `${d.perf.completed}/${getModules().length}`;

    const card = document.createElement('div');
    card.className = `perf-rank-card ${idx === 0 ? 'rank-first' : ''}`;
    card.style.cursor = 'pointer';
    card.title = 'Ver detalhes deste aluno';
    card.innerHTML = `
      <div class="rank-medal">${medal}</div>
      <div class="rank-avatar" style="background:${d.student.avatarColor};">${escapeHtml(d.student.avatar)}</div>
      <div class="rank-info">
        <div class="rank-name">${escapeHtml(d.student.name.split(' ').slice(0, 2).join(' '))}</div>
        <div class="rank-badge-chip" style="color:${rank.color};background:${rank.color}22;border-color:${rank.color}44;">
          ${rank.icon} ${rank.label}
        </div>
      </div>
      <div class="rank-right">
        <div class="rank-value">${mainValue}</div>
        <div class="rank-bar-wrap">
          <div class="rank-bar" style="width:${pct}%;background:${d.student.avatarColor};"></div>
        </div>
      </div>
    `;
    // Mesma tela de detalhe (progresso por módulo, atividades com "Ver Respostas",
    // banco de questões, log) já usada na aba Alunos — reaproveitada aqui.
    card.addEventListener('click', () => switchView('student-detail', d.student.id));
    list.appendChild(card);
  });
}

// ── Module Performance ───────────────────────────────────────
function renderModulePerformance(modules, students, allProgress) {
  const list = document.getElementById('perf-module-list');
  list.innerHTML = '';

  modules.forEach(mod => {
    const completedStudents = students.filter(s => allProgress[s.id]?.[mod.id]?.completed);
    const scores = completedStudents.map(s => allProgress[s.id][mod.id].score || 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const accessCount = students.filter(s => getStudentModuleAccess(s.id).includes(mod.id)).length;
    const completionRate = accessCount > 0 ? Math.round((completedStudents.length / accessCount) * 100) : 0;

    const scoreColor = avgScore >= 70 ? 'var(--green)' : avgScore >= 40 ? 'var(--yellow)' : 'var(--text-muted)';

    const item = document.createElement('div');
    item.className = 'perf-module-item';
    item.innerHTML = `
      <div class="perf-mod-header">
        <div class="perf-mod-icon" style="background:${mod.gradient};">${escapeHtml(mod.emoji)}</div>
        <div class="perf-mod-meta">
          <div class="perf-mod-name">${escapeHtml(mod.title)}</div>
          <div class="perf-mod-sub">${escapeHtml(mod.difficulty)} · ${completedStudents.length}/${students.length} concluíram</div>
        </div>
        <div class="perf-mod-score" style="color:${scoreColor};">${completedStudents.length > 0 ? avgScore + '%' : '—'}</div>
      </div>
      <div class="perf-mod-bars">
        <div class="perf-mod-bar-row">
          <span class="perf-mod-bar-label">Conclusão</span>
          <div class="perf-mod-bar-track">
            <div class="perf-mod-bar-fill" style="width:${completionRate}%;background:${mod.gradient};"></div>
          </div>
          <span class="perf-mod-bar-pct">${completionRate}%</span>
        </div>
        <div class="perf-mod-bar-row">
          <span class="perf-mod-bar-label">Méd. Acerto</span>
          <div class="perf-mod-bar-track">
            <div class="perf-mod-bar-fill" style="width:${avgScore}%;background:${scoreColor};"></div>
          </div>
          <span class="perf-mod-bar-pct">${completedStudents.length > 0 ? avgScore + '%' : '—'}</span>
        </div>
      </div>
      <div class="perf-mod-students">
        ${students.map(s => {
          const prog = allProgress[s.id]?.[mod.id];
          const hasAccess = getStudentModuleAccess(s.id).includes(mod.id);
          let status = 'locked';
          if (prog?.completed) status = 'done';
          else if (prog?.started) status = 'progress';
          else if (hasAccess) status = 'unlocked';
          const colors2 = { done: 'var(--green)', progress: 'var(--yellow)', unlocked: 'var(--accent-light)', locked: 'var(--border)' };
          const sName = escapeHtml(s.name);
          const tips = { done: `${sName}: Concluído (${prog?.score || 0}%)`, progress: `${sName}: Em andamento`, unlocked: `${sName}: Liberado`, locked: `${sName}: Bloqueado` };
          return `<div class="perf-student-dot" style="background:${s.avatarColor};border-color:${colors2[status]};" title="${tips[status]}">${escapeHtml(s.avatar)}</div>`;
        }).join('')}
      </div>
    `;
    list.appendChild(item);
  });
}

// ── Activity Performance ─────────────────────────────────────
function renderActivityPerformance(activities, students) {
  const list = document.getElementById('perf-activity-list');
  if (!list) return;
  list.innerHTML = '';

  if (activities.length === 0) {
    list.innerHTML = `<div class="perf-empty">✏️ Nenhuma atividade cadastrada ainda.</div>`;
    return;
  }

  activities.forEach(act => {
    const statuses = students.map(s => ({ student: s, status: getActivityStatus(act, s.id) }));
    const completedCount = statuses.filter(x => x.status === 'completed').length;
    const overdueCount   = statuses.filter(x => x.status === 'overdue').length;
    const completionRate = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;

    const moduleTitle = act.moduleId ? (getModuleById(act.moduleId)?.title || act.moduleId) : 'Todos os módulos';
    const deadlineText = act.deadline ? new Date(act.deadline).toLocaleString('pt-BR') : 'Sem prazo';

    const item = document.createElement('div');
    item.className = 'perf-module-item';
    item.innerHTML = `
      <div class="perf-mod-header">
        <div class="perf-mod-icon" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">✏️</div>
        <div class="perf-mod-meta">
          <div class="perf-mod-name">${escapeHtml(act.title)}</div>
          <div class="perf-mod-sub">📚 ${escapeHtml(moduleTitle)} · 📅 ${escapeHtml(deadlineText)}</div>
        </div>
        <div class="perf-mod-score" style="color:${overdueCount > 0 ? 'var(--red)' : 'var(--green)'};">
          ${overdueCount > 0 ? `🔴 ${overdueCount} atrasada${overdueCount !== 1 ? 's' : ''}` : `${completedCount}/${students.length}`}
        </div>
      </div>
      <div class="perf-mod-bars">
        <div class="perf-mod-bar-row">
          <span class="perf-mod-bar-label">Conclusão</span>
          <div class="perf-mod-bar-track">
            <div class="perf-mod-bar-fill" style="width:${completionRate}%;background:linear-gradient(90deg,#6366f1,#8b5cf6);"></div>
          </div>
          <span class="perf-mod-bar-pct">${completionRate}%</span>
        </div>
      </div>
      <div class="perf-mod-students">
        ${statuses.map(({ student: s, status }) => {
          const colors = { completed: 'var(--green)', overdue: 'var(--red)', open: 'var(--border)' };
          const tips = { completed: `${s.name}: Concluída`, overdue: `${s.name}: Em atraso`, open: `${s.name}: Em aberto` };
          return `<div class="perf-student-dot" style="background:${s.avatarColor};border-color:${colors[status]};" title="${escapeHtml(tips[status])}">${escapeHtml(s.avatar)}</div>`;
        }).join('')}
      </div>
    `;
    item.style.cursor = 'pointer';
    item.title = 'Clique para ver quem fez e as respostas';
    item.onclick = () => openActivitySubmissionsModal(act.id);
    list.appendChild(item);
  });
}

// ── Quiz Attempt Analysis ────────────────────────────────────
function renderQuizAnalysis(modules, students, allProgress) {
  const grid = document.getElementById('perf-quiz-grid');
  grid.innerHTML = '';

  modules.forEach(mod => {
    const card = document.createElement('div');
    card.className = 'perf-quiz-card';

    const studentRows = students.map(s => {
      const prog = allProgress[s.id]?.[mod.id];
      const log = (getActivityLog()[s.id] || []).filter(l => l.message && l.message.includes(mod.title));
      const hasAccess = getStudentModuleAccess(s.id).includes(mod.id);

      let attempts = 0;
      let score = prog?.score || 0;
      let status = 'locked';

      if (prog?.completed) {
        status = 'completed';
        attempts = Math.max(1, log.length);
      } else if (prog?.started) {
        status = 'progress';
        attempts = Math.max(1, log.filter(l => l.message.includes('quiz') || l.message.includes('concluído')).length);
      } else if (hasAccess) {
        status = 'unlocked';
      }

      return { student: s, attempts, score, status };
    });

    const completedCount = studentRows.filter(r => r.status === 'completed').length;
    const totalAttempts = studentRows.reduce((a, r) => a + r.attempts, 0);

    card.innerHTML = `
      <div class="perf-quiz-card-header">
        <div class="perf-quiz-mod-icon" style="background:${mod.gradient};">${escapeHtml(mod.emoji)}</div>
        <div>
          <div class="perf-quiz-mod-name">${escapeHtml(mod.title)}</div>
          <div class="perf-quiz-mod-sub">${completedCount} concluíram · ${totalAttempts} tentativas</div>
        </div>
      </div>
      <div class="perf-quiz-rows">
        ${studentRows.map(r => {
          const statusIcon = { completed: '✅', progress: '🔄', unlocked: '🔓', locked: '🔒' }[r.status];
          const scoreColor = r.score >= 70 ? 'var(--green)' : r.score >= 40 ? 'var(--yellow)' : 'var(--red)';
          return `
            <div class="perf-quiz-row">
              <div class="perf-qr-avatar" style="background:${r.student.avatarColor};">${escapeHtml(r.student.avatar)}</div>
              <div class="perf-qr-name">${escapeHtml(r.student.name.split(' ')[0])}</div>
              <div class="perf-qr-attempts">
                ${r.status === 'completed' || r.status === 'progress'
                  ? `<span class="attempt-chip">${r.attempts}x</span>`
                  : `<span class="attempt-chip locked">${statusIcon}</span>`
                }
              </div>
              <div class="perf-qr-score" style="color:${r.status === 'completed' ? scoreColor : 'var(--text-muted)'};">
                ${r.status === 'completed' ? r.score + '%' : statusIcon}
              </div>
              <div class="perf-qr-bar-track">
                ${r.status === 'completed' ? `<div class="perf-qr-bar" style="width:${r.score}%;background:${scoreColor};"></div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    grid.appendChild(card);
  });

  if (modules.length === 0) {
    grid.innerHTML = `<div class="perf-empty" style="grid-column:1/-1;">Nenhum módulo disponível.</div>`;
  }
}

// ── Badges ───────────────────────────────────────────────────
function renderBadgesSelector(studentData) {
  const selector = document.getElementById('perf-badges-selector');
  selector.innerHTML = '';
  studentData.forEach(d => {
    const btn = document.createElement('button');
    btn.className = `perf-stud-tab ${d.student.id === perfCurrentBadgeStudent ? 'active' : ''}`;
    btn.innerHTML = `<span class="tab-avatar" style="background:${d.student.avatarColor};">${escapeHtml(d.student.avatar)}</span>${escapeHtml(d.student.name.split(' ')[0])}`;
    btn.onclick = () => {
      perfCurrentBadgeStudent = d.student.id;
      document.querySelectorAll('#perf-badges-selector .perf-stud-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBadges(perfCurrentBadgeStudent, studentData);
    };
    selector.appendChild(btn);
  });
}

function renderBadges(studentId, studentData) {
  const grid = document.getElementById('perf-badges-grid');
  const d = studentData.find(s => s.student.id === studentId);
  if (!d) { grid.innerHTML = ''; return; }

  grid.innerHTML = '';
  BADGES.forEach(badge => {
    const earned = badge.condition(d.perf);
    const item = document.createElement('div');
    item.className = `perf-badge-item ${earned ? 'earned' : 'locked'}`;
    item.innerHTML = `
      <div class="perf-badge-icon">${badge.icon}</div>
      <div class="perf-badge-name">${badge.name}</div>
      <div class="perf-badge-desc">${badge.desc}</div>
      ${earned ? '<div class="perf-badge-status">✅ Conquistado</div>' : '<div class="perf-badge-status locked-text">🔒 Bloqueado</div>'}
    `;
    grid.appendChild(item);
  });
}

// ── Timeline ─────────────────────────────────────────────────
function renderTimelineSelector(studentData) {
  const selector = document.getElementById('perf-timeline-selector');
  selector.innerHTML = '';
  studentData.forEach(d => {
    const btn = document.createElement('button');
    btn.className = `perf-stud-tab ${d.student.id === perfCurrentTimelineStudent ? 'active' : ''}`;
    btn.innerHTML = `<span class="tab-avatar" style="background:${d.student.avatarColor};">${escapeHtml(d.student.avatar)}</span>${escapeHtml(d.student.name.split(' ')[0])}`;
    btn.onclick = () => {
      perfCurrentTimelineStudent = d.student.id;
      document.querySelectorAll('#perf-timeline-selector .perf-stud-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTimeline(perfCurrentTimelineStudent, studentData);
    };
    selector.appendChild(btn);
  });
}

function renderTimeline(studentId, studentData) {
  const container = document.getElementById('perf-timeline');
  const d = studentData.find(s => s.student.id === studentId);
  if (!d) { container.innerHTML = ''; return; }

  const student = d.student;
  const breakdown = d.perf.breakdown;

  if (breakdown.length === 0) {
    container.innerHTML = `<div class="perf-empty">📭 Nenhuma atividade registrada para ${escapeHtml(student.name.split(' ')[0])} ainda.</div>`;
    return;
  }

  // Build cumulative timeline
  let cumulativePoints = 0;
  const maxPoints = d.perf.points;

  container.innerHTML = '';
  breakdown.forEach((item, idx) => {
    cumulativePoints += item.pts;
    const pct = maxPoints > 0 ? Math.max(0, Math.round((cumulativePoints / maxPoints) * 100)) : 100;
    const isNegative = item.pts < 0;

    const el = document.createElement('div');
    el.className = 'perf-timeline-item';
    el.style.animationDelay = `${idx * 0.06}s`;
    el.innerHTML = `
      <div class="ptl-dot" style="background:${student.avatarColor};"></div>
      <div class="ptl-content">
        <div class="ptl-row">
          <span class="ptl-icon">${item.icon}</span>
          <span class="ptl-label">${item.label}</span>
          <span class="ptl-pts" style="${isNegative ? 'color:var(--red);' : ''}">${isNegative ? '' : '+'}${item.pts} pts</span>
        </div>
        <div class="ptl-bar-wrap">
          <div class="ptl-bar" style="width:${pct}%;background:${student.avatarColor};"></div>
          <span class="ptl-total">${cumulativePoints} pts</span>
        </div>
        ${item.ts ? `<div class="ptl-time">${formatRelativeTime(item.ts)}</div>` : ''}
      </div>
    `;
    container.appendChild(el);
  });

  // Summary at the bottom
  const rank = getRankLabel(d.perf.points);
  const summary = document.createElement('div');
  summary.className = 'ptl-summary';
  summary.innerHTML = `
    <div class="ptl-summary-inner" style="border-color:${rank.color}22;background:${rank.color}11;">
      <span style="font-size:1.5rem;">${rank.icon}</span>
      <div>
        <div style="font-weight:700;color:${rank.color};">${rank.label}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);">${d.perf.points} pontos acumulados</div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-size:1.3rem;font-weight:800;color:${rank.color};">${d.perf.points}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);">pontos</div>
      </div>
    </div>
  `;
  container.appendChild(summary);
}

// ============================================================
//  ⚙️ CONFIGURAÇÕES — Settings Page Logic
// ============================================================
// SETTINGS_KEY/DEFAULT_SETTINGS/getSettings() moraram aqui e foram movidas para
// js/data.js (compartilhado) — student.js também precisa ler settings.minScore
// para aprovação de etapa. saveSettings() (só usada pelo professor) continua aqui.

function saveSettings(patch) {
  const current = getSettings();
  const updated = { ...current, ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  if (typeof syncSettingsToSupabase === 'function') {
    syncSettingsToSupabase(updated);
  }
  return updated;
}

let settingsInitialized = false;

function initSettingsView() {
  // Always re-render dynamic sections
  renderSettingsDataStats();
  renderSettingsSessionInfo();
  renderSettingsSysInfo();
  renderSettingsRankLevels();
  renderTeachersManagementTable();

  if (settingsInitialized) {
    loadSettingsValues();
    return;
  }
  settingsInitialized = true;

  loadSettingsValues();

  // Tab switching
  document.querySelectorAll('.cfg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.tab;
      document.querySelectorAll('.cfg-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.cfg-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('cfgpanel-' + panel).classList.add('active');
    });
  });

  // ── GENERAL ──
  document.getElementById('btn-cfg-general-save').addEventListener('click', () => {
    saveSettings({
      instName:        document.getElementById('cfg-inst-name').value,
      instSemester:    document.getElementById('cfg-inst-semester').value,
      instDiscipline:  document.getElementById('cfg-inst-discipline').value,
      instTeacher:     document.getElementById('cfg-inst-teacher').value,
      instDesc:        document.getElementById('cfg-inst-desc').value,
      startDate:       document.getElementById('cfg-start-date').value,
      endDate:         document.getElementById('cfg-end-date').value,
    });
    showToast('✅ Informações gerais salvas!', 'success');
  });

  // ── PLATFORM toggles ──
  document.getElementById('btn-cfg-platform-save').addEventListener('click', () => {
    saveSettings({
      autoUnlockFirst:  document.getElementById('cfg-auto-unlock-first').checked,
      autoUnlockNext:   document.getElementById('cfg-auto-unlock-next').checked,
      allowRetry:       document.getElementById('cfg-allow-retry').checked,
      showAnswers:      document.getElementById('cfg-show-answers').checked,
      showRanking:      document.getElementById('cfg-show-ranking').checked,
      maintenanceMode:  document.getElementById('cfg-maintenance-mode').checked,
      minScore:         parseInt(document.getElementById('cfg-min-score').value),
      minModules:       parseInt(document.getElementById('cfg-min-modules').value),
    });
    showToast('✅ Configurações da plataforma salvas!', 'success');
    if (document.getElementById('cfg-maintenance-mode').checked) {
      showToast('⚠️ Modo de manutenção ativado! Alunos não poderão fazer login.', 'warning');
    }
  });

  // range live update
  document.getElementById('cfg-min-score').addEventListener('input', e => {
    document.getElementById('cfg-min-score-val').textContent = e.target.value + '%';
  });

  // ── SECURITY ──
  document.getElementById('cfg-new-pass').addEventListener('input', e => {
    const val = e.target.value;
    const el  = document.getElementById('cfg-pass-strength');
    if (!val) { el.innerHTML = ''; return; }
    let strength = 0;
    if (val.length >= 6) strength++;
    if (val.length >= 10) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    const levels = [
      { label: 'Muito fraca', color: '#ef4444' },
      { label: 'Fraca',      color: '#f97316' },
      { label: 'Média',      color: '#f59e0b' },
      { label: 'Forte',      color: '#10b981' },
      { label: 'Muito forte', color: '#06b6d4' },
    ];
    const lv = Math.min(strength, 4);
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div style="display:flex;gap:3px;">
          ${[0,1,2,3,4].map(i => `<div style="width:24px;height:4px;border-radius:4px;background:${i <= lv ? levels[lv].color : 'rgba(255,255,255,0.1)'};"></div>`).join('')}
        </div>
        <span style="font-size:0.72rem;font-weight:600;color:${levels[lv].color};">${levels[lv].label}</span>
      </div>
    `;
  });

  document.getElementById('btn-cfg-change-pass').addEventListener('click', async () => {
    const current = document.getElementById('cfg-cur-pass').value;
    const newPass  = document.getElementById('cfg-new-pass').value;
    const confirm  = document.getElementById('cfg-confirm-pass').value;
    if (!current || !newPass || !confirm) { showToast('⚠️ Preencha todos os campos de senha.', 'warning'); return; }
    if (newPass !== confirm) { showToast('❌ As senhas não coincidem.', 'error'); return; }
    if (newPass.length < 4) { showToast('❌ A nova senha deve ter pelo menos 4 caracteres.', 'error'); return; }

    if (isSupabaseConfigured()) {
      // A verificação da senha atual e o hash da nova senha acontecem no servidor
      // (Edge Function "change-password"), nunca no client.
      const result = await callEdgeFunction('change-password', { oldPassword: current, newPassword: newPass });
      if (!result.ok) { showToast(`❌ ${result.error}`, 'error'); return; }
    } else {
      const teacher = getUserById(getSession().userId);
      if (teacher.password !== current) { showToast('❌ Senha atual incorreta.', 'error'); return; }
      const users = JSON.parse(localStorage.getItem('ep_users') || '[]');
      const idx = users.findIndex(u => u.id === teacher.id);
      if (idx !== -1) {
        users[idx].password = newPass;
        localStorage.setItem('ep_users', JSON.stringify(users));
      }
    }

    document.getElementById('cfg-cur-pass').value    = '';
    document.getElementById('cfg-new-pass').value    = '';
    document.getElementById('cfg-confirm-pass').value = '';
    document.getElementById('cfg-pass-strength').innerHTML = '';
    showToast('✅ Senha alterada com sucesso!', 'success');
  });

  document.getElementById('btn-cfg-security-save').addEventListener('click', () => {
    saveSettings({
      passMinLen:      parseInt(document.getElementById('cfg-pass-min-len').value),
      defaultPass:     document.getElementById('cfg-default-pass').value,
      forcePassChange: document.getElementById('cfg-force-pass-change').checked,
    });
    showToast('✅ Configurações de segurança salvas!', 'success');
  });

  // ── GERENCIAR PROFESSORES ──
  document.getElementById('teacher-register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('teach-name').value.trim();
    const email = document.getElementById('teach-email').value.trim();
    const password = document.getElementById('teach-password').value.trim() || '1234';

    const result = await addTeacher({ name, email, password });
    if (!result.ok) {
      showToast(`❌ ${result.error}`, 'error');
      return;
    }
    showToast(`✅ Professor "${name}" cadastrado com sucesso!`, 'success');
    document.getElementById('teacher-register-form').reset();
    document.getElementById('teach-password').value = '1234';
    renderTeachersManagementTable();
  });

  document.getElementById('btn-teach-edit-close').addEventListener('click', closeTeacherEditModal);
  document.getElementById('btn-teach-edit-cancel').addEventListener('click', closeTeacherEditModal);

  document.getElementById('btn-teach-edit-save').addEventListener('click', async () => {
    const id = document.getElementById('edit-teach-id').value;
    const name = document.getElementById('edit-teach-name').value.trim();
    const email = document.getElementById('edit-teach-email').value.trim();
    if (!name || !email) { showToast('⚠️ Preencha nome e email.', 'warning'); return; }
    const result = await updateTeacher(id, { name, email });
    if (!result.ok) { showToast(`❌ ${result.error}`, 'error'); return; }
    showToast('✅ Professor atualizado com sucesso!', 'success');
    closeTeacherEditModal();
    renderTeachersManagementTable();
  });

  document.getElementById('btn-teach-reset-close').addEventListener('click', closeTeacherResetModal);
  document.getElementById('btn-teach-reset-cancel').addEventListener('click', closeTeacherResetModal);

  document.getElementById('btn-teach-reset-save').addEventListener('click', async () => {
    const teacherId = document.getElementById('teach-reset-id').value;
    const newPass = document.getElementById('teach-reset-new-pass').value;
    const confirmPass = document.getElementById('teach-reset-confirm-pass').value;
    if (!newPass || !confirmPass) { showToast('⚠️ Preencha os dois campos de senha.', 'warning'); return; }
    if (newPass !== confirmPass) { showToast('❌ As senhas não coincidem.', 'error'); return; }
    if (newPass.length < 4) { showToast('❌ A nova senha deve ter pelo menos 4 caracteres.', 'error'); return; }

    const result = await resetTeacherPassword(teacherId, newPass);
    if (!result.ok) { showToast(`❌ ${result.error}`, 'error'); return; }
    showToast('✅ Senha do professor redefinida com sucesso!', 'success');
    closeTeacherResetModal();
  });

  // ── SCORING ──
  // calculateStudentPoints() lê os valores direto de getSettings().scoring a cada
  // chamada — não precisa sincronizar nenhuma constante em memória depois de salvar.
  document.getElementById('btn-cfg-scoring-save').addEventListener('click', () => {
    const keys = ['MODULE_STARTED','MODULE_COMPLETED','QUIZ_ATTEMPT','QUIZ_SCORE_BONUS','ACTIVITY_DONE','PERFECT_BONUS','LATE_ACTIVITY_PENALTY','STEP_COMPLETED'];
    const scoring = {};
    keys.forEach(k => {
      scoring[k] = parseFloat(document.getElementById('score-' + k).value) || 0;
    });
    saveSettings({ scoring });
    showToast('✅ Regras de pontuação salvas!', 'success');
  });

  document.getElementById('btn-cfg-scoring-reset').addEventListener('click', () => {
    if (!confirm('Restaurar os valores padrão de pontuação?')) return;
    const defaults = DEFAULT_SETTINGS.scoring;
    Object.keys(defaults).forEach(k => {
      const el = document.getElementById('score-' + k);
      if (el) el.value = defaults[k];
    });
    saveSettings({ scoring: { ...defaults } });
    showToast('✅ Pontuação restaurada para os padrões!', 'info');
  });

  // ── APPEARANCE ──
  setupAccentPalette();

  document.getElementById('cfg-platform-name').addEventListener('input', e => {
    document.getElementById('clp-name').textContent = e.target.value || 'EstruturaPRO';
  });
  document.getElementById('cfg-platform-icon').addEventListener('input', e => {
    document.getElementById('clp-icon').textContent = e.target.value || '⚡';
  });
  document.getElementById('cfg-platform-tagline').addEventListener('input', e => {
    document.getElementById('clp-sub').textContent = e.target.value || 'Painel do Professor';
  });

  document.getElementById('btn-cfg-appearance-save').addEventListener('click', () => {
    const color = document.querySelector('.cfg-color-swatch.active')?.dataset.color
                  || document.getElementById('cfg-custom-color').value;
    saveSettings({
      accentColor:      color,
      platformName:     document.getElementById('cfg-platform-name').value,
      platformIcon:     document.getElementById('cfg-platform-icon').value,
      platformTagline:  document.getElementById('cfg-platform-tagline').value,
      animations:       document.getElementById('cfg-animations').checked,
      bgEffects:        document.getElementById('cfg-bg-effects').checked,
      compactToast:     document.getElementById('cfg-compact-toast').checked,
    });
    applyAppearanceSettings();
    showToast('✅ Aparência aplicada com sucesso!', 'success');
  });

  document.getElementById('btn-cfg-appearance-reset').addEventListener('click', () => {
    if (!confirm('Restaurar o visual padrão?')) return;
    saveSettings({
      accentColor: '#6366f1', platformName: 'EstruturaPRO',
      platformIcon: '⚡', platformTagline: 'Painel do Professor',
      animations: true, bgEffects: true, compactToast: false,
    });
    loadSettingsValues();
    applyAppearanceSettings();
    showToast('✅ Visual restaurado!', 'info');
  });

  // ── DATA: Export ──
  document.getElementById('btn-export-report').addEventListener('click', exportReport);
  document.getElementById('btn-export-pdf-settings').addEventListener('click', exportReportPDF);

  document.getElementById('btn-export-csv').addEventListener('click', () => {
    const students  = getStudents();
    const modules   = getModules();
    const allProgress = getAllProgress();
    let csv = 'Nome,Email,Módulos Liberados,Módulos Concluídos,Média Quiz (%),';
    csv += modules.map(m => m.title).join(',') + '\n';
    students.forEach(s => {
      const stats   = getStudentStats(s.id);
      const progress = allProgress[s.id] || {};
      const row = [
        `"${s.name}"`, s.email, stats.unlocked, stats.completed,
        stats.completed > 0 ? stats.avgScore : '',
        ...modules.map(m => progress[m.id]?.completed ? (progress[m.id].score + '%') : (progress[m.id]?.started ? 'Em andamento' : 'Não iniciado'))
      ];
      csv += row.join(',') + '\n';
    });
    downloadFile(csv, `estruturapro_alunos_${today()}.csv`, 'text/csv;charset=utf-8');
    showToast('📊 CSV exportado com sucesso!', 'success');
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const backup = {};
    const keys = Object.values(DB_KEYS);
    keys.forEach(k => {
      try { backup[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch { backup[k] = null; }
    });
    backup['ep_settings'] = getSettings();
    backup['_exported_at'] = new Date().toISOString();
    backup['_version']     = '2.0.0';
    downloadFile(JSON.stringify(backup, null, 2), `estruturapro_backup_${today()}.json`, 'application/json');
    showToast('🗂️ Backup JSON exportado!', 'success');
  });

  // ── DATA: Import ──
  document.getElementById('cfg-import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data._version) throw new Error('Arquivo não parece ser um backup válido do EstruturaPRO.');
        if (!confirm(`Restaurar backup de ${data._exported_at ? new Date(data._exported_at).toLocaleString('pt-BR') : 'data desconhecida'}?\nTodos os dados atuais serão substituídos.`)) return;
        const keys = Object.values(DB_KEYS);
        keys.forEach(k => { if (data[k] !== undefined && data[k] !== null) localStorage.setItem(k, JSON.stringify(data[k])); });
        if (data['ep_settings']) localStorage.setItem('ep_settings', JSON.stringify(data['ep_settings']));
        document.getElementById('cfg-import-result').innerHTML = '<div style="color:var(--green);font-weight:600;margin-top:0.5rem;">✅ Backup restaurado! Recarregue a página para ver as alterações.</div>';
        showToast('✅ Backup importado com sucesso!', 'success');
      } catch(err) {
        document.getElementById('cfg-import-result').innerHTML = `<div style="color:var(--red);font-weight:600;margin-top:0.5rem;">❌ Erro: ${err.message}</div>`;
        showToast('❌ Falha ao importar o arquivo.', 'error');
      }
    };
    reader.readAsText(file, 'UTF-8');
  });

  // ── Drag-and-drop import ──
  const importArea = document.getElementById('cfg-import-area');
  importArea.addEventListener('dragover', e => { e.preventDefault(); importArea.classList.add('drag-over'); });
  importArea.addEventListener('dragleave', () => importArea.classList.remove('drag-over'));
  importArea.addEventListener('drop', e => {
    e.preventDefault();
    importArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      document.getElementById('cfg-import-file').files = e.dataTransfer.files;
      document.getElementById('cfg-import-file').dispatchEvent(new Event('change'));
    }
  });

  // ── DANGER ZONE ──
  document.getElementById('btn-danger-clear-progress').addEventListener('click', () => {
    requireDangerPassword({
      icon: '🧹',
      title: 'Limpar Progresso',
      subtitle: 'Ação irreversível — confirme sua senha',
      warning: '⚠️ Isso apagará <strong>TODO o progresso</strong> de <strong>todos os alunos</strong>, incluindo logs e respostas de atividades. Os alunos permanecerão cadastrados.',
      confirmLabel: '🧹 Limpar Progresso',
      onConfirm: () => {
        const students = getStudents();
        const emptyProgress = {};
        students.forEach(s => { emptyProgress[s.id] = {}; });
        localStorage.setItem('ep_progress', JSON.stringify(emptyProgress));
        localStorage.setItem('ep_activity_log', JSON.stringify({}));
        localStorage.setItem('ep_student_answers', JSON.stringify({}));
        renderSettingsDataStats();
        showToast('🧹 Progresso de todos os alunos limpo.', 'warning');
      },
    });
  });

  document.getElementById('btn-danger-clear-activities').addEventListener('click', () => {
    requireDangerPassword({
      icon: '🗑️',
      title: 'Remover Atividades',
      subtitle: 'Ação irreversível — confirme sua senha',
      warning: '⚠️ Isso apagará <strong>todas as atividades</strong> criadas pelo professor e <strong>todas as respostas</strong> dos alunos. Esta ação não pode ser desfeita.',
      confirmLabel: '🗑️ Remover Atividades',
      onConfirm: () => {
        localStorage.removeItem('ep_activities');
        localStorage.setItem('ep_student_answers', JSON.stringify({}));
        renderSettingsDataStats();
        showToast('🗑️ Todas as atividades removidas.', 'warning');
      },
    });
  });

  document.getElementById('btn-danger-reset-all').addEventListener('click', () => {
    requireDangerPassword({
      icon: '💣',
      title: 'Reset Completo do Sistema',
      subtitle: 'IRREVERSÍVEL — todos os dados serão apagados',
      warning: '❌ <strong>ATENÇÃO CRÍTICA!</strong> Isso apagará <strong>TODOS os dados</strong> do sistema: alunos, progresso, atividades e configurações. O sistema será restaurado ao estado de fábrica. <strong>Impossível desfazer.</strong>',
      confirmLabel: '💣 Apagar Tudo e Resetar',
      onConfirm: () => {
        Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
        localStorage.removeItem(SETTINGS_KEY);
        showToast('💣 Sistema resetado! Redirecionando...', 'warning');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
      },
    });
  });
}

function loadSettingsValues() {
  const s = getSettings();
  // General
  document.getElementById('cfg-inst-name').value        = s.instName       || '';
  document.getElementById('cfg-inst-semester').value    = s.instSemester   || '';
  document.getElementById('cfg-inst-discipline').value  = s.instDiscipline || '';
  document.getElementById('cfg-inst-teacher').value     = s.instTeacher    || '';
  document.getElementById('cfg-inst-desc').value        = s.instDesc       || '';
  document.getElementById('cfg-start-date').value       = s.startDate      || '';
  document.getElementById('cfg-end-date').value         = s.endDate        || '';
  // Platform
  document.getElementById('cfg-auto-unlock-first').checked  = s.autoUnlockFirst;
  document.getElementById('cfg-auto-unlock-next').checked   = s.autoUnlockNext;
  document.getElementById('cfg-allow-retry').checked        = s.allowRetry;
  document.getElementById('cfg-show-answers').checked       = s.showAnswers;
  document.getElementById('cfg-show-ranking').checked       = s.showRanking;
  document.getElementById('cfg-maintenance-mode').checked   = s.maintenanceMode;
  document.getElementById('cfg-min-score').value            = s.minScore;
  document.getElementById('cfg-min-score-val').textContent  = s.minScore + '%';
  document.getElementById('cfg-min-modules').value          = s.minModules;
  // Security
  document.getElementById('cfg-pass-min-len').value    = s.passMinLen;
  document.getElementById('cfg-default-pass').value    = s.defaultPass;
  document.getElementById('cfg-force-pass-change').checked = s.forcePassChange;
  // Scoring (merge com os defaults — settings salvos antes de um campo novo existir,
  // como LATE_ACTIVITY_PENALTY, não teriam essa chave no objeto salvo)
  const sc = { ...DEFAULT_SETTINGS.scoring, ...(s.scoring || {}) };
  Object.keys(sc).forEach(k => {
    const el = document.getElementById('score-' + k);
    if (el) el.value = sc[k];
  });
  // Appearance
  document.getElementById('cfg-platform-name').value     = s.platformName    || 'EstruturaPRO';
  document.getElementById('cfg-platform-icon').value     = s.platformIcon    || '⚡';
  document.getElementById('cfg-platform-tagline').value  = s.platformTagline || 'Painel do Professor';
  document.getElementById('cfg-animations').checked      = s.animations;
  document.getElementById('cfg-bg-effects').checked      = s.bgEffects;
  document.getElementById('cfg-compact-toast').checked   = s.compactToast;
  document.getElementById('clp-name').textContent        = s.platformName    || 'EstruturaPRO';
  document.getElementById('clp-icon').textContent        = s.platformIcon    || '⚡';
  document.getElementById('clp-sub').textContent         = s.platformTagline || 'Painel do Professor';
  // Accent color swatches
  document.querySelectorAll('.cfg-color-swatch').forEach(sw => sw.classList.remove('active'));
  const matchSwatch = document.querySelector(`.cfg-color-swatch[data-color="${s.accentColor}"]`);
  if (matchSwatch) matchSwatch.classList.add('active');
  document.getElementById('cfg-custom-color').value = s.accentColor || '#6366f1';
  updateAccentPreview(s.accentColor || '#6366f1');
}

function setupAccentPalette() {
  document.querySelectorAll('.cfg-color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.cfg-color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      document.getElementById('cfg-custom-color').value = sw.dataset.color;
      updateAccentPreview(sw.dataset.color);
    });
  });
  document.getElementById('cfg-custom-color').addEventListener('input', e => {
    document.querySelectorAll('.cfg-color-swatch').forEach(s => s.classList.remove('active'));
    updateAccentPreview(e.target.value);
  });
}

function updateAccentPreview(color) {
  document.getElementById('cap-preview-bar').style.background = color;
  document.getElementById('cap-preview-btn').style.background = color;
  document.getElementById('cap-preview-btn').style.boxShadow  = `0 0 20px ${color}55`;
  document.getElementById('cap-preview-badge').style.background = color + '22';
  document.getElementById('cap-preview-badge').style.color = color;
  document.getElementById('cap-preview-badge').style.borderColor = color + '55';
}

function applyAppearanceSettings() {
  const s = getSettings();
  const color = s.accentColor || '#6366f1';
  // Convert hex to RGB for CSS variable
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-light', adjustColor(color, 30));
  document.documentElement.style.setProperty('--accent-dark',  adjustColor(color, -20));
  document.documentElement.style.setProperty('--accent-glow',  `rgba(${r},${g},${b},0.35)`);
  // Platform name
  const logoName = document.getElementById('sidebar-name')?.closest('.sidebar-logo');
  const nameEl   = document.querySelector('.logo-name');
  const iconEl   = document.querySelector('.logo-icon');
  if (nameEl) nameEl.textContent = s.platformName   || 'EstruturaPRO';
  if (iconEl) iconEl.textContent = s.platformIcon   || '⚡';
  // Animations
  if (!s.animations) {
    document.documentElement.style.setProperty('--transition', 'none');
  } else {
    document.documentElement.style.removeProperty('--transition');
  }
  // Background effects
  const mesh = document.querySelector('.bg-mesh');
  const grid = document.querySelector('.bg-grid');
  if (mesh) mesh.style.display = s.bgEffects ? '' : 'none';
  if (grid) grid.style.display = s.bgEffects ? '' : 'none';
}

function adjustColor(hex, amount) {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1,3),16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3,5),16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5,7),16) + amount));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function renderSettingsDataStats() {
  const students    = getStudents();
  const modules     = getModules();
  const activities  = getActivities();
  const allProgress = getAllProgress();
  const allAnswers  = JSON.parse(localStorage.getItem('ep_student_answers') || '{}');
  const allLog      = JSON.parse(localStorage.getItem('ep_activity_log') || '{}');
  const totalLogEntries = Object.values(allLog).reduce((a,v) => a + (v?.length||0), 0);
  const totalCompletions = students.reduce((a, s) => a + Object.values(allProgress[s.id]||{}).filter(p=>p&&p.completed).length, 0);
  const totalAnswers = Object.values(allAnswers).reduce((a,v) => a + Object.keys(v||{}).length, 0);
  const totalStorage = Object.keys(localStorage).filter(k => k.startsWith('ep_')).reduce((a, k) => a + (localStorage.getItem(k)?.length || 0), 0);
  const storagekB = (totalStorage / 1024).toFixed(1);

  const el = document.getElementById('cfg-data-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="cfg-stat-grid">
      <div class="cfg-stat-item">
        <div class="cfg-stat-val">${students.length}</div>
        <div class="cfg-stat-lbl">👥 Alunos</div>
      </div>
      <div class="cfg-stat-item">
        <div class="cfg-stat-val">${modules.length}</div>
        <div class="cfg-stat-lbl">📚 Módulos</div>
      </div>
      <div class="cfg-stat-item">
        <div class="cfg-stat-val">${activities.length}</div>
        <div class="cfg-stat-lbl">✏️ Atividades</div>
      </div>
      <div class="cfg-stat-item">
        <div class="cfg-stat-val">${totalCompletions}</div>
        <div class="cfg-stat-lbl">✅ Conclusões</div>
      </div>
      <div class="cfg-stat-item">
        <div class="cfg-stat-val">${totalAnswers}</div>
        <div class="cfg-stat-lbl">📝 Respostas</div>
      </div>
      <div class="cfg-stat-item">
        <div class="cfg-stat-val">${storagekB} kB</div>
        <div class="cfg-stat-lbl">💾 Storage</div>
      </div>
    </div>
  `;
}

function renderSettingsSessionInfo() {
  const session = getSession();
  const el = document.getElementById('cfg-session-info');
  if (!el) return;
  el.innerHTML = `
    <div class="cfg-session-row">
      <span class="cfg-session-key">👤 Usuário logado</span>
      <span class="cfg-session-val">${session?.name || 'Desconhecido'}</span>
    </div>
    <div class="cfg-session-row">
      <span class="cfg-session-key">🏷️ Papel</span>
      <span class="cfg-session-val">${session?.role === 'teacher' ? '👨‍🏫 Professor' : '👨‍🎓 Aluno'}</span>
    </div>
    <div class="cfg-session-row">
      <span class="cfg-session-key">📅 Sessão iniciada</span>
      <span class="cfg-session-val">${new Date().toLocaleString('pt-BR')}</span>
    </div>
    <div class="cfg-session-row">
      <span class="cfg-session-key">📱 Agente</span>
      <span class="cfg-session-val" style="font-size:0.7rem;">${navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
    </div>
  `;
}

function renderSettingsSysInfo() {
  const el = document.getElementById('cfg-sys-info');
  if (!el) return;
  const totalStorage = Object.keys(localStorage).filter(k => k.startsWith('ep_')).reduce((a, k) => a + (localStorage.getItem(k)?.length || 0), 0);
  el.innerHTML = `
    <div class="cfg-session-row">
      <span class="cfg-session-key">🚀 Versão</span>
      <span class="cfg-session-val">EstruturaPRO 2.0.0</span>
    </div>
    <div class="cfg-session-row">
      <span class="cfg-session-key">💾 Armazenamento usado</span>
      <span class="cfg-session-val">${(totalStorage/1024).toFixed(1)} kB de ~5 MB</span>
    </div>
    <div class="cfg-session-row">
      <span class="cfg-session-key">🌐 Navegador</span>
      <span class="cfg-session-val">${navigator.userAgent.split(')').pop().trim().split(' ')[0]}</span>
    </div>
    <div class="cfg-session-row">
      <span class="cfg-session-key">🖥️ Resolução</span>
      <span class="cfg-session-val">${window.screen.width} × ${window.screen.height}px</span>
    </div>
    <div class="cfg-session-row">
      <span class="cfg-session-key">📅 Data atual</span>
      <span class="cfg-session-val">${new Date().toLocaleDateString('pt-BR', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
    </div>
  `;
}

function renderSettingsRankLevels() {
  const el = document.getElementById('cfg-rank-levels');
  if (!el) return;
  const levels = [
    { icon: '🔰', label: 'Novato',         color: '#64748b', pts: '0',   desc: 'Ponto de partida' },
    { icon: '🌱', label: 'Iniciante',      color: '#6366f1', pts: '20',  desc: 'Começou a aprender' },
    { icon: '⚡',  label: 'Intermediário', color: '#06b6d4', pts: '75',  desc: 'Está evoluindo' },
    { icon: '🔥', label: 'Avançado',       color: '#10b981', pts: '150', desc: 'Bom desempenho' },
    { icon: '💎', label: 'Especialista',  color: '#8b5cf6', pts: '300', desc: 'Domina o conteúdo' },
    { icon: '👑', label: 'Mestre',         color: '#f59e0b', pts: '500', desc: 'Excelente!' },
  ];
  el.innerHTML = levels.map(l => `
    <div class="cfg-rank-level-row">
      <span class="cfg-rl-icon">${l.icon}</span>
      <div class="cfg-rl-info">
        <div class="cfg-rl-label" style="color:${l.color};">${l.label}</div>
        <div class="cfg-rl-desc">${l.desc}</div>
      </div>
      <div class="cfg-rl-pts">
        <span style="color:${l.color};font-weight:800;">≥${l.pts}</span>
        <span style="font-size:0.7rem;color:var(--text-muted);"> pts</span>
      </div>
    </div>
  `).join('');
}

// ── Helpers ──────────────────────────────────────────────────
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Apply settings on initial load
document.addEventListener('DOMContentLoaded', () => {
  // Apply after DOMContentLoaded (runs after initDB)
  setTimeout(applyAppearanceSettings, 0);
});

// ============================================================
//  🔐 DANGER ZONE — Password Confirmation Modal
// ============================================================

let _dangerModalCallback = null;
let _dangerModalSetup = false;

function requireDangerPassword({ icon, title, subtitle, warning, confirmLabel, onConfirm }) {
  const overlay    = document.getElementById('danger-modal-overlay');
  const inputEl    = document.getElementById('danger-password-input');
  const errorEl    = document.getElementById('danger-modal-error');
  const confirmBtn = document.getElementById('danger-modal-confirm');

  // Populate content
  document.getElementById('danger-modal-icon').textContent      = icon || '⚠️';
  document.getElementById('danger-modal-title').textContent     = title || 'Confirmar Ação';
  document.getElementById('danger-modal-subtitle').textContent  = subtitle || 'Esta ação é irreversível';
  document.getElementById('danger-modal-warning').innerHTML     = warning || '';
  document.getElementById('danger-modal-confirm-label').textContent = confirmLabel || 'Confirmar';

  // Deixa claro que é a senha da conta LOGADA no momento, não de outra conta envolvida
  // na ação (ex: ao excluir outro professor, é fácil confundir com a senha dele).
  const currentUser = getUserById(getSession()?.userId);
  document.getElementById('danger-modal-account-hint').textContent =
    currentUser ? `a senha da sua conta (${currentUser.email})` : 'sua senha';

  // Reset state
  inputEl.value = '';
  inputEl.type  = 'password';
  inputEl.classList.remove('input-error');
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
  confirmBtn.disabled = false;
  confirmBtn.classList.remove('loading');

  // Store callback
  _dangerModalCallback = onConfirm;

  // Open
  overlay.classList.add('open');
  setTimeout(() => inputEl.focus(), 220);

  // Wire events only once
  if (!_dangerModalSetup) {
    _dangerModalSetup = true;
    _setupDangerModal();
  }
}

function _setupDangerModal() {
  const overlay    = document.getElementById('danger-modal-overlay');
  const inputEl    = document.getElementById('danger-password-input');
  const errorEl    = document.getElementById('danger-modal-error');
  const confirmBtn = document.getElementById('danger-modal-confirm');
  const toggleVis  = document.getElementById('danger-toggle-vis');

  function closeModal() {
    overlay.classList.remove('open');
    inputEl.value = '';
    inputEl.type  = 'password';
    inputEl.classList.remove('input-error');
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
    confirmBtn.disabled = false;
    confirmBtn.classList.remove('loading');
    _dangerModalCallback = null;
  }

  function showError(msg) {
    errorEl.textContent = '❌ ' + msg;
    errorEl.classList.add('visible');
    inputEl.classList.add('input-error');
    // Remove shake class after animation
    setTimeout(() => inputEl.classList.remove('input-error'), 450);
  }

  async function attemptConfirm() {
    const password = inputEl.value;
    if (!password) {
      showError('Digite sua senha para continuar.');
      inputEl.focus();
      return;
    }

    const session = getSession();
    if (!session) {
      showError('Sessão expirada. Faça login novamente.');
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.classList.add('loading');
    document.getElementById('danger-modal-confirm-label').textContent = 'Verificando...';

    // A verificação da senha acontece no servidor (Edge Function "verify-password")
    // quando o Supabase está configurado; nunca compara contra dado já exposto no client.
    let passwordOk;
    if (isSupabaseConfigured()) {
      const result = await callEdgeFunction('verify-password', { password });
      passwordOk = result.ok && result.data.ok;
    } else {
      const teacher = getUserById(session.userId);
      passwordOk = teacher && teacher.password === password;
    }

    if (!passwordOk) {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove('loading');
      document.getElementById('danger-modal-confirm-label').textContent = 'Confirmar';
      showError('Senha incorreta. Tente novamente.');
      inputEl.value = '';
      inputEl.focus();
      return;
    }

    document.getElementById('danger-modal-confirm-label').textContent = 'Executando...';
    setTimeout(() => {
      closeModal();
      if (typeof _dangerModalCallback === 'function') {
        _dangerModalCallback();
      }
    }, 300);
  }

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // Close button
  document.getElementById('danger-modal-close').addEventListener('click', closeModal);

  // Cancel button
  document.getElementById('danger-modal-cancel').addEventListener('click', closeModal);

  // Confirm button
  confirmBtn.addEventListener('click', attemptConfirm);

  // Enter key
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptConfirm();
    if (e.key === 'Escape') closeModal();
    // Clear error on typing
    if (e.key !== 'Enter') {
      errorEl.classList.remove('visible');
    }
  });

  // Show/hide password toggle
  toggleVis.addEventListener('click', () => {
    if (inputEl.type === 'password') {
      inputEl.type = 'text';
      toggleVis.textContent = '🙈';
    } else {
      inputEl.type = 'password';
      toggleVis.textContent = '👁️';
    }
    inputEl.focus();
  });

  // Keyboard trap: Escape closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeModal();
    }
  });
}

// ============================================================
//  📦 GERENCIAMENTO DE MÓDULOS (CRUD) — Modules CRUD Logic
// ============================================================

let currentEditModuleId = null;

function setupModulesCrudEvents() {
  // Search bar
  document.getElementById('modules-crud-search').addEventListener('input', debounce(() => {
    renderModulesCrudList();
  }));

  document.getElementById('mod-complexity-enabled').addEventListener('change', updateComplexityVisibility);

  document.getElementById('btn-add-mod-video').addEventListener('click', () => {
    addModuleVideoRow().focus();
  });

  // New Module button
  document.getElementById('btn-new-module').addEventListener('click', () => {
    currentEditModuleId = null;
    document.getElementById('modules-form-title').textContent = '➕ Criar Novo Módulo';
    document.getElementById('modules-crud-form').reset();
    setModuleVideoRows([]);
    updateComplexityVisibility(); // reset() desmarca o Big-O → começa desligado em módulo novo
    document.getElementById('mod-id').disabled = false;
    document.getElementById('mod-quiz-questions-container').innerHTML = '';
    document.getElementById('mod-steps-container').innerHTML = '';
    updateTheoryCodeVisibility();

    // Default values
    document.getElementById('mod-color').value = '#6366f1';
    document.getElementById('mod-difficulty').value = 'Intermediário';
    document.getElementById('mod-duration').value = '45 min';

    // Switch views
    document.getElementById('modules-crud-list-sec').style.display = 'none';
    document.getElementById('modules-crud-form-sec').style.display = 'block';

    // Initialize/Refresh CodeMirror Editors
    initModulesCodeMirrorEditors();
    if (modTheoryEditor) {
      modTheoryEditor.setValue('');
      modTheoryEditor.refresh();
    }
    if (modCodeEditor) {
      modCodeEditor.setValue('');
      modCodeEditor.refresh();
    }
    setComplexityField('mod-c-access', 'O(n)');
    setComplexityField('mod-c-search', 'O(n)');
    setComplexityField('mod-c-insert', 'O(1)');
    setComplexityField('mod-c-delete', 'O(1)');
    setComplexityField('mod-c-space', 'O(n)');
    updateModulesTheoryPreview();
    updateMissingFieldsIndicator();

    checkForModuleDraftRecovery();
  });

  // Back to list button
  document.getElementById('btn-modules-form-back').addEventListener('click', () => {
    document.getElementById('modules-crud-form-sec').style.display = 'none';
    document.getElementById('modules-crud-list-sec').style.display = 'block';
  });

  // Cancel form button
  document.getElementById('btn-mod-cancel').addEventListener('click', () => {
    document.getElementById('modules-crud-form-sec').style.display = 'none';
    document.getElementById('modules-crud-list-sec').style.display = 'block';
  });

  // Add quiz question button
  document.getElementById('btn-mod-add-quiz-q').addEventListener('click', () => {
    addQuizQuestionEditor(document.getElementById('mod-quiz-questions-container'));
  });

  document.getElementById('btn-mod-quiz-import').addEventListener('click', () => {
    openQuizImportModal(document.getElementById('mod-quiz-questions-container'));
  });

  // Add module stage button
  document.getElementById('btn-mod-add-step').addEventListener('click', () => {
    openStepEditor(addModuleStageEditor(), true);
  });

  // Janela do Editor de Etapa
  document.getElementById('btn-step-editor-save').addEventListener('click', saveStepEditor);
  document.getElementById('btn-step-editor-cancel').addEventListener('click', cancelStepEditor);
  document.getElementById('btn-close-step-editor').addEventListener('click', cancelStepEditor);
  document.getElementById('btn-step-add-q').addEventListener('click', () => {
    if (stepEditorState) addQuizQuestionEditor(stepEditorState.quizNode);
  });
  document.getElementById('btn-step-quiz-import').addEventListener('click', () => {
    if (stepEditorState) openQuizImportModal(stepEditorState.quizNode);
  });

  // Form submit
  const modulesCrudForm = document.getElementById('modules-crud-form');
  modulesCrudForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveModuleCrudForm();
  });

  // O navegador bloqueia o submit silenciosamente (sem rodar nenhum JS, sem erro no
  // console) se algum campo "required" do formulário estiver vazio — incluindo campos
  // dentro de uma etapa ou de uma pergunta do quiz esquecidos em branco. O evento
  // "invalid" não borbulha (bubble), por isso o listener precisa estar na fase de
  // captura pra pegar o primeiro campo inválido, não importa onde ele esteja.
  let modFormInvalidToastShown = false;
  modulesCrudForm.addEventListener('invalid', (e) => {
    if (modFormInvalidToastShown) return;
    modFormInvalidToastShown = true;
    showToast('❌ Existe um campo obrigatório vazio no formulário (destacado em vermelho) — o módulo não foi salvo.', 'error');
    setTimeout(() => { modFormInvalidToastShown = false; }, 500);
  }, true);

  // Preview modals close
  document.getElementById('btn-mod-close-preview').addEventListener('click', () => {
    document.getElementById('mod-preview-modal').style.display = 'none';
  });
  document.getElementById('btn-mod-close-preview-2').addEventListener('click', () => {
    document.getElementById('mod-preview-modal').style.display = 'none';
  });

  // Histórico de versões
  document.getElementById('btn-mod-close-history').addEventListener('click', () => {
    document.getElementById('mod-history-modal').style.display = 'none';
  });
}

// Editor de uma pergunta. Dentro do questionário de ETAPA (container com a classe
// .stage-quiz-questions-container) a pergunta ganha um seletor de tipo:
//   multiple → múltipla escolha (4 opções + correta)
//   essay    → discursiva (texto livre; conta como certa se respondida)
//   code     → código JavaScript corrigido por casos de teste
// No Quiz do Módulo (sem etapas) continua só múltipla escolha, sem seletor.
// Os valores são preenchidos via .value (não interpolados no HTML) pra não quebrar com aspas.
function addQuizQuestionEditor(container = document.getElementById('mod-quiz-questions-container'), q = null) {
  const withTypes = container.classList.contains('stage-quiz-questions-container');
  const card = document.createElement('div');
  card.className = 'ca-question-card quiz-question-block';
  card.style.cssText = 'padding:1.25rem; margin-top:1rem; border-left:3px solid var(--primary); background:var(--card-bg);';
  card.dataset.questionId = (q && q.id) ? q.id : 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
        <h4 style="margin:0; font-size:0.9rem; font-weight:600; color:var(--text-primary);">Pergunta</h4>
        ${withTypes ? `
          <select class="ca-input ca-select q-type" style="width:auto; padding:0.3rem 0.6rem; font-size:0.8rem;" title="Tipo da pergunta">
            <option value="multiple">🔘 Múltipla escolha</option>
            <option value="essay">📝 Discursiva</option>
            <option value="code">💻 Código (JavaScript)</option>
          </select>` : ''}
      </div>
      <button type="button" class="btn btn-ghost btn-sm btn-mod-delete-q" style="color:var(--red-light); padding:2px 8px;">🗑️ Remover</button>
    </div>
    <div class="ca-fields-grid" style="grid-template-columns: 1fr;">
      <div class="ca-field ca-field-full">
        <label class="ca-label">Texto da Pergunta <span class="ca-required">*</span></label>
        <textarea class="ca-input q-text" rows="2" required placeholder="Ex: Qual é a complexidade de tempo do acesso em um Array?"></textarea>
      </div>
    </div>

    <div class="q-mc-fields">
      <div class="ca-fields-grid" style="grid-template-columns: 1fr 1fr; gap:0.75rem; margin-top:0.75rem;">
        ${[0, 1, 2, 3].map(i => `
          <div class="ca-field">
            <label class="ca-label">Opção ${i + 1} (Índice ${i}) <span class="ca-required">*</span></label>
            <input type="text" class="ca-input q-opt-${i}" required placeholder="Opção ${i + 1}" />
          </div>`).join('')}
      </div>
      <div class="ca-fields-grid" style="grid-template-columns: 1fr; margin-top:0.75rem;">
        <div class="ca-field">
          <label class="ca-label">Opção Correta <span class="ca-required">*</span></label>
          <select class="ca-input ca-select q-correct">
            ${[0, 1, 2, 3].map(i => `<option value="${i}">Opção ${i + 1} (Índice ${i})</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="q-essay-fields" style="display:none; margin-top:0.75rem; font-size:0.8rem; color:var(--text-muted);">
      📝 O aluno responde com texto livre. Qualquer resposta preenchida conta como acerto; você pode ler as respostas na ficha do aluno.
    </div>

    <div class="q-code-fields" style="display:none; margin-top:0.75rem;">
      <p style="font-size:0.8rem; color:var(--text-muted); margin:0 0 0.75rem;">💻 O aluno escreve o código; a resposta é certa se passar em todos os casos de teste.</p>
      <div class="ca-field">
        <label class="ca-label">Código inicial (opcional)</label>
        <textarea class="ca-input q-code-template" rows="5" spellcheck="false" style="font-family:var(--font-mono); font-size:0.82rem;" placeholder="function soma(a, b) {&#10;  // escreva aqui&#10;}"></textarea>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin:0.75rem 0 0.5rem;">
        <label class="ca-label" style="margin:0;">Casos de teste <span class="ca-required">*</span></label>
        <button type="button" class="btn btn-ghost btn-sm btn-q-add-tc">+ Caso de teste</button>
      </div>
      <div class="q-tc-list" style="display:flex; flex-direction:column; gap:0.4rem;"></div>
    </div>

    <div class="ca-fields-grid q-explanation-field" style="grid-template-columns: 1fr; margin-top:0.75rem;">
      <div class="ca-field">
        <label class="ca-label">Explicação da Resposta</label>
        <input type="text" class="ca-input q-explanation" placeholder="Explicação mostrada ao aluno depois de responder..." />
      </div>
    </div>
  `;

  const tcList = card.querySelector('.q-tc-list');
  function addTestCaseRow(tc = { expression: '', expected: '' }) {
    const row = document.createElement('div');
    row.className = 'q-tc-row';
    row.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
    row.innerHTML = `
      <input type="text" class="ca-input q-tc-expr" style="flex:1; font-family:var(--font-mono);" placeholder="Chamada. Ex: soma(2, 3)" />
      <span style="color:var(--text-muted);">→</span>
      <input type="text" class="ca-input q-tc-exp" style="flex:1; font-family:var(--font-mono);" placeholder="Esperado. Ex: 5" />
      <button type="button" class="btn btn-ghost btn-sm" title="Remover caso" style="color:var(--red-light);">✕</button>
    `;
    row.querySelector('.q-tc-expr').value = tc.expression || '';
    row.querySelector('.q-tc-exp').value = tc.expected || '';
    row.querySelector('button').addEventListener('click', () => row.remove());
    tcList.appendChild(row);
  }

  // Preenche os valores
  card.querySelector('.q-text').value = q ? (q.question || '') : '';
  card.querySelector('.q-explanation').value = q ? (q.explanation || '') : '';
  [0, 1, 2, 3].forEach(i => { card.querySelector(`.q-opt-${i}`).value = q?.options?.[i] || ''; });
  card.querySelector('.q-correct').value = String(q && Number.isInteger(q.correct) ? q.correct : 0);
  card.querySelector('.q-code-template').value = q?.template || '';
  (q?.testCases?.length ? q.testCases : [{}]).forEach(tc => addTestCaseRow(tc));

  card.querySelector('.btn-q-add-tc').addEventListener('click', () => addTestCaseRow());

  // Mostra só os campos do tipo escolhido. "required" fica só nas opções de múltipla
  // escolha: campo obrigatório escondido bloquearia o submit do form em silêncio.
  function applyType() {
    const type = withTypes ? card.querySelector('.q-type').value : 'multiple';
    if (withTypes) card.dataset.qtype = type;
    card.querySelector('.q-mc-fields').style.display = type === 'multiple' ? '' : 'none';
    card.querySelector('.q-essay-fields').style.display = type === 'essay' ? '' : 'none';
    card.querySelector('.q-code-fields').style.display = type === 'code' ? '' : 'none';
    card.querySelector('.q-explanation-field').style.display = type === 'essay' ? 'none' : '';
    [0, 1, 2, 3].forEach(i => { card.querySelector(`.q-opt-${i}`).required = type === 'multiple'; });
  }
  if (withTypes) {
    card.querySelector('.q-type').value = q?.type || 'multiple';
    card.querySelector('.q-type').addEventListener('change', applyType);
  }
  applyType();

  card.querySelector('.btn-mod-delete-q').addEventListener('click', () => {
    card.remove();
  });

  container.appendChild(card);
}

// Lê uma pergunta do questionário de ETAPA (com tipo) no formato salvo no módulo.
function readQuestionBlock(block) {
  const type = block.dataset.qtype || 'multiple';
  const q = {
    id: block.dataset.questionId,
    type,
    question: block.querySelector('.q-text').value.trim(),
    explanation: type === 'essay' ? '' : block.querySelector('.q-explanation').value.trim()
  };
  if (type === 'multiple') {
    q.options = [0, 1, 2, 3].map(i => block.querySelector(`.q-opt-${i}`).value.trim());
    q.correct = parseInt(block.querySelector('.q-correct').value);
  } else if (type === 'code') {
    q.template = block.querySelector('.q-code-template').value;
    q.testCases = Array.from(block.querySelectorAll('.q-tc-row')).map(row => ({
      expression: row.querySelector('.q-tc-expr').value.trim(),
      expected: row.querySelector('.q-tc-exp').value.trim()
    })).filter(tc => tc.expression || tc.expected);
  }
  return q;
}

// Mensagem do que falta numa pergunta de etapa, ou null se estiver completa.
function questionBlockError(q) {
  if (!q.question) return 'falta o texto da pergunta';
  if (q.type === 'multiple' && q.options.some(o => !o)) return 'as 4 opções são obrigatórias';
  if (q.type === 'code') {
    if (q.testCases.length === 0) return 'cadastre pelo menos 1 caso de teste';
    if (q.testCases.some(tc => !tc.expression || !tc.expected)) return 'todo caso de teste precisa da chamada e do valor esperado';
  }
  return null;
}

// Cada etapa aparece na tela só como um card compacto (título + nº de perguntas + ações).
// Os dados ficam guardados escondidos dentro do próprio card (.stage-title, .stage-theory e
// o container de perguntas) — é de lá que saveModuleCrudForm() lê, então o salvar do módulo
// não muda. A edição acontece na janela "Editor de Etapa" (openStepEditor), com o mesmo
// editor rico da teoria do módulo.
// Os campos escondidos NÃO têm "required": campo obrigatório invisível bloqueia o submit do
// form em silêncio. A validação é feita ao clicar em "Concluir Etapa".
function addModuleStageEditor(stage = null) {
  const container = document.getElementById('mod-steps-container');
  const card = document.createElement('div');
  card.className = 'ca-question-card module-stage-block';
  card.style.cssText = 'padding:0.9rem 1.1rem; margin-top:0.75rem; border-left:3px solid var(--accent-light, #8b5cf6); background:var(--card-bg);';
  card.dataset.stageId = stage ? stage.id : 'step_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  card.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
      <div style="flex:1; min-width:200px;">
        <div class="stage-order-label" style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted);">Etapa</div>
        <div class="stage-summary-title" style="font-weight:600; font-size:0.95rem; color:var(--text-primary);"></div>
        <div class="stage-summary-meta" style="font-size:0.78rem; color:var(--text-muted);"></div>
      </div>
      <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
        <button type="button" class="btn btn-ghost btn-sm btn-stage-move-up" title="Mover pra cima" style="padding:2px 8px;">⬆️</button>
        <button type="button" class="btn btn-ghost btn-sm btn-stage-move-down" title="Mover pra baixo" style="padding:2px 8px;">⬇️</button>
        <button type="button" class="btn btn-ghost btn-sm btn-stage-edit">✏️ Editar</button>
        <button type="button" class="btn btn-ghost btn-sm btn-mod-delete-step" style="color:var(--red-light);">🗑️ Excluir</button>
      </div>
    </div>
    <div class="stage-data" style="display:none;">
      <input type="text" class="stage-title" />
      <textarea class="stage-theory"></textarea>
      <div class="stage-quiz-questions-container ca-questions-list"></div>
    </div>
  `;

  card.querySelector('.stage-title').value = stage ? stage.title : '';
  card.querySelector('.stage-theory').value = stage ? stage.theory : '';
  const qContainer = card.querySelector('.stage-quiz-questions-container');
  if (stage && stage.quiz) stage.quiz.forEach(q => addQuizQuestionEditor(qContainer, q));

  card.querySelector('.btn-stage-edit').addEventListener('click', () => openStepEditor(card, false));

  card.querySelector('.btn-mod-delete-step').addEventListener('click', () => {
    const title = card.querySelector('.stage-title').value.trim() || 'sem título';
    if (!confirm(`Excluir a etapa "${title}"? (só vale de vez depois de clicar em "Salvar Módulo")`)) return;
    card.remove();
    renumberModuleStages();
  });

  card.querySelector('.btn-stage-move-up').addEventListener('click', () => {
    const prev = card.previousElementSibling;
    if (prev) {
      container.insertBefore(card, prev);
      renumberModuleStages();
    }
  });

  card.querySelector('.btn-stage-move-down').addEventListener('click', () => {
    const next = card.nextElementSibling;
    if (next) {
      container.insertBefore(next, card);
      renumberModuleStages();
    }
  });

  container.appendChild(card);
  updateStageCardSummary(card);
  renumberModuleStages();
  return card;
}

function updateStageCardSummary(card) {
  const title = card.querySelector('.stage-title').value.trim();
  const qCount = card.querySelectorAll('.stage-quiz-questions-container .quiz-question-block').length;
  card.querySelector('.stage-summary-title').textContent = title || '(sem título)';
  card.querySelector('.stage-summary-meta').textContent = `${qCount} pergunta${qCount !== 1 ? 's' : ''}`;
}

// Lê as perguntas de um container (inclusive incompletas) — usado pra validar e pra
// restaurar o estado anterior quando o professor cancela a edição.
function readQuizBlocksRaw(container) {
  return Array.from(container.querySelectorAll('.quiz-question-block')).map(readQuestionBlock);
}

// ── Editor de Etapa (janela) ──
let stepTheoryEditor = null;
let stepEditorState = null; // { card, isNew, quizNode, quizSnapshot }

function initStepTheoryEditor() {
  if (stepTheoryEditor) return;
  stepTheoryEditor = CodeMirror.fromTextArea(document.getElementById('step-theory'), {
    mode: 'markdown',
    theme: 'dracula',
    lineNumbers: true,
    tabSize: 2,
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    spellcheck: true,
    inputStyle: 'contenteditable',
    extraKeys: {
      Tab: (cm) => {
        if (cm.somethingSelected()) cm.indentSelection('add');
        else cm.replaceSelection('  ', 'end');
      },
      'Shift-Tab': (cm) => cm.indentSelection('subtract'),
      'Ctrl-B': (cm) => insertMarkdownTag('bold', cm),
      'Cmd-B': (cm) => insertMarkdownTag('bold', cm),
      'Ctrl-I': (cm) => insertMarkdownTag('italic', cm),
      'Cmd-I': (cm) => insertMarkdownTag('italic', cm),
      'Ctrl-K': (cm) => insertMarkdownTag('link', cm),
      'Cmd-K': (cm) => insertMarkdownTag('link', cm),
      'Shift-Ctrl-K': (cm) => insertMarkdownTag('codeblock', cm),
      'Shift-Cmd-K': (cm) => insertMarkdownTag('codeblock', cm)
    }
  });
  stepTheoryEditor.on('change', updateStepTheoryPreview);

  document.querySelectorAll('#step-md-toolbar .md-btn').forEach(btn => {
    btn.onclick = () => insertMarkdownTag(btn.dataset.tag, stepTheoryEditor);
  });

  const toggles = document.querySelectorAll('#step-theory-editor-block .btn-layout-toggle');
  const split = document.getElementById('step-split-container');
  toggles.forEach(toggle => {
    toggle.onclick = () => {
      toggles.forEach(t => t.classList.remove('active'));
      toggle.classList.add('active');
      split.classList.remove('split-layout', 'editor-layout', 'preview-layout');
      split.classList.add(`${toggle.dataset.layout}-layout`);
      stepTheoryEditor.refresh();
    };
  });

  const templateSelect = document.getElementById('step-theory-template');
  templateSelect.onchange = () => {
    const key = templateSelect.value;
    templateSelect.value = '';
    if (!key || !THEORY_TEMPLATES[key]) return;
    if (stepTheoryEditor.getValue().trim() && !confirm('Isso substitui a teoria atual da etapa pelo modelo escolhido. Continuar?')) return;
    stepTheoryEditor.setValue(THEORY_TEMPLATES[key]);
    stepTheoryEditor.focus();
  };
}

function updateStepTheoryPreview() {
  const text = stepTheoryEditor ? stepTheoryEditor.getValue() : '';
  const pane = document.getElementById('step-preview-pane');
  pane.innerHTML = text.trim()
    ? renderMarkdown(text)
    : '<div class="preview-placeholder">// A prévia renderizada aparecerá aqui em tempo real...</div>';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('step-theory-word-count').textContent =
    words > 0 ? `${words} palavras · ~${Math.max(1, Math.round(words / 200))} min de leitura` : '';
}

function openStepEditor(card, isNew) {
  initStepTheoryEditor();

  // O container de perguntas da etapa é MOVIDO pra dentro da janela (mantém os editores de
  // pergunta com o estado atual) e devolvido ao card ao salvar/cancelar.
  const quizNode = card.querySelector('.stage-quiz-questions-container');
  stepEditorState = { card, isNew, quizNode, quizSnapshot: readQuizBlocksRaw(quizNode) };
  document.getElementById('step-editor-quiz-slot').appendChild(quizNode);

  const idx = Array.from(document.querySelectorAll('#mod-steps-container .module-stage-block')).indexOf(card) + 1;
  document.getElementById('step-editor-heading').textContent = isNew ? `➕ Nova Etapa (Etapa ${idx})` : `✏️ Editar Etapa ${idx}`;
  document.getElementById('step-editor-name').value = card.querySelector('.stage-title').value;
  stepTheoryEditor.setValue(card.querySelector('.stage-theory').value);
  stepTheoryEditor.clearHistory();
  updateStepTheoryPreview();

  document.getElementById('step-editor-modal').classList.add('open');
  setTimeout(() => {
    stepTheoryEditor.refresh();
    document.getElementById('step-editor-name').focus();
  }, 50);
}

function closeStepEditor() {
  const { card, quizNode } = stepEditorState;
  card.querySelector('.stage-data').appendChild(quizNode);
  document.getElementById('step-editor-modal').classList.remove('open');
  stepEditorState = null;
}

function saveStepEditor() {
  if (!stepEditorState) return;
  const { card, quizNode } = stepEditorState;
  const title = document.getElementById('step-editor-name').value.trim();
  const theory = stepTheoryEditor.getValue();
  const questions = readQuizBlocksRaw(quizNode);

  if (!title) { showToast('⚠️ Dê um título para a etapa.', 'warning'); return; }
  if (!theory.trim()) { showToast('⚠️ Escreva a teoria da etapa.', 'warning'); return; }
  if (questions.length === 0) { showToast('⚠️ Adicione pelo menos 1 pergunta ao questionário da etapa.', 'warning'); return; }
  for (let i = 0; i < questions.length; i++) {
    const err = questionBlockError(questions[i]);
    if (err) {
      showToast(`⚠️ Pergunta ${i + 1}: ${err}.`, 'warning');
      return;
    }
  }

  card.querySelector('.stage-title').value = title;
  card.querySelector('.stage-theory').value = theory;
  closeStepEditor();
  updateStageCardSummary(card);

  // Salvar a etapa só organiza o card nesta tela — ainda não grava no servidor.
  showToast('✓ Etapa pronta na lista (ainda não gravada). Clique em "💾 Salvar Módulo" no final da página para gravar de vez.', 'info');
}

function cancelStepEditor() {
  if (!stepEditorState) return;
  const { card, isNew, quizNode, quizSnapshot } = stepEditorState;
  if (!isNew) {
    quizNode.innerHTML = '';
    quizSnapshot.forEach(q => addQuizQuestionEditor(quizNode, q));
  }
  closeStepEditor();
  if (isNew) {
    card.remove();
    renumberModuleStages();
  }
}

// Atualiza o rótulo "Etapa N" de cada card (refletindo a ordem real no DOM) e
// desabilita os botões mover-pra-cima/baixo nas pontas — chamado sempre que a lista
// de etapas muda (adicionar, remover, mover).
function renumberModuleStages() {
  const cards = document.querySelectorAll('#mod-steps-container .module-stage-block');
  cards.forEach((card, idx) => {
    const label = card.querySelector('.stage-order-label');
    if (label) label.textContent = `Etapa ${idx + 1}`;
    const upBtn = card.querySelector('.btn-stage-move-up');
    const downBtn = card.querySelector('.btn-stage-move-down');
    if (upBtn) upBtn.disabled = idx === 0;
    if (downBtn) downBtn.disabled = idx === cards.length - 1;
  });
  updateTheoryCodeVisibility();
}

// Com pelo menos uma etapa, a Teoria/Código do módulo não é usada (cada etapa tem a sua),
// então a seção some do formulário.
function updateTheoryCodeVisibility() {
  const hasSteps = document.querySelectorAll('#mod-steps-container .module-stage-block').length > 0;
  const section = document.getElementById('mod-theory-code-section');
  const wasHidden = section.style.display === 'none';
  section.style.display = hasSteps ? 'none' : '';
  // CodeMirror criado/alterado com o container escondido precisa de refresh ao reaparecer
  if (wasHidden && !hasSteps) {
    if (modTheoryEditor) modTheoryEditor.refresh();
    if (modCodeEditor) modCodeEditor.refresh();
  }
  updateMissingFieldsIndicator();
}

function updateComplexityVisibility() {
  const enabled = document.getElementById('mod-complexity-enabled').checked;
  document.getElementById('mod-complexity-fields').style.display = enabled ? '' : 'none';
}

function renderModulesCrudList() {
  const grid = document.getElementById('modules-crud-grid');
  const countEl = document.getElementById('modules-crud-count');
  const searchVal = document.getElementById('modules-crud-search').value.toLowerCase().trim();
  const modules = getModules();

  const filtered = modules.filter(m => 
    m.title.toLowerCase().includes(searchVal) || 
    m.difficulty.toLowerCase().includes(searchVal)
  );

  countEl.textContent = `${filtered.length} módulo${filtered.length !== 1 ? 's' : ''}`;
  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="ca-empty-questions" style="grid-column:1/-1; padding:3rem;">
        <div class="ca-empty-icon">📦</div>
        <p>Nenhum módulo encontrado.</p>
        <p class="ca-empty-hint">Use o botão "+ Criar Novo Módulo" no topo para criar um novo tópico.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(m => {
    const isDefault = ['arrays', 'linked-list', 'stack', 'queue', 'tree', 'graph'].includes(m.id);
    const card = document.createElement('div');
    card.className = 'ca-question-card';
    card.style.cssText = `
      position: relative; 
      border-left: 4px solid ${m.color || '#6366f1'}; 
      padding: 1.25rem; 
      display: flex; 
      flex-direction: column; 
      justify-content: space-between; 
      height: 100%;
      background: var(--card-bg);
      border-radius: 12px;
      border: 1px solid var(--border);
    `;

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
          <div style="font-size:1.8rem; background:${m.color || '#6366f1'}15; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid ${m.color || '#6366f1'}30;">
            ${escapeHtml(m.emoji) || '📦'}
          </div>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <span class="badge" style="background:${m.color || '#6366f1'}20; color:${m.color || '#6366f1'};">${escapeHtml(m.difficulty)}</span>
            ${isDefault ? '<span class="badge" style="background:#6366f115; color:#6366f1;">Padrão</span>' : '<span class="badge" style="background:#10b98115; color:#10b981;">Custom</span>'}
          </div>
        </div>
        <h3 style="font-size:1.15rem; font-weight:600; color:var(--text-primary); margin:0.5rem 0 0.25rem 0;">${escapeHtml(m.title)}</h3>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin:0 0 0.75rem 0; font-style:italic;">${escapeHtml(m.subtitle)}</p>
        <p style="font-size:0.82rem; color:var(--text-muted); margin:0; line-clamp:2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(m.description) || 'Sem descrição.'}</p>
      </div>
      <div style="margin-top:1.25rem; border-top:1px solid var(--border); padding-top:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; font-size:0.75rem; color:var(--text-secondary);">
          <span>⏱️ ${escapeHtml(m.duration)}</span>
          <span>📝 ${m.quiz ? m.quiz.length : 0} perguntas</span>
        </div>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm btn-mod-student-view" title="Abre o módulo numa nova aba exatamente como o aluno vê (nada é salvo)">🎓 Ver como aluno</button>
          <button class="btn btn-ghost btn-sm btn-mod-preview" data-id="${m.id}" title="Visualizar prévia do aluno">👁️ Prévia</button>
          <button class="btn btn-ghost btn-sm btn-mod-duplicate" data-id="${m.id}" title="Duplicar este módulo como ponto de partida">📋 Duplicar</button>
          <button class="btn btn-ghost btn-sm btn-mod-history" data-id="${m.id}" title="Ver histórico de versões salvas">🕐 Histórico</button>
          <button class="btn btn-ghost btn-sm btn-mod-edit" data-id="${m.id}" title="Editar módulo">✏️ Editar</button>
          ${isDefault ? '' : `<button class="btn btn-ghost btn-sm btn-mod-delete" data-id="${m.id}" style="color:var(--red-light);" title="Excluir módulo">🗑️ Excluir</button>`}
        </div>
      </div>
    `;

    // Bind edit/delete/preview/duplicate actions
    card.querySelector('.btn-mod-preview').addEventListener('click', () => {
      previewModuleCrud(m);
    });

    card.querySelector('.btn-mod-student-view').addEventListener('click', () => {
      window.open(`student.html?preview=${encodeURIComponent(m.id)}`, '_blank');
    });

    card.querySelector('.btn-mod-duplicate').addEventListener('click', () => {
      duplicateModule(m);
    });

    card.querySelector('.btn-mod-history').addEventListener('click', () => {
      openModuleHistoryModal(m);
    });

    card.querySelector('.btn-mod-edit').addEventListener('click', () => {
      renderModulesCrudForm(m.id);
    });

    if (!isDefault) {
      card.querySelector('.btn-mod-delete').addEventListener('click', () => {
        if (confirm(`Tem certeza que deseja excluir o módulo "${m.title}"? Esta ação não pode ser desfeita.`)) {
          deleteCustomModule(m.id);
          showToast('✓ Módulo excluído com sucesso!');
          renderModulesCrudList();
        }
      });
    }

    grid.appendChild(card);
  });
}

function renderModulesCrudForm(moduleId) {
  const m = getModuleById(moduleId);
  if (!m) return;

  currentEditModuleId = moduleId;
  document.getElementById('modules-form-title').textContent = `✏️ Editar Módulo: ${m.title}`;

  // Se é um módulo padrão do sistema, trava o ID pra não quebrar os gatilhos do visualizador
  const isDefault = ['arrays', 'linked-list', 'stack', 'queue', 'tree', 'graph'].includes(m.id);
  fillModuleFormFields(m, { lockId: isDefault });
}

// ── Vídeos do módulo (lista dinâmica de links) ──
function addModuleVideoRow(url = '') {
  const list = document.getElementById('mod-video-list');
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'ca-input mod-video-url-input';
  input.placeholder = 'Ex: https://www.youtube.com/watch?v=...';
  input.value = url;
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-ghost btn-sm';
  removeBtn.title = 'Remover vídeo';
  removeBtn.textContent = '✕';
  removeBtn.onclick = () => {
    row.remove();
    if (!list.children.length) addModuleVideoRow();
    saveModuleDraft();
  };
  row.append(input, removeBtn);
  list.appendChild(row);
  return input;
}

function setModuleVideoRows(urls) {
  document.getElementById('mod-video-list').innerHTML = '';
  (urls.length ? urls : ['']).forEach(u => addModuleVideoRow(u));
}

function getModuleVideoInputValues() {
  return Array.from(document.querySelectorAll('#mod-video-list .mod-video-url-input'))
    .map(i => i.value.trim())
    .filter(Boolean);
}

// Preenche o formulário de criar/editar módulo a partir de um objeto no formato de módulo —
// usado ao editar (módulo real), duplicar (cópia com ID vazio) e recuperar rascunho.
function fillModuleFormFields(m, { lockId = false } = {}) {
  document.getElementById('mod-id').value = m.id || '';
  document.getElementById('mod-id').disabled = lockId;

  document.getElementById('mod-title').value = m.title || '';
  document.getElementById('mod-subtitle').value = m.subtitle || '';
  document.getElementById('mod-emoji').value = m.emoji || '';
  document.getElementById('mod-color').value = m.color || '#6366f1';
  document.getElementById('mod-difficulty').value = m.difficulty || 'Intermediário';
  document.getElementById('mod-duration').value = m.duration || '45 min';

  setModuleVideoRows(Array.isArray(m.video?.urls) ? m.video.urls : (m.video?.url ? [m.video.url] : []));
  document.getElementById('mod-video-autoplay').checked = !!m.video?.autoplay;

  // Módulos antigos (sem o campo) continuam com Big-O ligado
  document.getElementById('mod-complexity-enabled').checked = m.complexity?.enabled !== false;
  updateComplexityVisibility();
  setComplexityField('mod-c-access', m.complexity?.access || 'O(n)');
  setComplexityField('mod-c-search', m.complexity?.search || 'O(n)');
  setComplexityField('mod-c-insert', m.complexity?.insert || 'O(1)');
  setComplexityField('mod-c-delete', m.complexity?.delete || 'O(1)');
  setComplexityField('mod-c-space', m.complexity?.space || 'O(n)');

  // Populate quiz questions
  const container = document.getElementById('mod-quiz-questions-container');
  container.innerHTML = '';
  if (m.quiz && m.quiz.length > 0) {
    m.quiz.forEach(q => {
      addQuizQuestionEditor(container, q);
    });
  }

  // Populate module stages
  const stepsContainer = document.getElementById('mod-steps-container');
  stepsContainer.innerHTML = '';
  if (m.steps && m.steps.length > 0) {
    m.steps.forEach(stage => addModuleStageEditor(stage));
  }
  updateTheoryCodeVisibility();

  // Switch views
  document.getElementById('modules-crud-list-sec').style.display = 'none';
  document.getElementById('modules-crud-form-sec').style.display = 'block';

  // Initialize/Refresh CodeMirror Editors
  initModulesCodeMirrorEditors();
  if (modTheoryEditor) {
    modTheoryEditor.setValue(m.theory || '');
    modTheoryEditor.refresh();
  }
  if (modCodeEditor) {
    modCodeEditor.setValue(cleanLegacyCodeHtml(m.codeExample));
    modCodeEditor.refresh();
  }
  updateModulesTheoryPreview();
  updateMissingFieldsIndicator();
}

function duplicateModule(m) {
  const copy = { ...m, id: '', title: `${m.title} (cópia)` };
  currentEditModuleId = null;
  document.getElementById('modules-form-title').textContent = `➕ Duplicar Módulo: ${m.title}`;
  fillModuleFormFields(copy, { lockId: false });
}

async function openModuleHistoryModal(m) {
  const modal = document.getElementById('mod-history-modal');
  const list = document.getElementById('mod-history-list');
  document.getElementById('mod-history-title').textContent = `🕐 Histórico de Versões: ${m.title}`;
  modal.style.display = 'flex';
  list.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">Carregando...</p>';

  const result = await getModuleHistory(m.id);
  if (!result.ok) {
    list.innerHTML = `<p style="color:var(--red-light); padding:1rem;">❌ ${escapeHtml(result.error)}</p>`;
    return;
  }

  if (!result.history || result.history.length === 0) {
    list.innerHTML = `
      <div class="ca-empty-questions" style="padding:2rem;">
        <div class="ca-empty-icon">🕐</div>
        <p>Nenhuma versão anterior salva ainda.</p>
        <p class="ca-empty-hint">Toda vez que este módulo for salvo novamente, a versão atual entra pro histórico.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  result.history.forEach(entry => {
    const date = new Date(entry.created_at).toLocaleString('pt-BR');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; border:1px solid var(--border); border-radius:8px; margin-bottom:0.6rem; background:var(--card-bg);';
    row.innerHTML = `
      <div>
        <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(entry.snapshot.title || '(sem título)')}</div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">Salvo em ${date}</div>
      </div>
      <button class="btn btn-ghost btn-sm btn-mod-history-restore">↩️ Restaurar</button>
    `;
    row.querySelector('.btn-mod-history-restore').addEventListener('click', async () => {
      if (!confirm(`Restaurar o módulo "${m.title}" para a versão salva em ${date}? A versão atual será guardada no histórico antes.`)) return;
      const restoreResult = await restoreModuleHistory(entry.id);
      if (!restoreResult.ok) {
        showToast(`❌ ${restoreResult.error}`, 'error');
        return;
      }
      showToast('✓ Módulo restaurado com sucesso!');
      modal.style.display = 'none';
      renderModulesCrudList();
    });
    list.appendChild(row);
  });
}

function saveModuleCrudForm() {
  const idInput = document.getElementById('mod-id');
  const id = idInput.value.trim().toLowerCase();

  // Validate ID format
  if (!/^[a-z0-9\-]+$/.test(id)) {
    showToast('❌ O ID Único do módulo deve conter apenas letras minúsculas, números e hifens (sem espaços).', 'warning');
    return;
  }

  // Validate ID collision for new modules
  if (currentEditModuleId === null) {
    const existing = getModuleById(id);
    if (existing) {
      showToast('❌ Este ID Único de módulo já está em uso por outro módulo.', 'warning');
      return;
    }
  }

  // Gather complexity
  const complexity = {
    access: document.getElementById('mod-c-access').value.trim() || 'O(n)',
    search: document.getElementById('mod-c-search').value.trim() || 'O(n)',
    insert: document.getElementById('mod-c-insert').value.trim() || 'O(1)',
    delete: document.getElementById('mod-c-delete').value.trim() || 'O(1)',
    space: document.getElementById('mod-c-space').value.trim() || 'O(n)',
    enabled: document.getElementById('mod-complexity-enabled').checked
  };

  // Gather Quiz (escopado ao container do quiz do módulo — não misturar com as perguntas
  // dentro dos cards de etapa, que têm a mesma classe .quiz-question-block mas em containers
  // próprios dentro de .module-stage-block)
  function collectQuestionBlocks(scopeEl) {
    const list = [];
    let valid = true;
    scopeEl.querySelectorAll('.quiz-question-block').forEach(block => {
      // Pergunta de etapa (tem tipo: múltipla escolha, discursiva ou código)
      if (block.dataset.qtype) {
        const q = readQuestionBlock(block);
        if (questionBlockError(q)) { valid = false; return; }
        list.push(q);
        return;
      }

      const qText = block.querySelector('.q-text').value.trim();
      const opt0 = block.querySelector('.q-opt-0').value.trim();
      const opt1 = block.querySelector('.q-opt-1').value.trim();
      const opt2 = block.querySelector('.q-opt-2').value.trim();
      const opt3 = block.querySelector('.q-opt-3').value.trim();
      const correct = parseInt(block.querySelector('.q-correct').value);
      const explanation = block.querySelector('.q-explanation').value.trim();

      if (!qText || !opt0 || !opt1 || !opt2 || !opt3) {
        valid = false;
        return;
      }

      list.push({
        question: qText,
        options: [opt0, opt1, opt2, opt3],
        correct: correct,
        explanation: explanation
      });
    });
    return { list, valid };
  }

  const quizResult = collectQuestionBlocks(document.getElementById('mod-quiz-questions-container'));
  const quiz = quizResult.list;

  if (!quizResult.valid) {
    showToast('❌ Preencha todos os campos obrigatórios em todas as perguntas do quiz.', 'warning');
    return;
  }

  // Gather Steps (etapas): cada card precisa de título + teoria não vazios e pelo menos
  // 1 pergunta válida no seu próprio questionário.
  const steps = [];
  let stepsValid = true;
  document.querySelectorAll('#mod-steps-container .module-stage-block').forEach(stageBlock => {
    const stageTitle = stageBlock.querySelector('.stage-title').value.trim();
    const stageTheory = stageBlock.querySelector('.stage-theory').value.trim();
    const stageQuizContainer = stageBlock.querySelector('.stage-quiz-questions-container');
    const stageQuizResult = collectQuestionBlocks(stageQuizContainer);

    if (!stageTitle || !stageTheory || !stageQuizResult.valid || stageQuizResult.list.length === 0) {
      stepsValid = false;
      return;
    }

    steps.push({
      id: stageBlock.dataset.stageId,
      title: stageTitle,
      theory: stageTheory,
      quiz: stageQuizResult.list
    });
  });

  if (!stepsValid) {
    showToast('❌ Cada etapa precisa de título, teoria e pelo menos 1 pergunta válida no questionário.', 'warning');
    return;
  }

  const theoryVal = modTheoryEditor ? modTheoryEditor.getValue() : '';
  const codeVal   = modCodeEditor ? modCodeEditor.getValue() : '';

  // A teoria "clássica" do módulo só é exibida quando ele NÃO usa etapas (o aluno vê o
  // fluxo de etapas em vez dela) — por isso só é obrigatória nesse caso.
  if (steps.length === 0 && !theoryVal.trim()) {
    showToast('❌ O conteúdo teórico do módulo é obrigatório.', 'warning');
    return;
  }

  // Video (opcional)
  const videoUrls = getModuleVideoInputValues();
  const invalidIdx = videoUrls.findIndex(u => !extractYouTubeId(u));
  if (invalidIdx !== -1) {
    showToast(`❌ Link de vídeo do YouTube inválido (vídeo ${invalidIdx + 1}). Cole a URL completa do vídeo.`, 'warning');
    return;
  }
  // `url` = primeiro vídeo, mantido por compatibilidade com o formato antigo
  const video = videoUrls.length
    ? { url: videoUrls[0], urls: videoUrls, autoplay: document.getElementById('mod-video-autoplay').checked }
    : { url: '', urls: [], autoplay: false };

  // Colors and Gradients
  const color = document.getElementById('mod-color').value;
  const gradient = `linear-gradient(135deg, ${color} 0%, #111827 100%)`;

  const newModule = {
    id: id,
    title: document.getElementById('mod-title').value.trim(),
    subtitle: document.getElementById('mod-subtitle').value.trim() || '',
    icon: document.getElementById('mod-emoji').value.trim() || '📦',
    emoji: document.getElementById('mod-emoji').value.trim() || '📦',
    color: color,
    gradient: gradient,
    description: (theoryVal.trim() || (steps[0]?.theory || '')).substring(0, 120) + '...',
    duration: document.getElementById('mod-duration').value.trim() || '45 min',
    difficulty: document.getElementById('mod-difficulty').value,
    complexity: complexity,
    theory: theoryVal,
    codeExample: codeVal,
    quiz: quiz,
    video: video,
    steps: steps
  };

  // Save
  saveCustomModule(newModule);
  clearModuleDraft();

  showToast('✓ Módulo salvo com sucesso!');

  // Return to list view
  document.getElementById('modules-crud-form-sec').style.display = 'none';
  document.getElementById('modules-crud-list-sec').style.display = 'block';
  renderModulesCrudList();
}

function previewModuleCrud(m) {
  const modal = document.getElementById('mod-preview-modal');
  const body = document.getElementById('mod-preview-header-body');
  document.getElementById('mod-preview-header-title').textContent = `👁️ Prévia do Aluno: ${m.title}`;

  // Render Theory & Code & Quiz Preview
  let quizHtml = '';
  if (m.quiz && m.quiz.length > 0) {
    quizHtml = `
      <div style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1.5rem;">
        <h3 style="font-size:1.1rem; margin-bottom:1.25rem; font-weight:600; color:var(--text-primary);">❓ Exercícios de Fixação (Quiz)</h3>
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          ${m.quiz.map((q, idx) => `
            <div style="padding:1.25rem; border:1px solid var(--border); border-radius:10px; background:rgba(255,255,255,0.015); border-left:3px solid ${m.color || '#6366f1'};">
              <div style="font-weight:600; font-size:0.9rem; margin-bottom:0.75rem; color:var(--text-primary);">${idx + 1}. ${escapeHtml(q.question)}</div>
              <div style="display:grid; grid-template-columns:1fr; gap:0.5rem; margin-left:0.5rem;">
                ${q.options.map((opt, optIdx) => `
                  <div style="font-size:0.82rem; padding:0.5rem 1rem; border-radius:6px; border:1px solid ${optIdx === q.correct ? 'rgba(16,185,129,0.4)' : 'var(--border)'}; background:${optIdx === q.correct ? 'rgba(16,185,129,0.08)' : 'transparent'}; color:${optIdx === q.correct ? 'var(--green-light)' : 'var(--text-secondary)'};">
                    ${escapeHtml(opt)} ${optIdx === q.correct ? ' <span style="font-weight:700; margin-left:0.5rem;">✓ Resposta Correta</span>' : ''}
                  </div>
                `).join('')}
              </div>
              ${q.explanation ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.75rem; font-style:italic; display:flex; gap:0.35rem; align-items:center;"><span>💡</span><span>Explicação: ${escapeHtml(q.explanation)}</span></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    quizHtml = `
      <div style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1.5rem; color:var(--text-muted); font-style:italic;">
        Nenhuma pergunta cadastrada para o quiz deste módulo.
      </div>
    `;
  }

  const theoryHtml = renderMarkdown(m.theory);

  // Módulos com etapas mostram o percurso etapa por etapa (teoria + gabarito do
  // questionário de cada uma) em vez da seção única de Teoria + Quiz clássico.
  let stepsHtml = '';
  if (m.steps && m.steps.length > 0) {
    stepsHtml = `
      <h3 style="font-size:1rem; font-weight:600; margin-bottom:0.75rem; color:var(--text-primary); border-left:3px solid ${m.color || '#6366f1'}; padding-left:0.5rem;">🪜 Etapas do Módulo (${m.steps.length})</h3>
      <div style="display:flex; flex-direction:column; gap:1.5rem; margin-bottom:2rem;">
        ${m.steps.map((step, sIdx) => `
          <div style="padding:1.25rem; border:1px solid var(--border); border-radius:10px; background:rgba(255,255,255,0.015);">
            <div style="font-weight:700; font-size:0.95rem; margin-bottom:0.75rem; color:var(--text-primary);">Etapa ${sIdx + 1}: ${escapeHtml(step.title)}</div>
            <div style="font-size:0.85rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">${renderMarkdown(step.theory)}</div>
            <div style="display:flex; flex-direction:column; gap:0.85rem;">
              ${(step.quiz || []).map((q, idx) => `
                <div style="padding:0.85rem 1rem; border:1px solid var(--border); border-radius:8px; border-left:3px solid ${m.color || '#6366f1'};">
                  <div style="font-weight:600; font-size:0.85rem; margin-bottom:0.5rem; color:var(--text-primary);">${idx + 1}. ${escapeHtml(q.question)}</div>
                  ${q.type === 'essay' ? `
                    <div style="font-size:0.78rem; color:var(--text-muted);">📝 Discursiva — conta como certa se respondida.</div>
                  ` : q.type === 'code' ? `
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.4rem;">💻 Código — certa se passar em todos os casos:</div>
                    ${q.template ? `<pre style="background:#1e1e2e; color:#a6adc8; padding:0.6rem 0.8rem; border-radius:6px; font-size:0.75rem; overflow-x:auto; margin:0 0 0.4rem;">${escapeHtml(q.template)}</pre>` : ''}
                    ${(q.testCases || []).map(tc => `<div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(tc.expression)} → <span style="color:var(--green-light);">${escapeHtml(tc.expected)}</span></div>`).join('')}
                  ` : (q.options || []).map((opt, optIdx) => `
                    <div style="font-size:0.78rem; padding:0.4rem 0.75rem; border-radius:6px; border:1px solid ${optIdx === q.correct ? 'rgba(16,185,129,0.4)' : 'var(--border)'}; background:${optIdx === q.correct ? 'rgba(16,185,129,0.08)' : 'transparent'}; color:${optIdx === q.correct ? 'var(--green-light)' : 'var(--text-secondary)'}; margin-bottom:0.3rem;">
                      ${escapeHtml(opt)} ${optIdx === q.correct ? ' <span style="font-weight:700; margin-left:0.5rem;">✓ Correta</span>' : ''}
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const videoEmbedUrls = getModuleVideoUrls(m.video)
    .map((url, i) => buildYouTubeEmbedUrl({ url, autoplay: i === 0 && m.video?.autoplay }));
  const videoHtml = videoEmbedUrls.length ? `
    <h3 style="font-size:1rem; font-weight:600; margin-bottom:0.75rem; color:var(--text-primary); border-left:3px solid ${m.color || '#6366f1'}; padding-left:0.5rem;">🎥 Vídeo Aula${videoEmbedUrls.length > 1 ? 's' : ''}</h3>
    ${videoEmbedUrls.map(src => `
    <div style="position:relative; width:100%; padding-top:56.25%; border-radius:10px; overflow:hidden; background:#000; margin-bottom:1rem;">
      <iframe src="${src}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>`).join('')}
    <div style="margin-bottom:1rem;"></div>
  ` : '';

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:start; border-bottom:1px solid var(--border); padding-bottom:1.25rem; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:2.2rem; background:${m.color || '#6366f1'}15; width:56px; height:56px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid ${m.color || '#6366f1'}30;">${escapeHtml(m.emoji) || '📦'}</span>
        <div>
          <h2 style="font-size:1.4rem; font-weight:700; margin:0; color:var(--text-primary);">${escapeHtml(m.title)}</h2>
          <p style="margin:0.2rem 0 0 0; font-size:0.85rem; color:var(--text-secondary); font-style:italic;">${escapeHtml(m.subtitle)}</p>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <span class="badge" style="background:${m.color || '#6366f1'}20; color:${m.color || '#6366f1'}; padding:0.4rem 0.8rem;">${escapeHtml(m.difficulty)}</span>
        <span class="badge badge-muted" style="padding:0.4rem 0.8rem;">⏱️ ${escapeHtml(m.duration)}</span>
      </div>
    </div>

    <!-- Complexity Grid -->
    <div style="${m.complexity?.enabled === false ? 'display:none;' : ''}">
    <h3 style="font-size:1rem; font-weight:600; margin-bottom:0.75rem; color:var(--text-primary);">⏱️ Complexidade Temporal / Espacial</h3>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:0.5rem; margin-bottom:2rem;">
      <div style="text-align:center; padding:0.75rem 0.5rem; border:1px solid var(--border); border-radius:8px; background:rgba(0,0,0,0.15);"><div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.25rem;">Acesso</div><div style="font-weight:700; font-size:0.95rem; color:${m.color || '#6366f1'};">${m.complexity?.access || 'O(n)'}</div></div>
      <div style="text-align:center; padding:0.75rem 0.5rem; border:1px solid var(--border); border-radius:8px; background:rgba(0,0,0,0.15);"><div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.25rem;">Busca</div><div style="font-weight:700; font-size:0.95rem; color:${m.color || '#6366f1'};">${m.complexity?.search || 'O(n)'}</div></div>
      <div style="text-align:center; padding:0.75rem 0.5rem; border:1px solid var(--border); border-radius:8px; background:rgba(0,0,0,0.15);"><div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.25rem;">Inserção</div><div style="font-weight:700; font-size:0.95rem; color:${m.color || '#6366f1'};">${m.complexity?.insert || 'O(n)'}</div></div>
      <div style="text-align:center; padding:0.75rem 0.5rem; border:1px solid var(--border); border-radius:8px; background:rgba(0,0,0,0.15);"><div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.25rem;">Remoção</div><div style="font-weight:700; font-size:0.95rem; color:${m.color || '#6366f1'};">${m.complexity?.delete || 'O(n)'}</div></div>
      <div style="text-align:center; padding:0.75rem 0.5rem; border:1px solid var(--border); border-radius:8px; background:rgba(0,0,0,0.15);"><div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.25rem;">Espaço</div><div style="font-weight:700; font-size:0.95rem; color:${m.color || '#6366f1'};">${m.complexity?.space || 'O(n)'}</div></div>
    </div>
    </div>

    <!-- Video -->
    ${videoHtml}

    ${m.steps && m.steps.length > 0 ? stepsHtml : `
    <!-- Theory -->
    <h3 style="font-size:1rem; font-weight:600; margin-bottom:0.75rem; color:var(--text-primary); border-left:3px solid ${m.color || '#6366f1'}; padding-left:0.5rem;">📖 Explicação Teórica</h3>
    <div class="theory-text" style="font-size:0.88rem; line-height:1.6; color:var(--text-secondary); margin-bottom:2rem; padding-left:0.5rem;">
      ${theoryHtml}
    </div>
    `}

    <!-- Code Block -->
    <h3 style="font-size:1rem; font-weight:600; margin-bottom:0.75rem; color:var(--text-primary); border-left:3px solid ${m.color || '#6366f1'}; padding-left:0.5rem;">💻 Código de Exemplo</h3>
    <pre style="background:#1e1e2e; color:#a6adc8; padding:1.25rem; border-radius:10px; overflow-x:auto; font-size:0.82rem; border:1px solid var(--border); margin-bottom:2rem;"><code style="font-family:'Courier New', Courier, monospace; line-height:1.4;">${escapeHtml(cleanLegacyCodeHtml(m.codeExample))}</code></pre>

    <!-- Quiz (só pra módulos sem etapas) -->
    ${m.steps && m.steps.length > 0 ? '' : quizHtml}
  `;

  modal.style.display = 'flex';
}

// ── Upgraded Module Editors & Live Preview Helpers ────────────────

function initModulesCodeMirrorEditors() {
  const theoryBlock = document.getElementById('theory-editor-block');
  if (theoryBlock) {
    theoryBlock.classList.remove('fullscreen-mode');
    if (theoryFullscreenAnchor) {
      theoryFullscreenAnchor.parent.insertBefore(theoryBlock, theoryFullscreenAnchor.nextSibling);
    }
  }
  const fullscreenBtn = document.getElementById('btn-theory-fullscreen');
  if (fullscreenBtn) fullscreenBtn.classList.remove('active');
  theoryFullscreenActive = false;
  theoryFullscreenAnchor = null;

  document.querySelectorAll('.mod-form-section-hideable').forEach(sec => sec.classList.remove('focus-hidden'));
  const focusBtn = document.getElementById('btn-theory-focus-mode');
  if (focusBtn) focusBtn.classList.remove('active');
  focusModeActive = false;

  if (modTheoryEditor && modCodeEditor) {
    // Already initialized, refresh sizes
    modTheoryEditor.refresh();
    modCodeEditor.refresh();
    updateModulesTheoryPreview();
    return;
  }

  // Initialize modTheoryEditor (Markdown)
  const theoryTextArea = document.getElementById('mod-theory');
  if (theoryTextArea && !modTheoryEditor) {
    modTheoryEditor = CodeMirror.fromTextArea(theoryTextArea, {
      mode: 'markdown',
      theme: 'dracula',
      lineNumbers: true,
      tabSize: 2,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      spellcheck: true,
      inputStyle: 'contenteditable',
      extraKeys: {
        Tab: (cm) => {
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('  ', 'end');
        },
        'Shift-Tab': (cm) => cm.indentSelection('subtract'),
        'Ctrl-B': () => insertMarkdownTag('bold'),
        'Cmd-B': () => insertMarkdownTag('bold'),
        'Ctrl-I': () => insertMarkdownTag('italic'),
        'Cmd-I': () => insertMarkdownTag('italic'),
        'Ctrl-K': () => insertMarkdownTag('link'),
        'Cmd-K': () => insertMarkdownTag('link'),
        'Shift-Ctrl-K': () => insertMarkdownTag('codeblock'),
        'Shift-Cmd-K': () => insertMarkdownTag('codeblock'),
        Esc: () => { if (theoryFullscreenActive) toggleTheoryFullscreen(); }
      }
    });

    modTheoryEditor.on('change', () => {
      updateModulesTheoryPreview();
      updateMissingFieldsIndicator();
      saveModuleDraft();
    });
  }

  // Initialize modCodeEditor (JavaScript)
  const codeTextArea = document.getElementById('mod-code');
  if (codeTextArea && !modCodeEditor) {
    modCodeEditor = CodeMirror.fromTextArea(codeTextArea, {
      mode: 'javascript',
      theme: 'dracula',
      lineNumbers: true,
      tabSize: 2,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      hintOptions: { completeSingle: false },
      extraKeys: {
        'Ctrl-Space': (cm) => cm.showHint({ hint: CodeMirror.hint.javascript }),
        'Ctrl-/': (cm) => cm.toggleComment(),
        Tab: (cm) => {
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('  ', 'end');
        },
        'Shift-Tab': (cm) => cm.indentSelection('subtract')
      }
    });

    modCodeEditor.on('change', () => {
      updateMissingFieldsIndicator();
      saveModuleDraft();
    });
  }

  populateComplexitySelects();

  // Setup toolbar events and layout toggles
  setupModulesEditorControls();

  // Force first preview build
  updateModulesTheoryPreview();
  updateMissingFieldsIndicator();
}

function updateModulesTheoryPreview() {
  const previewPane = document.getElementById('theory-preview-pane');
  const theoryText = modTheoryEditor ? modTheoryEditor.getValue() : '';

  updateTheoryWordCount(theoryText);

  if (!previewPane) return;
  if (!theoryText.trim()) {
    previewPane.innerHTML = '<div class="preview-placeholder">// A prévia renderizada aparecerá aqui em tempo real...</div>';
    return;
  }
  previewPane.innerHTML = renderMarkdown(theoryText);
}

function updateTheoryWordCount(theoryText) {
  const el = document.getElementById('theory-word-count');
  if (!el) return;
  const words = theoryText.trim() ? theoryText.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));
  el.textContent = words > 0 ? `${words} palavras · ~${minutes} min de leitura` : '';
}

// ── Complexidade (Big-O): select com opções comuns + "Outro..." pra texto livre ──
const COMPLEXITY_OPTIONS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];

function populateComplexitySelects() {
  document.querySelectorAll('#modules-crud-form select[data-target]').forEach(select => {
    select.innerHTML = COMPLEXITY_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')
      + '<option value="outro">Outro...</option>';
    select.onchange = () => {
      const targetInput = document.getElementById(select.dataset.target);
      if (select.value === 'outro') {
        targetInput.style.display = '';
        targetInput.focus();
      } else {
        targetInput.style.display = 'none';
        targetInput.value = select.value;
      }
      updateMissingFieldsIndicator();
      saveModuleDraft();
    };
  });
}

// Define o valor de um campo de complexidade, escolhendo a opção do select correspondente
// (ou "Outro..." + mostra o campo de texto, se o valor não bater com nenhuma opção conhecida).
function setComplexityField(inputId, value) {
  const input = document.getElementById(inputId);
  const select = document.getElementById(`${inputId}-select`);
  input.value = value;
  if (!select) return;
  if (COMPLEXITY_OPTIONS.includes(value)) {
    select.value = value;
    input.style.display = 'none';
  } else {
    select.value = 'outro';
    input.style.display = '';
  }
}

// ── Indicador de campos obrigatórios pendentes ──
function updateMissingFieldsIndicator() {
  const el = document.getElementById('mod-missing-fields');
  if (!el) return;

  const missing = [];
  if (!document.getElementById('mod-id').value.trim()) missing.push('ID Único');
  if (!document.getElementById('mod-title').value.trim()) missing.push('Título');
  const hasSteps = document.querySelectorAll('#mod-steps-container .module-stage-block').length > 0;
  if (!hasSteps && (!modTheoryEditor || !modTheoryEditor.getValue().trim())) missing.push('Conteúdo Teórico');

  if (missing.length === 0) {
    el.style.display = 'none';
    el.textContent = '';
  } else {
    el.style.display = 'flex';
    el.textContent = `⚠️ Faltam preencher: ${missing.join(', ')}.`;
  }
}

// ── Modelos prontos de teoria ──
const THEORY_TEMPLATES = {
  linear: `### Como funciona

Descreva aqui o funcionamento básico da estrutura.

### Operações principais

- **Inserção**: explique como um elemento é adicionado.
- **Remoção**: explique como um elemento é removido.
- **Busca**: explique como um elemento é encontrado.

### Quando usar

Descreva cenários práticos onde essa estrutura é a escolha certa.

### Exemplo do dia a dia

Dê uma analogia simples pra fixar o conceito.
`,
  tree: `### Como funciona

Descreva a estrutura hierárquica (nós, raiz, folhas, arestas).

### Percursos / Travessias

Explique as formas de percorrer a estrutura (ex.: em profundidade, em largura).

### Operações principais

- **Inserção**: como um novo nó é posicionado.
- **Remoção**: como um nó é removido sem quebrar a estrutura.
- **Busca**: como localizar um nó específico.

### Complexidade e quando usar

Explique o ganho de desempenho e cenários práticos de uso.
`
};

// ── Rascunho automático (só no fluxo de criar módulo novo, não ao editar um existente) ──
const MODULE_DRAFT_KEY = 'ep_module_draft';

function serializeModuleDraft() {
  return {
    id: document.getElementById('mod-id').value,
    title: document.getElementById('mod-title').value,
    subtitle: document.getElementById('mod-subtitle').value,
    emoji: document.getElementById('mod-emoji').value,
    color: document.getElementById('mod-color').value,
    difficulty: document.getElementById('mod-difficulty').value,
    duration: document.getElementById('mod-duration').value,
    complexity: {
      access: document.getElementById('mod-c-access').value,
      search: document.getElementById('mod-c-search').value,
      insert: document.getElementById('mod-c-insert').value,
      delete: document.getElementById('mod-c-delete').value,
      space: document.getElementById('mod-c-space').value,
      enabled: document.getElementById('mod-complexity-enabled').checked,
    },
    video: {
      urls: getModuleVideoInputValues(),
      autoplay: document.getElementById('mod-video-autoplay').checked,
    },
    theory: modTheoryEditor ? modTheoryEditor.getValue() : '',
    codeExample: modCodeEditor ? modCodeEditor.getValue() : '',
  };
}

const saveModuleDraft = debounce(() => {
  if (currentEditModuleId !== null) return; // só salva rascunho ao criar módulo novo
  const draft = serializeModuleDraft();
  const hasContent = draft.title.trim() || draft.theory.trim() || draft.codeExample.trim();
  if (!hasContent) return;
  localStorage.setItem(MODULE_DRAFT_KEY, JSON.stringify(draft));
}, 800);

function clearModuleDraft() {
  localStorage.removeItem(MODULE_DRAFT_KEY);
}

function checkForModuleDraftRecovery() {
  const raw = localStorage.getItem(MODULE_DRAFT_KEY);
  if (!raw) return;
  let draft;
  try { draft = JSON.parse(raw); } catch { clearModuleDraft(); return; }
  const hasContent = (draft.title || '').trim() || (draft.theory || '').trim() || (draft.codeExample || '').trim();
  if (!hasContent) { clearModuleDraft(); return; }

  if (confirm(`Encontramos um rascunho não salvo de um módulo (${draft.title || 'sem título'}). Deseja recuperá-lo?`)) {
    fillModuleFormFields(draft, { lockId: false });
  } else {
    clearModuleDraft();
  }
}

function setupModulesEditorControls() {
  // 1. Layout Toggles
  // Escopado ao bloco da teoria do módulo — o editor de etapa tem seus próprios toggles
  const toggles = document.querySelectorAll('#theory-editor-block .btn-layout-toggle');
  const splitContainer = document.getElementById('theory-split-container');
  
  // Ensure we add events only once by removing old listener placeholders if any, but since it's vanilla, we just assign onclick
  toggles.forEach(toggle => {
    toggle.onclick = () => {
      toggles.forEach(t => t.classList.remove('active'));
      toggle.classList.add('active');
      const layout = toggle.dataset.layout;

      // Remove classes
      splitContainer.classList.remove('split-layout', 'editor-layout', 'preview-layout');
      
      if (layout === 'split') {
        splitContainer.classList.add('split-layout');
      } else if (layout === 'editor') {
        splitContainer.classList.add('editor-layout');
      } else if (layout === 'preview') {
        splitContainer.classList.add('preview-layout');
      }
      
      // Refresh CodeMirror because size changes
      if (modTheoryEditor) {
        modTheoryEditor.refresh();
      }
    };
  });

  // 1.5 Fullscreen Toggle
  const fullscreenBtn = document.getElementById('btn-theory-fullscreen');
  if (fullscreenBtn) fullscreenBtn.onclick = () => toggleTheoryFullscreen();

  // 1.6 Focus Mode Toggle
  const focusModeBtn = document.getElementById('btn-theory-focus-mode');
  if (focusModeBtn) focusModeBtn.onclick = () => toggleFocusMode();

  // 2. Toolbar Actions
  const toolbarButtons = document.querySelectorAll('#theory-md-toolbar .md-btn');
  toolbarButtons.forEach(btn => {
    btn.onclick = () => {
      const tag = btn.dataset.tag;
      insertMarkdownTag(tag);
    };
  });

  // 3. Modelo de teoria pronto
  const templateSelect = document.getElementById('mod-theory-template');
  if (templateSelect) {
    templateSelect.onchange = () => {
      const key = templateSelect.value;
      templateSelect.value = '';
      if (!key || !THEORY_TEMPLATES[key] || !modTheoryEditor) return;
      const hasContent = modTheoryEditor.getValue().trim().length > 0;
      if (hasContent && !confirm('Isso substitui o conteúdo teórico atual pelo modelo escolhido. Continuar?')) return;
      modTheoryEditor.setValue(THEORY_TEMPLATES[key]);
      modTheoryEditor.focus();
    };
  }

  // 4. Campos gerais do formulário (fora dos editores CodeMirror): rascunho + indicador de pendentes
  const form = document.getElementById('modules-crud-form');
  if (form) {
    form.oninput = () => {
      updateMissingFieldsIndicator();
      saveModuleDraft();
    };
  }
}

// Ao entrar em tela cheia, o bloco é movido para document.body: alguns ancestrais do form
// usam backdrop-filter (efeito de vidro fosco), que cria um "containing block" novo pra
// elementos position:fixed — sem isso, a tela cheia ficaria presa dentro do layout normal
// em vez de cobrir a viewport inteira.
let theoryFullscreenAnchor = null; // { parent, nextSibling } para restaurar a posição original

function toggleTheoryFullscreen() {
  const block = document.getElementById('theory-editor-block');
  const btn = document.getElementById('btn-theory-fullscreen');
  if (!block) return;

  theoryFullscreenActive = !theoryFullscreenActive;

  if (theoryFullscreenActive) {
    theoryFullscreenAnchor = { parent: block.parentElement, nextSibling: block.nextElementSibling };
    document.body.appendChild(block);
  } else if (theoryFullscreenAnchor) {
    theoryFullscreenAnchor.parent.insertBefore(block, theoryFullscreenAnchor.nextSibling);
    theoryFullscreenAnchor = null;
  }

  block.classList.toggle('fullscreen-mode', theoryFullscreenActive);
  if (btn) btn.classList.toggle('active', theoryFullscreenActive);

  if (modTheoryEditor) {
    setTimeout(() => modTheoryEditor.refresh(), 50);
  }
}

// Modo Foco: esconde as seções do form que não são teoria/código (Informações Básicas,
// Big-O, Vídeo, Quiz), pra escrever sem distração sem precisar ir pra tela cheia.
function toggleFocusMode() {
  const btn = document.getElementById('btn-theory-focus-mode');
  focusModeActive = !focusModeActive;
  document.querySelectorAll('.mod-form-section-hideable').forEach(sec => {
    sec.classList.toggle('focus-hidden', focusModeActive);
  });
  if (btn) btn.classList.toggle('active', focusModeActive);
  if (modTheoryEditor) {
    setTimeout(() => modTheoryEditor.refresh(), 50);
  }
}

// cm: qual editor recebe a formatação (teoria do módulo por padrão, ou o editor de etapa)
function insertMarkdownTag(tag, cm = modTheoryEditor) {
  if (!cm) return;

  const selection = cm.getSelection();
  const cursor = cm.getCursor();

  if (tag === 'clear') {
    if (selection) {
      const plain = selection
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^>\s?/gm, '')
        .replace(/^[-*]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1');
      cm.replaceSelection(plain, 'around');
    }
    cm.focus();
    return;
  }

  let replacement = '';
  let cursorOffset = 0; // offset to place cursor inside tags if selection is empty

  switch (tag) {
    case 'bold':
      replacement = `**${selection || 'texto'}**`;
      cursorOffset = 2;
      break;
    case 'italic':
      replacement = `*${selection || 'texto'}*`;
      cursorOffset = 1;
      break;
    case 'header':
      const lineContent = cm.getLine(cursor.line);
      cm.setSelection({ line: cursor.line, ch: 0 }, { line: cursor.line, ch: lineContent.length });
      replacement = `### ${selection || lineContent || 'Título'}`;
      break;
    case 'code':
      replacement = `\`${selection || 'codigo'}\``;
      cursorOffset = 1;
      break;
    case 'codeblock':
      replacement = `\`\`\`javascript\n${selection || '// código aqui'}\n\`\`\``;
      cursorOffset = 14;
      break;
    case 'link':
      replacement = `[${selection || 'Texto do Link'}](https://exemplo.com)`;
      cursorOffset = 1;
      break;
    case 'image':
      replacement = `![${selection || 'descrição da imagem'}](https://exemplo.com/imagem.png)`;
      cursorOffset = 2;
      break;
    case 'list':
      replacement = `\n- ${selection || 'Item'}`;
      break;
    case 'orderedlist':
      replacement = `\n1. ${selection || 'Item'}`;
      break;
    case 'quote': {
      const quoteLine = cm.getLine(cursor.line);
      cm.setSelection({ line: cursor.line, ch: 0 }, { line: cursor.line, ch: quoteLine.length });
      replacement = `> ${selection || quoteLine || 'Citação'}`;
      break;
    }
    case 'hr':
      replacement = `\n\n---\n\n`;
      break;
    case 'table':
      replacement = `\n| Cabeçalho 1 | Cabeçalho 2 |\n| ----------- | ----------- |\n| Valor 1     | Valor 2     |\n`;
      break;
    case 'check':
      replacement = ` ✅ `;
      break;
    case 'cross':
      replacement = ` ❌ `;
      break;
  }

  cm.replaceSelection(replacement, 'around');
  cm.focus();

  // If there was no selection, place cursor inside the tags for convenience
  if (!selection && cursorOffset > 0) {
    const newCursor = cm.getCursor('from');
    if (tag === 'codeblock') {
      cm.setCursor({ line: newCursor.line + 1, ch: 0 });
    } else {
      cm.setCursor({ line: newCursor.line, ch: newCursor.ch + cursorOffset });
    }
  }
}

// ── Banco de Questões (Professor CRUD e Importação) ──
function renderQuestionsCrud() {
  const modules = getModules();
  const filterMod = document.getElementById('qb-filter-module');
  const modalMod = document.getElementById('qb-modal-module');

  if (filterMod && filterMod.options.length <= 1) {
    filterMod.innerHTML = '<option value="">Todos os Módulos</option>';
    modules.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.title;
      filterMod.appendChild(opt);
    });
  }

  if (modalMod) {
    modalMod.innerHTML = '';
    modules.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.title;
      modalMod.appendChild(opt);
    });
  }

  renderQuestionStats();
  renderQuestionsTable();
}

function renderQuestionStats() {
  const container = document.getElementById('qb-stats-container');
  if (!container) return;

  const modules = getModules();
  container.innerHTML = '';

  modules.forEach(m => {
    const qCount = getBankQuestionsByModule(m.id).length;
    const statItem = document.createElement('div');
    statItem.className = 'overview-stat';
    statItem.style.background = 'var(--bg-card)';
    statItem.style.border = '1px solid var(--border)';
    statItem.style.padding = '1.25rem';
    statItem.style.display = 'flex';
    statItem.style.flexDirection = 'column';
    statItem.style.gap = '0.35rem';
    statItem.style.borderRadius = 'var(--radius-md)';

    let statusText = '';
    if (qCount === 0) {
      statusText = `<span style="font-size:0.75rem;color:var(--red-light);font-weight:700;">⚠️ Sem questões</span>`;
    } else if (qCount < 10) {
      statusText = `<span style="font-size:0.75rem;color:var(--yellow-light);font-weight:700;">⚠️ Poucas questões (${qCount}/10)</span>`;
    } else {
      statusText = `<span style="font-size:0.75rem;color:var(--green-light);font-weight:700;">✅ Suficiente (>= 10)</span>`;
    }

    statItem.innerHTML = `
      <div style="font-size:0.85rem;color:var(--text-secondary);font-weight:600;">${escapeHtml(m.title)}</div>
      <div style="font-size:2rem;font-weight:800;color:var(--text-primary);line-height:1.1;">${qCount}</div>
      <div style="margin-top:0.25rem;">${statusText}</div>
    `;
    container.appendChild(statItem);
  });
}

function renderQuestionsTable() {
  const tbody = document.getElementById('qb-questions-tbody');
  if (!tbody) return;

  const filterMod = document.getElementById('qb-filter-module').value;
  const filterType = document.getElementById('qb-filter-type').value;
  const keyword = document.getElementById('qb-search-keyword').value.toLowerCase().trim();

  let questions = getBankQuestions();

  // Filters
  if (filterMod) {
    questions = questions.filter(q => q.module_id === filterMod);
  }
  if (filterType) {
    questions = questions.filter(q => q.type === filterType);
  }
  if (keyword) {
    questions = questions.filter(q => q.statement.toLowerCase().includes(keyword));
  }

  document.getElementById('qb-questions-count-badge').textContent = `${questions.length} questões`;

  tbody.innerHTML = '';
  if (questions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);font-style:italic;padding:2rem;">Nenhuma questão encontrada com os filtros selecionados.</td></tr>`;
    return;
  }

  questions.forEach(q => {
    const tr = document.createElement('tr');

    const modName = getModuleById(q.module_id)?.title || q.module_id;
    let typeLabel = '';
    if (q.type === 'multiple') typeLabel = 'Múltipla Escolha';
    else if (q.type === 'true_false') typeLabel = 'Verd./Falso';
    else if (q.type === 'essay') typeLabel = 'Dissertativa';

    // Formatar alternativas/gabarito
    let ansDetails = '';
    if (q.type === 'multiple') {
      const correctIdx = parseInt(q.correct_answer);
      const letter = ['A','B','C','D','E'][correctIdx] || '?';
      const text = q.options[correctIdx] || '';
      ansDetails = `<span style="font-size:0.8rem;color:var(--text-secondary);">${q.options.length} alt. | Gabarito: <strong>${letter}</strong> (${escapeHtml(text.substring(0, 20))}...)</span>`;
    } else if (q.type === 'true_false') {
      const correctVal = q.correct_answer === '0' ? 'Verd.' : 'Falso';
      ansDetails = `<span style="font-size:0.8rem;color:var(--text-secondary);">Gabarito: <strong>${correctVal}</strong></span>`;
    } else if (q.type === 'essay') {
      ansDetails = `<span style="font-size:0.8rem;color:var(--text-secondary);">Gabarito: <strong>"${escapeHtml(q.correct_answer)}"</strong></span>`;
    }

    const shortStatement = q.statement.length > 90 ? q.statement.substring(0, 87) + '...' : q.statement;

    tr.innerHTML = `
      <td><span style="font-weight:600;font-size:0.85rem;color:var(--text-primary);">${escapeHtml(modName)}</span></td>
      <td><span class="badge badge-muted" style="font-size:0.75rem;">${typeLabel}</span></td>
      <td><span style="font-size:0.85rem;" title="${escapeHtml(q.statement)}">${escapeHtml(shortStatement)}</span></td>
      <td>${ansDetails}</td>
      <td style="text-align:center;">
        <div style="display:inline-flex;gap:0.5rem;">
          <button class="btn btn-ghost btn-sm btn-qb-edit" style="padding:0.25rem 0.6rem;font-size:0.75rem;border:1px solid var(--border);">✏️ Editar</button>
          <button class="btn btn-ghost btn-sm btn-qb-delete" style="padding:0.25rem 0.6rem;font-size:0.75rem;color:var(--red-light);border:1px solid var(--border);">🗑️ Excluir</button>
        </div>
      </td>
    `;
    tr.querySelector('.btn-qb-edit').addEventListener('click', () => openQuestionModal(q.id));
    tr.querySelector('.btn-qb-delete').addEventListener('click', () => deleteQuestion(q.id));
    tbody.appendChild(tr);
  });
}

function renderDynamicModalOptions(type, data = null) {
  const container = document.getElementById('qb-modal-dynamic-options-section');
  if (!container) return;

  container.innerHTML = '';

  if (type === 'multiple') {
    container.innerHTML = `
      <label style="font-size:0.85rem; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:0.5rem;">Alternativas (marque a correta):</label>
      <div style="display:flex; flex-direction:column; gap:0.6rem;" id="qb-options-list">
        <!-- 4 options -->
      </div>
    `;
    const list = document.getElementById('qb-options-list');
    const savedOpts = (data && data.options) ? data.options : ['', '', '', ''];
    const correctIdx = (data && data.correct_answer) ? parseInt(data.correct_answer) : 0;

    savedOpts.forEach((opt, oIdx) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '0.5rem';
      item.innerHTML = `
        <input type="radio" name="qb-correct-radio" value="${oIdx}" ${oIdx === correctIdx ? 'checked' : ''} style="cursor:pointer;" />
        <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted); width:15px;">${['A','B','C','D','E'][oIdx]}</span>
        <input type="text" class="form-input qb-opt-input" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.25); border:1px solid var(--border); color:var(--text-primary); border-radius:var(--radius-sm);" placeholder="Texto da alternativa ${['A','B','C','D','E'][oIdx]}..." value="${escapeHtml(opt)}" required />
      `;
      list.appendChild(item);
    });

  } else if (type === 'true_false') {
    const correctVal = (data && data.correct_answer) ? data.correct_answer : '0';
    container.innerHTML = `
      <label style="font-size:0.85rem; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:0.5rem;">Gabarito Correto:</label>
      <div style="display:flex; gap:1.5rem;">
        <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; cursor:pointer;">
          <input type="radio" name="qb-tf-radio" value="0" ${correctVal === '0' ? 'checked' : ''} /> Verdadeiro
        </label>
        <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; cursor:pointer;">
          <input type="radio" name="qb-tf-radio" value="1" ${correctVal === '1' ? 'checked' : ''} /> Falso
        </label>
      </div>
    `;
  } else if (type === 'essay') {
    const correctVal = (data && data.correct_answer) ? data.correct_answer : '';
    container.innerHTML = `
      <div class="form-group" style="display:flex; flex-direction:column; gap:0.35rem;">
        <label style="font-size:0.85rem; font-weight:600; color:var(--text-secondary);">Resposta Esperada (Texto exato ou palavra-chave)</label>
        <input type="text" id="qb-modal-essay-answer" class="form-input" style="padding:0.6rem; background:rgba(0,0,0,0.25); border:1px solid var(--border); color:var(--text-primary); border-radius:var(--radius-sm);" placeholder="Escreva o gabarito..." value="${escapeHtml(correctVal)}" required />
      </div>
    `;
  }
}

function openQuestionModal(questionId = null) {
  const overlay = document.getElementById('qb-question-modal-overlay');
  const titleEl = document.getElementById('qb-modal-title');
  const form = document.getElementById('qb-question-form');

  form.reset();

  // Populate dynamic select list if it's first run
  renderQuestionsCrud();

  if (questionId) {
    titleEl.textContent = 'Editar Questão';
    document.getElementById('qb-edit-id').value = questionId;

    const questions = getBankQuestions();
    const q = questions.find(item => item.id === questionId);
    if (q) {
      document.getElementById('qb-modal-module').value = q.module_id;
      document.getElementById('qb-modal-type').value = q.type;
      document.getElementById('qb-modal-statement').value = q.statement;
      renderDynamicModalOptions(q.type, q);
    }
  } else {
    titleEl.textContent = 'Cadastrar Nova Questão';
    document.getElementById('qb-edit-id').value = '';
    renderDynamicModalOptions('multiple');
  }

  overlay.classList.add('open');
}

function closeQuestionModal() {
  const overlay = document.getElementById('qb-question-modal-overlay');
  overlay.classList.remove('open');
}

function saveQuestionFromForm(e) {
  if (e) e.preventDefault();

  const editId = document.getElementById('qb-edit-id').value;
  const modId = document.getElementById('qb-modal-module').value;
  const qType = document.getElementById('qb-modal-type').value;
  const statement = document.getElementById('qb-modal-statement').value.trim();

  if (!statement) {
    showToast('⚠️ Por favor, escreva o enunciado da questão.', 'warning');
    return;
  }

  let options = [];
  let correct_answer = '';

  if (qType === 'multiple') {
    const inputs = document.querySelectorAll('.qb-opt-input');
    let hasEmpty = false;
    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (!val) hasEmpty = true;
      options.push(val);
    });

    if (hasEmpty) {
      showToast('⚠️ Por favor, preencha todas as alternativas.', 'warning');
      return;
    }

    const checkedRadio = document.querySelector('input[name="qb-correct-radio"]:checked');
    if (!checkedRadio) {
      showToast('⚠️ Selecione a alternativa correta.', 'warning');
      return;
    }
    correct_answer = checkedRadio.value;

  } else if (qType === 'true_false') {
    const checkedRadio = document.querySelector('input[name="qb-tf-radio"]:checked');
    correct_answer = checkedRadio ? checkedRadio.value : '0';
    options = ['Verdadeiro', 'Falso'];
  } else if (qType === 'essay') {
    correct_answer = document.getElementById('qb-modal-essay-answer').value.trim();
    if (!correct_answer) {
      showToast('⚠️ Por favor, escreva a resposta esperada.', 'warning');
      return;
    }
  }

  const question = {
    id: editId || ('q_bank_' + Date.now() + '_' + Math.floor(Math.random() * 9999)),
    module_id: modId,
    type: qType,
    statement: statement,
    options: options,
    correct_answer: correct_answer
  };

  saveBankQuestion(question);
  closeQuestionModal();
  showToast(editId ? '✅ Questão atualizada com sucesso!' : '✅ Nova questão cadastrada com sucesso!', 'success');
  renderQuestionsCrud();
}

function deleteQuestion(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir esta questão permanentemente?')) {
    deleteBankQuestion(id);
    showToast('🗑️ Questão excluída com sucesso.', 'info');
    renderQuestionsCrud();
  }
}

function openCSVImportModal() {
  document.getElementById('qb-csv-modal-overlay').classList.add('open');
  document.getElementById('qb-csv-text').value = '';
  document.getElementById('qb-csv-file').value = '';
  document.getElementById('qb-csv-import-result').innerHTML = '';
}

function closeCSVImportModal() {
  document.getElementById('qb-csv-modal-overlay').classList.remove('open');
}

function importQuestionsFromCSV() {
  const rawText = document.getElementById('qb-csv-text').value.trim();
  if (!rawText) {
    showToast('⚠️ Cole o CSV ou carregue um arquivo antes de importar.', 'warning');
    return;
  }

  const lines = rawText.split('\n').filter(l => l.trim());
  let importedCount = 0;
  let errors = [];

  // Helper para decodificar linha CSV respeitando aspas
  function parseCSVLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => {
      if (val.startsWith('"') && val.endsWith('"')) {
        return val.substring(1, val.length - 1);
      }
      return val;
    });
  }

  lines.forEach((line, idx) => {
    // Ignorar primeira linha se for cabeçalho
    if (idx === 0 && line.toLowerCase().includes('modulo_id') && line.toLowerCase().includes('tipo')) {
      return;
    }

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 5) {
        errors.push(`Linha ${idx + 1}: Colunas insuficientes (esperado 5 colunas)`);
        return;
      }

      const [modId, type, statement, alternativesRaw, correctAns] = parts;
      
      if (!modId || !type || !statement || !correctAns) {
        errors.push(`Linha ${idx + 1}: Módulo, Tipo, Enunciado ou Gabarito vazio`);
        return;
      }

      // Validar tipo
      if (!['multiple', 'true_false', 'essay'].includes(type)) {
        errors.push(`Linha ${idx + 1}: Tipo de questão inválido ("${type}")`);
        return;
      }

      // Obter alternativas
      let options = [];
      if (type === 'multiple') {
        options = alternativesRaw.split('|').map(x => x.trim()).filter(Boolean);
        if (options.length < 2) {
          errors.push(`Linha ${idx + 1}: Questão múltipla escolha requer ao menos 2 alternativas divididas por "|"`);
          return;
        }
      } else if (type === 'true_false') {
        options = ['Verdadeiro', 'Falso'];
      }

      const question = {
        id: 'q_bank_csv_' + Date.now() + '_' + Math.floor(Math.random() * 99999) + '_' + idx,
        module_id: modId,
        type: type,
        statement: statement,
        options: options,
        correct_answer: correctAns
      };

      saveBankQuestion(question);
      importedCount++;

    } catch (err) {
      errors.push(`Linha ${idx + 1}: Erro inesperado ao processar linha - ${err.message}`);
    }
  });

  const resultEl = document.getElementById('qb-csv-import-result');
  let html = '';
  if (importedCount > 0) {
    html += `<div style="color:var(--green);font-weight:600;margin-bottom:0.35rem;">✅ ${importedCount} questão(ões) importada(s) com sucesso!</div>`;
  }
  if (errors.length > 0) {
    html += `<div style="color:var(--red);font-weight:600;margin-bottom:0.25rem;">❌ ${errors.length} erro(s):</div>`;
    html += errors.slice(0, 10).map(e => `<div style="font-size:0.75rem;color:var(--text-muted);padding-left:0.75rem;">- ${e}</div>`).join('');
    if (errors.length > 10) {
      html += `<div style="font-size:0.75rem;color:var(--text-muted);padding-left:0.75rem;font-style:italic;">... e mais ${errors.length - 10} erro(s).</div>`;
    }
  }
  resultEl.innerHTML = html;

  if (importedCount > 0) {
    showToast(`📚 ${importedCount} questões importadas com sucesso!`, 'success');
    renderQuestionsCrud();
  }
}

window.renderQuestionsCrud = renderQuestionsCrud;
window.renderDynamicModalOptions = renderDynamicModalOptions;
window.openQuestionModal = openQuestionModal;
window.deleteQuestion = deleteQuestion;
window.closeQuestionModal = closeQuestionModal;
window.saveQuestionFromForm = saveQuestionFromForm;
window.openCSVImportModal = openCSVImportModal;
window.closeCSVImportModal = closeCSVImportModal;
window.importQuestionsFromCSV = importQuestionsFromCSV;

