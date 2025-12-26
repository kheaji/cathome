// 글쓰기 기능

// DOM 요소
const writeForm = document.getElementById('write-form');
const postTitle = document.getElementById('post-title');
const postContent = document.getElementById('post-content');
const postImage = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
const errorMessage = document.getElementById('error-message');

let selectedFile = null;

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

// 페이지 로드 시 로그인 확인
document.addEventListener('DOMContentLoaded', async () => {
  // Supabase 클라이언트 준비 대기
  await waitForSupabase();

  // 로그인 확인
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session) {
    alert('로그인이 필요한 서비스입니다.');
    window.location.href = 'login.html';
    return;
  }
});

// 이미지 선택 시 미리보기
imagePreview.addEventListener('click', () => {
  postImage.click();
});

postImage.addEventListener('change', (e) => {
  const file = e.target.files[0];

  if (!file) {
    selectedFile = null;
    resetImagePreview();
    return;
  }

  // 파일 크기 확인 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.textContent = '이미지 크기는 5MB 이하만 가능합니다.';
    postImage.value = '';
    return;
  }

  // 이미지 파일 확인
  if (!file.type.startsWith('image/')) {
    errorMessage.textContent = '이미지 파일만 업로드 가능합니다.';
    postImage.value = '';
    return;
  }

  selectedFile = file;
  errorMessage.textContent = '';

  // 미리보기 표시
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="미리보기">`;
    imagePreview.classList.add('has-image');
  };
  reader.readAsDataURL(file);
});

// 이미지 미리보기 초기화
function resetImagePreview() {
  imagePreview.innerHTML = `
    <span class="material-symbols-outlined">add_photo_alternate</span>
    <p>이미지를 선택하세요 (최대 5MB)</p>
  `;
  imagePreview.classList.remove('has-image');
}

// 글쓰기 폼 제출
writeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMessage.textContent = '';

  const title = postTitle.value.trim();
  const content = postContent.value.trim();

  // 유효성 검사
  if (!title) {
    errorMessage.textContent = '제목을 입력하세요.';
    postTitle.focus();
    return;
  }

  if (!content) {
    errorMessage.textContent = '내용을 입력하세요.';
    postContent.focus();
    return;
  }

  try {
    // 로딩 상태
    const submitBtn = writeForm.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '작성 중...';

    // 현재 사용자 정보 가져오기
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const user = session.user;

    let imageUrl = null;

    // 이미지 업로드
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
        .from('post-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 이미지 공개 URL 가져오기
      const { data: urlData } = window.supabaseClient.storage
        .from('post-images')
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    // 게시글 작성
    const { data: postData, error: postError } = await window.supabaseClient
      .from('posts')
      .insert([
        {
          title: title,
          content: content,
          author_id: user.id,
          author_email: user.email,
          image_url: imageUrl
        }
      ])
      .select()
      .single();

    if (postError) throw postError;

    // 성공 시 게시판으로 이동
    alert('게시글이 작성되었습니다.');
    window.location.href = 'board.html';

  } catch (error) {
    console.error('게시글 작성 실패:', error);
    errorMessage.textContent = '게시글 작성 중 오류가 발생했습니다: ' + error.message;

    // 버튼 원래대로
    const submitBtn = writeForm.querySelector('.btn-submit');
    submitBtn.disabled = false;
    submitBtn.textContent = '작성 완료';
  }
});
