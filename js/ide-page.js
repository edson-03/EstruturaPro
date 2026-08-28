// ============================================================
//  EstruturaPRO — IDE JavaScript (página própria)
// ============================================================
// Extraído de js/student.js pra rodar isolada em ide.html — precisa de
// crossOriginIsolated (headers COOP/COEP com Cross-Origin-Embedder-Policy:
// require-corp, ver vercel.json) pra que alert()/prompt()/confirm() reais
// funcionem dentro do código do aluno. O resto do painel (student.html) não
// tem esses headers porque quebraria o embed de vídeo do YouTube dos módulos
// (Safari só suporta require-corp, que exige COEP em todo <iframe> cross-origin
// — o YouTube ainda não manda esse header nos embeds).

let currentUser = null;
let ideEditorInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initDB();
  const session = getSession();
  if (!session || session.role !== 'student') {
    window.location.href = 'index.html';
    return;
  }
  currentUser = getUserById(session.userId);
  if (!currentUser) { clearSession(); window.location.href = 'index.html'; return; }

  document.getElementById('ide-user-avatar').textContent = currentUser.avatar;
  document.getElementById('ide-user-avatar').style.background = currentUser.avatarColor;
  document.getElementById('ide-user-name').textContent = currentUser.name;
  document.getElementById('btn-ide-back').addEventListener('click', () => {
    window.location.href = 'student.html';
  });

  setupIdeEventListeners();
  initIDE();
});

function setupIdeEventListeners() {
  const ideFileInput = document.getElementById('ide-file-input');
  const btnIdeImport = document.getElementById('btn-ide-import');
  if (btnIdeImport && ideFileInput) {
    btnIdeImport.addEventListener('click', () => ideFileInput.click());
    ideFileInput.addEventListener('change', (e) => {
      importIDEFile(e.target.files[0]);
      ideFileInput.value = '';
    });
  }
  document.getElementById('btn-ide-run').addEventListener('click', runIDECode);
  document.getElementById('btn-ide-stop').addEventListener('click', stopIDECode);
  document.getElementById('btn-ide-clear').addEventListener('click', clearIDECode);
  document.getElementById('btn-ide-save-file').addEventListener('click', saveIDEFileAs);
  document.getElementById('btn-ide-fullscreen').addEventListener('click', toggleIdeFullscreen);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ideFullscreenActive) toggleIdeFullscreen();
  });
}

// ── IDE JavaScript (espaço livre de código do aluno) ──
const IDE_DEFAULT_CODE = '// Escreva seu código aqui\nconsole.log("Olá!");\n';

function initIDE() {
  const ioWarning = document.getElementById('ide-io-warning');
  if (ioWarning) {
    ioWarning.style.display = (typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated) ? 'none' : 'block';
  }

  const textarea = document.getElementById('ide-code-textarea');
  ideEditorInstance = CodeMirror.fromTextArea(textarea, {
    mode: 'javascript',
    theme: 'dracula',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    tabSize: 2,
    viewportMargin: Infinity,
    hintOptions: { completeSingle: false },
    extraKeys: {
      'Ctrl-Space': (cm) => cm.showHint({ hint: CodeMirror.hint.javascript }),
      'Ctrl-/': (cm) => cm.toggleComment(),
      'Ctrl-S': saveIDECodeNow,
      'Cmd-S': saveIDECodeNow,
      'Ctrl-Enter': runIDECode,
      'Cmd-Enter': runIDECode,
    }
  });
  ideEditorInstance.setSize('100%', '480px');
  ideEditorInstance.on('change', debounce(() => saveIDECode(ideEditorInstance.getValue()), 800));
  ideEditorInstance.on('change', updateIdeLineCount);

  const localCode = getCodeSnippet(currentUser.id) || IDE_DEFAULT_CODE;
  ideEditorInstance.setValue(localCode);
  updateIdeLineCount();
  setTimeout(() => ideEditorInstance.refresh(), 120);

  // Busca a versão mais recente salva no Supabase (pode ter mudado em outro dispositivo).
  // Só aplica se o aluno não tiver digitado nada nesse meio-tempo — sem essa checagem,
  // essa promise resolvendo enquanto o aluno já está digitando código novo sobrescreve o
  // editor no meio da digitação, misturando o texto novo com o antigo.
  syncCodeSnippetFromSupabase(currentUser.id).then(code => {
    if (!ideEditorInstance) return;
    if (ideEditorInstance.getValue() !== localCode) return;
    const remoteCode = code || IDE_DEFAULT_CODE;
    if (remoteCode !== localCode) ideEditorInstance.setValue(remoteCode);
  });
}

