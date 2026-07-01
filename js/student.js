// ============================================================
//  EstruturaPRO — Student Dashboard Logic
// ============================================================

let currentUser = null;
let currentModule = null;
let currentActivity = null;
const studentEditorInstances = {};
const runCounters = {}; // tracks execution count per question
let visualizer = null;
let quizState = { current: 0, answers: [], score: 0 };

document.addEventListener('DOMContentLoaded', () => {
  initDB();
  const session = getSession();
  if (!session || session.role !== 'student') {
    window.location.href = 'index.html';
    return;
  }
  currentUser = getUserById(session.userId);
  if (!currentUser) { clearSession(); window.location.href = 'index.html'; return; }

  initStudentUI();
});

// ── Init UI ──────────────────────────────────────────────
function initStudentUI() {
  populateUserInfo();
  renderSidebarNav();
  renderDashboard();
  setupEventListeners();
  updateGreeting();
}

function populateUserInfo() {
  const { name, avatar, avatarColor } = currentUser;
  document.getElementById('sidebar-avatar').textContent = avatar;
  document.getElementById('sidebar-avatar').style.background = avatarColor;
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('header-avatar').textContent = avatar;
  document.getElementById('header-avatar').style.background = avatarColor;
  document.getElementById('header-name').textContent = name.split(' ')[0];
  document.getElementById('greeting-text').textContent = `Olá, ${name.split(' ')[0]}! 👋`;
}

function updateGreeting() {
  const h = new Date().getHours();
  const period = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  document.getElementById('greeting-text').textContent = `${period}, ${currentUser.name.split(' ')[0]}! 👋`;
}

// ── Sidebar Nav ──────────────────────────────────────────
function renderSidebarNav() {
  const modulesList = document.getElementById('nav-modules-list');
  const activitiesList = document.getElementById('nav-activities-list');
  
  const access = getStudentModuleAccess(currentUser.id);
  const progress = getStudentProgress(currentUser.id);
  const modules = getModules();

  if (modulesList) {
    modulesList.innerHTML = '';
    modules.forEach(mod => {
      const unlocked  = access.includes(mod.id);
      const completed = progress[mod.id]?.completed;
      const item = document.createElement('div');
      item.className = `nav-item ${unlocked ? 'unlocked' : 'locked'} ${currentModule?.id === mod.id ? 'active' : ''}`;
      item.dataset.moduleId = mod.id;

      item.innerHTML = `
        <div class="nav-dot ${completed ? 'completed' : unlocked ? 'unlocked' : 'locked'}"></div>
        <span class="nav-text">${mod.title}</span>
        ${completed ? '<span class="nav-check">✓</span>' : !unlocked ? '<span class="nav-lock">🔒</span>' : ''}
      `;

      if (unlocked) {
        item.addEventListener('click', () => openModule(mod.id));
      }
      modulesList.appendChild(item);
    });
  }

  if (activitiesList) {
    activitiesList.innerHTML = '';
    const activities = getActivities();
    const studentAnswers = getStudentAnswers(currentUser.id);
    
    if (activities.length === 0) {
      activitiesList.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted);padding:0.5rem 0.75rem;font-style:italic;">Nenhuma atividade pendente</div>';
    } else {
      activities.forEach(act => {
        const answersForAct = studentAnswers[act.id] || {};
        const totalQuestions = act.questions.length;
        const answeredQuestions = Object.keys(answersForAct).length;
        const isDone = answeredQuestions === totalQuestions && totalQuestions > 0;
        
        const item = document.createElement('div');
        item.className = `nav-item unlocked ${currentActivity?.id === act.id ? 'active' : ''}`;
        
        item.innerHTML = `
          <div class="nav-dot ${isDone ? 'completed' : 'unlocked'}"></div>
          <span class="nav-text">${act.title}</span>
          ${isDone ? '<span class="nav-check">✓</span>' : answeredQuestions > 0 ? `<span style="font-size:0.7rem;color:var(--text-muted);">${answeredQuestions}/${totalQuestions}</span>` : ''}
        `;
        
        item.addEventListener('click', () => openActivity(act.id));
        activitiesList.appendChild(item);
      });
    }
  }

  // Update progress bar
  const stats = getStudentStats(currentUser.id);
  const pct = Math.round((stats.completed / stats.total) * 100);
  document.getElementById('sidebar-progress-text').textContent = `${stats.completed}/${stats.total}`;
  document.getElementById('sidebar-progress-fill').style.width = pct + '%';
}

// ── Dashboard ────────────────────────────────────────────
function renderDashboard() {
  const stats = getStudentStats(currentUser.id);
  document.getElementById('stat-completed').textContent = stats.completed;
  document.getElementById('stat-unlocked').textContent  = stats.unlocked;
  document.getElementById('stat-score').textContent     = stats.completed > 0 ? `${stats.avgScore}%` : '—';

  renderModuleCards();
}

function renderModuleCards() {
  const grid = document.getElementById('modules-grid');
  const modules = getModules();
  const access  = getStudentModuleAccess(currentUser.id);
  const progress = getStudentProgress(currentUser.id);

  grid.innerHTML = '';
  modules.forEach((mod, i) => {
    const unlocked  = access.includes(mod.id);
    const prog      = progress[mod.id] || {};
    const completed = prog.completed;
    const started   = prog.started;

    const card = document.createElement('div');
    card.className = `module-card ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`;
    card.style.animationDelay = `${i * 0.08}s`;
    card.classList.add('animate-fade-up');

    let statusBadge = '';
    if (completed)       statusBadge = `<span class="badge badge-success">✓ Concluído</span>`;
    else if (started)    statusBadge = `<span class="badge badge-primary">Em andamento</span>`;
    else if (!unlocked)  statusBadge = `<span class="badge badge-muted">🔒 Bloqueado</span>`;
    else                 statusBadge = `<span class="badge badge-warning">Disponível</span>`;

    card.innerHTML = `
      <div class="card-accent-line" style="background:${mod.gradient}"></div>
      <div class="card-top">
        <div class="module-icon-big" style="background:${mod.gradient}20;border:1px solid ${mod.color}30;">
          ${mod.emoji}
        </div>
        <div class="card-badges">
          ${statusBadge}
          <span class="badge badge-muted">${mod.difficulty}</span>
        </div>
      </div>
      <div class="module-title">${mod.title}</div>
      <div class="module-subtitle">${mod.subtitle}</div>
      <div class="module-desc">${mod.description}</div>
      ${completed ? `
        <div class="progress-bar" style="margin-bottom:1rem;">
          <div class="progress-fill" style="width:100%;background:${mod.gradient}"></div>
        </div>
        <div style="font-size:0.78rem;color:var(--green-light);margin-bottom:0.75rem;">
          ⭐ Pontuação: ${prog.score}%
        </div>
      ` : unlocked ? `
        <div class="progress-bar" style="margin-bottom:0.75rem;">
          <div class="progress-fill" style="width:${started?'30':'0'}%;background:${mod.gradient}"></div>
        </div>
      ` : ''}
      <div class="module-footer">
        <div class="module-meta">
          <span>⏱️ ${mod.duration}</span>
          <span>📝 ${mod.quiz.length} questões</span>
        </div>
        ${unlocked ? `
          <button class="btn btn-sm btn-primary module-cta" style="background:${mod.gradient};" data-module-id="${mod.id}">
            ${completed ? '🔄 Rever' : started ? '▶ Continuar' : '▶ Iniciar'}
          </button>
        ` : '<span style="font-size:1.2rem;">🔒</span>'}
      </div>
      ${!unlocked ? `
        <div class="locked-overlay">
          <div class="locked-icon">🔒</div>
          <div class="locked-text">Aguardando liberação<br>pelo professor</div>
        </div>
      ` : ''}
    `;

    if (unlocked) {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.locked-overlay')) openModule(mod.id);
      });
      const ctaBtn = card.querySelector('.module-cta');
      if (ctaBtn) {
        ctaBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openModule(mod.id);
        });
      }
    }

    grid.appendChild(card);
  });
}

