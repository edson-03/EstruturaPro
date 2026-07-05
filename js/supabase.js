// ============================================================
//  EstruturaPRO — Supabase Client Setup
// ============================================================

// ⚠️ INSTRUÇÕES:
// Para conectar ao seu banco de dados Supabase:
// 1. Substitua as constantes abaixo com as credenciais do seu projeto Supabase.
// 2. Ou salve no LocalStorage (útil para desenvolvimento rápido):
//    localStorage.setItem('supabase_url', 'SUA_URL')
//    localStorage.setItem('supabase_anon_key', 'SUA_CHAVE')
//    E recarregue a página.

const SUPABASE_URL = localStorage.getItem('supabase_url') || window.SUPABASE_URL || 'SUA_URL_DO_SUPABASE';
const SUPABASE_ANON_KEY = localStorage.getItem('supabase_anon_key') || window.SUPABASE_ANON_KEY || 'SUA_ANON_KEY_DO_SUPABASE';

let supabaseClient = null;

function initSupabaseClient() {
  if (
    typeof supabase !== 'undefined' &&
    SUPABASE_URL &&
    SUPABASE_URL !== 'SUA_URL_DO_SUPABASE' &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== 'SUA_ANON_KEY_DO_SUPABASE'
  ) {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('⚡ Conexão com Supabase inicializada com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar o cliente do Supabase:', error);
    }
  } else {
    console.log('ℹ️ Supabase não configurado. Utilizando armazenamento local (LocalStorage) como fallback.');
  }
  return false;
}

// Inicializar imediatamente ao carregar o script
const IS_SUPABASE_ACTIVE = initSupabaseClient();

/**
 * Retorna se o cliente do Supabase está ativo e configurado.
 * @returns {boolean}
 */
function isSupabaseConfigured() {
  return IS_SUPABASE_ACTIVE && supabaseClient !== null;
}

function updateConnectionStatusWidget() {
  const runUpdate = () => {
    const dot = document.getElementById('supabase-status-dot');
    const text = document.getElementById('supabase-status-text');
    const badge = document.getElementById('supabase-status-badge');

    if (!dot || !text) return;

    if (isSupabaseConfigured()) {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 8px #10b981';
      text.textContent = 'Supabase';
      if (badge) badge.title = 'Conectado ao banco de dados Supabase na nuvem.';
    } else {
      dot.style.background = '#f59e0b';
      dot.style.boxShadow = '0 0 8px #f59e0b';
      text.textContent = 'Local';
      if (badge) badge.title = 'Utilizando armazenamento offline (LocalStorage).';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runUpdate);
  } else {
    runUpdate();
  }
}

// Executar atualização de status do indicador de conexão
updateConnectionStatusWidget();
