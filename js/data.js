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
};

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

  // Se o Supabase estiver ativo, inicializa a sincronização em segundo plano
  if (isSupabaseConfigured()) {
    syncFromSupabase();
  }
}

async function syncFromSupabase() {
  if (!isSupabaseConfigured()) return;
  try {
    console.log('🔄 Sincronizando dados com o Supabase...');
    
    // 1. Sincronização de Usuários
    let { data: users, error: errUsers } = await supabaseClient.from('users').select('*');
    if (errUsers) throw errUsers;

    // Se o banco remoto estiver vazio, fazer upload dos dados locais (Auto-migração)
    if (!users || users.length === 0) {
      console.log('📤 Banco Supabase vazio detectado. Exportando dados locais para o banco remoto...');
      const localUsers = getUsers();
      const { error: errPushUsers } = await supabaseClient.from('users').insert(
        localUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          avatar: u.avatar,
          avatar_color: u.avatarColor,
          created_at: u.createdAt || new Date().toISOString()
        }))
      );
      if (errPushUsers) console.error('Erro ao inicializar usuários no Supabase:', errPushUsers);

      const localAccess = getModuleAccess();
      const accessArray = Object.keys(localAccess).map(studentId => ({
        student_id: studentId,
        module_ids: localAccess[studentId]
      }));
      if (accessArray.length > 0) {
        await supabaseClient.from('module_access').insert(accessArray);
      }

      const localProgress = getAllProgress();
      const progressArray = [];
      Object.keys(localProgress).forEach(studentId => {
        if (studentId === '_lastAccess') return;
        Object.keys(localProgress[studentId]).forEach(moduleId => {
          const m = localProgress[studentId][moduleId];
          progressArray.push({
            student_id: studentId,
            module_id: moduleId,
            started: m.started || false,
            started_at: m.startedAt || null,
            completed: m.completed || false,
            completed_at: m.completedAt || null,
            score: m.score || 0
          });
        });
      });
      if (progressArray.length > 0) {
        await supabaseClient.from('progress').insert(progressArray);
      }

      const savedSettings = localStorage.getItem('ep_settings');
      if (savedSettings) {
        await supabaseClient.from('settings').upsert({
          key: 'general',
          value: JSON.parse(savedSettings)
        });
      }

      console.log('✅ Banco Supabase inicializado com dados locais.');
      return;
    }

    // Se o banco remoto já tem dados, sobrescreve o cache local com os dados remotos
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    
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
        quiz: rm.quiz
      }));
      localStorage.setItem('ep_custom_modules', JSON.stringify(mappedModules));
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

function addStudent({ name, email, password, avatarColor }) {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'E-mail já cadastrado.' };
  }
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
  // Init empty access & progress
  const access = getModuleAccess();
  access[newUser.id] = [];
  localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(access));
  const progress = getAllProgress();
  progress[newUser.id] = {};
  localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(progress));

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('users').insert({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      avatar: newUser.avatar,
      avatar_color: newUser.avatarColor,
      created_at: newUser.createdAt
    }).then(({ error }) => {
      if (error) console.error('Erro ao sincronizar usuário no Supabase:', error);
    });
    supabaseClient.from('module_access').insert({
      student_id: newUser.id,
      module_ids: []
    }).then(({ error }) => {
      if (error) console.error('Erro ao sincronizar module_access no Supabase:', error);
    });
  }

  return { ok: true, user: newUser };
}

function removeStudent(studentId) {
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

  // Sync para o Supabase (ON DELETE CASCADE lidará com as tabelas filhas)
  if (isSupabaseConfigured()) {
    supabaseClient.from('users').delete().eq('id', studentId).then(({ error }) => {
      if (error) console.error('Erro ao remover usuário no Supabase:', error);
    });
  }
}

function updateStudent(studentId, { name, email, password, avatarColor }) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === studentId);
  if (idx === -1) return { ok: false, error: 'Aluno não encontrado.' };
  const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== studentId);
  if (duplicate) return { ok: false, error: 'E-mail já cadastrado por outro usuário.' };
  const initials = name.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  users[idx] = {
    ...users[idx],
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || users[idx].password,
    avatar: initials || users[idx].avatar,
    avatarColor: avatarColor || users[idx].avatarColor,
  };
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('users').update({
      name: users[idx].name,
      email: users[idx].email,
      password: users[idx].password,
      avatar: users[idx].avatar,
      avatar_color: users[idx].avatarColor
    }).eq('id', studentId).then(({ error }) => {
      if (error) console.error('Erro ao atualizar usuário no Supabase:', error);
    });
  }

  return { ok: true, user: users[idx] };
}

// ── Session ──
function setSession(user) {
  localStorage.setItem(DB_KEYS.SESSION, JSON.stringify({ userId: user.id, role: user.role, name: user.name }));
}

