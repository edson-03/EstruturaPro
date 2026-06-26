# ⚡ EstruturaPRO

> **Plataforma interativa de ensino de Estrutura de Dados com visualizações animadas, exercícios práticos e painel do professor.**

---

## 📋 Sobre o Projeto

O **EstruturaPRO** é uma aplicação web educacional desenvolvida para facilitar o aprendizado de **Estrutura de Dados** de forma visual e interativa. A plataforma oferece visualizações animadas de algoritmos e estruturas, exercícios práticos e um painel completo para professores gerenciarem turmas e acompanharem o desempenho dos alunos.

---

## 🚀 Funcionalidades

### 👨‍🎓 Aluno
- Login com perfil de aluno
- Visualizações animadas de estruturas de dados (pilha, fila, lista, árvore, grafos, etc.)
- Exercícios interativos com correção automática
- Acompanhamento do progresso pessoal

### 👨‍🏫 Professor
- Login com perfil de professor
- Painel de controle com visão geral da turma
- Gerenciamento de alunos e exercícios
- Relatórios de desempenho detalhados

---

## 🗂️ Estrutura do Projeto

```
Projeto de Estrutura/
│
├── index.html          # Página de login (seleção de perfil)
├── student.html        # Painel do aluno
├── teacher.html        # Painel do professor
│
├── css/
│   ├── global.css      # Estilos globais e design system
│   ├── login.css       # Estilos da página de login
│   ├── student.css     # Estilos do painel do aluno
│   └── teacher.css     # Estilos do painel do professor
│
└── js/
    ├── auth.js         # Autenticação e controle de sessão
    ├── data.js         # Dados da aplicação (estruturas, exercícios)
    ├── student.js      # Lógica do painel do aluno
    ├── teacher.js      # Lógica do painel do professor
    └── visualizer.js   # Motor de visualizações animadas
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|-----------|-----|
| **HTML5** | Estrutura semântica das páginas |
| **CSS3** | Estilização, animações e layout responsivo |
| **JavaScript (Vanilla)** | Lógica da aplicação, visualizações e interatividade |

> Projeto 100% front-end, sem dependências externas ou frameworks — roda diretamente no navegador.

---

## ▶️ Como Executar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/estruturapro.git
   ```

2. **Acesse a pasta do projeto:**
   ```bash
   cd estruturapro
   ```

3. **Abra o arquivo `index.html`** no seu navegador preferido, ou utilize a extensão **Live Server** do VS Code para uma melhor experiência de desenvolvimento.

---

## 🌐 Páginas

| Página | Descrição |
|--------|-----------|
| `index.html` | Tela de login com seleção de perfil (Aluno / Professor) |
| `student.html` | Ambiente de aprendizado do aluno |
| `teacher.html` | Painel administrativo do professor |

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

Feito com ❤️ para tornar o aprendizado de Estrutura de Dados mais visual e acessível.

</div>
