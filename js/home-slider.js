(() => {
  "use strict";

  const slider = document.querySelector(".homepage-slide1");
  if (!slider) return;

  const monthMap = {
    Ocak: 1,
    Şubat: 2,
    Mart: 3,
    Nisan: 4,
    Mayıs: 5,
    Haziran: 6,
    Temmuz: 7,
    Ağustos: 8,
    Eylül: 9,
    Ekim: 10,
    Kasım: 11,
    Aralık: 12,
  };

  function eventDate(event) {
    const date = event.date || {};
    return new Date(Number(date.year) || 0, (monthMap[date.month] || 1) - 1, Number(date.day) || 1);
  }

  function createSlide(event, index) {
    const slide = document.createElement("div");
    slide.className = `single-slide-item slide-bg${(index % 3) + 1}`;
    if (event.heroImage) {
      slide.style.backgroundImage = `url("${event.heroImage}")`;
    }
    slide.innerHTML = `
      <div class="slide-item-table">
        <div class="slide-item-tablecell">
          <div class="container">
            <div class="row">
              <div class="col-md-7">
                <div class="slider-heading">
                  <p class="slider__meta">İstanbul Atlas Rotary Kulübü</p>
                  <h2 class="slider__title"></h2>
                  <a class="theme-btn" href="events-detail.html">Daha Fazla</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    slide.querySelector(".slider__title").textContent = event.title || "";
    slide.querySelector(".theme-btn").href = `events-detail.html?slug=${encodeURIComponent(event.slug || "")}`;
    return slide;
  }

  function initializeSlider() {
    if (!window.jQuery || !jQuery.fn.owlCarousel) return;

    const $slider = jQuery(slider);
    if ($slider.hasClass("owl-loaded")) $slider.trigger("destroy.owl.carousel");

    $slider.owlCarousel({
      items: 1,
      nav: false,
      dots: true,
      autoplay: true,
      loop: true,
      smartSpeed: 1000,
      animateOut: "slideOutDown",
      animateIn: "fadeIn",
      active: true,
    });
  }

  fetch("data/events.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const events = (data.events || [])
        .filter((event) => event.status !== "draft" && event.status !== "passive")
        .sort((a, b) => eventDate(b) - eventDate(a))
        .slice(0, 3);

      slider.replaceChildren(...events.map(createSlide));
      initializeSlider();
    })
    .catch((error) => console.error("Failed to load homepage events:", error));
})();