function getSession() {
  const s = localStorage.getItem(DB_KEYS.SESSION);
  return s ? JSON.parse(s) : null;
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

function setStudentModuleAccess(studentId, moduleIds) {
  const access = getModuleAccess();
  access[studentId] = moduleIds;
  localStorage.setItem(DB_KEYS.MODULE_ACCESS, JSON.stringify(access));

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('module_access').upsert({
      student_id: studentId,
      module_ids: moduleIds
    }).then(({ error }) => {
      if (error) console.error('Erro ao salvar module_access no Supabase:', error);
    });
  }
}

function syncSettingsToSupabase(settings) {
  if (isSupabaseConfigured()) {
    supabaseClient.from('settings').upsert({
      key: 'general',
      value: settings
    }).then(({ error }) => {
      if (error) console.error('Erro ao salvar configurações no Supabase:', error);
    });
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

function setModuleProgress(studentId, moduleId, data) {
  const all = getAllProgress();
  if (!all[studentId]) all[studentId] = {};
  all[studentId][moduleId] = { ...all[studentId][moduleId], ...data };
  localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify(all));

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    const currentModule = all[studentId][moduleId];
    supabaseClient.from('progress').upsert({
      student_id: studentId,
      module_id: moduleId,
      started: currentModule.started || false,
      started_at: currentModule.startedAt || null,
      completed: currentModule.completed || false,
      completed_at: currentModule.completedAt || null,
      score: currentModule.score || 0
    }).then(({ error }) => {
      if (error) console.error('Erro ao salvar progresso no Supabase:', error);
    });
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

function logActivity(studentId, message) {
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

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('activity_log').insert({
      student_id: studentId,
      message,
      timestamp
    }).then(({ error }) => {
      if (error) console.error('Erro ao registrar log no Supabase:', error);
    });
  }
}

// ── Activities ──
function getActivities() {
  return JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITIES) || '[]');
}

function saveActivity(activity) {
  const activities = getActivities();
  activities.push(activity);
  localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(activities));

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('activities').insert({
      id: activity.id,
      title: activity.title,
      description: activity.description || '',
      created_by: activity.createdBy || 'teacher1',
      questions: activity.questions,
      created_at: activity.createdAt || new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.error('Erro ao salvar atividade no Supabase:', error);
    });
  }
}

function deleteActivity(id) {
  let activities = getActivities();
  activities = activities.filter(act => act.id !== id);
  localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(activities));

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('activities').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Erro ao deletar atividade no Supabase:', error);
    });
  }
}

function getStudentAnswers(studentId) {
  const all = JSON.parse(localStorage.getItem(DB_KEYS.STUDENT_ANSWERS) || '{}');
  return all[studentId] || {};
}

function saveStudentAnswer(studentId, activityId, questionId, answerData) {
  const all = JSON.parse(localStorage.getItem(DB_KEYS.STUDENT_ANSWERS) || '{}');
  if (!all[studentId]) all[studentId] = {};
  if (!all[studentId][activityId]) all[studentId][activityId] = {};
  all[studentId][activityId][questionId] = answerData;
  localStorage.setItem(DB_KEYS.STUDENT_ANSWERS, JSON.stringify(all));

  // Sync para o Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('student_answers').upsert({
      student_id: studentId,
      activity_id: activityId,
      question_id: questionId,
      answer_data: answerData,
      updated_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.error('Erro ao salvar resposta no Supabase:', error);
    });
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

function saveCustomModule(module) {
  const custom = getCustomModules();
  const idx = custom.findIndex(m => m.id === module.id);
  if (idx !== -1) {
    custom[idx] = module;
  } else {
    custom.push(module);
  }
  localStorage.setItem('ep_custom_modules', JSON.stringify(custom));

  // Sync to Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('modules').upsert({
      id: module.id,
      title: module.title,
      subtitle: module.subtitle || '',
      icon: module.icon || '',
      emoji: module.emoji || '',
      color: module.color || '',
      gradient: module.gradient || '',
      description: module.description || '',
      duration: module.duration || '',
      difficulty: module.difficulty || '',
      complexity: module.complexity || {},
      theory: module.theory || '',
      code_example: module.codeExample || '',
      quiz: module.quiz || []
    }).then(({ error }) => {
      if (error) console.error('Erro ao sincronizar módulo no Supabase:', error);
    });
  }
}

function deleteCustomModule(id) {
  let custom = getCustomModules();
  custom = custom.filter(m => m.id !== id);
  localStorage.setItem('ep_custom_modules', JSON.stringify(custom));

  // Sync to Supabase
  if (isSupabaseConfigured()) {
    supabaseClient.from('modules').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Erro ao deletar módulo no Supabase:', error);
    });
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