// ── Module Viewer ────────────────────────────────────────
function openModule(moduleId) {
  const mod = getModuleById(moduleId);
  if (!mod) return;
  if (!isModuleUnlocked(currentUser.id, moduleId)) {
    showToast('🔒 Este módulo ainda não foi liberado pelo professor.', 'warning');
    return;
  }

  currentModule = mod;
  markModuleStarted(currentUser.id, moduleId);

  // Switch views
  document.getElementById('view-dashboard').style.display = 'none';
  document.getElementById('view-module').style.display = 'block';

  // Update header
  document.getElementById('header-title').textContent = mod.title;
  document.getElementById('header-subtitle').textContent = mod.subtitle;
  document.getElementById('viewer-module-icon').textContent = mod.emoji;
  document.getElementById('viewer-module-title').textContent = mod.title;

  // Populate tabs
  switchViewerTab('theory');
  populateTheory(mod);
  populateCode(mod);
  populateModuleActivities(mod);

  // Update sidebar active state
  renderSidebarNav();

  // Update sidebar nav active
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.moduleId === moduleId);
  });

  // Mobile: close sidebar
  closeSidebar();

  // Init quiz state
  quizState = { current: 0, answers: Array(mod.quiz.length).fill(null), score: 0, done: false };
  renderQuiz(mod);
}

function backToDashboard() {
  currentModule = null;
  currentActivity = null;
  document.getElementById('view-dashboard').style.display = 'block';
  document.getElementById('view-module').style.display = 'none';
  if (document.getElementById('view-activity')) {
    document.getElementById('view-activity').style.display = 'none';
  }
  document.getElementById('header-title').textContent = 'Meus Módulos';
  document.getElementById('header-subtitle').textContent = 'Selecione um módulo para começar a aprender';
  renderDashboard();
  renderSidebarNav();
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (visualizer) { visualizer = null; }
  
  // Clear any dynamic code editors
  Object.keys(studentEditorInstances).forEach(k => {
    delete studentEditorInstances[k];
  });
}

// ── Theory ───────────────────────────────────────────────
function populateTheory(mod) {
  // Complexity
  const cGrid = document.getElementById('complexity-grid');
  const c = mod.complexity;
  cGrid.innerHTML = `
    <div class="complexity-item"><div class="complexity-label">Acesso</div><div class="complexity-value">${c.access}</div></div>
    <div class="complexity-item"><div class="complexity-label">Busca</div><div class="complexity-value">${c.search}</div></div>
    <div class="complexity-item"><div class="complexity-label">Inserção</div><div class="complexity-value">${c.insert}</div></div>
    <div class="complexity-item"><div class="complexity-label">Remoção</div><div class="complexity-value">${c.delete}</div></div>
    <div class="complexity-item"><div class="complexity-label">Espaço</div><div class="complexity-value">${c.space}</div></div>
  `;

  // Theory text
  const content = document.getElementById('theory-content');
  content.innerHTML = renderMarkdown(mod.theory);
}

