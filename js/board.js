// 게시판 기능

// DOM 요소
const writeBtn = document.getElementById('write-btn');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const postList = document.getElementById('post-list');
const pagination = document.getElementById('pagination');

// 현재 페이지
let currentPage = 1;
const postsPerPage = 10;

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

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
  await waitForSupabase();
  await initBoard();
});

// 게시판 초기화
async function initBoard() {
  // 로그인 상태에 따라 글쓰기 버튼 활성화/비활성화
  await updateWriteButton();

  // 게시글 목록 로드
  await loadPosts();
}

// 글쓰기 버튼 상태 업데이트
async function updateWriteButton() {
  // 직접 Supabase 세션 확인
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (session) {
    // 로그인 상태
    writeBtn.disabled = false;
    writeBtn.onclick = goToWritePage;
  } else {
    // 로그아웃 상태
    writeBtn.disabled = true;
    writeBtn.onclick = () => {
      alert('로그인이 필요한 서비스입니다.');
      window.location.href = 'login.html';
    };
  }
}

// 글쓰기 페이지로 이동
function goToWritePage() {
  window.location.href = 'write.html';
}

// 게시글 목록 로드
async function loadPosts(searchKeyword = '') {
  try {
    let query = window.supabaseClient
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    // 검색어가 있으면 제목 검색
    if (searchKeyword) {
      query = query.ilike('title', `%${searchKeyword}%`);
    }

    // 페이지네이션
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage - 1;
    query = query.range(start, end);

    const { data: posts, error, count } = await query;

    if (error) throw error;

    // 전체 게시글 수 가져오기 (페이지네이션용)
    const { count: totalCount } = await window.supabaseClient
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // 게시글 렌더링
    renderPosts(posts);

    // 페이지네이션 렌더링
    renderPagination(totalCount);

  } catch (error) {
    console.error('게시글 로드 실패:', error);
    postList.innerHTML = `
      <tr class="no-posts">
        <td colspan="5">게시글을 불러오는 중 오류가 발생했습니다.</td>
      </tr>
    `;
  }
}

// 게시글 렌더링
function renderPosts(posts) {
  if (posts.length === 0) {
    postList.innerHTML = `
      <tr class="no-posts">
        <td colspan="5">게시글이 없습니다.</td>
      </tr>
    `;
    return;
  }

  const postsHTML = posts.map(post => `
    <tr onclick="goToPost(${post.id})">
      <td>${post.id}</td>
      <td>
        <div class="post-title">
          ${post.image_url ? '<span class="material-symbols-outlined">image</span>' : ''}
          ${post.title}
        </div>
      </td>
      <td>${post.author_email.split('@')[0]}</td>
      <td>${formatDate(post.created_at)}</td>
      <td>${post.views || 0}</td>
    </tr>
  `).join('');

  postList.innerHTML = postsHTML;
}

// 게시글 상세 페이지로 이동
function goToPost(postId) {
  window.location.href = `post.html?id=${postId}`;
}

// 날짜 포맷팅
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const diffHours = Math.floor(diff / (1000 * 60 * 60));

  // 24시간 이내면 시간 표시
  if (diffHours < 24) {
    const diffMinutes = Math.floor(diff / (1000 * 60));
    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    }
    return `${diffHours}시간 전`;
  }

  // 그 외에는 날짜 표시
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 검색 기능
searchBtn.addEventListener('click', () => {
  const keyword = searchInput.value.trim();
  currentPage = 1;
  loadPosts(keyword);
});

// 엔터키로 검색
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// 페이지네이션 렌더링
function renderPagination(totalPosts) {
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  // 이전 버튼
  paginationHTML += `
    <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      &lt;
    </button>
  `;

  // 페이지 번호
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      paginationHTML += `
        <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += '<button disabled>...</button>';
    }
  }

  // 다음 버튼
  paginationHTML += `
    <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      &gt;
    </button>
  `;

  pagination.innerHTML = paginationHTML;
}

// 페이지 변경
function changePage(page) {
  currentPage = page;
  loadPosts(searchInput.value.trim());
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
