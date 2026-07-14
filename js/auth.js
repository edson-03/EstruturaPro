// ============================================================
//  EstruturaPRO — Auth Module
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initDB();

  const session = getSession();
  if (session) {
    window.location.href = session.role === 'teacher' ? 'teacher.html' : 'student.html';
    return;
  }

  setupLoginUI();
});

function setupLoginUI() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('error-msg');
  const btnLogin = document.getElementById('btn-login');

  // Tab switching
  const tabs = document.querySelectorAll('.role-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Auto-fill demo credentials
      const role = tab.dataset.role;
      if (role === 'teacher') {
        emailInput.value = 'professor@estrutura.edu';
        passwordInput.value = '1234';
        document.getElementById('demo-hint').textContent = 'Professor: professor@estrutura.edu / 1234';
      } else {
        emailInput.value = 'ana@aluno.edu';
        passwordInput.value = '1234';
        document.getElementById('demo-hint').textContent = 'Aluno: ana@aluno.edu / 1234';
      }
      errorMsg.textContent = '';
    });
  });

  // Demo credential quick fill
  const demoLinks = document.querySelectorAll('.demo-user');
  demoLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      emailInput.value = link.dataset.email;
      passwordInput.value = link.dataset.pass;
      // Switch tab if needed
      const user = findUserByEmail(link.dataset.email);
      if (user) {
        tabs.forEach(t => t.classList.remove('active'));
        const target = document.querySelector(`.role-tab[data-role="${user.role}"]`);
        if (target) target.classList.add('active');
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin(emailInput.value.trim(), passwordInput.value.trim(), errorMsg, btnLogin);
  });

  // Enter key shortcut
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') form.dispatchEvent(new Event('submit'));
    });
  });
}

async function handleLogin(email, password, errorEl, btn) {
  errorEl.textContent = '';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Entrando...';

  const fail = () => {
    errorEl.textContent = '❌ E-mail ou senha incorretos.';
    btn.disabled = false;
    btn.innerHTML = 'Entrar na Plataforma';
    shakeElement(document.getElementById('login-card'));
  };

  const proceed = (user, token, expiresAt) => {
    setSession(user, token, expiresAt);
    btn.innerHTML = '✓ Redirecionando...';
    setTimeout(() => {
      window.location.href = user.role === 'teacher' ? 'teacher.html' : 'student.html';
    }, 400);
  };

  // Com Supabase configurado, o login (e a verificação da senha) é feito inteiramente
  // no servidor pela Edge Function "login" — o client nunca vê a senha de ninguém.
  if (isSupabaseConfigured()) {
    const result = await callEdgeFunction('login', { email, password });
    if (!result.ok) { fail(); return; }
    proceed(result.data.user, result.data.token, result.data.expiresAt);
    return;
  }

  // Modo local/offline: sem Supabase configurado, mantém o login de demonstração
  // comparando contra os dados seed no localStorage (sem persistência real de conta).
  setTimeout(() => {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) { fail(); return; }
    proceed(user);
  }, 400);
}

function shakeElement(el) {
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 600);
}
