// 게시글 상세 페이지 기능

let currentPost = null;
let postCurrentUser = null;

// URL에서 게시글 ID 가져오기
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

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
  if (!postId) {
    alert('잘못된 접근입니다.');
    window.location.href = 'board.html';
    return;
  }

  // Supabase 클라이언트 준비 대기
  await waitForSupabase();

  // 현재 사용자 정보 가져오기
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) {
    postCurrentUser = session.user;
  }

  // 게시글 로드
  await loadPost();
});

// 게시글 로드
async function loadPost() {
  try {
    // 게시글 조회
    const { data: post, error } = await window.supabaseClient
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    if (!post) {
      alert('게시글을 찾을 수 없습니다.');
      window.location.href = 'board.html';
      return;
    }

    currentPost = post;

    // 조회수 증가
    await incrementViews();

    // 게시글 렌더링
    renderPost(post);

    // 작성자인 경우 수정/삭제 버튼 표시
    if (postCurrentUser && postCurrentUser.id === post.author_id) {
      document.getElementById('author-actions').style.display = 'flex';
    }

  } catch (error) {
    console.error('게시글 로드 실패:', error);
    alert('게시글을 불러오는 중 오류가 발생했습니다.');
    window.location.href = 'board.html';
  }
}

// 게시글 렌더링
function renderPost(post) {
  // 제목
  document.getElementById('post-title').textContent = post.title;

  // 작성자
  document.getElementById('post-author').textContent = post.author_email.split('@')[0];

  // 작성일
  document.getElementById('post-date').textContent = formatDate(post.created_at);

  // 조회수
  document.getElementById('post-views').textContent = `조회 ${post.views || 0}`;

  // 이미지
  const imageContainer = document.getElementById('post-image-container');
  if (post.image_url) {
    imageContainer.innerHTML = `<img src="${post.image_url}" alt="게시글 이미지">`;
  } else {
    imageContainer.innerHTML = '';
  }

  // 내용
  document.getElementById('post-text').textContent = post.content;
}

// 조회수 증가
async function incrementViews() {
  try {
    await window.supabaseClient
      .from('posts')
      .update({ views: (currentPost.views || 0) + 1 })
      .eq('id', postId);
  } catch (error) {
    console.error('조회수 증가 실패:', error);
  }
}

// 날짜 포맷팅
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 수정 버튼
document.getElementById('btn-edit')?.addEventListener('click', () => {
  // 수정 페이지로 이동
  window.location.href = `write.html?id=${postId}`;
});

// 삭제 버튼
document.getElementById('btn-delete')?.addEventListener('click', async () => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return;
  }

  try {
    // 이미지가 있으면 Storage에서 삭제
    if (currentPost.image_url) {
      const urlParts = currentPost.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${postCurrentUser.id}/${fileName}`;

      await window.supabaseClient.storage
        .from('post-images')
        .remove([filePath]);
    }

    // 게시글 삭제
    const { error } = await window.supabaseClient
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    alert('게시글이 삭제되었습니다.');
    window.location.href = 'board.html';

  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    alert('게시글 삭제 중 오류가 발생했습니다: ' + error.message);
  }
});
