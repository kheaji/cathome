// 슬라이더 기능 구현
document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');
  const dots = document.querySelectorAll('.dot');
  const currentSlideNum = document.querySelector('.current-slide');

  let currentSlide = 0;
  const slideCount = slides.length;
  let autoSlideInterval;

  // 슬라이드 표시 함수
  function showSlide(index) {
    // 인덱스 범위 확인
    if (index >= slideCount) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slideCount - 1;
    } else {
      currentSlide = index;
    }

    // 모든 슬라이드 비활성화
    slides.forEach(slide => {
      slide.classList.remove('active');
    });

    // 모든 dot 비활성화
    dots.forEach(dot => {
      dot.classList.remove('active');
    });

    // 현재 슬라이드 활성화
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');

    // 슬라이드 번호 업데이트
    if (currentSlideNum) {
      currentSlideNum.textContent = currentSlide + 1;
    }
  }

  // 다음 슬라이드
  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  // 이전 슬라이드
  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  // 자동 슬라이드 시작
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 3000); // 3초마다 다음 슬라이드
  }

  // 자동 슬라이드 중지
  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }

  // 이벤트 리스너
  prevBtn.addEventListener('click', function() {
    prevSlide();
    stopAutoSlide();
    startAutoSlide(); // 버튼 클릭 후 다시 자동 슬라이드 시작
  });

  nextBtn.addEventListener('click', function() {
    nextSlide();
    stopAutoSlide();
    startAutoSlide();
  });

  // dot 클릭 이벤트
  dots.forEach(dot => {
    dot.addEventListener('click', function() {
      const slideIndex = parseInt(this.getAttribute('data-slide'));
      showSlide(slideIndex);
      stopAutoSlide();
      startAutoSlide();
    });
  });

  // 자동 슬라이드 시작
  startAutoSlide();

  // 슬라이더에 마우스 올리면 자동 슬라이드 중지
  const sliderContainer = document.querySelector('.banner-wrapper');
  sliderContainer.addEventListener('mouseenter', stopAutoSlide);
  sliderContainer.addEventListener('mouseleave', startAutoSlide);
});
