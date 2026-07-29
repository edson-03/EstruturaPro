// ============================================================
//  EstruturaPRO — Data Layer (localStorage)
// ============================================================

const DB_KEYS = {
  USERS:           'ep_users',
  SESSION:         'ep_session',
  PROGRESS:        'ep_progress',
  MODULE_ACCESS:   'ep_module_access',
  ACTIVITY_LOG:    'ep_activity_log',
  ACTIVITIES:      'ep_activities',
  STUDENT_ANSWERS: 'ep_student_answers',
  BANK_QUESTIONS:  'ep_bank_questions',
  BANK_SCORES:     'ep_bank_scores',
};

// ── HTML Escaping (compartilhado entre student.js e teacher.js) ──
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Vídeo do YouTube (compartilhado entre teacher.js e student.js) ──
function extractYouTubeId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:[?&]v=|\/embed\/|\/shorts\/|\/live\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

function buildYouTubeEmbedUrl(video) {
  const id = extractYouTubeId(video?.url);
  if (!id) return null;
  const params = new URLSearchParams({ rel: '0' });
  if (video?.autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function escapeDangerousHtml(text) {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]*)/gi, '');
}

// ── Default Users ──────────────────────────────────────────
const DEFAULT_USERS = [
  {
    id: 'teacher1',
    name: 'Prof. Carlos Silva',
    email: 'professor@estrutura.edu',
    password: '1234',
    role: 'teacher',
    avatar: 'CS',
    avatarColor: '#6366f1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student1',
    name: 'Ana Beatriz Souza',
    email: 'ana@aluno.edu',
    password: '1234',
    role: 'student',
    avatar: 'AS',
    avatarColor: '#10b981',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student2',
    name: 'Bruno Lima Costa',
    email: 'bruno@aluno.edu',
    password: '1234',
    role: 'student',
    avatar: 'BL',
    avatarColor: '#f59e0b',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student3',
    name: 'Carlos Eduardo Melo',
    email: 'carlos@aluno.edu',
    password: '1234',
    role: 'student',
    avatar: 'CM',
    avatarColor: '#ec4899',
    createdAt: new Date().toISOString(),
  },
];

// Default: only module "arrays" unlocked for each student
const DEFAULT_MODULE_ACCESS = {
  student1: ['arrays'],
  student2: ['arrays'],
  student3: ['arrays'],
};

// Default progress (empty — students haven't done anything)
const DEFAULT_PROGRESS = {
  student1: {},
  student2: {},
  student3: {},
};

// ── Default Bank Questions ──────────────────────────────────
const DEFAULT_BANK_QUESTIONS = [
  // Módulo Arrays e Vetores
  {
    id: "q_arr_1",
    module_id: "arrays",
    type: "multiple",
    statement: "Qual é a complexidade de tempo para ACESSAR um elemento por índice em um array comum?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
    correct_answer: "2"
  },
  {
    id: "q_arr_2",
    module_id: "arrays",
    type: "multiple",
    statement: "Qual é a complexidade de tempo (caso médio) para inserção no final de um array dinâmico (por exemplo, push em JS)?",
    options: ["O(1) amortizado", "O(n)", "O(log n)", "O(n²)"],
    correct_answer: "0"
  },
  {
    id: "q_arr_3",
    module_id: "arrays",
    type: "multiple",
    statement: "Por que o acesso por índice em um array é extremamente rápido e tem tempo O(1)?",
    options: [
      "Porque faz uma busca linear rápida",
      "Porque calcula o endereço exato na memória usando: endereço_inicial + índice * tamanho_elemento",
      "Porque os dados de um array são espalhados aleatoriamente na memória",
      "Porque o navegador pré-carrega todos os elementos em cache"
    ],
    correct_answer: "1"
  },
  {
    id: "q_arr_4",
    module_id: "arrays",
    type: "true_false",
    statement: "Em um array de tamanho estático (fixo), é possível alterar dinamicamente a quantidade de memória alocada sem precisar criar um novo bloco na memória.",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "1"
  },
  {
    id: "q_arr_5",
    module_id: "arrays",
    type: "true_false",
    statement: "A inserção de um elemento no início de um array comum de tamanho N requer o deslocamento de todos os outros N elementos uma posição para a direita.",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "0"
  },
  {
    id: "q_arr_6",
    module_id: "arrays",
    type: "multiple",
    statement: "Qual das seguintes alternativas descreve uma desvantagem típica do uso de arrays de tamanho estático?",
    options: [
      "Acesso aleatório muito lento por índice",
      "Desperdício de memória ou estouro de limite devido ao tamanho pré-definido e imutável",
      "Alta sobrecarga de ponteiros adicionais para cada elemento",
      "Não suporta dados heterogêneos em nenhuma linguagem"
    ],
    correct_answer: "1"
  },
  {
    id: "q_arr_7",
    module_id: "arrays",
    type: "multiple",
    statement: "Em JavaScript, qual método é utilizado para remover o último elemento de um array e retornar esse elemento?",
    options: ["shift()", "unshift()", "pop()", "push()"],
    correct_answer: "2"
  },
  {
    id: "q_arr_8",
    module_id: "arrays",
    type: "multiple",
    statement: "Em JavaScript, qual método é utilizado para inserir um ou mais elementos no início do array?",
    options: ["push()", "unshift()", "pop()", "shift()"],
    correct_answer: "1"
  },
  {
    id: "q_arr_9",
    module_id: "arrays",
    type: "true_false",
    statement: "A busca binária pode ser executada em tempo O(log n) sobre qualquer array, independente de os elementos estarem ordenados ou não.",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "1"
  },
  {
    id: "q_arr_10",
    module_id: "arrays",
    type: "essay",
    statement: "Qual termo técnico em inglês define o endereço de memória onde um array inicia?",
    options: [],
    correct_answer: "base"
  },
  {
    id: "q_arr_11",
    module_id: "arrays",
    type: "multiple",
    statement: "Se você precisa de uma estrutura de dados linear onde as inserções no início sejam estritamente O(1) e não requerem redimensionar memória contígua, qual seria melhor que um array?",
    options: ["Fila sequencial", "Lista ligada", "Pilha com array de tamanho fixo", "Matriz multidimensional"],
    correct_answer: "1"
  },
  {
    id: "q_arr_12",
    module_id: "arrays",
    type: "true_false",
    statement: "A complexidade de espaço de um array contendo N elementos é de ordem O(N).",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "0"
  },
  {
    id: "q_arr_13",
    module_id: "arrays",
    type: "multiple",
    statement: "Se tentarmos acessar um índice fora dos limites do array em uma linguagem como C (ex: index out of bounds), qual comportamento é esperado?",
    options: [
      "Retorna undefined",
      "Lança uma exceção controlada do tipo IndexOutOfBoundsException",
      "Ocorre comportamento indefinido (Undefined Behavior), podendo acessar sujeira de memória ou causar falha de segmentação",
      "O array redimensiona automaticamente para acomodar o índice"
    ],
    correct_answer: "2"
  },

  // Módulo Lista Ligada
  {
    id: "q_list_1",
    module_id: "linked-list",
    type: "multiple",
    statement: "Qual é a complexidade de tempo para buscar um valor específico em uma lista simplesmente ligada de N elementos?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct_answer: "2"
  },
  {
    id: "q_list_2",
    module_id: "linked-list",
    type: "multiple",
    statement: "Em uma lista simplesmente ligada, cada nó é composto basicamente por:",
    options: [
      "O nó anterior e o nó seguinte",
      "O valor do dado e uma referência/ponteiro para o próximo nó",
      "O valor do dado apenas",
      "Ponteiros para a cabeça e para a cauda da lista"
    ],
    correct_answer: "1"
  },
  {
    id: "q_list_3",
    module_id: "linked-list",
    type: "true_false",
    statement: "A inserção de um novo elemento no início de uma lista ligada simples (head) é uma operação que roda em tempo constante O(1).",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "0"
  },
  {
    id: "q_list_4",
    module_id: "linked-list",
    type: "true_false",
    statement: "Diferente de um array, os elementos de uma lista ligada não ocupam necessariamente posições adjacentes na memória física.",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "0"
  },
  {
    id: "q_list_5",
    module_id: "linked-list",
    type: "multiple",
    statement: "Para remover o primeiro nó de uma lista simplesmente ligada com pelo menos dois nós, o ponteiro de início da lista (head) deve ser atualizado para apontar para:",
    options: ["null", "O segundo nó (head.proximo)", "O último nó", "O nó anterior"],
    correct_answer: "1"
  },
  {
    id: "q_list_6",
    module_id: "linked-list",
    type: "multiple",
    statement: "Qual é a principal vantagem de uma lista duplamente ligada em relação a uma simplesmente ligada?",
    options: [
      "Usa menos espaço de memória por nó",
      "Permite percorrer e navegar na lista em ambas as direções (para frente e para trás)",
      "Reduz a complexidade de busca por índice para O(1)",
      "Dispensa o uso de ponteiros"
    ],
    correct_answer: "1"
  },
  {
    id: "q_list_7",
    module_id: "linked-list",
    type: "true_false",
    statement: "Em uma lista simplesmente ligada que seja circular, o ponteiro de próximo (next) do último nó aponta de volta para o primeiro nó da lista (head) em vez de ser null.",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "0"
  },
  {
    id: "q_list_8",
    module_id: "linked-list",
    type: "essay",
    statement: "Qual é a palavra comumente usada em inglês para se referir ao primeiro nó de uma lista ligada?",
    options: [],
    correct_answer: "head"
  },
  {
    id: "q_list_9",
    module_id: "linked-list",
    type: "essay",
    statement: "Qual é a palavra comumente usada em inglês para se referir ao último nó de uma lista ligada?",
    options: [],
    correct_answer: "tail"
  },
  {
    id: "q_list_10",
    module_id: "linked-list",
    type: "multiple",
    statement: "Se tivermos uma lista duplamente ligada e tivermos uma referência direta ao nó intermediário que desejamos excluir, qual é a complexidade de tempo para removê-lo?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
    correct_answer: "0"
  },
  {
    id: "q_list_11",
    module_id: "linked-list",
    type: "true_false",
    statement: "Listas ligadas são mais propensas a causar fragmentação de memória na Heap em comparação com arrays devido à alocação e liberação individual de cada nó.",
    options: ["Verdadeiro", "Falso"],
    correct_answer: "0"
  }
];

