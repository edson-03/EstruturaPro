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

self.addEventListener('message', function (e) {
  var data = e.data;
  if (!data || !data.__ideRun) return;
  try {
    (new Function(data.code))();
  } catch (err) {
    send('error', '❌ Erro: ' + err.message);
  }
  send('done', '');
});

send('ready', '');
