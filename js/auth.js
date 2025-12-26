// 로그인/회원가입 기능

// DOM 요소
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');

// 탭 전환
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    // 탭 버튼 active 전환
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 폼 전환
    if (tab === 'login') {
      loginForm.classList.add('active');
      signupForm.classList.remove('active');
      loginError.textContent = '';
    } else {
      signupForm.classList.add('active');
      loginForm.classList.remove('active');
      signupError.textContent = '';
    }
  });
});

// 로그인 처리
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // 로그인 성공 - 메인 페이지로 이동
    alert('로그인 성공!');
    window.location.href = 'index.html';

  } catch (error) {
    loginError.textContent = '로그인 실패: ' + error.message;
  }
});

// 회원가입 처리
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signupError.textContent = '';

  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const passwordConfirm = document.getElementById('signup-password-confirm').value;

  // 비밀번호 확인
  if (password !== passwordConfirm) {
    signupError.textContent = '비밀번호가 일치하지 않습니다.';
    return;
  }

  // 비밀번호 길이 확인
  if (password.length < 6) {
    signupError.textContent = '비밀번호는 최소 6자 이상이어야 합니다.';
    return;
  }

  try {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    // 회원가입 성공
    alert('회원가입 성공! 이메일을 확인하여 인증을 완료해주세요.');

    // 로그인 탭으로 전환
    document.querySelector('[data-tab="login"]').click();
    signupForm.reset();

  } catch (error) {
    signupError.textContent = '회원가입 실패: ' + error.message;
  }
});

// Supabase 클라이언트가 준비될 때까지 대기
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window.supabaseClient) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.supabaseClient) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    }
  });
}

// 페이지 로드 시 로그인 상태 확인
async function checkLoginStatus() {
  await waitForSupabase();
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  // 이미 로그인되어 있으면 메인 페이지로 이동
  if (session) {
    window.location.href = 'index.html';
  }
}

// 페이지 로드 시 실행
checkLoginStatus();
