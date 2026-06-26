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

function handleLogin(email, password, errorEl, btn) {
  errorEl.textContent = '';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Entrando...';

  setTimeout(() => {
    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
      errorEl.textContent = '❌ E-mail ou senha incorretos.';
      btn.disabled = false;
      btn.innerHTML = 'Entrar na Plataforma';
      shakeElement(document.getElementById('login-card'));
      return;
    }

    setSession(user);
    btn.innerHTML = '✓ Redirecionando...';

    setTimeout(() => {
      if (user.role === 'teacher') {
        window.location.href = 'teacher.html';
      } else {
        window.location.href = 'student.html';
      }
    }, 400);
  }, 600);
}

function shakeElement(el) {
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 600);
}
