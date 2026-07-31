// Worker compartilhado por testStudentCode() (js/student.js) e runPracticalQuestion()
// (js/teacher.js) — roda o código de questões práticas isolado, fora da thread
// principal, porque new Function() direto era bloqueado pela CSP (sem 'unsafe-eval').
//
// Cada mensagem é independente (sem estado entre chamadas) e devolve só dados simples
// (string/boolean/number) — nunca o valor bruto retornado pelo código do aluno, que pode
// não ser serializável via postMessage (ex. função). A comparação com o valor esperado
// (que já existia antes, em js/student.js/js/teacher.js) roda aqui dentro por isso,
// preservando a mesma lógica de antes, só que no lado que efetivamente tem o valor.

function fmtArgs(args) {
  return Array.prototype.map.call(args, function (a) {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a === 'object') {
      try { return JSON.stringify(a, null, 2); } catch (e) { return String(a); }
    }
    return String(a);
  }).join(' ');
}

function makeFakeConsole(lines) {
  return {
    log:   function () { lines.push({ type: 'log',   text: fmtArgs(arguments) }); },
    warn:  function () { lines.push({ type: 'warn',  text: fmtArgs(arguments) }); },
    error: function () { lines.push({ type: 'error', text: fmtArgs(arguments) }); },
    info:  function () { lines.push({ type: 'info',  text: fmtArgs(arguments) }); },
    dir:   function () { lines.push({ type: 'log',   text: fmtArgs(arguments) }); },
    table: function () { lines.push({ type: 'log',   text: fmtArgs(arguments) }); },
  };
}

// prompt/alert/confirm falsos (não são diálogos reais — o aluno já preencheu os
// valores de prompt antes, via painel inline) usados só pela versão do aluno
// (com prompt/alert/confirm); a versão do professor não usa isso.
function makeFakeIO(lines, promptQueue) {
  var idx = 0;
  return {
    prompt: function (msg) {
      var val = promptQueue[idx] !== undefined ? promptQueue[idx++] : '';
      lines.push({ type: 'info', text: '⌨️ prompt("' + (msg || '') + '") → "' + val + '"' });
      return val;
    },
    alert: function (msg) {
      lines.push({ type: 'warn', text: '🔔 alert("' + (msg || '') + '")' });
    },
    confirm: function (msg) {
      lines.push({ type: 'info', text: '❓ confirm("' + (msg || '') + '") → true' });
      return true;
    },
  };
}

self.onmessage = function (e) {
  const data = e.data;
  if (!data || !data.__exec) return;
  const reply = { __execResult: true, id: data.id };

  if (data.kind === 'checkSyntax') {
    // Só compila (sem chamar) — CSP bloqueia até isso na thread principal, por isso
    // precisa rodar aqui mesmo sem executar o código de verdade.
    try {
      new Function('console', 'prompt', 'alert', 'confirm', data.code);
      reply.ok = true;
    } catch (err) {
      reply.ok = false;
      reply.error = err.message;
    }
    self.postMessage(reply);
    return;
  }

  if (data.kind === 'detectPrompts') {
    const prompts = [];
    const silentConsole = { log: function () {}, warn: function () {}, error: function () {}, info: function () {}, dir: function () {}, table: function () {} };
    const recordingPrompt = function (msg) { prompts.push(msg || 'Entrada'); return ''; };
    try {
      const fn = new Function('console', 'prompt', 'alert', 'confirm', data.code);
      fn(silentConsole, recordingPrompt, function () {}, function () { return false; });
    } catch (_e) { /* ignorado, igual ao comportamento original */ }
    reply.prompts = prompts;
    self.postMessage(reply);
    return;
  }

  if (data.kind === 'runTop') {
    // Execução "top-level" pra capturar o console.log direto do código do aluno — erros
    // aqui são silenciados de propósito (o mesmo erro reaparece por caso de teste abaixo).
    const lines = [];
    const fakeConsole = makeFakeConsole(lines);
    const io = makeFakeIO(lines, data.promptQueue || []);
    try {
      const fn = new Function('console', 'prompt', 'alert', 'confirm', data.code);
      fn(fakeConsole, io.prompt, io.alert, io.confirm);
    } catch (_e) { /* ignorado, igual ao comportamento original */ }
    reply.lines = lines;
    self.postMessage(reply);
    return;
  }

  if (data.kind === 'runTestCase') {
    // Versão do aluno: reexecuta o código inteiro + expressão de teste, com
    // prompt/alert/confirm falsos, e já compara com o valor esperado aqui dentro.
    const lines = [];
    const fakeConsole = makeFakeConsole(lines);
    const io = makeFakeIO(lines, data.promptQueue || []);
    try {
      const fn = new Function('console', 'prompt', 'alert', 'confirm', data.code + '\n;return (' + data.expression + ');');
      const result = fn(fakeConsole, io.prompt, io.alert, io.confirm);
      let expectedVal;
      try { expectedVal = eval(data.expected); } catch (_e) { expectedVal = data.expected; }
      reply.ok = true;
      reply.pass = JSON.stringify(result) === JSON.stringify(expectedVal) || String(result) === String(data.expected);
      reply.gotFormatted = (result === null) ? 'null' : (result === undefined) ? 'undefined' : (typeof result === 'object' ? (function () { try { return JSON.stringify(result, null, 2); } catch (_e) { return String(result); } })() : String(result));
    } catch (err) {
      reply.ok = false;
      reply.error = err.message;
    }
    reply.lines = lines;
    self.postMessage(reply);
    return;
  }

  if (data.kind === 'checkFunctionDefined') {
    // Versão do professor: compila o código e checa se ele define "minhaFuncao"
    // (convenção usada na prévia de questão prática do professor).
    const lines = [];
    const fakeConsole = makeFakeConsole(lines);
    try {
      const fn = new Function('console', data.code + '\n; return typeof minhaFuncao !== "undefined" ? minhaFuncao : undefined;');
      const result = fn(fakeConsole);
      reply.ok = true;
      reply.functionDefined = typeof result === 'function';
    } catch (err) {
      reply.ok = false;
      reply.error = err.message;
    }
    reply.lines = lines;
    self.postMessage(reply);
    return;
  }

  if (data.kind === 'runTeacherTestCase') {
    // Versão do professor: reexecuta o código + expressão de teste (só console, sem
    // prompt/alert/confirm), com a mesma lógica de comparação de antes (JSON.parse do
    // esperado, com fallback pra comparação de string).
    const lines = [];
    const fakeConsole = makeFakeConsole(lines);
    try {
      const fn = new Function('console', data.code + '\n; return (' + data.expression + ');');
      const got = fn(fakeConsole);
      const gotStr = (got === null) ? 'null' : (got === undefined) ? 'undefined' : (typeof got === 'object' ? (function () { try { return JSON.stringify(got); } catch (_e) { return String(got); } })() : String(got));
      const expectedStr = (data.expected || '').trim();
      let pass = false;
      try {
        const expectedVal = JSON.parse(expectedStr);
        pass = JSON.stringify(got) === JSON.stringify(expectedVal);
      } catch (_e) {
        pass = gotStr === expectedStr;
      }
      reply.ok = true;
      reply.pass = pass;
      reply.gotFormatted = gotStr;
    } catch (err) {
      reply.ok = false;
      reply.error = err.message;
    }
    reply.lines = lines;
    self.postMessage(reply);
    return;
  }
};