// ── Modules Definition ──────────────────────────────────────
const MODULES = [
  // ── 1. Arrays ──
  {
    id: 'arrays',
    title: 'Arrays e Vetores',
    subtitle: 'A base de tudo',
    icon: '▦',
    emoji: '📦',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    description: 'Aprenda sobre arrays — a estrutura de dados mais fundamental da computação.',
    duration: '45 min',
    difficulty: 'Iniciante',
    complexity: {
      access:   'O(1)',
      search:   'O(n)',
      insert:   'O(n)',
      delete:   'O(n)',
      space:    'O(n)',
    },
    theory: `
Um **array** (ou vetor) é uma coleção de elementos armazenados em posições de memória **contíguas** e acessados por um índice numérico.

### Como funciona?

Imagine uma sequência de caixas numeradas em uma prateleira. Cada caixa tem um endereço (índice) e guarda um valor. O computador conhece o endereço da primeira caixa e calcula o endereço de qualquer outra em tempo constante.

### Características principais

- **Tamanho fixo** (em linguagens como C/Java) ou **dinâmico** (JavaScript, Python)
- **Índice começa em 0** na maioria das linguagens
- **Acesso direto** — para acessar o elemento de índice k, basta ir direto a ele: O(1)
- **Inserção/remoção no meio** requer deslocamento de elementos: O(n)

### Vantagens
✅ Acesso extremamente rápido por índice
✅ Fácil de percorrer (iterar)
✅ Boa localidade de cache (dados contíguos na memória)

### Desvantagens
❌ Inserção/remoção no meio é custosa
❌ Tamanho fixo (em implementações estáticas)
❌ Busca linear sem ordenação: O(n)

### Aplicações reais
- Armazenar pixels de uma imagem
- Lista de contatos de um celular
- Dados de uma planilha eletrônica
- Buffer de áudio/vídeo
    `,
    codeExample: `<span class="cmt">// Criando e manipulando arrays em JavaScript</span>

<span class="kw">const</span> <span class="var">numeros</span> <span class="op">=</span> <span class="op">[</span><span class="num">10</span><span class="op">,</span> <span class="num">25</span><span class="op">,</span> <span class="num">7</span><span class="op">,</span> <span class="num">42</span><span class="op">,</span> <span class="num">18</span><span class="op">]</span><span class="op">;</span>

<span class="cmt">// Acesso por índice — O(1)</span>
<span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="var">numeros</span><span class="op">[</span><span class="num">0</span><span class="op">]</span><span class="op">)</span><span class="op">;</span>  <span class="cmt">// 10</span>
<span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="var">numeros</span><span class="op">[</span><span class="num">3</span><span class="op">]</span><span class="op">)</span><span class="op">;</span>  <span class="cmt">// 42</span>

<span class="cmt">// Inserção no final — O(1) amortizado</span>
<span class="var">numeros</span><span class="op">.</span><span class="fn">push</span><span class="op">(</span><span class="num">99</span><span class="op">)</span><span class="op">;</span>        <span class="cmt">// [10, 25, 7, 42, 18, 99]</span>

<span class="cmt">// Inserção no meio — O(n) (desloca elementos)</span>
<span class="var">numeros</span><span class="op">.</span><span class="fn">splice</span><span class="op">(</span><span class="num">2</span><span class="op">,</span> <span class="num">0</span><span class="op">,</span> <span class="num">50</span><span class="op">)</span><span class="op">;</span>  <span class="cmt">// insere 50 no índice 2</span>

<span class="cmt">// Busca linear — O(n)</span>
<span class="kw">function</span> <span class="fn">buscar</span><span class="op">(</span><span class="var">arr</span><span class="op">,</span> <span class="var">alvo</span><span class="op">)</span> <span class="op">{</span>
  <span class="kw">for</span> <span class="op">(</span><span class="kw">let</span> <span class="var">i</span> <span class="op">=</span> <span class="num">0</span><span class="op">;</span> <span class="var">i</span> <span class="op">&lt;</span> <span class="var">arr</span><span class="op">.</span><span class="var">length</span><span class="op">;</span> <span class="var">i</span><span class="op">++</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">if</span> <span class="op">(</span><span class="var">arr</span><span class="op">[</span><span class="var">i</span><span class="op">]</span> <span class="op">===</span> <span class="var">alvo</span><span class="op">)</span> <span class="kw">return</span> <span class="var">i</span><span class="op">;</span>
  <span class="op">}</span>
  <span class="kw">return</span> <span class="op">-</span><span class="num">1</span><span class="op">;</span>
<span class="op">}</span>

<span class="cmt">// Percorrer — O(n)</span>
<span class="var">numeros</span><span class="op">.</span><span class="fn">forEach</span><span class="op">(</span><span class="op">(</span><span class="var">val</span><span class="op">,</span> <span class="var">idx</span><span class="op">)</span> <span class="op">=&gt;</span> <span class="op">{</span>
  <span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="str">\`[\${idx}] = \${val}\`</span><span class="op">)</span><span class="op">;</span>
<span class="op">}</span><span class="op">)</span><span class="op">;</span>`,
    quiz: [
      {
        question: 'Qual é a complexidade de tempo para ACESSAR um elemento por índice em um array?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correct: 2,
        explanation: 'O acesso por índice é O(1) pois o computador calcula diretamente o endereço de memória do elemento.'
      },
      {
        question: 'O que acontece ao inserir um elemento no MEIO de um array?',
        options: [
          'Nada, é instantâneo',
          'Os elementos após a posição são deslocados uma posição à direita',
          'O array é completamente recriado',
          'Ocorre um erro automaticamente'
        ],
        correct: 1,
        explanation: 'Para inserir no meio, todos os elementos após a posição de inserção precisam ser deslocados uma posição, tornando a operação O(n).'
      },
      {
        question: 'Qual índice representa o PRIMEIRO elemento de um array na maioria das linguagens?',
        options: ['1', '-1', '0', 'Depende da linguagem'],
        correct: 2,
        explanation: 'A maioria das linguagens usa indexação a partir de 0 (zero-based indexing). Assim, o primeiro elemento está no índice 0.'
      },
    ],
  },

  // ── 2. Listas Ligadas ──
  {
    id: 'linked-list',
    title: 'Listas Ligadas',
    subtitle: 'Nós conectados dinamicamente',
    icon: '⟶',
    emoji: '🔗',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    description: 'Entenda como nós se conectam por ponteiros formando estruturas dinâmicas.',
    duration: '55 min',
    difficulty: 'Básico',
    complexity: {
      access:   'O(n)',
      search:   'O(n)',
      insert:   'O(1)*',
      delete:   'O(1)*',
      space:    'O(n)',
    },
    theory: `
Uma **lista ligada** (linked list) é uma sequência de **nós**, onde cada nó armazena um valor e um ponteiro (referência) para o próximo nó da lista.

### Estrutura de um Nó

\`\`\`
┌─────────┬──────────┐
│  Dado   │ Próximo ─┼──→  próximo nó
└─────────┴──────────┘
\`\`\`

### Tipos de Listas Ligadas

**Simplesmente ligada**: cada nó aponta apenas para o próximo.
**Duplamente ligada**: cada nó tem ponteiro para o próximo e para o anterior.
**Circular**: o último nó aponta para o primeiro.

### Vantagens vs Arrays

| Característica | Array | Lista Ligada |
|---|---|---|
| Acesso por índice | O(1) ✅ | O(n) ❌ |
| Inserção no início | O(n) ❌ | O(1) ✅ |
| Memória | Contígua | Dispersa |
| Tamanho | Fixo (estático) | Dinâmico |

### Aplicações reais
- Histórico de navegação do browser (voltar/avançar)
- Lista de reprodução de músicas
- Implementação de pilhas e filas
- Gerenciamento de memória em sistemas operacionais
    `,
    codeExample: `<span class="cmt">// Implementação de Lista Ligada Simples</span>

<span class="kw">class</span> <span class="fn">No</span> <span class="op">{</span>
  <span class="fn">constructor</span><span class="op">(</span><span class="var">valor</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">valor</span>   <span class="op">=</span> <span class="var">valor</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">proximo</span> <span class="op">=</span> <span class="kw">null</span><span class="op">;</span>
  <span class="op">}</span>
<span class="op">}</span>

<span class="kw">class</span> <span class="fn">ListaLigada</span> <span class="op">{</span>
  <span class="fn">constructor</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">cabeca</span> <span class="op">=</span> <span class="kw">null</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">tamanho</span> <span class="op">=</span> <span class="num">0</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Inserir no início — O(1)</span>
  <span class="fn">inserirInicio</span><span class="op">(</span><span class="var">valor</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">const</span> <span class="var">novo</span> <span class="op">=</span> <span class="kw">new</span> <span class="fn">No</span><span class="op">(</span><span class="var">valor</span><span class="op">)</span><span class="op">;</span>
    <span class="var">novo</span><span class="op">.</span><span class="var">proximo</span> <span class="op">=</span> <span class="kw">this</span><span class="op">.</span><span class="var">cabeca</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">cabeca</span>  <span class="op">=</span> <span class="var">novo</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">tamanho</span><span class="op">++</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Percorrer — O(n)</span>
  <span class="fn">percorrer</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">let</span> <span class="var">atual</span> <span class="op">=</span> <span class="kw">this</span><span class="op">.</span><span class="var">cabeca</span><span class="op">;</span>
    <span class="kw">while</span> <span class="op">(</span><span class="var">atual</span> <span class="op">!==</span> <span class="kw">null</span><span class="op">)</span> <span class="op">{</span>
      <span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="var">atual</span><span class="op">.</span><span class="var">valor</span><span class="op">)</span><span class="op">;</span>
      <span class="var">atual</span> <span class="op">=</span> <span class="var">atual</span><span class="op">.</span><span class="var">proximo</span><span class="op">;</span>
    <span class="op">}</span>
  <span class="op">}</span>
<span class="op">}</span>

<span class="kw">const</span> <span class="var">lista</span> <span class="op">=</span> <span class="kw">new</span> <span class="fn">ListaLigada</span><span class="op">()</span><span class="op">;</span>
<span class="var">lista</span><span class="op">.</span><span class="fn">inserirInicio</span><span class="op">(</span><span class="num">30</span><span class="op">)</span><span class="op">;</span>  <span class="cmt">// 30</span>
<span class="var">lista</span><span class="op">.</span><span class="fn">inserirInicio</span><span class="op">(</span><span class="num">20</span><span class="op">)</span><span class="op">;</span>  <span class="cmt">// 20 → 30</span>
<span class="var">lista</span><span class="op">.</span><span class="fn">inserirInicio</span><span class="op">(</span><span class="num">10</span><span class="op">)</span><span class="op">;</span>  <span class="cmt">// 10 → 20 → 30</span>`,
    quiz: [
      {
        question: 'Qual é a complexidade de inserção no INÍCIO de uma lista ligada?',
        options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
        correct: 3,
        explanation: 'Inserir no início é O(1) pois basta criar o novo nó, apontar seu "próximo" para a cabeça atual, e atualizar a cabeça.'
      },
      {
        question: 'O que cada nó de uma lista ligada simples contém?',
        options: [
          'Apenas o valor',
          'O valor e um ponteiro para o próximo nó',
          'O valor e ponteiros para o próximo e anterior',
          'Um índice e um valor'
        ],
        correct: 1,
        explanation: 'Na lista simplesmente ligada, cada nó contém o dado armazenado e um ponteiro (referência) para o próximo nó da sequência.'
      },
      {
        question: 'Por que o acesso a um elemento por posição é O(n) em listas ligadas?',
        options: [
          'Porque listas são sempre maiores que arrays',
          'Porque é necessário percorrer os nós sequencialmente desde o início',
          'Porque os dados não estão ordenados',
          'Porque a memória é não-contígua e há cache miss'
        ],
        correct: 1,
        explanation: 'Diferente de arrays, não há como calcular diretamente o endereço do k-ésimo elemento. É preciso seguir os ponteiros um a um desde a cabeça.'
      },
    ],
  },

  // ── 3. Pilhas ──
  {
    id: 'stack',
    title: 'Pilhas (Stack)',
    subtitle: 'Último a entrar, primeiro a sair',
    icon: '⬆',
    emoji: '📚',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    description: 'Compreenda a estrutura LIFO e suas aplicações no mundo real.',
    duration: '40 min',
    difficulty: 'Básico',
    complexity: {
      access:   'O(n)',
      search:   'O(n)',
      insert:   'O(1)',
      delete:   'O(1)',
      space:    'O(n)',
    },
    theory: `
Uma **pilha** (stack) é uma estrutura de dados que segue o princípio **LIFO** — *Last In, First Out* (Último a entrar, Primeiro a Sair).

### Analogia

Pense em uma pilha de pratos: você só pode adicionar ou remover pelo TOPO. O último prato colocado é o primeiro a ser retirado.

### Operações Fundamentais

| Operação | Descrição | Complexidade |
|---|---|---|
| **push(x)** | Insere x no topo | O(1) |
| **pop()** | Remove e retorna o topo | O(1) |
| **peek()** | Consulta o topo sem remover | O(1) |
| **isEmpty()** | Verifica se está vazia | O(1) |

### Visualização

\`\`\`
push(40) →   [40]  ← topo
push(20) →   [20]  ← topo
             [40]
push(60) →   [60]  ← topo
             [20]
             [40]
pop()    →   [20]  ← topo (60 foi removido)
             [40]
\`\`\`

### Aplicações reais
- **Desfazer (Ctrl+Z)** em editores de texto
- **Pilha de chamadas** (call stack) em linguagens de programação
- **Histórico de navegação** (botão voltar)
- **Avaliação de expressões** matemáticas (balanceamento de parênteses)
- **DFS** (Busca em Profundidade) em grafos
    `,
    codeExample: `<span class="kw">class</span> <span class="fn">Pilha</span> <span class="op">{</span>
  <span class="fn">constructor</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">itens</span> <span class="op">=</span> <span class="op">[]</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Empilhar — O(1)</span>
  <span class="fn">push</span><span class="op">(</span><span class="var">elemento</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="fn">push</span><span class="op">(</span><span class="var">elemento</span><span class="op">)</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Desempilhar — O(1)</span>
  <span class="fn">pop</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">if</span> <span class="op">(</span><span class="kw">this</span><span class="op">.</span><span class="fn">isEmpty</span><span class="op">()</span><span class="op">)</span> <span class="kw">return</span> <span class="kw">null</span><span class="op">;</span>
    <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="fn">pop</span><span class="op">()</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Ver topo sem remover — O(1)</span>
  <span class="fn">peek</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">[</span><span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="var">length</span> <span class="op">-</span> <span class="num">1</span><span class="op">]</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="fn">isEmpty</span><span class="op">()</span> <span class="op">{</span> <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="var">length</span> <span class="op">===</span> <span class="num">0</span><span class="op">;</span> <span class="op">}</span>
  <span class="fn">size</span><span class="op">()</span>    <span class="op">{</span> <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="var">length</span><span class="op">;</span> <span class="op">}</span>
<span class="op">}</span>

<span class="cmt">// Uso prático: verificar parênteses balanceados</span>
<span class="kw">function</span> <span class="fn">balanceado</span><span class="op">(</span><span class="var">expressao</span><span class="op">)</span> <span class="op">{</span>
  <span class="kw">const</span> <span class="var">pilha</span> <span class="op">=</span> <span class="kw">new</span> <span class="fn">Pilha</span><span class="op">()</span><span class="op">;</span>
  <span class="kw">for</span> <span class="op">(</span><span class="kw">const</span> <span class="var">c</span> <span class="kw">of</span> <span class="var">expressao</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">if</span> <span class="op">(</span><span class="var">c</span> <span class="op">===</span> <span class="str">'('</span><span class="op">)</span> <span class="var">pilha</span><span class="op">.</span><span class="fn">push</span><span class="op">(</span><span class="var">c</span><span class="op">)</span><span class="op">;</span>
    <span class="kw">else if</span> <span class="op">(</span><span class="var">c</span> <span class="op">===</span> <span class="str">')'</span><span class="op">)</span> <span class="op">{</span>
      <span class="kw">if</span> <span class="op">(</span><span class="var">pilha</span><span class="op">.</span><span class="fn">isEmpty</span><span class="op">()</span><span class="op">)</span> <span class="kw">return</span> <span class="kw">false</span><span class="op">;</span>
      <span class="var">pilha</span><span class="op">.</span><span class="fn">pop</span><span class="op">()</span><span class="op">;</span>
    <span class="op">}</span>
  <span class="op">}</span>
  <span class="kw">return</span> <span class="var">pilha</span><span class="op">.</span><span class="fn">isEmpty</span><span class="op">()</span><span class="op">;</span>
<span class="op">}</span>`,
    quiz: [
      {
        question: 'Qual é o princípio de funcionamento de uma Pilha?',
        options: ['FIFO — First In, First Out', 'LIFO — Last In, First Out', 'FILO — First In, Last Out', 'Random Access'],
        correct: 1,
        explanation: 'Pilhas seguem o LIFO: o último elemento inserido (push) é o primeiro a ser removido (pop).'
      },
      {
        question: 'Qual operação verifica o TOPO da pilha SEM remover o elemento?',
        options: ['pop()', 'push()', 'peek()', 'top()'],
        correct: 2,
        explanation: 'A operação peek() (ou top()) retorna o elemento no topo da pilha sem removê-lo, enquanto pop() remove e retorna.'
      },
      {
        question: 'Qual funcionalidade de editor de texto usa internamente uma Pilha?',
        options: ['Salvar arquivo', 'Busca e substituição', 'Desfazer (Ctrl+Z)', 'Formatação automática'],
        correct: 2,
        explanation: 'Ctrl+Z (desfazer) armazena cada ação em uma pilha. Ao desfazer, a última ação (topo) é removida e revertida.'
      },
    ],
  },

  // ── 4. Filas ──
  {
    id: 'queue',
    title: 'Filas (Queue)',
    subtitle: 'Primeiro a entrar, primeiro a sair',
    icon: '⟹',
    emoji: '🚶',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'Explore a estrutura FIFO e como ela organiza processos e tarefas.',
    duration: '40 min',
    difficulty: 'Básico',
    complexity: {
      access:   'O(n)',
      search:   'O(n)',
      insert:   'O(1)',
      delete:   'O(1)',
      space:    'O(n)',
    },
    theory: `
Uma **fila** (queue) é uma estrutura de dados que segue o princípio **FIFO** — *First In, First Out* (Primeiro a entrar, Primeiro a sair).

### Analogia

Pense em uma fila de banco: quem chega primeiro é atendido primeiro. Novos clientes entram no final, e o próximo a ser atendido sai da frente.

### Operações Fundamentais

| Operação | Descrição | Complexidade |
|---|---|---|
| **enqueue(x)** | Insere x no final da fila | O(1) |
| **dequeue()** | Remove e retorna o elemento do início | O(1) |
| **front()** | Consulta o início sem remover | O(1) |
| **isEmpty()** | Verifica se está vazia | O(1) |

### Tipos de Filas

**Fila simples**: FIFO padrão
**Fila dupla (Deque)**: inserção e remoção em ambas as extremidades
**Fila de prioridade**: elementos com maior prioridade saem primeiro

### Aplicações reais
- **Fila de impressão** em impressoras
- **Gerenciamento de processos** em sistemas operacionais
- **Buffer de dados** em streaming (YouTube, Spotify)
- **BFS** (Busca em Largura) em grafos
- **Filas de mensagens** em sistemas distribuídos (Kafka, RabbitMQ)
    `,
    codeExample: `<span class="kw">class</span> <span class="fn">Fila</span> <span class="op">{</span>
  <span class="fn">constructor</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">itens</span> <span class="op">=</span> <span class="op">[]</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Enfileirar (inserir no final) — O(1)</span>
  <span class="fn">enqueue</span><span class="op">(</span><span class="var">elemento</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="fn">push</span><span class="op">(</span><span class="var">elemento</span><span class="op">)</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Desenfileirar (remover do início) — O(1) amortizado</span>
  <span class="fn">dequeue</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">if</span> <span class="op">(</span><span class="kw">this</span><span class="op">.</span><span class="fn">isEmpty</span><span class="op">()</span><span class="op">)</span> <span class="kw">return</span> <span class="kw">null</span><span class="op">;</span>
    <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="fn">shift</span><span class="op">()</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// Ver o primeiro sem remover — O(1)</span>
  <span class="fn">front</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">[</span><span class="num">0</span><span class="op">]</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="fn">isEmpty</span><span class="op">()</span> <span class="op">{</span> <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="var">length</span> <span class="op">===</span> <span class="num">0</span><span class="op">;</span> <span class="op">}</span>
  <span class="fn">size</span><span class="op">()</span>    <span class="op">{</span> <span class="kw">return</span> <span class="kw">this</span><span class="op">.</span><span class="var">itens</span><span class="op">.</span><span class="var">length</span><span class="op">;</span> <span class="op">}</span>
<span class="op">}</span>

<span class="cmt">// Exemplo: simulação de fila de atendimento</span>
<span class="kw">const</span> <span class="var">fila</span> <span class="op">=</span> <span class="kw">new</span> <span class="fn">Fila</span><span class="op">()</span><span class="op">;</span>
<span class="var">fila</span><span class="op">.</span><span class="fn">enqueue</span><span class="op">(</span><span class="str">'Cliente A'</span><span class="op">)</span><span class="op">;</span>
<span class="var">fila</span><span class="op">.</span><span class="fn">enqueue</span><span class="op">(</span><span class="str">'Cliente B'</span><span class="op">)</span><span class="op">;</span>
<span class="var">fila</span><span class="op">.</span><span class="fn">enqueue</span><span class="op">(</span><span class="str">'Cliente C'</span><span class="op">)</span><span class="op">;</span>

<span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="var">fila</span><span class="op">.</span><span class="fn">dequeue</span><span class="op">()</span><span class="op">)</span><span class="op">;</span> <span class="cmt">// "Cliente A"</span>
<span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="var">fila</span><span class="op">.</span><span class="fn">front</span><span class="op">()</span><span class="op">)</span><span class="op">;</span>   <span class="cmt">// "Cliente B"</span>`,
    quiz: [
      {
        question: 'Qual é o princípio de funcionamento de uma Fila?',
        options: ['LIFO — Last In, First Out', 'FIFO — First In, First Out', 'Aleatório', 'Por prioridade'],
        correct: 1,
        explanation: 'Filas seguem FIFO: o primeiro a entrar é o primeiro a sair, como em uma fila de banco.'
      },
      {
        question: 'Como se chama a operação de INSERIR um elemento em uma fila?',
        options: ['push', 'add', 'enqueue', 'insert'],
        correct: 2,
        explanation: 'A operação padrão de inserção em uma fila é enqueue() (enfileirar), que adiciona no final.'
      },
      {
        question: 'Qual algoritmo de grafos usa internamente uma Fila?',
        options: ['DFS (Busca em Profundidade)', 'BFS (Busca em Largura)', 'Dijkstra', 'Floyd-Warshall'],
        correct: 1,
        explanation: 'BFS (Breadth-First Search) usa uma fila para explorar os vizinhos nível por nível, garantindo a ordem de visitação.'
      },
    ],
  },

  // ── 5. Árvores Binárias ──
  {
    id: 'tree',
    title: 'Árvores Binárias',
    subtitle: 'Hierarquia e divisão eficiente',
    icon: '🌲',
    emoji: '🌳',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    description: 'Descubra como árvores organizam dados de forma hierárquica e eficiente.',
    duration: '65 min',
    difficulty: 'Intermediário',
    complexity: {
      access:   'O(log n)*',
      search:   'O(log n)*',
      insert:   'O(log n)*',
      delete:   'O(log n)*',
      space:    'O(n)',
    },
    theory: `
Uma **árvore binária** é uma estrutura de dados hierárquica onde cada nó tem no máximo **dois filhos**: o filho esquerdo e o filho direito.

### Terminologia

- **Raiz**: o nó do topo (sem pai)
- **Folha**: nó sem filhos
- **Altura**: número de arestas no caminho mais longo da raiz até uma folha
- **Nível**: distância do nó até a raiz
- **Subárvore**: qualquer nó e seus descendentes

### Árvore Binária de Busca (BST)

Em uma BST, para cada nó:
- Todos os valores da **subárvore esquerda** são **menores**
- Todos os valores da **subárvore direita** são **maiores**

Isso permite busca eficiente em O(log n) para árvores balanceadas.

### Travessias

**In-order (Esq → Raiz → Dir)**: retorna os valores em ordem crescente
**Pre-order (Raiz → Esq → Dir)**: usado para cópia da árvore
**Post-order (Esq → Dir → Raiz)**: usado para deletar a árvore

### Aplicações reais
- **Banco de dados** — índices B-tree
- **Sistemas de arquivos** — organização hierárquica
- **Compiladores** — Árvore Sintática Abstrata (AST)
- **Compressão** — Huffman coding
    `,
    codeExample: `<span class="kw">class</span> <span class="fn">No</span> <span class="op">{</span>
  <span class="fn">constructor</span><span class="op">(</span><span class="var">valor</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">valor</span>    <span class="op">=</span> <span class="var">valor</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">esquerda</span> <span class="op">=</span> <span class="kw">null</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">direita</span>  <span class="op">=</span> <span class="kw">null</span><span class="op">;</span>
  <span class="op">}</span>
<span class="op">}</span>

<span class="kw">class</span> <span class="fn">BST</span> <span class="op">{</span>
  <span class="fn">constructor</span><span class="op">()</span> <span class="op">{</span> <span class="kw">this</span><span class="op">.</span><span class="var">raiz</span> <span class="op">=</span> <span class="kw">null</span><span class="op">;</span> <span class="op">}</span>

  <span class="cmt">// Inserir — O(log n) média</span>
  <span class="fn">inserir</span><span class="op">(</span><span class="var">valor</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">const</span> <span class="fn">_ins</span> <span class="op">=</span> <span class="op">(</span><span class="var">no</span><span class="op">,</span> <span class="var">v</span><span class="op">)</span> <span class="op">=&gt;</span> <span class="op">{</span>
      <span class="kw">if</span> <span class="op">(!</span><span class="var">no</span><span class="op">)</span> <span class="kw">return</span> <span class="kw">new</span> <span class="fn">No</span><span class="op">(</span><span class="var">v</span><span class="op">)</span><span class="op">;</span>
      <span class="kw">if</span> <span class="op">(</span><span class="var">v</span> <span class="op">&lt;</span> <span class="var">no</span><span class="op">.</span><span class="var">valor</span><span class="op">)</span>
        <span class="var">no</span><span class="op">.</span><span class="var">esquerda</span> <span class="op">=</span> <span class="fn">_ins</span><span class="op">(</span><span class="var">no</span><span class="op">.</span><span class="var">esquerda</span><span class="op">,</span> <span class="var">v</span><span class="op">)</span><span class="op">;</span>
      <span class="kw">else if</span> <span class="op">(</span><span class="var">v</span> <span class="op">&gt;</span> <span class="var">no</span><span class="op">.</span><span class="var">valor</span><span class="op">)</span>
        <span class="var">no</span><span class="op">.</span><span class="var">direita</span>  <span class="op">=</span> <span class="fn">_ins</span><span class="op">(</span><span class="var">no</span><span class="op">.</span><span class="var">direita</span><span class="op">,</span>  <span class="var">v</span><span class="op">)</span><span class="op">;</span>
      <span class="kw">return</span> <span class="var">no</span><span class="op">;</span>
    <span class="op">}</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">raiz</span> <span class="op">=</span> <span class="fn">_ins</span><span class="op">(</span><span class="kw">this</span><span class="op">.</span><span class="var">raiz</span><span class="op">,</span> <span class="var">valor</span><span class="op">)</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// In-order: visita em ordem crescente</span>
  <span class="fn">inOrder</span><span class="op">(</span><span class="var">no</span> <span class="op">=</span> <span class="kw">this</span><span class="op">.</span><span class="var">raiz</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">if</span> <span class="op">(!</span><span class="var">no</span><span class="op">)</span> <span class="kw">return</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="fn">inOrder</span><span class="op">(</span><span class="var">no</span><span class="op">.</span><span class="var">esquerda</span><span class="op">)</span><span class="op">;</span>
    <span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="var">no</span><span class="op">.</span><span class="var">valor</span><span class="op">)</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="fn">inOrder</span><span class="op">(</span><span class="var">no</span><span class="op">.</span><span class="var">direita</span><span class="op">)</span><span class="op">;</span>
  <span class="op">}</span>
<span class="op">}</span>

<span class="kw">const</span> <span class="var">arvore</span> <span class="op">=</span> <span class="kw">new</span> <span class="fn">BST</span><span class="op">()</span><span class="op">;</span>
<span class="op">[</span><span class="num">50</span><span class="op">,</span><span class="num">30</span><span class="op">,</span><span class="num">70</span><span class="op">,</span><span class="num">20</span><span class="op">,</span><span class="num">40</span><span class="op">,</span><span class="num">60</span><span class="op">,</span><span class="num">80</span><span class="op">]</span><span class="op">.</span><span class="fn">forEach</span><span class="op">(</span><span class="var">v</span> <span class="op">=&gt;</span> <span class="var">arvore</span><span class="op">.</span><span class="fn">inserir</span><span class="op">(</span><span class="var">v</span><span class="op">)</span><span class="op">)</span><span class="op">;</span>
<span class="var">arvore</span><span class="op">.</span><span class="fn">inOrder</span><span class="op">()</span><span class="op">;</span> <span class="cmt">// 20 30 40 50 60 70 80</span>`,
    quiz: [
      {
        question: 'Em uma Árvore Binária de Busca (BST), onde ficam os valores MENORES que a raiz?',
        options: ['Na subárvore direita', 'Na subárvore esquerda', 'Qualquer lado', 'No mesmo nível'],
        correct: 1,
        explanation: 'Em uma BST, valores menores ficam na subárvore esquerda e valores maiores na subárvore direita. Essa propriedade permite busca eficiente.'
      },
      {
        question: 'Qual travessagem retorna os valores de uma BST em ORDEM CRESCENTE?',
        options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
        correct: 2,
        explanation: 'In-order (Esquerda → Raiz → Direita) visita os nós na ordem crescente em uma BST, pois sempre processa a subárvore esquerda (menores) primeiro.'
      },
      {
        question: 'Qual é a complexidade de busca em uma BST BALANCEADA?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correct: 2,
        explanation: 'Em uma BST balanceada, cada comparação elimina metade das possibilidades, resultando em O(log n). No pior caso (árvore degenerada), pode ser O(n).'
      },
    ],
  },

  // ── 6. Grafos ──
  {
    id: 'graph',
    title: 'Grafos',
    subtitle: 'Conexões e redes complexas',
    icon: '◉',
    emoji: '🕸️',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    description: 'Explore a estrutura mais versátil para modelar relações e redes.',
    duration: '75 min',
    difficulty: 'Avançado',
    complexity: {
      access:   'O(V+E)',
      search:   'O(V+E)',
      insert:   'O(1)',
      delete:   'O(E)',
      space:    'O(V+E)',
    },
    theory: `
Um **grafo** é uma estrutura composta por **vértices** (nós) e **arestas** (conexões entre eles). É a estrutura mais versátil para modelar relações complexas.

### Terminologia

- **Vértice (V)**: um nó do grafo
- **Aresta (E)**: conexão entre dois vértices
- **Grau**: número de arestas conectadas a um vértice
- **Caminho**: sequência de vértices conectados por arestas
- **Ciclo**: caminho que começa e termina no mesmo vértice

### Tipos de Grafos

| Tipo | Descrição |
|---|---|
| **Dirigido** | Arestas têm direção (→) |
| **Não-dirigido** | Arestas bidirecionais |
| **Ponderado** | Arestas têm pesos/custos |
| **Acíclico** | Sem ciclos |

### Representações

**Lista de adjacência**: dicionário de listas — eficiente para grafos esparsos
**Matriz de adjacência**: matriz N×N — eficiente para grafos densos

### Algoritmos fundamentais

**BFS** (Busca em Largura): usa fila, encontra caminho mais curto
**DFS** (Busca em Profundidade): usa pilha/recursão, detecta ciclos

### Aplicações reais
- **Redes sociais** — amigos em comum, sugestões
- **GPS/Mapas** — rotas mais curtas (Dijkstra)
- **Internet** — roteamento de pacotes
- **Jogos** — IA de personagens, mapas
    `,
    codeExample: `<span class="kw">class</span> <span class="fn">Grafo</span> <span class="op">{</span>
  <span class="fn">constructor</span><span class="op">()</span> <span class="op">{</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">adjacencia</span> <span class="op">=</span> <span class="kw">new</span> <span class="fn">Map</span><span class="op">()</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="fn">addVertice</span><span class="op">(</span><span class="var">v</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">if</span> <span class="op">(!</span><span class="kw">this</span><span class="op">.</span><span class="var">adjacencia</span><span class="op">.</span><span class="fn">has</span><span class="op">(</span><span class="var">v</span><span class="op">)</span><span class="op">)</span>
      <span class="kw">this</span><span class="op">.</span><span class="var">adjacencia</span><span class="op">.</span><span class="fn">set</span><span class="op">(</span><span class="var">v</span><span class="op">,</span> <span class="op">[]</span><span class="op">)</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="fn">addAresta</span><span class="op">(</span><span class="var">u</span><span class="op">,</span> <span class="var">v</span><span class="op">)</span> <span class="op">{</span> <span class="cmt">// Não-dirigido</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">adjacencia</span><span class="op">.</span><span class="fn">get</span><span class="op">(</span><span class="var">u</span><span class="op">)</span><span class="op">.</span><span class="fn">push</span><span class="op">(</span><span class="var">v</span><span class="op">)</span><span class="op">;</span>
    <span class="kw">this</span><span class="op">.</span><span class="var">adjacencia</span><span class="op">.</span><span class="fn">get</span><span class="op">(</span><span class="var">v</span><span class="op">)</span><span class="op">.</span><span class="fn">push</span><span class="op">(</span><span class="var">u</span><span class="op">)</span><span class="op">;</span>
  <span class="op">}</span>

  <span class="cmt">// BFS — O(V + E)</span>
  <span class="fn">bfs</span><span class="op">(</span><span class="var">inicio</span><span class="op">)</span> <span class="op">{</span>
    <span class="kw">const</span> <span class="var">visitados</span> <span class="op">=</span> <span class="kw">new</span> <span class="fn">Set</span><span class="op">()</span><span class="op">;</span>
    <span class="kw">const</span> <span class="var">fila</span> <span class="op">=</span> <span class="op">[</span><span class="var">inicio</span><span class="op">]</span><span class="op">;</span>
    <span class="var">visitados</span><span class="op">.</span><span class="fn">add</span><span class="op">(</span><span class="var">inicio</span><span class="op">)</span><span class="op">;</span>
    <span class="kw">while</span> <span class="op">(</span><span class="var">fila</span><span class="op">.</span><span class="var">length</span><span class="op">)</span> <span class="op">{</span>
      <span class="kw">const</span> <span class="var">v</span> <span class="op">=</span> <span class="var">fila</span><span class="op">.</span><span class="fn">shift</span><span class="op">()</span><span class="op">;</span>
      <span class="fn">console</span><span class="op">.</span><span class="fn">log</span><span class="op">(</span><span class="var">v</span><span class="op">)</span><span class="op">;</span>
      <span class="kw">for</span> <span class="op">(</span><span class="kw">const</span> <span class="var">viz</span> <span class="kw">of</span> <span class="kw">this</span><span class="op">.</span><span class="var">adjacencia</span><span class="op">.</span><span class="fn">get</span><span class="op">(</span><span class="var">v</span><span class="op">)</span><span class="op">)</span> <span class="op">{</span>
        <span class="kw">if</span> <span class="op">(!</span><span class="var">visitados</span><span class="op">.</span><span class="fn">has</span><span class="op">(</span><span class="var">viz</span><span class="op">)</span><span class="op">)</span> <span class="op">{</span>
          <span class="var">visitados</span><span class="op">.</span><span class="fn">add</span><span class="op">(</span><span class="var">viz</span><span class="op">)</span><span class="op">;</span>
          <span class="var">fila</span><span class="op">.</span><span class="fn">push</span><span class="op">(</span><span class="var">viz</span><span class="op">)</span><span class="op">;</span>
        <span class="op">}</span>
      <span class="op">}</span>
    <span class="op">}</span>
  <span class="op">}</span>
<span class="op">}</span>`,
    quiz: [
      {
        question: 'O que são VÉRTICES em um grafo?',
        options: ['As conexões entre os nós', 'Os nós/pontos do grafo', 'O peso das arestas', 'O caminho mais curto'],
        correct: 1,
        explanation: 'Vértices são os nós (pontos) do grafo. Já arestas são as conexões entre dois vértices.'
      },
      {
        question: 'Qual algoritmo de busca em grafos usa uma FILA internamente?',
        options: ['DFS — Busca em Profundidade', 'Dijkstra', 'BFS — Busca em Largura', 'Bellman-Ford'],
        correct: 2,
        explanation: 'BFS usa uma fila (FIFO) para garantir que os vértices sejam visitados em ordem de distância crescente a partir do vértice inicial.'
      },
      {
        question: 'Qual representação de grafos é mais eficiente para grafos ESPARSOS (poucas arestas)?',
        options: ['Matriz de adjacência', 'Lista de adjacência', 'Matriz de incidência', 'Ambas são iguais'],
        correct: 1,
        explanation: 'A lista de adjacência usa O(V+E) de espaço, ideal para grafos esparsos. A matriz usa O(V²), desperdiçando espaço quando há poucas arestas.'
      },
    ],
  },
];

