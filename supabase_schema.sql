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

-- ── 2. TABELA DE USUÁRIOS (users) ──
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 8. TABELA DE CONFIGURAÇÕES (settings) ──
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ── 9. INSERIR DADOS PADRÃO (DEFAULT_USERS) ──
INSERT INTO users (id, name, email, password, role, avatar, avatar_color) VALUES
('teacher1', 'Prof. Carlos Silva', 'professor@estrutura.edu', '1234', 'teacher', 'CS', '#6366f1'),
('student1', 'Ana Beatriz Souza', 'ana@aluno.edu', '1234', 'student', 'AS', '#10b981'),
('student2', 'Bruno Lima Costa', 'bruno@aluno.edu', '1234', 'student', 'BL', '#f59e0b'),
('student3', 'Carlos Eduardo Melo', 'carlos@aluno.edu', '1234', 'student', 'CM', '#ec4899')
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

-- Índices recomendados para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_progress_student_id ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_student_id ON activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_student_id ON student_answers(student_id);

-- ── 10. SEGURANÇA: ROW LEVEL SECURITY (RLS) ──
-- Habilita políticas de segurança no nível de linha no PostgreSQL.
-- Para ativar o RLS em produção no Supabase, execute as políticas de isolamento abaixo.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (permitem que a aplicação leia e grave usando a chave anônima).
-- Nota: Para segurança máxima em produção, substitua "USING (true)" por verificações baseadas em token JWT ou perfis.

CREATE POLICY "Permitir leitura pública de usuários" ON users FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de usuários" ON users FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de módulos" ON modules FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de módulos" ON modules FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de acessos" ON module_access FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de acessos" ON module_access FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de progresso" ON progress FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de progresso" ON progress FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de logs" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de logs" ON activity_log FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de atividades" ON activities FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de atividades" ON activities FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de respostas" ON student_answers FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de respostas" ON student_answers FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de configurações" ON settings FOR SELECT USING (true);
CREATE POLICY "Permitir gravação pública de configurações" ON settings FOR ALL USING (true);