function renderMarkdown(text) {
  return text
    .trim()
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\`\`\`[\s\S]*?\`\`\`/g, '')
    .replace(/\| (.+) \|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      const isHeader = cells.some(c => /^[-\s]+$/.test(c.trim()));
      if (isHeader) return '';
      const tag = cells[0] && cells[0].includes('**') ? 'th' : 'td';
      return `<tr>${cells.map(c => `<${tag}>${c.trim().replace(/\*\*/g,'')}</${tag}>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>)/gs, (m) => `<table>${m}</table>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/✅/g, '<span style="color:var(--green)">✅</span>')
    .replace(/❌/g, '<span style="color:var(--red)">❌</span>');
}

// ── Code ─────────────────────────────────────────────────
function populateCode(mod) {
  document.getElementById('code-content').innerHTML = mod.codeExample;
}

// ── Visualizer ───────────────────────────────────────────
function initVisualizer(mod) {
  visualizer = new Visualizer('viz-canvas', mod.id);
  visualizer.init();
  renderVizControls(mod);
}

function renderVizControls(mod) {
  const controls = document.getElementById('viz-controls');
  const log = document.getElementById('viz-log');

  const logMsg = (msg) => {
    log.textContent = `// ${msg}`;
  };

  const getVal = () => {
    const inp = document.getElementById('viz-value-input');
    return inp ? (parseInt(inp.value) || Math.floor(Math.random() * 90) + 10) : Math.floor(Math.random() * 90) + 10;
  };

  const mkBtn = (text, color, fn) => {
    const b = document.createElement('button');
    b.className = 'btn btn-sm';
    b.style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44;`;
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  };

  const valInput = () => {
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.id = 'viz-value-input';
    inp.className = 'viz-input';
    inp.placeholder = 'valor';
    inp.value = String(Math.floor(Math.random() * 90) + 10);
    inp.min = 1; inp.max = 999;
    return inp;
  };

  controls.innerHTML = '';

  const resetBtn = mkBtn('↺ Resetar', '#94a3b8', () => {
    visualizer.reset();
    logMsg('Visualizador resetado ao estado inicial.');
  });

  switch (mod.id) {
    case 'arrays': {
      const inp = valInput();
      controls.append(
        inp,
        mkBtn('Acessar [idx]', '#6366f1', async () => {
          const v = getVal();
          const idx = v % visualizer.items.length;
          logMsg(`Acessando índice ${idx}... Valor: ${visualizer.items[idx]} | Complexidade: O(1)`);
          await visualizer.animateArrayAccess(idx);
        }),
        mkBtn('Inserir no final', '#6366f1', async () => {
          const v = getVal();
          await visualizer.animateArrayInsert(v);
          logMsg(`Inserido ${v} no final. Tamanho: ${visualizer.items.length} | Complexidade: O(1)`);
        }),
        mkBtn('Inserir no meio', '#8b5cf6', async () => {
          const v = getVal();
          const mid = Math.floor(visualizer.items.length / 2);
          await visualizer.animateArrayInsert(v, mid);
          logMsg(`Inserido ${v} na posição ${mid}. Elementos deslocados! | Complexidade: O(n)`);
        }),
        mkBtn('Remover', '#ef4444', async () => {
          if (!visualizer.items.length) { logMsg('Array vazio!'); return; }
          await visualizer.animateArrayRemove();
          logMsg(`Elemento removido. Tamanho atual: ${visualizer.items.length} | Complexidade: O(n)`);
        }),
        resetBtn
      );
      break;
    }
    case 'linked-list': {
      const inp = valInput();
      controls.append(
        inp,
        mkBtn('Inserir no início', '#06b6d4', async () => {
          const v = getVal();
          await visualizer.animateListInsert(v, true);
          logMsg(`Novo nó ${v} inserido no início (nova cabeça). | Complexidade: O(1)`);
        }),
        mkBtn('Inserir no fim', '#0284c7', async () => {
          const v = getVal();
          await visualizer.animateListInsert(v, false);
          logMsg(`Nó ${v} inserido no final (percorreu ${visualizer.items.length-1} nós). | Complexidade: O(n)`);
        }),
        mkBtn('Remover início', '#ef4444', async () => {
          if (!visualizer.items.length) { logMsg('Lista vazia!'); return; }
          await visualizer.animateListRemove(true);
          logMsg(`Cabeça removida. Nova cabeça: ${visualizer.items[0] ?? 'null'} | Complexidade: O(1)`);
        }),
        resetBtn
      );
      break;
    }
    case 'stack': {
      const inp = valInput();
      controls.append(
        inp,
        mkBtn('Push (empilhar)', '#10b981', async () => {
          const v = getVal();
          await visualizer.animateStackPush(v);
          logMsg(`push(${v}) — Novo topo: ${v} | Tamanho: ${visualizer.items.length}`);
        }),
        mkBtn('Pop (desempilhar)', '#ef4444', async () => {
          if (!visualizer.items.length) { logMsg('Pilha vazia! Underflow.'); return; }
          const v = await visualizer.animateStackPop();
          logMsg(`pop() → ${v} removido. Novo topo: ${visualizer.items[visualizer.items.length-1] ?? 'vazio'}`);
        }),
        mkBtn('Peek (ver topo)', '#6366f1', () => {
          if (!visualizer.items.length) { logMsg('Pilha vazia!'); return; }
          const top = visualizer.items[visualizer.items.length - 1];
          logMsg(`peek() → ${top} (não removido)`);
        }),
        resetBtn
      );
      break;
    }
    case 'queue': {
      const inp = valInput();
      controls.append(
        inp,
        mkBtn('Enqueue (entrar)', '#f59e0b', async () => {
          const v = getVal();
          await visualizer.animateQueueEnqueue(v);
          logMsg(`enqueue(${v}) — Adicionado ao final. Tamanho: ${visualizer.items.length}`);
        }),
        mkBtn('Dequeue (sair)', '#ef4444', async () => {
          if (!visualizer.items.length) { logMsg('Fila vazia!'); return; }
          const v = await visualizer.animateQueueDequeue();
          logMsg(`dequeue() → ${v} saiu da frente. Próximo: ${visualizer.items[0] ?? 'fila vazia'}`);
        }),
        mkBtn('Front (ver frente)', '#6366f1', () => {
          if (!visualizer.items.length) { logMsg('Fila vazia!'); return; }
          logMsg(`front() → ${visualizer.items[0]} (não removido)`);
        }),
        resetBtn
      );
      break;
    }
    case 'tree': {
      const inp = valInput();
      controls.append(
        inp,
        mkBtn('Inserir', '#a855f7', async () => {
          const v = getVal();
          if (visualizer.items.includes(v)) { logMsg(`${v} já existe na árvore.`); return; }
          await visualizer.animateTreeInsert(v);
          logMsg(`Inserido ${v} na BST. | Complexidade: O(log n)`);
        }),
        mkBtn('Buscar', '#7c3aed', async () => {
          const v = getVal();
          logMsg(`Buscando ${v}...`);
          const found = await visualizer.animateTreeSearch(v);
          logMsg(`Busca por ${v}: ${found ? '✓ Encontrado!' : '✗ Não encontrado'} | Complexidade: O(log n)`);
        }),
        resetBtn
      );
      break;
    }
    case 'graph': {
      controls.append(
        mkBtn('▶ BFS — Busca em Largura', '#ec4899', async () => {
          logMsg('Executando BFS a partir do vértice A...');
          await visualizer.animateGraphBFS();
          logMsg('BFS concluído! Visitou todos os vértices em ordem de distância. | O(V+E)');
        }),
        resetBtn
      );
      break;
    }
  }
}

// ── Viewer Tabs ──────────────────────────────────────────
function switchViewerTab(tabId) {
  document.querySelectorAll('.viewer-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.viewer-panel').forEach(p => p.classList.remove('active'));

  const tab = document.querySelector(`.viewer-tab[data-tab="${tabId}"]`);
  if (tab) tab.classList.add('active');

  const panel = document.getElementById(`panel-${tabId}`);
  if (panel) panel.classList.add('active');

  // Init visualizer when first opening that tab
  if (tabId === 'visualizer' && currentModule && !visualizer) {
    initVisualizer(currentModule);
  }

  // Refresh module activities list when switching to that tab
  if (tabId === 'module-activities' && currentModule) {
    populateModuleActivities(currentModule);
  }
}

// ── Module Activities (inside module viewer) ───────────────
function populateModuleActivities(mod) {
  const allActivities = getActivities();
  const moduleActivities = allActivities.filter(a => a.moduleId === mod.id);

  // Update badge count on tab
  const countEl = document.getElementById('tab-activities-count');
  if (countEl) countEl.textContent = moduleActivities.length;

  const listEl = document.getElementById('module-activities-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (moduleActivities.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted);">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">📭</div>
        <div style="font-weight:600;margin-bottom:0.35rem;">Nenhuma atividade vinculada</div>
        <div style="font-size:0.82rem;">O professor ainda não adicionou atividades para este módulo.</div>
      </div>
    `;
    return;
  }

  const studentAnswers = getStudentAnswers(currentUser.id);
  moduleActivities.forEach((act, i) => {
    const answers = studentAnswers[act.id] || {};
    const answeredCount = Object.keys(answers).length;
    const totalCount = act.questions.length;
    const isDone = answeredCount === totalCount && totalCount > 0;
    const score = isDone ? getStudentActivityScore(currentUser.id, act.id) : null;

    const card = document.createElement('div');
    card.style.cssText = `
      background:var(--bg-card);
      border:1px solid var(--border);
      border-radius:var(--radius-lg);
      padding:1.25rem 1.5rem;
      margin-bottom:1rem;
      display:flex;
      align-items:center;
      gap:1rem;
      cursor:pointer;
      transition:border-color 0.2s, transform 0.15s;
      animation:fadeSlideUp 0.3s ease both;
      animation-delay:${i * 0.07}s;
    `;
    card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--accent)'; card.style.transform = 'translateY(-1px)'; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--border)'; card.style.transform = 'none'; });

    const statusColor = isDone
      ? (score >= 70 ? 'var(--green)' : 'var(--yellow)')
      : answeredCount > 0 ? 'var(--accent-light)' : 'var(--text-muted)';
    const statusText = isDone
      ? `✅ Concluída — ${score}% de acerto`
      : answeredCount > 0 ? `🔄 Em andamento (${answeredCount}/${totalCount} respostas)`
      : '📋 Não iniciada';

    card.innerHTML = `
      <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">✏️</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.95rem;font-weight:700;margin-bottom:0.2rem;">${act.title}</div>
        ${act.description ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.35rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${act.description}</div>` : ''}
        <div style="font-size:0.8rem;font-weight:600;color:${statusColor};">${statusText}</div>
      </div>
      <div style="flex-shrink:0;">
        <span style="font-size:0.78rem;background:rgba(99,102,241,0.15);color:var(--accent-light);padding:0.3rem 0.75rem;border-radius:20px;border:1px solid rgba(99,102,241,0.25);">
          ${totalCount} quest${totalCount === 1 ? 'ão' : 'ões'}
        </span>
      </div>
      <div style="font-size:1.2rem;color:var(--text-muted);">›</div>
    `;

    card.addEventListener('click', () => openActivity(act.id));
    listEl.appendChild(card);
  });
}

// ── Quiz ─────────────────────────────────────────────────
function renderQuiz(mod) {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';
  renderQuestion(mod, 0, container);
}

function renderQuestion(mod, idx, container) {
  const q = mod.quiz[idx];
  const total = mod.quiz.length;
  const pct = Math.round((idx / total) * 100);
  document.getElementById('quiz-progress-fill').style.width = pct + '%';

  container.innerHTML = `
    <div class="question-card">
      <div class="question-number">Questão ${idx + 1} de ${total}</div>
      <div class="question-text">${q.question}</div>
      <div class="quiz-options" id="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" data-index="${i}">
            <span class="option-letter">${['A','B','C','D'][i]}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
      <div class="quiz-explanation" id="quiz-explanation">
        💡 ${q.explanation}
      </div>
      <div class="quiz-nav">
        <span style="font-size:0.82rem;color:var(--text-muted);">
          ${quizState.answers.filter(a => a !== null).length} de ${total} respondidas
        </span>
        <div style="display:flex;gap:0.5rem;">
          ${idx > 0 ? `<button class="btn btn-ghost btn-sm" id="quiz-prev">← Anterior</button>` : ''}
          <button class="btn btn-primary btn-sm" id="quiz-next" disabled>
            ${idx < total - 1 ? 'Próxima →' : '✓ Finalizar Quiz'}
          </button>
        </div>
      </div>
    </div>
  `;

  // Restore previous answer if any
  const prev = quizState.answers[idx];
  if (prev !== null) {
    applyAnswerFeedback(q, prev);
    document.getElementById('quiz-next').disabled = false;
  }

  // Option click handler
  container.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (quizState.answers[idx] !== null) return;
      const chosen = parseInt(btn.dataset.index);
      quizState.answers[idx] = chosen;
      applyAnswerFeedback(q, chosen);
      document.getElementById('quiz-next').disabled = false;
    });
  });

  // Next/Prev
  const nextBtn = document.getElementById('quiz-next');
  nextBtn.addEventListener('click', () => {
    if (idx < total - 1) {
      renderQuestion(mod, idx + 1, container);
    } else {
      finishQuiz(mod);
    }
  });

  const prevBtn = document.getElementById('quiz-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => renderQuestion(mod, idx - 1, container));
  }
}

function applyAnswerFeedback(q, chosen) {
  const optBtns = document.querySelectorAll('.quiz-option');
  const expEl   = document.getElementById('quiz-explanation');
  optBtns.forEach(btn => {
    btn.disabled = true;
    const i = parseInt(btn.dataset.index);
    if (i === q.correct) btn.classList.add('correct');
    else if (i === chosen && chosen !== q.correct) btn.classList.add('wrong');
    else btn.style.opacity = '0.4';
  });
  expEl.classList.add('visible');
}

function finishQuiz(mod) {
  const correct = quizState.answers.filter((a, i) => a === mod.quiz[i].correct).length;
  const total   = mod.quiz.length;
  const score   = Math.round((correct / total) * 100);

  // Save progress
  markModuleComplete(currentUser.id, mod.id, score);
  renderSidebarNav();

  const emoji = score === 100 ? '🏆' : score >= 66 ? '🌟' : score >= 33 ? '👍' : '📚';
  const msg   = score === 100 ? 'Perfeito! Você acertou tudo!' :
                score >= 66   ? 'Muito bem! Continue assim!' :
                score >= 33   ? 'Bom começo! Revise o conteúdo.' : 'Revise a teoria e tente novamente.';

  const container = document.getElementById('quiz-container');
  container.innerHTML = `
    <div class="quiz-result">
      <span class="result-emoji">${emoji}</span>
      <div class="result-score" style="color:${score>=66?'var(--green)':score>=33?'var(--yellow)':'var(--red)'}">
        ${score}%
      </div>
      <div class="result-msg">${correct} de ${total} questões corretas. ${msg}</div>
      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-ghost" id="quiz-retry">🔄 Tentar novamente</button>
        <button class="btn btn-primary" id="quiz-back-dash">🏠 Voltar ao painel</button>
      </div>
    </div>
  `;

  document.getElementById('quiz-progress-fill').style.width = '100%';

  document.getElementById('quiz-retry').addEventListener('click', () => {
    quizState = { current: 0, answers: Array(mod.quiz.length).fill(null), score: 0, done: false };
    renderQuiz(mod);
  });

  document.getElementById('quiz-back-dash').addEventListener('click', backToDashboard);

  if (score >= 66) {
    showToast(`🏆 Parabéns! Módulo concluído com ${score}%!`, 'success');
  } else {
    showToast(`📚 Quiz finalizado: ${score}%. Revise o conteúdo!`, 'info');
  }
}

// ── Event Listeners ──────────────────────────────────────
function setupEventListeners() {
  // Back button
  document.getElementById('btn-back').addEventListener('click', backToDashboard);
  
  if (document.getElementById('btn-back-activity')) {
    document.getElementById('btn-back-activity').addEventListener('click', backToDashboard);
  }
  if (document.getElementById('btn-submit-activity-answers')) {
    document.getElementById('btn-submit-activity-answers').addEventListener('click', submitActivityAnswers);
  }

  // Viewer tabs
  document.getElementById('viewer-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.viewer-tab');
    if (tab) switchViewerTab(tab.dataset.tab);
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  // Mobile sidebar
  const toggle   = document.getElementById('sidebar-toggle');
  const overlay  = document.getElementById('sidebar-overlay');
  const sidebar  = document.getElementById('sidebar');
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  });
  overlay.addEventListener('click', closeSidebar);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ── Toast ────────────────────────────────────────────────
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
//  ✏️ Student Activity Answering & Evaluation
// ============================================================
function openActivity(activityId) {
  const activities = getActivities();
  const act = activities.find(a => a.id === activityId);
  if (!act) return;

  currentActivity = act;
  currentModule = null;

  // Switch views
  document.getElementById('view-dashboard').style.display = 'none';
  document.getElementById('view-module').style.display = 'none';
  document.getElementById('view-activity').style.display = 'block';

  // Header update
  document.getElementById('header-title').textContent = act.title;
  document.getElementById('header-subtitle').textContent = act.description || 'Responda as questões teóricas e práticas abaixo.';
  document.getElementById('viewer-activity-title').textContent = act.title;

  renderActivityStudentView(act);
  renderSidebarNav();
  closeSidebar();
}

function renderActivityStudentView(act) {
  const container = document.getElementById('activity-student-container');
  container.innerHTML = '';

  const answers = getStudentAnswers(currentUser.id)[act.id] || {};

  act.questions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'cap-q-card';
    qDiv.style.background = 'var(--bg-card)';
    qDiv.style.border = '1px solid var(--border)';
    qDiv.style.borderRadius = 'var(--radius-lg)';
    qDiv.style.padding = '1.5rem';
    qDiv.style.marginBottom = '1.5rem';
    qDiv.style.position = 'relative';
    qDiv.id = `student_q_${q.id}`;
    qDiv.dataset.questionId = q.id;
    qDiv.dataset.type = q.type;

    let html = `
      <div class="cap-q-num" style="color:var(--text-muted);font-weight:700;font-size:0.75rem;margin-bottom:0.5rem;text-transform:uppercase;">Questão ${idx + 1} — ${q.type === 'theoretical' ? 'Teórica' : 'Prática'}</div>
      <div class="cap-q-text" style="font-size:1.05rem;font-weight:700;margin-bottom:1.25rem;color:var(--text-primary);">${q.question}</div>
    `;

    if (q.type === 'theoretical') {
      const savedChoice = answers[q.id]?.chosen;
      html += `<div class="quiz-options" style="display:flex;flex-direction:column;gap:0.6rem;">`;
      q.options.forEach((opt, oIdx) => {
        const isSelected = savedChoice !== undefined && parseInt(savedChoice) === oIdx;
        html += `
          <button class="quiz-option q-stud-opt ${isSelected ? 'selected' : ''}" data-index="${oIdx}" onclick="selectStudentTheoreticalOption(this, '${q.id}', ${oIdx})">
            <span class="option-letter">${['A','B','C','D'][oIdx]}</span>
            <span>${opt}</span>
          </button>
        `;
      });
      html += `</div>`;
    } else if (q.type === 'practical') {
      const savedCode = answers[q.id]?.code || q.template;
      html += `
        <div class="cap-practical-label" style="font-size:0.8rem;color:var(--text-secondary);font-weight:600;margin-bottom:0.5rem;">Escreva seu código JavaScript no editor abaixo:</div>
        <div class="ca-codemirror-wrapper" style="border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin-bottom:1rem;">
          <textarea id="stud_editor_${q.id}">${savedCode}</textarea>
        </div>
        <div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:0.75rem;flex-wrap:wrap;">
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;font-weight:600;" onclick="testStudentCode('${q.id}')">&#9654; Executar e Testar</button>
          <span id="stud_test_status_${q.id}" style="font-size:0.82rem;font-weight:600;"></span>
        </div>

        <!-- Output / Console panel -->
        <div id="stud_output_${q.id}" style="display:none;margin-bottom:0.75rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;background:#0d1117;border:1px solid #30363d;border-bottom:none;border-radius:8px 8px 0 0;padding:0.4rem 0.85rem;">
            <span style="width:10px;height:10px;border-radius:50%;background:#ff5f56;display:inline-block;"></span>
            <span style="width:10px;height:10px;border-radius:50%;background:#ffbd2e;display:inline-block;"></span>
            <span style="width:10px;height:10px;border-radius:50%;background:#27c93f;display:inline-block;"></span>
            <span style="font-size:0.72rem;color:#7d8590;margin-left:0.25rem;font-family:var(--font-mono);flex:1;">Output &mdash; console</span>
            <button onclick="clearOutputPanel('${q.id}')" title="Limpar saída" style="background:none;border:none;color:#586069;cursor:pointer;font-size:0.72rem;padding:0 0.25rem;font-family:var(--font-mono);» transition:color 0.15s;" onmouseenter="this.style.color='#e2e8f0'" onmouseleave="this.style.color='#586069'">&#x1F5D1; limpar</button>
          </div>
          <div id="stud_output_body_${q.id}" style="background:#0d1117;border:1px solid #30363d;border-radius:0 0 8px 8px;padding:0;font-family:var(--font-mono);font-size:0.82rem;min-height:56px;max-height:260px;overflow-y:auto;line-height:1.6;"></div>
        </div>

        <!-- Test results panel -->
        <div id="stud_test_log_${q.id}" style="display:none;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.06);border-radius:var(--radius-md);padding:0.75rem;margin-top:0.25rem;"></div>
      `;
    }

    qDiv.innerHTML = html;
    container.appendChild(qDiv);

    // If practical, instantiate CodeMirror
    if (q.type === 'practical') {
      const textarea = document.getElementById(`stud_editor_${q.id}`);
      const editor = CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        tabSize: 2,
        lineWrapping: true
      });
      studentEditorInstances[q.id] = editor;
    }
  });

  // Setup buttons at the footer
  const totalQuestions = act.questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const statusInfo = document.getElementById('activity-status-info');
  if (statusInfo) {
    statusInfo.textContent = `${answeredQuestions} de ${totalQuestions} questões respondidas.`;
  }
}

function selectStudentTheoreticalOption(button, qId, oIdx) {
  const container = button.closest('.quiz-options');
  container.querySelectorAll('.q-stud-opt').forEach(btn => {
    btn.classList.remove('selected');
  });
  button.classList.add('selected');

  if (currentActivity) {
    const answerData = { chosen: oIdx };
    saveStudentAnswer(currentUser.id, currentActivity.id, qId, answerData);
    
    const answers = getStudentAnswers(currentUser.id)[currentActivity.id] || {};
    const total = currentActivity.questions.length;
    const answered = Object.keys(answers).length;
    document.getElementById('activity-status-info').textContent = `${answered} de ${total} questões respondidas.`;
    renderSidebarNav();
  }
}

// tracks pending prompt values per question
const pendingPromptInputs = {};

function testStudentCode(qId, providedPromptValues) {
  const editor = studentEditorInstances[qId];
  if (!editor) return;
  const userCode = editor.getValue();

  const q = currentActivity.questions.find(quest => quest.id === qId);
  if (!q) return;

  const logContainer   = document.getElementById(`stud_test_log_${qId}`);
  const statusSpan     = document.getElementById(`stud_test_status_${qId}`);
  const outputPanel    = document.getElementById(`stud_output_${qId}`);
  const outputBody     = document.getElementById(`stud_output_body_${qId}`);

  // Show panels
  logContainer.style.display = 'block';
  logContainer.innerHTML = '<span style="color:var(--text-muted);">// Executando...</span>';
  if (outputPanel) outputPanel.style.display = 'block';

  // Increment run counter
  if (!runCounters[qId]) runCounters[qId] = 0;
  runCounters[qId]++;
  const runNum = runCounters[qId];
  const runTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // ── Syntax check
  let syntaxError = null;
  try { new Function('console','prompt','alert','confirm', userCode); } catch (e) { syntaxError = e; }

  // ── Detect prompt() usage — show inline input panel if needed
  const hasPrompt = /\bprompt\s*\(/.test(userCode);
  if (hasPrompt && !providedPromptValues) {
    // Dry-run to discover how many prompts are called and their messages
    const promptsFound = [];
    const silentConsole = { log:()=>{}, warn:()=>{}, error:()=>{}, info:()=>{}, dir:()=>{}, table:()=>{} };
    const recordingPrompt = (msg) => { promptsFound.push(msg || 'Entrada'); return ''; };
    const silentAlert   = () => {};
    const silentConfirm = () => false;
    try {
      const dryRunner = new Function('console','prompt','alert','confirm', userCode);
      dryRunner(silentConsole, recordingPrompt, silentAlert, silentConfirm);
    } catch(_) {}

    if (outputPanel) outputPanel.style.display = 'block';
    showStudentPromptPanel(qId, promptsFound.length > 0 ? promptsFound : ['Entrada']);
    logContainer.innerHTML = '<span style="color:#a5f3fc;font-size:0.82rem;">⌨️ Preencha as entradas abaixo e clique em Executar.</span>';
    return;
  }

  if (syntaxError) {
    if (outputBody) {
      // Append syntax error block to history
      const errBlock = document.createElement('div');
      errBlock.style.cssText = 'border-top:1px solid #21262d;padding:0.6rem 1rem;';
      errBlock.innerHTML = `
        <div style="color:#586069;font-size:0.72rem;margin-bottom:0.3rem;"># Execução ${runNum} &bull; ${runTime}</div>
        <div style="color:#f87171;">&#10008; Erro de Sintaxe: ${escapeHtml(syntaxError.message)}</div>
      `;
      if (outputBody.querySelector('.output-empty')) outputBody.innerHTML = '';
      outputBody.appendChild(errBlock);
      outputBody.scrollTop = outputBody.scrollHeight;
    }
    logContainer.innerHTML = `
      <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:0.85rem 1rem;">
        <div style="color:#f87171;font-weight:700;font-size:0.85rem;margin-bottom:0.4rem;">&#128683; ERRO DE SINTAXE</div>
        <div style="color:#fca5a5;font-family:var(--font-mono);font-size:0.82rem;white-space:pre-wrap;">${escapeHtml(syntaxError.message)}</div>
      </div>
    `;
    statusSpan.innerHTML = '<span style="color:#f87171;">&#9940; Erro de sintaxe &mdash; corrija o código</span>';
    saveStudentAnswer(currentUser.id, currentActivity.id, qId, { code: userCode, correct: false });
    updateActivityStatusInfo();
    return;
  }

  // ── Build a fake console that captures all output
  const allOutputLines = [];

  const fmtArgs = (args) => args.map(a => {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a === 'object') {
      try { return JSON.stringify(a, null, 2); } catch (_) { return String(a); }
    }
    return String(a);
  }).join(' ');

  // Build prompt queue from provided values (or empty)
  const promptQueue = providedPromptValues ? [...providedPromptValues] : [];
  let promptQueueIdx = 0;
  const customPrompt = (msg) => {
    const val = promptQueue[promptQueueIdx] !== undefined ? promptQueue[promptQueueIdx++] : '';
    allOutputLines.push({ type: 'info', text: `⌨️ prompt("${msg || ''}") → "${val}"` });
    return val;
  };
  const customAlert   = (msg) => { allOutputLines.push({ type: 'warn', text: `🔔 alert("${msg || ''}")` }); };
  const customConfirm = (msg) => { allOutputLines.push({ type: 'info', text: `❓ confirm("${msg || ''}") → true` }); return true; };

  // ── Execute the code once at top-level to capture direct console.log calls
  const topLevelConsole = {
    log:   (...args) => { const t = fmtArgs(args); allOutputLines.push({ type: 'log',   text: t }); },
    warn:  (...args) => { const t = fmtArgs(args); allOutputLines.push({ type: 'warn',  text: t }); },
    error: (...args) => { const t = fmtArgs(args); allOutputLines.push({ type: 'error', text: t }); },
    info:  (...args) => { const t = fmtArgs(args); allOutputLines.push({ type: 'info',  text: t }); },
    dir:   (...args) => { const t = fmtArgs(args); allOutputLines.push({ type: 'log',   text: t }); },
    table: (...args) => { const t = fmtArgs(args); allOutputLines.push({ type: 'log',   text: t }); },
  };
  try {
    promptQueueIdx = 0; // reset before top-level run
    const topRunner = new Function('console', 'prompt', 'alert', 'confirm', userCode);
    topRunner(topLevelConsole, customPrompt, customAlert, customConfirm);
  } catch (_) {
    // Errors here will be caught again per test case below
  }

  // ── Run test cases
  let passedAll = true;
  let testFeedbacks = [];

  q.testCases.forEach((tc, idx) => {
    const caseOutputLines = [];

    // Create a fresh fake console for each test case
    const fakeConsole = {
      log:   (...args) => { const t = fmtArgs(args); caseOutputLines.push({ type: 'log',   text: t }); },
      warn:  (...args) => { const t = fmtArgs(args); caseOutputLines.push({ type: 'warn',  text: t }); },
      error: (...args) => { const t = fmtArgs(args); caseOutputLines.push({ type: 'error', text: t }); },
      info:  (...args) => { const t = fmtArgs(args); caseOutputLines.push({ type: 'info',  text: t }); },
      dir:   (...args) => { const t = fmtArgs(args); caseOutputLines.push({ type: 'log',   text: t }); },
      table: (...args) => { const t = fmtArgs(args); caseOutputLines.push({ type: 'log',   text: t }); },
    };

    try {
      let result;
      // Pass fakeConsole + prompt/alert/confirm interceptors
      promptQueueIdx = 0; // reset per test
      const runner = new Function('console', 'prompt', 'alert', 'confirm', `${userCode}\nreturn (${tc.expression});`);
      result = runner(fakeConsole, customPrompt, customAlert, customConfirm);

      let expectedVal;
      try { expectedVal = eval(tc.expected); } catch (_) { expectedVal = tc.expected; }

      const match = JSON.stringify(result) === JSON.stringify(expectedVal) || String(result) === String(tc.expected);

      // Build per-case console output snippet
      const caseConsoleHtml = caseOutputLines.length
        ? `<div style="margin-top:0.4rem;padding:0.35rem 0.6rem;background:rgba(0,0,0,0.3);border-radius:4px;border-left:2px solid #30363d;">
            ${caseOutputLines.map(l => {
              const color = l.type === 'warn' ? '#fbbf24' : l.type === 'error' ? '#f87171' : '#a5f3fc';
              return `<div style="font-family:var(--font-mono);font-size:0.77rem;color:${color};">&#8250; ${escapeHtml(l.text)}</div>`;
            }).join('')}
           </div>`
        : '';

      if (match) {
        testFeedbacks.push(`
          <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:6px;padding:0.6rem 0.85rem;margin:0.35rem 0;">
            <div style="color:#34d399;font-weight:700;font-size:0.82rem;">&#10003; Caso ${idx + 1} &mdash; PASSOU</div>
            <div style="font-family:var(--font-mono);font-size:0.79rem;color:#a7f3d0;margin-top:0.2rem;">
              <span style="color:#7d8590;">${escapeHtml(tc.expression)}</span>
              &rarr; <span style="color:#34d399;font-weight:700;">${escapeHtml(formatValue(result))}</span>
            </div>
            ${caseConsoleHtml}
          </div>`);
      } else {
        passedAll = false;
        testFeedbacks.push(`
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:6px;padding:0.6rem 0.85rem;margin:0.35rem 0;">
            <div style="color:#f87171;font-weight:700;font-size:0.82rem;">&#10007; Caso ${idx + 1} &mdash; FALHOU</div>
            <div style="font-family:var(--font-mono);font-size:0.79rem;margin-top:0.2rem;">
              <div style="color:#7d8590;">${escapeHtml(tc.expression)}</div>
              <div style="color:#fca5a5;">&#x21AA; Retornou: <strong>${escapeHtml(formatValue(result))}</strong></div>
              <div style="color:#86efac;">&#x21AA; Esperado:&nbsp; <strong>${escapeHtml(tc.expected)}</strong></div>
            </div>
            ${caseConsoleHtml}
          </div>`);
      }
    } catch (err) {
      passedAll = false;
      testFeedbacks.push(`
        <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.6rem 0.85rem;margin:0.35rem 0;">
          <div style="color:#f87171;font-weight:700;font-size:0.82rem;">&#128165; Caso ${idx + 1} &mdash; ERRO</div>
          <div style="font-family:var(--font-mono);font-size:0.79rem;color:#fca5a5;margin-top:0.2rem;">
            <div style="color:#7d8590;">${escapeHtml(tc.expression)}</div>
            <div style="background:rgba(0,0,0,0.35);border-radius:4px;padding:0.35rem 0.5rem;margin-top:0.25rem;white-space:pre-wrap;">${escapeHtml(err.message)}</div>
          </div>
        </div>`);
    }
  });

  // ── Render global output panel (APPEND to history)
  if (outputBody) {
    // Clear placeholder
    if (outputBody.innerHTML.includes('aguardando') || outputBody.innerHTML.includes('output-empty')) {
      outputBody.innerHTML = '';
    }

    const runBlock = document.createElement('div');
    runBlock.style.cssText = 'border-top:1px solid #21262d;';

    // Run header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.35rem 1rem;background:#161b22;border-bottom:1px solid #21262d;';
    const passed = passedAll;
    header.innerHTML = `
      <span style="font-size:0.7rem;color:#586069;font-family:var(--font-mono);"># Execução ${runNum}</span>
      <span style="font-size:0.7rem;color:#586069;">|</span>
      <span style="font-size:0.7rem;color:#586069;">${runTime}</span>
      <span style="margin-left:auto;font-size:0.7rem;font-weight:700;color:${passed ? '#34d399' : '#f87171'};">${passed ? '&#10003; passou' : '&#10007; falhou'}</span>
    `;
    runBlock.appendChild(header);

    // Output lines
    const linesEl = document.createElement('div');
    linesEl.style.cssText = 'padding:0.5rem 1rem;';

    if (allOutputLines.length === 0) {
      linesEl.innerHTML = '<span style="color:#586069;font-style:italic;font-size:0.8rem;">// sem saída de console</span>';
    } else {
      linesEl.innerHTML = allOutputLines.map(line => {
        const color = line.type === 'warn' ? '#fbbf24' : line.type === 'error' ? '#f87171' : line.type === 'info' ? '#93c5fd' : '#e2e8f0';
        const prefix = line.type === 'warn' ? '&#9888;' : line.type === 'error' ? '&#10008;' : line.type === 'info' ? 'i' : '&#8250;';
        return `<div style="color:${color};padding:0.1rem 0;white-space:pre-wrap;word-break:break-all;">${prefix} ${escapeHtml(line.text)}</div>`;
      }).join('');
    }
    runBlock.appendChild(linesEl);
    outputBody.appendChild(runBlock);
    outputBody.scrollTop = outputBody.scrollHeight;
  }

  // ── Render test results summary
  const summary = passedAll
    ? `<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:0.6rem 1rem;margin-bottom:0.5rem;color:#34d399;font-weight:700;">&#127881; Todos os ${q.testCases.length} caso(s) de teste passaram!</div>`
    : `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:0.6rem 1rem;margin-bottom:0.5rem;color:#f87171;font-weight:700;">&#10060; Alguns testes falharam. Revise seu código.</div>`;

  logContainer.innerHTML = summary + testFeedbacks.join('');

  if (passedAll) {
    statusSpan.innerHTML = '<span style="color:#34d399;">&#10003; Todos os testes passaram!</span>';
    saveStudentAnswer(currentUser.id, currentActivity.id, qId, { code: userCode, correct: true });
  } else {
    statusSpan.innerHTML = '<span style="color:#f87171;">&#10007; Alguns testes falharam</span>';
    saveStudentAnswer(currentUser.id, currentActivity.id, qId, { code: userCode, correct: false });
  }

  updateActivityStatusInfo();
  renderSidebarNav();
}