// ============================================================
//  Data Access Functions
// ============================================================

function initDB() {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(DB_KEYS.MODULE_ACCESS)) {
    localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(DEFAULT_MODULE_ACCESS));
  }
  if (!localStorage.getItem(DB_KEYS.PROGRESS)) {
    localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(DEFAULT_PROGRESS));
  }
  if (!localStorage.getItem(DB_KEYS.ACTIVITY_LOG)) {
    localStorage.setItem(DB_KEYS.ACTIVITY_LOG, JSON.stringify({}));
  }
  if (!localStorage.getItem(DB_KEYS.BANK_QUESTIONS)) {
    localStorage.setItem(DB_KEYS.BANK_QUESTIONS, JSON.stringify(DEFAULT_BANK_QUESTIONS));
  }
  if (!localStorage.getItem(DB_KEYS.BANK_SCORES)) {
    localStorage.setItem(DB_KEYS.BANK_SCORES, JSON.stringify([]));
  }

  // Se o Supabase estiver ativo, inicializa a sincronização em segundo plano
  if (isSupabaseConfigured()) {
    syncFromSupabase();
  }
}

async function syncFromSupabase() {
  if (!isSupabaseConfigured()) return;
  try {
    console.log('🔄 Sincronizando dados com o Supabase...');
    
    // 1. Sincronização de Usuários — via view users_public (sem a coluna password;
    // a tabela users em si só é acessível pela service_role, dentro das Edge Functions).
    let { data: users, error: errUsers } = await supabaseClient.from('users_public').select('*');
    if (errUsers) throw errUsers;

    if (!users || users.length === 0) {
      // Não há mais auto-migração de usuários locais para o Supabase a partir do client:
      // a tabela users só aceita escrita da service_role, e a senha precisa ser gerada como
      // hash no servidor. Rode o script supabase_schema.sql (seção 9) para popular os
      // usuários iniciais diretamente no banco.
      console.warn('⚠️ Nenhum usuário encontrado no Supabase. Rode o seed de supabase_schema.sql no projeto.');
      return;
    }

    // Mapeia users_public (avatar_color) para o formato usado no client (avatarColor)
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      avatarColor: u.avatar_color,
      createdAt: u.created_at,
    }));
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(mappedUsers));
    
    // 2. Acesso aos Módulos
    const { data: access, error: errAccess } = await supabaseClient.from('module_access').select('*');
    if (!errAccess && access) {
      const accessObj = {};
      access.forEach(row => {
        accessObj[row.student_id] = row.module_ids;
      });
      localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(accessObj));
    }
    
    // 3. Progresso
    const { data: progress, error: errProgress } = await supabaseClient.from('progress').select('*');
    if (!errProgress && progress) {
      const progressObj = {};
      progress.forEach(row => {
        if (!progressObj[row.student_id]) progressObj[row.student_id] = {};
        progressObj[row.student_id][row.module_id] = {
          started: row.started,
          startedAt: row.started_at,
          completed: row.completed,
          completedAt: row.completed_at,
          score: row.score
        };
      });
      localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(progressObj));
    }

    // 4. Logs de Atividades
    const { data: logs, error: errLogs } = await supabaseClient.from('activity_log').select('*').order('timestamp', { ascending: false });
    if (!errLogs && logs) {
      const logsObj = {};
      logs.forEach(row => {
        if (!logsObj[row.student_id]) logsObj[row.student_id] = [];
        logsObj[row.student_id].push({
          message: row.message,
          timestamp: row.timestamp
        });
      });
      localStorage.setItem(DB_KEYS.ACTIVITY_LOG, JSON.stringify(logsObj));
    }

    // 5. Atividades Personalizadas
    const { data: activities, error: errActivities } = await supabaseClient.from('activities').select('*');
    if (!errActivities && activities) {
      localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(activities));
    }

    // 6. Respostas dos Exercícios
    const { data: answers, error: errAnswers } = await supabaseClient.from('student_answers').select('*');
    if (!errAnswers && answers) {
      const answersObj = {};
      answers.forEach(row => {
        if (!answersObj[row.student_id]) answersObj[row.student_id] = {};
        if (!answersObj[row.student_id][row.activity_id]) answersObj[row.student_id][row.activity_id] = {};
        answersObj[row.student_id][row.activity_id][row.question_id] = row.answer_data;
      });
      localStorage.setItem(DB_KEYS.STUDENT_ANSWERS, JSON.stringify(answersObj));
    }

    // 6.5. Módulos Personalizados
    const { data: remoteModules, error: errRemoteModules } = await supabaseClient.from('modules').select('*');
    if (!errRemoteModules && remoteModules) {
      const mappedModules = remoteModules.map(rm => ({
        id: rm.id,
        title: rm.title,
        subtitle: rm.subtitle,
        icon: rm.icon,
        emoji: rm.emoji,
        color: rm.color,
        gradient: rm.gradient,
        description: rm.description,
        duration: rm.duration,
        difficulty: rm.difficulty,
        complexity: rm.complexity,
        theory: rm.theory,
        codeExample: rm.code_example,
        quiz: rm.quiz,
        video: rm.video || {}
      }));
      localStorage.setItem('ep_custom_modules', JSON.stringify(mappedModules));
    }

    // 6.6. Banco de Questões
    const { data: remoteQuestions, error: errRemoteQuestions } = await supabaseClient.from('bank_questions').select('*');
    if (!errRemoteQuestions && remoteQuestions) {
      localStorage.setItem(DB_KEYS.BANK_QUESTIONS, JSON.stringify(remoteQuestions));
    } else if (errRemoteQuestions) {
      console.error('Erro ao buscar bank_questions:', errRemoteQuestions);
    }

    // 6.7. Pontuações do Banco de Questões
    const { data: remoteScores, error: errRemoteScores } = await supabaseClient.from('student_bank_scores').select('*');
    if (!errRemoteScores && remoteScores) {
      localStorage.setItem(DB_KEYS.BANK_SCORES, JSON.stringify(remoteScores));
    } else if (errRemoteScores) {
      console.error('Erro ao buscar student_bank_scores:', errRemoteScores);
    }

    // 7. Configurações
    const { data: settings, error: errSettings } = await supabaseClient.from('settings').select('*');
    if (!errSettings && settings) {
      const generalSettings = settings.find(s => s.key === 'general');
      if (generalSettings) {
        localStorage.setItem('ep_settings', JSON.stringify(generalSettings.value));
      }
    }

    console.log('✅ Dados sincronizados do Supabase para o LocalStorage.');
    document.dispatchEvent(new CustomEvent('supabaseSynced'));
  } catch (error) {
    console.error('❌ Falha ao sincronizar dados com o Supabase:', error);
  }
}

