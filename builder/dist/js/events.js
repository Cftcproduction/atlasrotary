(() => {
  "use strict";

  const blogContent = document.querySelector(".blog-content-wrap");
  const EVENTS_URL = "data/events.json";
  const ITEMS_PER_LOAD = 6;

  let allEvents = [];
  let displayedCount = 0;
  let isLoading = false;

  if (!blogContent) return;

  const loadMoreWrapper = document.createElement("div");
  loadMoreWrapper.className = "events-load-more-wrapper";
  loadMoreWrapper.innerHTML = `
    <button type="button" id="events-load-more-btn" class="theme-btn">
      Daha Fazla Göster
    </button>
  `;

  blogContent.parentNode.appendChild(loadMoreWrapper);

  const loadMoreBtn = document.getElementById("events-load-more-btn");

  const style = document.createElement("style");
  style.textContent = `
    .events-load-more-wrapper {
      width: 100%;
      text-align: center;
      margin-top: 35px;
    }

    #events-load-more-btn {
      cursor: pointer;
      border: none;
    }

    #events-load-more-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .event-card-fade-in {
      animation: fadeInUp 0.6s ease-out forwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  async function fetchEvents() {
    try {
      const response = await fetch(EVENTS_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      return json.events || [];
    } catch (err) {
      console.error("Failed to load events:", err);
      return [];
    }
  }

  function createCard(ev) {
    const card = document.createElement("div");
    card.className = "col-lg-4 event-card-fade-in";

    card.innerHTML = `
      <div class="blog-content">
        <div class="blog-item blog-item1">
          <div class="blog-img">
            <a href="events-detail.html?slug=${ev.slug}">
              <img src="${ev.heroImage || ""}" alt="${ev.title}" />
            </a>
            <span class="blog__tag blog__tag1">
              <span class="date__num-text">${ev.date.day}</span>
              <span class="date__mon-text">${ev.date.month}</span>
            </span>
          </div>

          <div class="blog-inner-content">
            <h3 class="blog__title">
              <a href="events-detail.html?slug=${ev.slug}">${ev.title}</a>
            </h3>

            <ul class="blog__list">
              <li class="blog__dot-active">
                ${ev.date.day} ${ev.date.month} ${ev.date.year}
              </li>
              <li>
                ${ev.location && ev.location.address ? ev.location.address.split(",")[0] : ""}
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;

    blogContent.appendChild(card);
  }

  function sortCards(events) {
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

    return events.slice().sort((a, b) => {
      const yearA = parseInt(a.date.year);
      const yearB = parseInt(b.date.year);

      if (yearA !== yearB) return yearB - yearA;

      const monthA = monthMap[a.date.month] || 0;
      const monthB = monthMap[b.date.month] || 0;

      if (monthA !== monthB) return monthB - monthA;

      const dayA = parseInt(a.date.day);
      const dayB = parseInt(b.date.day);

      return dayB - dayA;
    });
  }

  function updateLoadMoreButton() {
    if (displayedCount >= allEvents.length) {
      loadMoreWrapper.style.display = "none";
    } else {
      loadMoreWrapper.style.display = "block";
    }
  }

  function loadMoreEvents() {
    if (isLoading || displayedCount >= allEvents.length) return;

    isLoading = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Yükleniyor...";

    const nextIndex = displayedCount + ITEMS_PER_LOAD;
    const eventsToAdd = allEvents.slice(displayedCount, nextIndex);

    eventsToAdd.forEach(createCard);

    displayedCount += eventsToAdd.length;

    isLoading = false;
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Daha Fazla Göster";

    updateLoadMoreButton();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const events = await fetchEvents();

    if (!events.length) {
      loadMoreWrapper.style.display = "none";
      return;
    }

    allEvents = sortCards(events);

    loadMoreEvents();

    loadMoreBtn.addEventListener("click", loadMoreEvents);
  });
})();
