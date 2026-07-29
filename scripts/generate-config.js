// Gera js/config.js a partir das variáveis de ambiente no momento do build.
// Usado pela Vercel (Settings > Environment Variables: SUPABASE_URL, SUPABASE_ANON_KEY).
// Local/Docker: continue criando js/config.js manualmente a partir de js/config.example.js.
const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('❌ SUPABASE_URL e/ou SUPABASE_ANON_KEY não configuradas nas variáveis de ambiente do projeto na Vercel.');
  console.error('   Vá em Project Settings > Environment Variables e adicione as duas.');
  process.exit(1);
}

const content = `// Gerado automaticamente no build a partir das variáveis de ambiente. Não edite à mão.
window.SUPABASE_URL = '${url}';
window.SUPABASE_ANON_KEY = '${anonKey}';
`;

fs.writeFileSync(path.join(__dirname, '..', 'js', 'config.js'), content);
console.log('✅ js/config.js gerado a partir das variáveis de ambiente.');