// ── Users ──
function getUsers() {
  return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
}

function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email === email) || null;
}

function getStudents() {
  return getUsers().filter(u => u.role === 'student');
}

async function addStudent({ name, email, password, avatarColor }) {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'E-mail já cadastrado.' };
  }

  // Com Supabase configurado, a criação (e o hash da senha) é feita pela Edge Function
  // "add-student", que valida que quem está chamando é de fato o professor autenticado.
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('add-student', { name, email, password, avatarColor });
    if (!result.ok) return { ok: false, error: result.error };
    const newUser = result.data.user;
    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    const access = getModuleAccess();
    access[newUser.id] = [];
    localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(access));
    const progress = getAllProgress();
    progress[newUser.id] = {};
    localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(progress));
    return { ok: true, user: newUser };
  }

  // Modo local/offline: mantém o comportamento anterior (senha em texto puro só no localStorage).
  const initials = name.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  const newUser = {
    id: 'student_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || '1234',
    role: 'student',
    avatar: initials || 'AL',
    avatarColor: avatarColor || '#6366f1',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  const access = getModuleAccess();
  access[newUser.id] = [];
  localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(access));
  const progress = getAllProgress();
  progress[newUser.id] = {};
  localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(progress));

  return { ok: true, user: newUser };
}

async function removeStudent(studentId) {
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('remove-student', { studentId });
    if (!result.ok) {
      showToast(`❌ ${result.error}`, 'error');
      return { ok: false, error: result.error };
    }
  }

  let users = getUsers();
  users = users.filter(u => u.id !== studentId);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  // Clean up related data
  const access = getModuleAccess();
  delete access[studentId];
  localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(access));
  const progress = getAllProgress();
  delete progress[studentId];
  localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(progress));
  const log = getActivityLog();
  delete log[studentId];
  localStorage.setItem(DB_KEYS.ACTIVITY_LOG, JSON.stringify(log));
  const answers = JSON.parse(localStorage.getItem(DB_KEYS.STUDENT_ANSWERS) || '{}');
  delete answers[studentId];
  localStorage.setItem(DB_KEYS.STUDENT_ANSWERS, JSON.stringify(answers));

  return { ok: true };
}

