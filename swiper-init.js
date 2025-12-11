const productSlider = new Swiper('.product-slider', {
  // Mobile-first parameters
  loop: false, // Disabled loop
  slidesPerView: 1.3, // Show parts of next/prev slides
  spaceBetween: 15, // Reduced gap
  centeredSlides: true, // Center the active slide

  // If we need pagination
  pagination: {
    el: '.product-slider .swiper-pagination',
    clickable: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: '.product-slider .swiper-button-next',
    prevEl: '.product-slider .swiper-button-prev',
  },

  // Responsive breakpoints
  breakpoints: {
    // when window width is >= 768px
    768: {
      slidesPerView: 3,
      spaceBetween: 30,
      centeredSlides: false,
    }
  }
});

const featuresSlider = new Swiper('.features-slider', {
  // Mobile-first parameters
  loop: false, // Disabled loop
  slidesPerView: 1.3, // Show parts of next/prev slides
  spaceBetween: 15, // Reduced gap
  centeredSlides: true, // Center the active slide

  // If we need pagination
  pagination: {
    el: '.features-slider .swiper-pagination',
    clickable: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: '.features-slider .swiper-button-next',
    prevEl: '.features-slider .swiper-button-prev',
  },

  // Responsive breakpoints
  breakpoints: {
    // when window width is >= 768px
    768: {
      slidesPerView: 3,
      spaceBetween: 30,
      centeredSlides: false,
    }
  }
});

// Recipes Slider
const recipesSlider = new Swiper('.recipes-slider', {
  loop: false,
  slidesPerView: 1.2,
  spaceBetween: 15,
  centeredSlides: true,
  pagination: {
    el: '.recipes-slider .swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.recipes-slider .swiper-button-next',
    prevEl: '.recipes-slider .swiper-button-prev',
  },
  breakpoints: {
    768: {
      slidesPerView: 3,
      spaceBetween: 30,
      centeredSlides: false,
    }
  }
});

// Testimonials Slider
const testimonialsSlider = new Swiper('.testimonials-slider', {
  loop: false,
  slidesPerView: 1.2,
  spaceBetween: 15,
  centeredSlides: true,
  pagination: {
    el: '.testimonials-slider .swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.testimonials-slider .swiper-button-next',
    prevEl: '.testimonials-slider .swiper-button-prev',
  },
  breakpoints: {
    768: {
      slidesPerView: 2,
      spaceBetween: 30,
      centeredSlides: false,
    }
  }
});