function setIDESaveStatus(text) {
  const el = document.getElementById('ide-save-status');
  if (el) el.textContent = text;
}

async function saveIDECode(code) {
  setIDESaveStatus('Salvando...');
  await saveCodeSnippet(currentUser.id, code);
  setIDESaveStatus('✓ Salvo');
}

function saveIDECodeNow(cm) {
  saveIDECode(cm.getValue());
}

function updateIdeLineCount() {
  const el = document.getElementById('ide-line-count');
  if (!el || !ideEditorInstance) return;
  const code = ideEditorInstance.getValue();
  const lines = ideEditorInstance.lineCount();
  el.textContent = code.length > 0 ? `${lines} linha${lines !== 1 ? 's' : ''} · ${code.length} caracteres` : '';
}

// ── Salvar código como arquivo (.js/.txt/.json ou PDF via impressão) ──
function downloadIDETextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printIDECodeAsPdf(code) {
  const win = window.open('', '_blank');
  if (!win) {
    showToast('❌ O navegador bloqueou a janela de impressão. Permita pop-ups pra exportar em PDF.', 'warning');
    return;
  }
  win.document.write(
    '<!DOCTYPE html><html><head><title>Código JavaScript</title>' +
    '<style>body{font-family:"Courier New",monospace;white-space:pre-wrap;word-break:break-word;padding:2rem;font-size:13px;line-height:1.5;color:#000;}</style>' +
    '</head><body>' + escapeHtml(code) + '</body></html>'
  );
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

function saveIDEFileAs() {
  if (!ideEditorInstance) return;
  const code = ideEditorInstance.getValue();
  if (!code.trim()) {
    showToast('⚠️ Não há código pra salvar.', 'warning');
    return;
  }
  const format = document.getElementById('ide-save-format').value;

  if (format === 'pdf') {
    printIDECodeAsPdf(code);
    return;
  }
  if (format === 'json') {
    downloadIDETextFile('codigo.json', JSON.stringify({ code, savedAt: new Date().toISOString() }, null, 2), 'application/json');
    return;
  }
  if (format === 'txt') {
    downloadIDETextFile('codigo.txt', code, 'text/plain');
    return;
  }
  downloadIDETextFile('codigo.js', code, 'text/javascript');
}

function clearIDECode() {
  if (!ideEditorInstance) return;
  if (!ideEditorInstance.getValue().trim()) return;
  if (!confirm('Isso vai apagar todo o código do editor. Continuar?')) return;
  ideEditorInstance.setValue('');
  saveIDECode('');
  ideEditorInstance.focus();
}

// Modo Tela Cheia: reparenta o bloco pra document.body enquanto ativo — alguns
// ancestrais do layout usam backdrop-filter, que cria um novo "containing block" pra
// elementos position:fixed (mesmo achado/solução do editor de teoria do professor).
let ideFullscreenActive = false;
let ideFullscreenAnchor = null;

function toggleIdeFullscreen() {
  const block = document.getElementById('ide-editor-block');
  const btn = document.getElementById('btn-ide-fullscreen');
  if (!block) return;

  ideFullscreenActive = !ideFullscreenActive;

  if (ideFullscreenActive) {
    ideFullscreenAnchor = { parent: block.parentElement, nextSibling: block.nextElementSibling };
    document.body.appendChild(block);
  } else if (ideFullscreenAnchor) {
    ideFullscreenAnchor.parent.insertBefore(block, ideFullscreenAnchor.nextSibling);
    ideFullscreenAnchor = null;
  }

  block.classList.toggle('fullscreen-mode', ideFullscreenActive);
  if (btn) btn.classList.toggle('active', ideFullscreenActive);

  if (ideEditorInstance) {
    setTimeout(() => ideEditorInstance.refresh(), 50);
  }
}

function importIDEFile(file) {
  if (!file) return;
  const current = ideEditorInstance ? ideEditorInstance.getValue().trim() : '';
  if (current && current !== IDE_DEFAULT_CODE.trim()) {
    if (!confirm('Importar o arquivo vai substituir o código atual do editor. Continuar?')) return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (ideEditorInstance) {
      ideEditorInstance.setValue(String(reader.result));
      saveIDECode(ideEditorInstance.getValue());
      showToast('✓ Arquivo importado com sucesso!');
    }
  };
  reader.onerror = () => showToast('❌ Não foi possível ler o arquivo.', 'error');
  reader.readAsText(file);
}

// ── Execução isolada do código da IDE (Web Worker dedicado) ──
let ideWorker = null;
let ideRunTimeoutHandle = null;
let ideConsoleLineCount = 0;
const IDE_RUN_TIMEOUT_MS = 3000;

// O código do aluno roda num Worker dedicado (js/ide-worker.js) — thread de verdade,
// separada da página principal, sem acesso a document/window/localStorage (Workers não
// têm esses globais, diferente de um iframe onde a isolação depende do navegador tratar
// a origem opaca como processo à parte). Vantagem decisiva sobre iframe sandboxed: em
// teste real, um iframe sandboxed rodando `while(true){}` travou a thread principal da
// página (o navegador de teste não isolou o frame em processo próprio), tornando o botão
// "Parar" inútil — já `worker.terminate()` é garantido pela spec e interrompe a execução
// mesmo em loop infinito, então "Parar" funciona de verdade nesse caso.
let idePendingCode = null;
let ideWorkerReady = false;
let ideWorkerReadyTimeoutHandle = null;
let ideWorkerReadyRetries = 0;
const IDE_WORKER_READY_TIMEOUT_MS = 1500;
const IDE_WORKER_READY_MAX_RETRIES = 2;

// prompt/alert/confirm reais dentro do Worker: exige SharedArrayBuffer, que só existe se
// a página estiver "cross-origin isolated" (headers COOP/COEP, ver vercel.json). Sem
// isso, ideIOControl fica null e o worker mostra um erro amigável em vez de travar.
const IDE_IO_MAX_CHARS = 4096;
let ideIOControl = null;
let ideIOData = null;

function ensureIdeWorker() {
  if (ideWorker) return ideWorker;
  // "?v=" força o navegador e a CDN a tratar como URL nova a cada mudança neste arquivo —
  // ide-worker.js é immutable/cacheado por 30 dias (vercel.json), e um cache de borda da
  // CDN pode ficar preso numa cópia sem os headers COOP/COEP corretos mesmo depois de um
  // deploy novo. Incrementar este número sempre que ide-worker.js mudar.
  const worker = new Worker('js/ide-worker.js?v=3');
  ideWorker = worker;
  worker.onmessage = handleIdeWorkerMessage;

  if (typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated) {
    const controlBuffer = new SharedArrayBuffer(8);
    const dataBuffer = new SharedArrayBuffer(IDE_IO_MAX_CHARS * 2);
    ideIOControl = new Int32Array(controlBuffer);
    ideIOData = new Uint16Array(dataBuffer);
    worker.postMessage({ __ideInit: true, controlBuffer, dataBuffer });
  } else {
    ideIOControl = null;
    ideIOData = null;
  }

  // Vigia: se o worker não avisar "ready" a tempo (raro), descarta e recria — tentativa
  // simples de recuperação em vez de deixar o aluno preso num "Executar" que nunca sai
  // do estado de carregando.
  clearTimeout(ideWorkerReadyTimeoutHandle);
  ideWorkerReadyTimeoutHandle = setTimeout(() => {
    if (ideWorkerReady) return;
    if (ideWorkerReadyRetries >= IDE_WORKER_READY_MAX_RETRIES) {
      appendIdeConsoleLine('error', '❌ Não foi possível inicializar o ambiente de execução. Tente novamente.');
      clearTimeout(ideRunTimeoutHandle);
      setIDERunningState(false);
      return;
    }
    ideWorkerReadyRetries++;
    const pending = idePendingCode;
    discardIdeWorker();
    idePendingCode = pending;
    ensureIdeWorker();
  }, IDE_WORKER_READY_TIMEOUT_MS);

  return worker;
}

function discardIdeWorker() {
  if (ideWorker) {
    ideWorker.terminate();
    ideWorker = null;
  }
  clearTimeout(ideWorkerReadyTimeoutHandle);
  ideWorkerReady = false;
  idePendingCode = null;
  ideIOControl = null;
  ideIOData = null;
}

function appendIdeConsoleLine(type, text) {
  const el = document.getElementById('ide-console-output');
  if (!el) return;
  if (ideConsoleLineCount === 0) el.textContent = '';
  ideConsoleLineCount++;
  const line = document.createElement('div');
  line.style.color = type === 'error' ? 'var(--red-light)' : (type === 'warn' ? '#f59e0b' : '#a6adc8');
  line.textContent = text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function setIDERunningState(running) {
  const runBtn = document.getElementById('btn-ide-run');
  const stopBtn = document.getElementById('btn-ide-stop');
  if (runBtn) runBtn.disabled = running;
  if (stopBtn) stopBtn.disabled = !running;
}

function runIDECode() {
  if (!ideEditorInstance) return;
  const code = ideEditorInstance.getValue();

  const consoleEl = document.getElementById('ide-console-output');
  if (consoleEl) consoleEl.textContent = '';
  ideConsoleLineCount = 0;
  setIDERunningState(true);
  clearTimeout(ideRunTimeoutHandle);

  const worker = ensureIdeWorker();
  if (ideWorkerReady) {
    worker.postMessage({ __ideRun: true, code: code });
  } else {
    idePendingCode = code;
  }

  armIdeRunTimeout();
}

function armIdeRunTimeout() {
  clearTimeout(ideRunTimeoutHandle);
  ideRunTimeoutHandle = setTimeout(() => {
    appendIdeConsoleLine('warn', '⚠️ O código está demorando muito (pode ser um loop infinito). Clique em "⏹️ Parar" se quiser interromper.');
  }, IDE_RUN_TIMEOUT_MS);
}

function stopIDECode() {
  clearTimeout(ideRunTimeoutHandle);
  discardIdeWorker();
  ideWorkerReadyRetries = 0;
  appendIdeConsoleLine('warn', '⏹️ Execução interrompida.');
  setIDERunningState(false);
}

function handleIdeIORequest(data) {
  if (!ideIOControl) return;
  // Pausa o aviso de "loop infinito" enquanto o diálogo está aberto — o código não
  // está travado, só esperando o aluno responder ao prompt/alert/confirm.
  clearTimeout(ideRunTimeoutHandle);

  let resultValue;
  if (data.ioType === 'alert') {
    window.alert(data.text);
    resultValue = 0;
  } else if (data.ioType === 'confirm') {
    resultValue = window.confirm(data.text) ? 1 : 0;
  } else {
    const result = window.prompt(data.text, data.defaultValue || '');
    if (result === null) {
      resultValue = -1;
    } else {
      const len = Math.min(result.length, IDE_IO_MAX_CHARS);
      for (let i = 0; i < len; i++) ideIOData[i] = result.charCodeAt(i);
      resultValue = len;
    }
  }
  Atomics.store(ideIOControl, 1, resultValue);
  Atomics.store(ideIOControl, 0, 1);
  Atomics.notify(ideIOControl, 0);

  armIdeRunTimeout();
}

function handleIdeWorkerMessage(e) {
  const data = e.data;
  if (data && data.__ideIO) {
    handleIdeIORequest(data);
    return;
  }
  if (!data || !data.__ideConsole) return;

  if (data.type === 'ready') {
    clearTimeout(ideWorkerReadyTimeoutHandle);
    ideWorkerReady = true;
    ideWorkerReadyRetries = 0;
    if (idePendingCode !== null) {
      ideWorker.postMessage({ __ideRun: true, code: idePendingCode });
      idePendingCode = null;
    }
    return;
  }

  if (data.type === 'done') {
    clearTimeout(ideRunTimeoutHandle);
    setIDERunningState(false);
    if (ideConsoleLineCount === 0) {
      appendIdeConsoleLine('log', '// Código executado com sucesso (nenhum console.log emitido).');
    }
    return;
  }
  appendIdeConsoleLine(data.type, data.text);
}