async function updateStudent(studentId, { name, email, password, avatarColor }) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === studentId);
  if (idx === -1) return { ok: false, error: 'Aluno não encontrado.' };
  const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== studentId);
  if (duplicate) return { ok: false, error: 'E-mail já cadastrado por outro usuário.' };

  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('update-student', { studentId, name, email, password, avatarColor });
    if (!result.ok) return { ok: false, error: result.error };
  }

  const initials = name.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  users[idx] = {
    ...users[idx],
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: isSupabaseConfigured() ? users[idx].password : (password || users[idx].password),
    avatar: initials || users[idx].avatar,
    avatarColor: avatarColor || users[idx].avatarColor,
  };
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

  return { ok: true, user: users[idx] };
}

// ── Edge Functions (validação server-side quando o Supabase está configurado) ──
// Retorna { ok, data } ou { ok:false, error }. O token de sessão (quando existir) é
// injetado automaticamente no corpo da chamada.
async function callEdgeFunction(name, body = {}) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Supabase não configurado.' };
  const session = getSession();
  try {
    const { data, error } = await supabaseClient.functions.invoke(name, {
      body: { token: session?.token, ...body },
    });
    if (error) return { ok: false, error: error.message || 'Erro na chamada ao servidor.' };
    if (data && data.error) return { ok: false, error: data.error };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message || 'Erro de rede.' };
  }
}