function formatValue(val) {
  if (val === null)      return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') {
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  }
  return String(val);
}

// ── Inline prompt input panel ──────────────────────────────
function showStudentPromptPanel(qId, promptMessages) {
  const outputBody = document.getElementById(`stud_output_body_${qId}`);
  if (!outputBody) return;

  outputBody.innerHTML = '';

  const panel = document.createElement('div');
  panel.style.cssText = 'padding: 0.85rem 1rem; background: #0d1117;';

  const header = document.createElement('div');
  header.style.cssText = 'color: #a5f3fc; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;';
  header.innerHTML = `⌨️ O programa precisa de <strong>${promptMessages.length}</strong> entrada(s). Preencha e execute:`;
  panel.appendChild(header);

  promptMessages.forEach((msg, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom: 0.6rem;';
    row.innerHTML = `
      <label style="display:block;font-size:0.72rem;color:#7d8590;margin-bottom:0.25rem;font-family:var(--font-mono);">
        <span style="color:#6366f1;font-weight:700;">${i + 1}.</span> ${escapeHtml(msg)}
      </label>
      <input
        id="stud_prompt_input_${qId}_${i}"
        type="text"
        placeholder="Digite a entrada aqui..."
        autocomplete="off"
        style="
          width: 100%;
          box-sizing: border-box;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 7px;
          color: #e2e8f0;
          font-family: var(--font-mono);
          font-size: 0.82rem;
          padding: 0.45rem 0.75rem;
          outline: none;
          transition: border-color 0.15s;
        "
        onfocus="this.style.borderColor='#6366f1'"
        onblur="this.style.borderColor='#30363d'"
      />
    `;
    panel.appendChild(row);
  });

  const runBtn = document.createElement('button');
  runBtn.type = 'button';
  runBtn.textContent = '▶ Executar com essas entradas';
  runBtn.style.cssText = `
    margin-top: 0.4rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 7px;
    padding: 0.45rem 1.1rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.03em;
    transition: opacity 0.15s;
  `;
  runBtn.onmouseenter = () => { runBtn.style.opacity = '0.85'; };
  runBtn.onmouseleave = () => { runBtn.style.opacity = '1'; };
  runBtn.onclick = () => runStudentCodeWithInputs(qId, promptMessages.length);
  panel.appendChild(runBtn);

  outputBody.appendChild(panel);
  // Focus first input
  setTimeout(() => {
    const first = document.getElementById(`stud_prompt_input_${qId}_0`);
    if (first) first.focus();
  }, 50);
}

