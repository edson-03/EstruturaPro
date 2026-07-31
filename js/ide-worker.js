// Worker dedicado da IDE do aluno. Roda numa thread de verdade, separada da página
// principal — sem acesso a document/window/localStorage/DOM (Workers nunca têm isso,
// diferente de um iframe, onde a isolação depende de origem opaca). worker.terminate()
// (chamado pelo lado do student.js) interrompe a execução de forma garantida mesmo em
// loop infinito, o que uma iframe sandboxed não conseguia se o navegador não isolasse
// o frame num processo próprio.
function fmt(args) {
  return Array.prototype.map.call(args, function (a) {
    if (a !== null && typeof a === 'object') {
      try { return JSON.stringify(a, null, 2); } catch (e) { return String(a); }
    }
    return String(a);
  }).join(' ');
}

function send(type, text) {
  self.postMessage({ __ideConsole: true, type: type, text: text });
}

console.log = function () { send('log', fmt(arguments)); };
console.error = function () { send('error', '❌ ' + fmt(arguments)); };
console.warn = function () { send('warn', '⚠️ ' + fmt(arguments)); };

self.onerror = function (msg, url, line) {
  send('error', '❌ Erro: ' + msg + ' (linha ' + line + ')');
  return true;
};
self.addEventListener('unhandledrejection', function (e) {
  send('error', '❌ Promise rejeitada: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
});

// prompt/alert/confirm de verdade: Workers não têm essas funções (são exclusivas da
// janela principal). Implementado via SharedArrayBuffer + Atomics.wait — a única forma
// de bloquear a thread do worker de verdade até a página principal mostrar o diálogo
// nativo e escrever o resultado de volta. Exige que a página esteja "cross-origin
// isolated" (headers COOP/COEP); se não estiver, os buffers nunca chegam e as funções
// abaixo avisam com um erro amigável em vez de travar com "prompt is not defined".
var ideIOControl = null; // Int32Array(2): [0]=sinal (0=aguardando,1=pronto), [1]=resultado
var ideIOData = null;    // Uint16Array: char codes do resultado de prompt()
var IDE_IO_MAX_CHARS = 4096;

function requestIO(ioType, text, defaultValue) {
  if (!ideIOControl) {
    throw new Error(ioType + '() não está disponível neste ambiente agora. Recarregue a página e tente de novo.');
  }
  Atomics.store(ideIOControl, 0, 0);
  self.postMessage({ __ideIO: true, ioType: ioType, text: String(text == null ? '' : text), defaultValue: defaultValue });
  Atomics.wait(ideIOControl, 0, 0);

  if (ioType === 'alert') return undefined;
  var resultLen = Atomics.load(ideIOControl, 1);
  if (ioType === 'confirm') return resultLen === 1;
  // prompt: resultLen -1 significa cancelado (null)
  if (resultLen < 0) return null;
  var chars = [];
  for (var i = 0; i < resultLen; i++) chars.push(String.fromCharCode(ideIOData[i]));
  return chars.join('');
}

self.prompt = function (text, defaultValue) { return requestIO('prompt', text, defaultValue); };
self.alert = function (text) { return requestIO('alert', text); };
self.confirm = function (text) { return requestIO('confirm', text); };

self.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.__ideInit) {
    ideIOControl = new Int32Array(data.controlBuffer);
    ideIOData = new Uint16Array(data.dataBuffer);
    return;
  }
  if (!data || !data.__ideRun) return;
  try {
    (new Function(data.code))();
  } catch (err) {
    send('error', '❌ Erro: ' + err.message);
  }
  send('done', '');
});

send('ready', '');