// ── Session ──
// Quando o Supabase está configurado, a sessão inclui um "token" emitido pela
// Edge Function "login" — é ele que as demais Edge Functions usam para identificar
// o usuário no servidor (impede forjar sessão só editando o localStorage).
// Sem Supabase configurado (modo local/offline), a sessão não tem token e as
// operações sensíveis seguem validando apenas no client, como antes.
function setSession(user, token, expiresAt) {
  localStorage.setItem(DB_KEYS.SESSION, JSON.stringify({
    userId: user.id,
    role: user.role,
    name: user.name,
    token: token || null,
    expiresAt: expiresAt || null,
  }));
}

function getSession() {
  const s = localStorage.getItem(DB_KEYS.SESSION);
  if (!s) return null;
  const session = JSON.parse(s);
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
    clearSession();
    return null;
  }
  return session;
}

function clearSession() {
  localStorage.removeItem(DB_KEYS.SESSION);
}

// ── Module Access ──
function getModuleAccess() {
  return JSON.parse(localStorage.getItem(DB_KEYS.MODULE_ACCESS) || '{}');
}

function getStudentModuleAccess(studentId) {
  const access = getModuleAccess();
  return access[studentId] || [];
}

async function setStudentModuleAccess(studentId, moduleIds) {
  const access = getModuleAccess();
  access[studentId] = moduleIds;
  localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(access));

  // A escrita real (quando o Supabase está configurado) só é aceita pela Edge Function
  // "set-module-access", que exige uma sessão de professor válida — a policy de RLS
  // bloqueia escrita direta nessa tabela pela anon key.
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('set-module-access', { studentId, moduleIds });
    if (!result.ok) {
      console.error('Erro ao salvar module_access no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar o acesso: ${result.error}`, 'error');
    }
  }
}

