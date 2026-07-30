-- ============================================================
--  EstruturaPRO — Supabase Database Schema
-- ============================================================
-- Execute este script no SQL Editor do seu painel do Supabase
-- para configurar a estrutura de tabelas necessária.

-- ── 1. LIMPAR ESTRUTURA EXISTENTE (Opcional, use com cautela) ──
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS student_answers CASCADE;
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS activity_log CASCADE;
-- DROP TABLE IF EXISTS progress CASCADE;
-- DROP TABLE IF EXISTS module_access CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS bank_questions CASCADE;
-- DROP TABLE IF EXISTS student_bank_scores CASCADE;

-- ── 1.5. EXTENSÃO PARA HASH DE SENHA (bcrypt via pgcrypto) ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 2. TABELA DE USUÁRIOS (users) ──
-- A coluna "password" armazena um hash bcrypt (via pgcrypto/crypt), nunca texto puro.
-- Só a service_role (usada pelas Edge Functions de login/troca de senha) lê/escreve nesta tabela;
-- o client público lê a view "users_public" (sem a coluna password) — ver seção 14.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    avatar TEXT,
    avatar_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 2.5. TABELA DE SESSÕES (tokens emitidos pela Edge Function "login") ──
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ── 3. TABELA DE ACESSO AOS MÓDULOS (module_access) ──
CREATE TABLE IF NOT EXISTS module_access (
    student_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    module_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- ── 4. TABELA DE PROGRESSO (progress) ──
CREATE TABLE IF NOT EXISTS progress (
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    started BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    PRIMARY KEY (student_id, module_id)
);

-- ── 5. TABELA DE LOG DE ATIVIDADES (activity_log) ──
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 6. TABELA DE ATIVIDADES DO PROFESSOR (activities) ──
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 7. TABELA DE RESPOSTAS DOS ALUNOS (student_answers) ──
CREATE TABLE IF NOT EXISTS student_answers (
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    answer_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (student_id, activity_id, question_id)
);

-- ── 7.5. TABELA DE MÓDULOS DE AULA (modules) ──
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    icon TEXT,
    emoji TEXT,
    color TEXT,
    gradient TEXT,
    description TEXT,
    duration TEXT,
    difficulty TEXT,
    complexity JSONB NOT NULL DEFAULT '{}'::jsonb,
    theory TEXT,
    code_example TEXT,
    quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
    video JSONB NOT NULL DEFAULT '{}'::jsonb, -- { url, autoplay }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 8. TABELA DE CONFIGURAÇÕES (settings) ──
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ── 9. INSERIR DADOS PADRÃO (DEFAULT_USERS) ──
-- Senha de todos os usuários seed é "1234", armazenada como hash bcrypt (crypt(...) via pgcrypto).
INSERT INTO users (id, name, email, password, role, avatar, avatar_color) VALUES
('teacher1', 'Prof. Carlos Silva', 'professor@estrutura.edu', extensions.crypt('1234', extensions.gen_salt('bf')), 'teacher', 'CS', '#6366f1'),
('student1', 'Ana Beatriz Souza', 'ana@aluno.edu', extensions.crypt('1234', extensions.gen_salt('bf')), 'student', 'AS', '#10b981'),
('student2', 'Bruno Lima Costa', 'bruno@aluno.edu', extensions.crypt('1234', extensions.gen_salt('bf')), 'student', 'BL', '#f59e0b'),
('student3', 'Carlos Eduardo Melo', 'carlos@aluno.edu', extensions.crypt('1234', extensions.gen_salt('bf')), 'student', 'CM', '#ec4899')
ON CONFLICT (id) DO NOTHING;

-- Acessos iniciais liberados (apenas módulo 'arrays' por padrão)
INSERT INTO module_access (student_id, module_ids) VALUES
('student1', '["arrays"]'::jsonb),
('student2', '["arrays"]'::jsonb),
('student3', '["arrays"]'::jsonb)
ON CONFLICT (student_id) DO NOTHING;

-- Configurações iniciais padrão
INSERT INTO settings (key, value) VALUES
('general', '{
  "instName": "",
  "instSemester": "",
  "instDiscipline": "",
  "instTeacher": "",
  "instDesc": "",
  "startDate": "",
  "endDate": "",
  "autoUnlockFirst": true,
  "autoUnlockNext": false,
  "allowRetry": true,
  "showAnswers": true,
  "showRanking": false,
  "maintenanceMode": false,
  "minScore": 60,
  "minModules": 4,
  "passMinLen": 4,
  "defaultPass": "1234",
  "forcePassChange": false,
  "scoring": {
    "MODULE_STARTED": 10,
    "MODULE_COMPLETED": 50,
    "QUIZ_ATTEMPT": 5,
    "QUIZ_SCORE_BONUS": 1,
    "ACTIVITY_DONE": 30,
    "PERFECT_BONUS": 25
  },
  "accentColor": "#6366f1",
  "platformName": "EstruturaPRO",
  "platformIcon": "⚡",
  "platformTagline": "Painel do Professor",
  "animations": true,
  "bgEffects": true,
  "compactToast": false
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 7.6. TABELA DO BANCO DE QUESTÕES (bank_questions) ──
CREATE TABLE IF NOT EXISTS bank_questions (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    type TEXT NOT NULL,
    statement TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 7.7. TABELA DE DESEMPENHO NO BANCO DE QUESTÕES (student_bank_scores) ──
CREATE TABLE IF NOT EXISTS student_bank_scores (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 7.8. TABELA DE CÓDIGO SALVO DA IDE DO ALUNO (student_code_snippets) ──
-- Um único espaço de código por aluno (autosave), sem vínculo a módulo/atividade.
-- Sem policy pública (nem de leitura) — é conteúdo pessoal do aluno, diferente das
-- demais tabelas de conteúdo educacional; só acessível via Edge Functions
-- "get-code-snippet"/"save-code-snippet" (service_role), que resolvem o student_id
-- pelo token de sessão, nunca pelo body da requisição.
CREATE TABLE IF NOT EXISTS student_code_snippets (
    student_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices recomendados para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_progress_student_id ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_student_id ON activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_student_id ON student_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_bank_questions_module_id ON bank_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_student_bank_scores_student_id ON student_bank_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_student_bank_scores_module_id ON student_bank_scores(module_id);

-- ── 10. SEGURANÇA: ROW LEVEL SECURITY (RLS) ──
-- Habilita políticas de segurança no nível de linha no PostgreSQL.
-- Para ativar o RLS em produção no Supabase, execute as políticas de isolamento abaixo.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_bank_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_code_snippets ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (permitem que a aplicação leia usando a chave anônima).
-- Nenhuma tabela tem mais policy pública de ESCRITA — toda escrita passa obrigatoriamente
-- pelas Edge Functions (supabase/functions/), que usam a service_role key (nunca exposta
-- ao client) e por isso não são afetadas pelo RLS. Leitura continua pública nas tabelas
-- sem dado sensível (conteúdo educacional, logs, configurações, scores).

-- users: nenhuma policy para anon/authenticated. Leitura pública passa pela view users_public
-- (sem a coluna password, ver seção 14); escrita só via Edge Functions (login, add-student,
-- remove-student, change-password).
REVOKE ALL ON users FROM anon, authenticated;

-- sessions: nenhuma policy pública. Só a service_role (Edge Functions) cria/lê/apaga sessões.
REVOKE ALL ON sessions FROM anon, authenticated;

-- modules: leitura pública, escrita só via Edge Functions "save-module"/"delete-module" (professor).
CREATE POLICY "Permitir leitura pública de módulos" ON modules FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON modules FROM anon, authenticated;

-- module_access: leitura pública (não é dado sensível), escrita só via Edge Function "set-module-access".
CREATE POLICY "Permitir leitura pública de acessos" ON module_access FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON module_access FROM anon, authenticated;

-- progress: leitura pública, escrita só via Edge Function "submit-quiz-score".
CREATE POLICY "Permitir leitura pública de progresso" ON progress FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON progress FROM anon, authenticated;

-- activity_log: leitura pública, escrita só via Edge Function "log-activity".
CREATE POLICY "Permitir leitura pública de logs" ON activity_log FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON activity_log FROM anon, authenticated;

-- activities: leitura pública, escrita só via Edge Functions "save-activity"/"delete-activity" (professor).
CREATE POLICY "Permitir leitura pública de atividades" ON activities FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON activities FROM anon, authenticated;

-- student_answers: leitura pública, escrita só via Edge Function "save-student-answer".
CREATE POLICY "Permitir leitura pública de respostas" ON student_answers FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON student_answers FROM anon, authenticated;

-- settings: leitura pública, escrita só via Edge Function "save-settings" (professor).
CREATE POLICY "Permitir leitura pública de configurações" ON settings FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON settings FROM anon, authenticated;

-- bank_questions: leitura pública, escrita só via Edge Functions "save-bank-question"/"delete-bank-question" (professor).
CREATE POLICY "Permitir leitura pública de bank_questions" ON bank_questions FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON bank_questions FROM anon, authenticated;

-- student_bank_scores: leitura pública, escrita só via Edge Function "save-bank-score" (aluno, só o próprio).
CREATE POLICY "Permitir leitura pública de student_bank_scores" ON student_bank_scores FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON student_bank_scores FROM anon, authenticated;

-- student_code_snippets: nenhuma policy pública (é conteúdo pessoal do aluno, não conteúdo
-- educacional). Leitura e escrita só via Edge Functions "get-code-snippet"/"save-code-snippet".
REVOKE ALL ON student_code_snippets FROM anon, authenticated;

-- ── 14. VIEW PÚBLICA DE USUÁRIOS (sem a coluna password) ──
CREATE OR REPLACE VIEW users_public AS
  SELECT id, name, email, role, avatar, avatar_color, created_at FROM users;
GRANT SELECT ON users_public TO anon, authenticated;

-- ── 15. FUNÇÕES DE HASH/VERIFICAÇÃO DE SENHA (usadas só pelas Edge Functions, via service_role) ──
-- search_path inclui "extensions" porque o Supabase instala o pgcrypto nesse schema, não em "public".
CREATE OR REPLACE FUNCTION hash_password(plain TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT extensions.crypt(plain, extensions.gen_salt('bf'));
$$;
-- IMPORTANTE: o Supabase concede EXECUTE em funções novas para anon/authenticated por padrão
-- (ALTER DEFAULT PRIVILEGES) — "REVOKE ALL FROM PUBLIC" sozinho NÃO cobre isso, é preciso
-- revogar explicitamente dessas duas roles, senão a função fica exposta em /rest/v1/rpc/.
REVOKE EXECUTE ON FUNCTION hash_password(TEXT) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION verify_password(plain TEXT, hashed TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT hashed = extensions.crypt(plain, hashed);
$$;
REVOKE EXECUTE ON FUNCTION verify_password(TEXT, TEXT) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO service_role;

