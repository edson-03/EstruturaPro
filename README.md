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
- Acompanhamento do progresso pessoal, ranking, pontuação e conquistas

### 👨‍🏫 Professor
- Login com perfil de professor
- Painel de controle com visão geral da turma (número de alunos, taxa de conclusão média, etc.)
- Gerenciamento de acessos e liberação manual de módulos e atividades
- **Novo: Página de Desempenho Completo**: Análise individual de progresso, taxa de acerto e tentativas de quiz, conquistas (badges) desbloqueadas, ranking da turma e linha do tempo de atividades de cada aluno.
- **Novo: Configurações Gerais do Sistema**:
  - **Geral**: Dados da instituição, disciplina, professor e período letivo.
  - **Plataforma**: Nota mínima, liberação automática de módulos, gabaritos e modo manutenção.
  - **Segurança**: Alteração de senha com medidor de força, política de senha dos alunos e logs.
  - **Pontuação**: Edição das regras de pontuação (pesos de início/fim de módulos, quizzes e atividades).
  - **Aparência**: Personalização da cor de destaque (hexadecimal/paleta), nome, tagline e ícone do sistema com preview ao vivo.
  - **Exportação e PDF**: Geração de relatórios completos em formato PDF (pronto para imprimir), planilhas em CSV, textos em TXT e backup completo em JSON.
  - **Zona de Perigo Protegida**: Operações destrutivas (limpar dados, apagar atividades ou resetar sistema) exigem confirmação segura por modal com a senha atual do professor.

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