async function syncSettingsToSupabase(settings) {
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('save-settings', { settings });
    if (!result.ok) {
      console.error('Erro ao salvar configurações no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar as configurações: ${result.error}`, 'error');
    }
  }
}

function toggleModuleAccess(studentId, moduleId) {
  const access = getStudentModuleAccess(studentId);
  const idx = access.indexOf(moduleId);
  if (idx === -1) {
    access.push(moduleId);
    logActivity(studentId, `Módulo "${getModuleById(moduleId)?.title}" liberado pelo professor`);
  } else {
    access.splice(idx, 1);
  }
  setStudentModuleAccess(studentId, access);
  return access;
}

function isModuleUnlocked(studentId, moduleId) {
  return getStudentModuleAccess(studentId).includes(moduleId);
}

// ── Progress ──
function getAllProgress() {
  return JSON.parse(localStorage.getItem(DB_KEYS.PROGRESS) || '{}');
}

function getStudentProgress(studentId) {
  const all = getAllProgress();
  return all[studentId] || {};
}

async function setModuleProgress(studentId, moduleId, data) {
  const all = getAllProgress();
  if (!all[studentId]) all[studentId] = {};
  all[studentId][moduleId] = { ...all[studentId][moduleId], ...data };
  localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(all));

  // A escrita real (quando o Supabase está configurado) só é aceita pela Edge Function
  // "save-progress", que grava progresso apenas do aluno autenticado (identificado pelo
  // token de sessão) — impede que um aluno grave/forje nota de outro aluno via console.
  if (isSupabaseConfigured()) {
    const currentModule = all[studentId][moduleId];
    const result = await callEdgeFunction('save-progress', {
      moduleId,
      started: currentModule.started || false,
      completed: currentModule.completed || false,
      score: currentModule.score || 0,
    });
    if (!result.ok) {
      console.error('Erro ao salvar progresso no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar o progresso: ${result.error}`, 'error');
    }
  }
}

