  
;(() => {
  "use strict"



const blogContent = document.querySelector(".blog-content-wrap");
const EVENTS_URL = "data/events.json";
const ITEMS_PER_LOAD = 6;

let allEvents = [];
let displayedCount = 0;
let isLoading = false;

// Hint shown when more cards can be loaded by scrolling
const loadMoreHint = document.createElement("div");
loadMoreHint.className = "load-more-hint";
loadMoreHint.textContent = "Daha fazla etkinlik görmek için sayfayı aşağı kaydırın.";
loadMoreHint.style.display = "none";

if (blogContent && blogContent.parentNode) {
  blogContent.parentNode.appendChild(loadMoreHint);
}

function updateLoadMoreHint() {
  if (!loadMoreHint) return;
  // Hide hint while loading or when all events are already displayed.
  if (isLoading || displayedCount >= allEvents.length) {
    loadMoreHint.style.display = "none";
    return;
  }

  loadMoreHint.style.display = "block";
}

// Create loading spinner
const loadingSpinner = document.createElement("div");
loadingSpinner.id = "events-loading-spinner";
loadingSpinner.innerHTML = `
  <div class="spinner-container">
    <div class="spinner"></div>
    <p>Loading more events...</p>
  </div>
`;
loadingSpinner.style.cssText = `
  display: none;
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
`;
document.body.appendChild(loadingSpinner);

// Add spinner styles
const style = document.createElement("style");
style.textContent = `
  #events-loading-spinner .spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    background: white;
    padding: 20px 30px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  #events-loading-spinner .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f0f0f0;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  #events-loading-spinner p {
    margin: 0;
    color: #333;
    font-size: 14px;
    font-weight: 500;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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

  .load-more-hint {
    margin: 25px auto 0;
    text-align: center;
    color: #424242;
    font-weight: 600;
    font-size: 14px;
    max-width: 500px;
  }
`;
document.head.appendChild(style);
/**
 * Fetch events.json and return array of event objects.
 * @returns {Promise<Array>} events
 */
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
/**
 * Create a card element for a single event and append it to the page.
 * @param {Object} ev event data
 */


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
            <li class="blog__dot-active">${ev.date.day} ${ev.date.month} ${ev.date.year}</li>
            <li>${ev.location && ev.location.address ? ev.location.address.split(",")[0] : ""}</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  blogContent.appendChild(card);
}



/**
 * Sort an array of events by date (descending - closest dates first).
 * @param {Array} events
 */
function sortCards(events) {
  const monthMap = {
    "Ocak": 1, "Şubat": 2, "Mart": 3, "Nisan": 4,
    "Mayıs": 5, "Haziran": 6, "Temmuz": 7, "Ağustos": 8,
    "Eylül": 9, "Ekim": 10, "Kasım": 11, "Aralık": 12
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

/**
 * Load and display more events (6 at a time).
 */
function loadMoreEvents() {
  if (isLoading || displayedCount >= allEvents.length) return;
  
  isLoading = true;
  loadingSpinner.style.display = "block";
  
  // Simulate small delay for animation visibility
  setTimeout(() => {
    const nextIndex = displayedCount + ITEMS_PER_LOAD;
    const eventsToAdd = allEvents.slice(displayedCount, nextIndex);
    
    eventsToAdd.forEach(createCard);
    displayedCount = nextIndex;
    isLoading = false;
    loadingSpinner.style.display = "none";
    updateLoadMoreHint();
  }, 300);
}

/**
 * Check if user has scrolled near the bottom and load more if needed.
 */
function handleScroll() {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Load more when user is 300px from bottom
  if (scrollTop + windowHeight >= documentHeight - 300) {
    loadMoreEvents();
  }
}

// initialize when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  const events = await fetchEvents();
  if (events.length) {
    allEvents = sortCards(events);
    loadMoreEvents();
    updateLoadMoreHint();
    window.addEventListener("scroll", handleScroll);
  }
});
})();