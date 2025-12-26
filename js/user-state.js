// 로그인 상태 관리

// 현재 로그인한 사용자 정보
let currentUser = null;

// 로그인 상태 확인 및 UI 업데이트
async function updateUserState() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (session) {
    currentUser = session.user;
    showLoggedInState();
  } else {
    currentUser = null;
    showLoggedOutState();
  }
}

// 로그인된 상태 UI
function showLoggedInState() {
  const loginBtn = document.getElementById('login-btn');

  if (loginBtn) {
    // 아이콘은 유지하고 title만 변경
    loginBtn.innerHTML = '<span class="material-symbols-outlined">person</span>';
    loginBtn.title = '로그아웃';
    loginBtn.onclick = handleLogout;
  }
}

// 로그아웃 상태 UI
function showLoggedOutState() {
  const loginBtn = document.getElementById('login-btn');

  if (loginBtn) {
    // 아이콘은 유지하고 title만 변경
    loginBtn.innerHTML = '<span class="material-symbols-outlined">person</span>';
    loginBtn.title = '로그인';
    loginBtn.onclick = () => {
      window.location.href = 'login.html';
    };
  }
}

// 로그아웃 처리
async function handleLogout() {
  const { error } = await window.supabaseClient.auth.signOut();

  if (error) {
    alert('로그아웃 실패: ' + error.message);
  } else {
    alert('로그아웃되었습니다.');
    window.location.href = 'index.html';
  }
}

// 현재 사용자 정보 가져오기
function getCurrentUser() {
  return currentUser;
}

// 로그인 여부 확인
function isLoggedIn() {
  return currentUser !== null;
}

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

// 인증 상태 변경 감지 설정
async function setupAuthListener() {
  await waitForSupabase();
  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
      showLoggedInState();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLoggedOutState();
    }
  });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
  await waitForSupabase();
  await updateUserState();
  await setupAuthListener();
});