function markModuleComplete(studentId, moduleId, score) {
  setModuleProgress(studentId, moduleId, {
    completed: true,
    score: score,
    completedAt: new Date().toISOString(),
  });
  logActivity(studentId, `Módulo "${getModuleById(moduleId)?.title}" concluído com ${score}% de acerto`);
}

function markModuleStarted(studentId, moduleId) {
  const progress = getStudentProgress(studentId);
  if (!progress[moduleId]?.completed) {
    setModuleProgress(studentId, moduleId, {
      started: true,
      startedAt: new Date().toISOString(),
    });
  }
  // Update last access
  const all = getAllProgress();
  if (!all[studentId]) all[studentId] = {};
  all[studentId]._lastAccess = new Date().toISOString();
  localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(all));
}

// ── Activity Log ──
function getActivityLog() {
  return JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITY_LOG) || '{}');
}

async function logActivity(studentId, message) {
  const timestamp = new Date().toISOString();
  const log = getActivityLog();
  if (!log[studentId]) log[studentId] = [];
  log[studentId].unshift({
    message,
    timestamp,
  });
  // Keep only last 50 entries
  if (log[studentId].length > 50) log[studentId] = log[studentId].slice(0, 50);
  localStorage.setItem(DB_KEYS.ACTIVITY_LOG, JSON.stringify(log));

  // A escrita real (quando o Supabase está configurado) só é aceita pela Edge Function
  // "log-activity" — alunos só logam pra si mesmos, professores podem logar pra qualquer aluno.
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('log-activity', { studentId, message });
    if (!result.ok) {
      console.error('Erro ao registrar log no Supabase:', result.error);
    }
  }
}

// ── Activities ──
function getActivities() {
  return JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITIES) || '[]');
}

async function saveActivity(activity) {
  const activities = getActivities();
  activities.push(activity);
  localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(activities));

  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('save-activity', { activity });
    if (!result.ok) {
      console.error('Erro ao salvar atividade no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar a atividade: ${result.error}`, 'error');
    }
  }
}

async function deleteActivity(id) {
  let activities = getActivities();
  activities = activities.filter(act => act.id !== id);
  localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(activities));

  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('delete-activity', { activityId: id });
    if (!result.ok) {
      console.error('Erro ao deletar atividade no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar a exclusão: ${result.error}`, 'error');
    }
  }
}

function getStudentAnswers(studentId) {
  const all = JSON.parse(localStorage.getItem(DB_KEYS.STUDENT_ANSWERS) || '{}');
  return all[studentId] || {};
}

async function saveStudentAnswer(studentId, activityId, questionId, answerData) {
  const all = JSON.parse(localStorage.getItem(DB_KEYS.STUDENT_ANSWERS) || '{}');
  if (!all[studentId]) all[studentId] = {};
  if (!all[studentId][activityId]) all[studentId][activityId] = {};
  all[studentId][activityId][questionId] = answerData;
  localStorage.setItem(DB_KEYS.STUDENT_ANSWERS, JSON.stringify(all));

  // A escrita real (quando o Supabase está configurado) só é aceita pela Edge Function
  // "save-student-answer", que grava resposta apenas do aluno autenticado (via token).
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('save-student-answer', { activityId, questionId, answerData });
    if (!result.ok) {
      console.error('Erro ao salvar resposta no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar a resposta: ${result.error}`, 'error');
    }
  }
}

function getStudentActivityScore(studentId, activityId) {
  const answers = getStudentAnswers(studentId)[activityId] || {};
  const activity = getActivities().find(act => act.id === activityId);
  if (!activity || !activity.questions.length) return 0;
  
  let correctCount = 0;
  activity.questions.forEach(q => {
    const ans = answers[q.id];
    if (!ans) return;
    if (q.type === 'theoretical') {
      if (q.subtype === 'multiple' && parseInt(ans.chosen) === parseInt(q.correct)) {
        correctCount++;
      } else if (q.subtype === 'text' && ans.text.trim().toLowerCase() === q.correctText.trim().toLowerCase()) {
        correctCount++;
      }
    } else if (q.type === 'practical') {
      if (ans.correct) {
        correctCount++;
      }
    }
  });
  return Math.round((correctCount / activity.questions.length) * 100);
}

// ── Modules ──
function getCustomModules() {
  return JSON.parse(localStorage.getItem('ep_custom_modules') || '[]');
}

function getModules() {
  const custom = getCustomModules();
  const defaultFiltered = MODULES.filter(dm => !custom.some(cm => cm.id === dm.id));
  return [...defaultFiltered, ...custom];
}

function getModuleById(id) {
  return getModules().find(m => m.id === id) || null;
}

async function saveCustomModule(module) {
  const custom = getCustomModules();
  const idx = custom.findIndex(m => m.id === module.id);
  if (idx !== -1) {
    custom[idx] = module;
  } else {
    custom.push(module);
  }
  localStorage.setItem('ep_custom_modules', JSON.stringify(custom));

  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('save-module', { module });
    if (!result.ok) {
      console.error('Erro ao sincronizar módulo no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar o módulo: ${result.error}`, 'error');
    }
  }
}

async function deleteCustomModule(id) {
  let custom = getCustomModules();
  custom = custom.filter(m => m.id !== id);
  localStorage.setItem('ep_custom_modules', JSON.stringify(custom));

  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('delete-module', { moduleId: id });
    if (!result.ok) {
      console.error('Erro ao deletar módulo no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar a exclusão: ${result.error}`, 'error');
    }
  }
}

// ── Stats ──
function getStudentStats(studentId) {
  const progress = getStudentProgress(studentId);
  const access = getStudentModuleAccess(studentId);
  const total = MODULES.length;
  const unlocked = access.length;
  const completed = Object.values(progress).filter(p => p.completed).length;
  const avgScore = completed > 0
    ? Math.round(Object.values(progress).filter(p => p.completed).reduce((a, p) => a + (p.score || 0), 0) / completed)
    : 0;
  const lastAccess = progress._lastAccess || null;
  return { total, unlocked, completed, avgScore, lastAccess };
}

function getOverallStats() {
  const students = getStudents();
  const totalStudents = students.length;
  const allProgress = getAllProgress();
  let totalCompletions = 0;
  students.forEach(s => {
    const prog = allProgress[s.id] || {};
    totalCompletions += Object.values(prog).filter(p => p && p.completed).length;
  });
  const avgCompletionRate = totalStudents > 0
    ? Math.round((totalCompletions / (totalStudents * MODULES.length)) * 100)
    : 0;
  return { totalStudents, totalCompletions, avgCompletionRate, totalModules: MODULES.length };
}

// ── Banco de Questões (Helpers) ──
function getBankQuestions() {
  return JSON.parse(localStorage.getItem(DB_KEYS.BANK_QUESTIONS) || '[]');
}

function getBankQuestionsByModule(moduleId) {
  return getBankQuestions().filter(q => q.module_id === moduleId);
}

function getBankScores() {
  return JSON.parse(localStorage.getItem(DB_KEYS.BANK_SCORES) || '[]');
}

function getStudentBankScores(studentId) {
  return getBankScores().filter(s => s.student_id === studentId);
}

async function saveBankQuestion(question) {
  const questions = getBankQuestions();
  const idx = questions.findIndex(q => q.id === question.id);
  if (idx !== -1) {
    questions[idx] = question;
  } else {
    questions.push(question);
  }
  localStorage.setItem(DB_KEYS.BANK_QUESTIONS, JSON.stringify(questions));

  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('save-bank-question', { question });
    if (!result.ok) {
      console.error('Erro ao sincronizar questão no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar a questão: ${result.error}`, 'error');
    }
  }
}

async function deleteBankQuestion(id) {
  let questions = getBankQuestions();
  questions = questions.filter(q => q.id !== id);
  localStorage.setItem(DB_KEYS.BANK_QUESTIONS, JSON.stringify(questions));

  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('delete-bank-question', { questionId: id });
    if (!result.ok) {
      console.error('Erro ao deletar questão no Supabase:', result.error);
      if (typeof showToast === 'function') showToast(`⚠️ Não foi possível sincronizar a exclusão: ${result.error}`, 'error');
    }
  }
}

async function saveStudentBankScore(scoreData) {
  const scores = getBankScores();
  scores.push(scoreData);
  localStorage.setItem(DB_KEYS.BANK_SCORES, JSON.stringify(scores));

  // A escrita real (quando o Supabase está configurado) só é aceita pela Edge Function
  // "save-bank-score", que grava a pontuação apenas do aluno autenticado (via token).
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('save-bank-score', {
      id: scoreData.id,
      moduleId: scoreData.module_id,
      score: scoreData.score,
      totalQuestions: scoreData.total_questions,
      correctAnswers: scoreData.correct_answers,
    });
    if (!result.ok) {
      console.error('Erro ao sincronizar score do aluno no Supabase:', result.error);
    }
  }
}