function runStudentCodeWithInputs(qId, count) {
  const values = [];
  for (let i = 0; i < count; i++) {
    const el = document.getElementById(`stud_prompt_input_${qId}_${i}`);
    values.push(el ? el.value : '');
  }
  // Clear the input panel
  const outputBody = document.getElementById(`stud_output_body_${qId}`);
  if (outputBody) outputBody.innerHTML = '';
  // Re-run with provided values
  testStudentCode(qId, values);
}

// Expose for inline use if needed
window.runStudentCodeWithInputs = runStudentCodeWithInputs;

function updateActivityStatusInfo() {
  if (!currentActivity) return;
  const answers = getStudentAnswers(currentUser.id)[currentActivity.id] || {};
  const total = currentActivity.questions.length;
  const answered = Object.keys(answers).length;
  const el = document.getElementById('activity-status-info');
  if (el) el.textContent = `${answered} de ${total} questões respondidas.`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return 'undefined';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function submitActivityAnswers() {
  if (!currentActivity) return;

  const act = currentActivity;
  const answers = getStudentAnswers(currentUser.id)[act.id] || {};
  const total = act.questions.length;
  
  const answeredCount = Object.keys(answers).length;
  if (answeredCount < total) {
    const confirmSubmit = confirm(`Você respondeu ${answeredCount} de ${total} questões. Tem certeza que deseja enviar assim mesmo?`);
    if (!confirmSubmit) return;
  }

  const score = getStudentActivityScore(currentUser.id, act.id);
  showToast(`💾 Respostas enviadas com sucesso! Nota final: ${score}%`, 'success');
  logActivity(currentUser.id, `Concluiu atividade "${act.title}" obtendo ${score}%`);

  backToDashboard();
}

// Bind globally for inline click triggers
window.selectStudentTheoreticalOption = selectStudentTheoreticalOption;
window.testStudentCode = testStudentCode;
window.clearOutputPanel = clearOutputPanel;

function clearOutputPanel(qId) {
  const outputBody = document.getElementById(`stud_output_body_${qId}`);
  if (outputBody) outputBody.innerHTML = '';
  // Reset run counter so numbers restart from 1
  runCounters[qId] = 0;
}
