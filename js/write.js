// 글쓰기 기능

// DOM 요소
const writeForm = document.getElementById('write-form');
const postTitle = document.getElementById('post-title');
const postContent = document.getElementById('post-content');
const postImage = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
const errorMessage = document.getElementById('error-message');
const pageTitle = document.getElementById('page-title');
const pageDesc = document.getElementById('page-desc');
const submitBtn = document.getElementById('submit-btn');

let selectedFile = null;
let isEditMode = false;
let editPostId = null;
let currentPost = null;
let originalImageUrl = null;

// URL에서 게시글 ID 가져오기 (수정 모드 확인)
const urlParams = new URLSearchParams(window.location.search);
editPostId = urlParams.get('id');
isEditMode = !!editPostId;

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

  // 수정 모드인 경우
  if (isEditMode) {
    // 페이지 제목 및 버튼 텍스트 변경
    pageTitle.textContent = '게시글 수정';
    pageDesc.textContent = '게시글을 수정하세요';
    submitBtn.textContent = '수정 완료';

    // 기존 게시글 데이터 로드
    await loadPostData(session.user);
  }
});

// 기존 게시글 데이터 로드 (수정 모드)
async function loadPostData(user) {
  try {
    const { data: post, error } = await window.supabaseClient
      .from('posts')
      .select('*')
      .eq('id', editPostId)
      .single();

    if (error) throw error;

    if (!post) {
      alert('게시글을 찾을 수 없습니다.');
      window.location.href = 'board.html';
      return;
    }

    // 본인이 작성한 글인지 확인
    if (post.author_id !== user.id) {
      alert('본인이 작성한 글만 수정할 수 있습니다.');
      window.location.href = 'board.html';
      return;
    }

    currentPost = post;
    originalImageUrl = post.image_url;

    // 폼에 데이터 채우기
    postTitle.value = post.title;
    postContent.value = post.content;

    // 이미지가 있으면 미리보기 표시
    if (post.image_url) {
      imagePreview.innerHTML = `<img src="${post.image_url}" alt="기존 이미지">`;
      imagePreview.classList.add('has-image');
    }

  } catch (error) {
    console.error('게시글 로드 실패:', error);
    alert('게시글을 불러오는 중 오류가 발생했습니다.');
    window.location.href = 'board.html';
  }
}

// 이미지 선택 시 미리보기
imagePreview.addEventListener('click', () => {
  postImage.click();
});

postImage.addEventListener('change', (e) => {
  const file = e.target.files[0];

  if (!file) {
    selectedFile = null;
    // 수정 모드이고 원본 이미지가 있으면 원본 이미지로 복원
    if (isEditMode && originalImageUrl) {
      imagePreview.innerHTML = `<img src="${originalImageUrl}" alt="기존 이미지">`;
      imagePreview.classList.add('has-image');
    } else {
      resetImagePreview();
    }
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
    submitBtn.disabled = true;
    submitBtn.textContent = isEditMode ? '수정 중...' : '작성 중...';

    // 현재 사용자 정보 가져오기
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const user = session.user;

    if (isEditMode) {
      // 수정 모드
      await updatePost(user, title, content);
    } else {
      // 작성 모드
      await createPost(user, title, content);
    }

  } catch (error) {
    console.error('게시글 처리 실패:', error);
    errorMessage.textContent = '게시글 처리 중 오류가 발생했습니다: ' + error.message;

    // 버튼 원래대로
    submitBtn.disabled = false;
    submitBtn.textContent = isEditMode ? '수정 완료' : '작성 완료';
  }
});

// 게시글 작성
async function createPost(user, title, content) {
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
}

// 게시글 수정
async function updatePost(user, title, content) {
  let imageUrl = originalImageUrl;

  // 새 이미지가 선택된 경우
  if (selectedFile) {
    // 기존 이미지가 있으면 삭제
    if (originalImageUrl) {
      try {
        const urlParts = originalImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;

        await window.supabaseClient.storage
          .from('post-images')
          .remove([filePath]);
      } catch (error) {
        console.error('기존 이미지 삭제 실패:', error);
        // 이미지 삭제 실패는 무시하고 계속 진행
      }
    }

    // 새 이미지 업로드
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

  // 게시글 수정
  const { error: updateError } = await window.supabaseClient
    .from('posts')
    .update({
      title: title,
      content: content,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', editPostId);

  if (updateError) throw updateError;

  // 성공 시 게시글 상세 페이지로 이동
  alert('게시글이 수정되었습니다.');
  window.location.href = `post.html?id=${editPostId}`;
}
