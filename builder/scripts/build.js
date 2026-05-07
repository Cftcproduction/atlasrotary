const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const DATA_FILE = path.join(ROOT, "data", "events.json");
const LIST_TEMPLATE = path.join(ROOT, "templates", "events-list.html");
const DETAIL_TEMPLATE = path.join(ROOT, "templates", "event-detail.html");

const SITE_URL = "https://www.atlasrotary.org";
const EVENTS_INDEX_PATH = "/events/";

const PROJECT_ROOT = path.resolve(ROOT, "..");

const STATIC_PAGES = [
  { source: "index.html", output: "/", title: "İstanbul Atlas Rotary Kulübü" },
  { source: "about.html", output: "/about/", title: "Hakkımızda | İstanbul Atlas Rotary Kulübü" },
  { source: "team.html", output: "/team/", title: "Ekibimiz | İstanbul Atlas Rotary Kulübü" },
  { source: "projects.html", output: "/projects/", title: "Projeler | İstanbul Atlas Rotary Kulübü" },
  { source: "presentation.html", output: "/presentation/", title: "Sunum | İstanbul Atlas Rotary Kulübü" },
  { source: "contact.html", output: "/contact/", title: "İletişim | İstanbul Atlas Rotary Kulübü" },
];

const ASSET_DIRS = ["css", "js", "images", "fonts", "webfonts", "assets"];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function cleanRouteForFile(fileName) {
  if (fileName === "index.html") return "/";
  if (fileName === "events.html") return "/events/";
  if (fileName === "events-detail.html") return "/events/";
  return `/${fileName.replace(/\.html$/i, "")}/`;
}

function cleanInternalLinks(html) {
  return html
    .replace(/(href|src)=(['"])(?!https?:|mailto:|tel:|#|\/\/|\/)([^'"#?]+\.(?:css|js|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot))(#[^'"]*)?\2/gi, (m, attr, q, url, hash = "") => `${attr}=${q}/${url}${hash}${q}`)
    .replace(/href=(['"])(?!https?:|mailto:|tel:|#|\/\/)([^'"#?]+\.html)(#[^'"]*)?\1/gi, (m, q, url, hash = "") => {
      const base = path.posix.basename(url);
      return `href=${q}${cleanRouteForFile(base)}${hash}${q}`;
    })
    .replace(/href=(['"])events-detail\.html\?slug=([^'"#]+)(#[^'"]*)?\1/gi, (m, q, slug, hash = "") => `href=${q}/events/${slug}/${hash}${q}`);
}

function injectOrReplaceHeadTag(html, tagName, attrs, tagHtml) {
  const attrSelector = Object.entries(attrs)
    .map(([k, v]) => `(?=[^>]*${k}=["']${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'])`)
    .join("");
  const re = new RegExp(`<${tagName}${attrSelector}[^>]*>`, "i");
  if (re.test(html)) return html.replace(re, tagHtml);
  return html.replace(/<\/head>/i, `  ${tagHtml}\n</head>`);
}

function injectCanonicalAndMeta(html, page) {
  const canonical = absoluteUrl(page.output);
  const title = page.title || "İstanbul Atlas Rotary Kulübü";
  const description = `${title.replace(" | İstanbul Atlas Rotary Kulübü", "")} sayfası. İstanbul Atlas Rotary Kulübü çalışmaları, etkinlikleri ve sosyal sorumluluk projeleri.`;

  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(title)}</title>`);
  html = injectOrReplaceHeadTag(html, "meta", { name: "description" }, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = injectOrReplaceHeadTag(html, "link", { rel: "canonical" }, `<link rel="canonical" href="${canonical}" />`);
  html = injectOrReplaceHeadTag(html, "meta", { property: "og:title" }, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = injectOrReplaceHeadTag(html, "meta", { property: "og:description" }, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = injectOrReplaceHeadTag(html, "meta", { property: "og:url" }, `<meta property="og:url" content="${canonical}" />`);
  html = injectOrReplaceHeadTag(html, "meta", { property: "og:type" }, `<meta property="og:type" content="website" />`);
  return html;
}

function outputFileForRoute(route) {
  return route === "/" ? path.join(DIST_DIR, "index.html") : path.join(DIST_DIR, route.replace(/^\//, ""), "index.html");
}

function copyAssets() {
  for (const dir of ASSET_DIRS) {
    copyRecursive(path.join(PROJECT_ROOT, dir), path.join(DIST_DIR, dir));
    copyRecursive(path.join(ROOT, dir), path.join(DIST_DIR, dir));
  }
}

function buildStaticPages(events = []) {
  const built = [];

  for (const page of STATIC_PAGES) {
    const sourcePath = path.join(PROJECT_ROOT, page.source);
    if (!fs.existsSync(sourcePath)) continue;

    let html = read(sourcePath);

    if (page.source === "index.html") {
      html = html.replace(
        /<div class="row blog-content-wrap">[\s\S]*?<\/div>\s*<!-- end row -->/,
        `<div class="row blog-content-wrap">
${renderLatestHomeEvents(events)}
                </div><!-- end row -->`,
      );
    }

    html = cleanInternalLinks(html);
    html = injectCanonicalAndMeta(html, page);
    writeFile(outputFileForRoute(page.output), html);
    built.push(page.output);
  }

  return built;
}

function buildRobots() {
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl("/sitemap.xml")}\n`;
  writeFile(path.join(DIST_DIR, "robots.txt"), txt);
}

const HEADER = `
<header class="header-area">
  <div class="header-top-action">
    <div class="container">
      <div class="row">
        <div class="col-lg-5">
          <div class="top-action-content">
            <div class="info-box info-box-1 d-flex align-items-center">
              <ul class="d-flex align-items-center">
                <li><a href="mailto:atlasrotary@gmail.com"><i class="fa fa-envelope"></i>atlasrotary@gmail.com</a></li>
                <li><a href="tel:+905335185388"><i class="fa fa-phone-square"></i>+90 533 518 53 88</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="top-action-content info-action-content">
            <div class="info-box info-box-2 d-flex align-items-center justify-content-end">
              <ul class="top-action-list d-flex align-items-center">
                <li><a href="#"><i class="fa fa-twitter"></i></a></li>
                <li><a href="https://www.facebook.com/atlasrotarykulubu"><i class="fa fa-facebook"></i></a></li>
                <li><a href="https://www.instagram.com/istanbulatlasrotarykulubu/"><i class="fa fa-instagram"></i></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="header-top header-menu-action">
    <div class="container">
      <div class="row ostion-top-wrap">
        <div class="col-lg-5 col-sm-5 site-branding">
          <div class="logo-action d-flex align-items-center">
            <div class="ostion-logo">
              <a href="/"><img src="/images/logo.svg" alt="Atlas Rotary" title="Atlas Rotary"></a>
            </div>
          </div>
        </div>
        <div class="col-lg-7 col-sm-7 ostion-menu">
          <div class="ostion-menu-innner">
            <div class="ostion-menu-content">
              <div class="navigation-top">
                <nav class="main-navigation">
                  <ul>
                      <li><a href="/">Anasayfa</a></li>
                      <li><a href="/team/">Ekibimiz</a></li>
                      <li><a href="/presentation/">Sunum</a></li>
                      <li><a href="/events/">Etkinlikler</a></li>
                      <li><a href="/about/">Hakkımızda</a></li>
                      <li><a href="/contact/">İletişim</a></li>
                  </ul>
                </nav>
              </div>
            </div>
            <div class="mobile-menu-toggle"><img src="/images/icons/hmbrgr-menu.svg" alt="menu"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="side-nav-container">
    <div class="humburger-menu"><div class="humburger-menu-lines side-menu-close"></div></div>
    <div class="side-menu-wrap">
      <ul class="side-menu-ul">
          <ul>
              <li class="sidenav__item"><a href="/">Anasayfa</a></li>
              <li class="sidenav__item"><a href="/team/">Ekibimiz</a></li>
              <li class="sidenav__item"><a href="/presentation/">Sunum</a></li>
              <li class="sidenav__item"><a href="/events/">Etkinlikler</a></li>
              <li class="sidenav__item"><a href="/about/">Hakkımızda</a></li>
              <li class="sidenav__item"><a href="/contact/">İletişim</a></li>
          </ul>
      </ul>
      <ul class="side-social">
        <li><a href="https://www.instagram.com/istanbulatlasrotarykulubu/"><i class="fa fa-instagram"></i></a></li>
        <li><a href="https://www.facebook.com/atlasrotarykulubu"><i class="fa fa-facebook"></i></a></li>
        <li><a href="#"><i class="fa fa-twitter"></i></a></li>
        <li><a href="http://www.youtube.com/@AtlasRotary"><i class="fa fa-youtube-play"></i></a></li>
      </ul>
    </div>
  </div>
</header>`;

const FOOTER = `
<section class="footer-area">
  <div class="footer-copyright">
    <div class="container"><div class="row"><div class="col-lg-12"><div class="copyright-desc"><p>© CFTC BrandTech By <a href="https://www.cftcbrandtech.com/" target="_blank">cftcbrandtech.com</a></p></div></div></div></div>
  </div>
</section>
<div id="back-to-top" class="back-btn-shown" aria-label="Yukarı">
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
    <path d="M12 5l7 7-1.4 1.4L13 8.8V20h-2V8.8L6.4 13.4 5 12z"></path>
  </svg>
</div>`;

const SCRIPTS = `
<script src="/js/jquery.min.js"></script>
<script src="/js/bootstrap.min.js"></script>
<script src="/js/jquery.magnific-popup.min.js"></script>
<script src="/js/jquery.waypoints.js"></script>
<script src="/js/jquery.counterup.min.js"></script>
<script src="/js/jquery.barfiller.js"></script>
<script src="/js/lightbox.js"></script>
<script src="/js/smooth-scrolling.js"></script>
<script src="/js/wow.js"></script>
<script src="/js/main.js"></script>

<script src="https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js"></script>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    if (window.Fancybox) {
      Fancybox.bind("[data-fancybox]", {
        Thumbs: {
          type: "classic",
          // Open the thumbnail strip automatically (useful on mobile)
          autoStart: true
        },
        Toolbar: {
          display: {
            left: ["infobar"],
            middle: [],
            right: ["slideshow", "thumbs", "close"]
          }
        },
        Carousel: {
          infinite: true
        }
      });
    }

    // Workaround: some mobile environments hide the thumbs pane by default.
    // After Fancybox opens, try to force-show the thumbs container and
    // scroll the active thumb into view. This checks multiple possible
    // class name variants to be robust across versions / skins.
    document.addEventListener('click', function (ev) {
      const a = ev.target.closest && ev.target.closest('[data-fancybox]');
      if (!a) return;

      // Wait for Fancybox to open
      setTimeout(function () {
        try {
          var inst = window.Fancybox && Fancybox.getInstance && Fancybox.getInstance();
          if (!inst) return;

          var container = inst && inst.$container ? inst.$container : document.body;
          var selectors = ['.fancybox__thumbs', '.fancybox-thumbs', '.fancybox__thumbs-wrap', '.fancybox__thumbs-container'];
          selectors.forEach(function (sel) {
            var el = container.querySelector && container.querySelector(sel);
            if (el) {
              el.style.display = 'flex';
              el.style.overflowX = 'auto';
              el.style.webkitOverflowScrolling = 'touch';
              el.style.justifyContent = 'center';
              // ensure child thumbs visible
              Array.prototype.slice.call(el.querySelectorAll('img')).forEach(function (img) {
                img.style.opacity = '1';
              });

              // scroll active into view
              var active = el.querySelector('.fancybox__thumb--active, .active');
              if (active && active.scrollIntoView) active.scrollIntoView({ inline: 'center', behavior: 'smooth' });
            }
          });
        } catch (err) {
          // fail silently
        }
      }, 260);
    }, false);

    // Robust fallback: observe DOM for Fancybox container nodes and force-show thumbs
    (function () {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes && m.addedNodes.forEach(function (node) {
            try {
              if (!node || !node.querySelector) return;

              var thumbs = node.querySelector('.fancybox__thumbs') || node.querySelector('.fancybox-thumbs') || node.querySelector('.fancybox__thumbs-wrap') || node.querySelector('.fancybox__thumbs-container');
              if (thumbs) {
                thumbs.style.display = 'flex';
                thumbs.style.overflowX = 'auto';
                thumbs.style.webkitOverflowScrolling = 'touch';
                thumbs.style.justifyContent = 'center';
                thumbs.style.gap = '8px';
                Array.prototype.slice.call(thumbs.querySelectorAll('img')).forEach(function (img) {
                  img.style.opacity = '1';
                });
                var active = thumbs.querySelector('.fancybox__thumb--active, .active');
                if (active && active.scrollIntoView) active.scrollIntoView({ inline: 'center', behavior: 'smooth' });
              }
            } catch (err) {}
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    })();

    document.querySelectorAll(".event-gallery-slider").forEach(function (slider) {
      const slides = slider.querySelectorAll(".event-gallery-slide");
      const thumbs = slider.querySelectorAll(".event-gallery-thumb");
      const prevBtn = slider.querySelector(".event-gallery-prev");
      const nextBtn = slider.querySelector(".event-gallery-next");

      if (!slides.length) return;

      let currentIndex = 0;
      let autoplayTimer = null;

      function showSlide(index) {
        currentIndex = (index + slides.length) % slides.length;

        slides.forEach(function (slide, i) {
          slide.classList.toggle("active", i === currentIndex);
        });

        thumbs.forEach(function (thumb, i) {
          thumb.classList.toggle("active", i === currentIndex);
        });
      }

      function nextSlide() {
        showSlide(currentIndex + 1);
      }

      function prevSlide() {
        showSlide(currentIndex - 1);
      }

      function startAutoplay() {
        if (slides.length <= 1) return;

        stopAutoplay();
        autoplayTimer = setInterval(nextSlide, 4000);
      }

      function stopAutoplay() {
        if (autoplayTimer) {
          clearInterval(autoplayTimer);
          autoplayTimer = null;
        }
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          nextSlide();
          startAutoplay();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          prevSlide();
          startAutoplay();
        });
      }

      thumbs.forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          showSlide(Number(thumb.dataset.index || 0));
          startAutoplay();
        });
      });

      slider.addEventListener("mouseenter", stopAutoplay);
      slider.addEventListener("mouseleave", startAutoplay);

      startAutoplay();
    });
  });
</script>`;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceTokens(template, tokens) {
  return Object.entries(tokens).reduce((html, [key, value]) => {
    return html.replaceAll(`{{${key}}}`, value ?? "");
  }, template);
}

function slugify(value = "") {
  const trMap = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
  return String(value)
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (char) => trMap[char] || char)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeSlug(event) {
  return slugify(event.slug || event.title || `event-${event.id}`);
}

function fullDate(event) {
  return [event?.date?.day, event?.date?.month, event?.date?.year].filter(Boolean).join(" ");
}

function eventUrl(event) {
  return `${EVENTS_INDEX_PATH}${safeSlug(event)}/`;
}

function absoluteUrl(pathname) {
  return `${SITE_URL}${pathname}`.replace(/([^:]\/)\/+/g, "$1");
}

function renderEventCards(events) {
  return events
    .map((event, index) => {
      const slug = safeSlug(event);
      const title = escapeHtml(event.title);
      const image = escapeHtml(event.heroImage || event.gallery?.[0] || "images/events.jpg");
      const day = escapeHtml(event.date?.day || "");
      const month = escapeHtml(event.date?.month || "");
      const dateText = escapeHtml(fullDate(event) || event.date?.time || "");
      const location = escapeHtml(event.location?.address || event.sidebar?.items?.find((i) => /yer/i.test(i.label))?.value || event.category || "");

      return `
          <div class="col-lg-4 col-md-6">
            <div class="blog-content">
              <div class="blog-item blog-item${(index % 3) + 1}">
                <div class="blog-img">
                  <a href="${EVENTS_INDEX_PATH}${slug}/"><img src="/${image}" alt="${title}" loading="lazy" /></a>
                  <span class="blog__tag blog__tag${(index % 3) + 1}">
                    <span class="date__num-text">${day}</span>
                    <span class="date__mon-text">${month}</span>
                  </span>
                </div>
                <div class="blog-inner-content">
                  <h3 class="blog__title"><a href="${EVENTS_INDEX_PATH}${slug}/">${title}</a></h3>
                  <p class="blog__desc">${escapeHtml(event.description || stripHtml(event.content?.[0]?.paragraphs?.[0] || "").slice(0, 100))}...</p>
                </div>
              </div>
            </div>
          </div>`;
    })
    .join("\n");
}
function renderLatestHomeEvents(events) {
  return renderEventCards(events.slice(0, 3));
}

function renderGallery(event) {
  const images = Array.isArray(event.gallery) && event.gallery.length ? event.gallery : [event.heroImage].filter(Boolean);

  const groupName = `event-${safeSlug(event)}`;
  const title = escapeHtml(event.title || "Etkinlik fotoğrafı");

  const slides = images
    .map((src, index) => {
      const image = escapeHtml(src);

      return `
        <a
          href="/${image}"
          data-fancybox="${groupName}"
          data-caption="${title}"
          class="event-gallery-slide ${index === 0 ? "active" : ""}"
        >
          <img src="/${image}" alt="${title}" loading="${index === 0 ? "eager" : "lazy"}" />
        </a>`;
    })
    .join("\n");

  const thumbs = images
    .map((src, index) => {
      const image = escapeHtml(src);

      return `
        <button type="button" class="event-gallery-thumb ${index === 0 ? "active" : ""}" data-index="${index}">
          <img src="/${image}" alt="${title}" loading="lazy" />
        </button>`;
    })
    .join("\n");

  return `
    <div class="event-gallery-slider" data-autoplay="true">
      <div class="event-gallery-stage">
        ${slides}

        ${
          images.length > 1
            ? `
              <button type="button" class="event-gallery-arrow event-gallery-prev" aria-label="Önceki görsel">‹</button>
              <button type="button" class="event-gallery-arrow event-gallery-next" aria-label="Sonraki görsel">›</button>
            `
            : ""
        }
      </div>

      ${images.length > 1 ? `<div class="event-gallery-thumbs">${thumbs}</div>` : ""}
    </div>`;
}
function renderContent(event) {
  return (event.content || [])
    .filter((section) => section.heading || (section.paragraphs || []).some(Boolean))
    .map((section, index) => {
      const titleClass = index === 0 ? "event__title" : "event__title event__title2";
      const heading = section.heading ? `<h3 class="${titleClass}">${section.heading}</h3>` : "";
      const paragraphs = (section.paragraphs || [])
        .filter(Boolean)
        .map((p) => `<p class="event__text">${p}</p>`)
        .join("\n                ");
      return `<div class="event-detail-item">
                ${heading}
                ${paragraphs}
              </div>`;
    })
    .join("\n              ");
}

function renderSidebar(event) {
  const items = event.sidebar?.items || [];
  return items.map((item) => `<li><span>${escapeHtml(item.label)}:</span>${escapeHtml(item.value)}</li>`).join("\n                  ");
}

function extractMapSrc(mapEmbedSrc = "") {
  const raw = String(mapEmbedSrc || "").trim();
  if (!raw) return "";
  const srcMatch = raw.match(/src=["']([^"']+)["']/i);
  if (srcMatch) return srcMatch[1];
  return raw.split('"')[0];
}

function renderMap(event) {
  const src = extractMapSrc(event.location?.mapEmbedSrc);
  if (!src) return "";
  return `<div class="event-detail-item event-detail-item2">
                <div class="map-area">
                  <iframe src="${escapeHtml(src)}" width="365" height="450" style="border:0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                </div>
              </div>`;
}

function buildListPage(events, template) {
  const html = replaceTokens(template, {
    SEO_TITLE: "Etkinlikler | İstanbul Atlas Rotary Kulübü",
    SEO_DESCRIPTION: "İstanbul Atlas Rotary Kulübü etkinlikleri, toplantıları ve sosyal sorumluluk projeleri.",
    CANONICAL_URL: absoluteUrl(EVENTS_INDEX_PATH),
    HEADER,
    EVENT_CARDS: renderEventCards(events),
    FOOTER,
    SCRIPTS,
  });
  writeFile(path.join(DIST_DIR, "events", "index.html"), html);
  writeFile(path.join(DIST_DIR, "events.html"), html); // Eski linklerle uyumluluk için.
}

function buildDetailPages(events, template) {
  for (const event of events) {
    const slug = safeSlug(event);
    const pagePath = eventUrl(event);
    const description = event.seo?.description || stripHtml(event.content?.[0]?.paragraphs?.[0] || event.title).slice(0, 155);
    const html = replaceTokens(template, {
      SEO_TITLE: escapeHtml(event.seo?.title || `${event.title} | İstanbul Atlas Rotary Kulübü`),
      SEO_DESCRIPTION: escapeHtml(description),
      SEO_KEYWORDS: escapeHtml((event.seo?.keywords || []).join(", ")),
      CANONICAL_URL: absoluteUrl(pagePath),
      OG_IMAGE: absoluteUrl(`/${event.heroImage || event.gallery?.[0] || "images/events.jpg"}`),
      HEADER,
      GALLERY_IMAGES: renderGallery(event),
      DATE_DAY: escapeHtml(event.date?.day || ""),
      DATE_MONTH: escapeHtml(event.date?.month || ""),
      EVENT_CONTENT: renderContent(event),
      SIDEBAR_TITLE: escapeHtml(event.sidebar?.title || event.organizer || "İstanbul Atlas Rotary Kulübü"),
      SIDEBAR_ITEMS: renderSidebar(event),
      MAP_BLOCK: renderMap(event),
      FOOTER,
      SCRIPTS,
    });
    writeFile(path.join(DIST_DIR, "events", slug, "index.html"), html);
  }
}

function buildSitemap(events, staticRoutes = []) {
  const eventUrls = [EVENTS_INDEX_PATH, ...events.map(eventUrl)];
  const urls = Array.from(new Set([...staticRoutes, ...eventUrls]));
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${absoluteUrl(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${url === "/" ? "1.0" : url === EVENTS_INDEX_PATH ? "0.9" : "0.7"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
  writeFile(path.join(DIST_DIR, "sitemap.xml"), xml);
}

function buildRedirects(events) {
  const lines = [];
  for (const page of STATIC_PAGES) {
    if (page.source !== "index.html") lines.push(`/${page.source} ${page.output} 301`);
  }
  lines.push("/events.html /events/ 301");
  for (const event of events) {
    lines.push(`/events-detail.html?slug=${event.slug} ${eventUrl(event)} 301`);
  }
  writeFile(path.join(DIST_DIR, "_redirects"), lines.join("\n") + "\n");
}

function buildVercelConfig() {
  const config = {
    cleanUrls: true,
    trailingSlash: true,
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ],
    redirects: [
      ...STATIC_PAGES.filter((p) => p.source !== "index.html").map((p) => ({ source: `/${p.source}`, destination: p.output, permanent: true })),
      { source: "/events.html", destination: "/events/", permanent: true },
      { source: "/events-detail.html", destination: "/events/", permanent: true },
    ],
  };
  writeFile(path.join(DIST_DIR, "vercel.json"), JSON.stringify(config, null, 2));
}

function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);

  copyAssets();

  const data = JSON.parse(read(DATA_FILE));
  const events = (data.events || []).filter((event) => event.status !== "draft" && event.status !== "passive");
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

  events.sort((a, b) => {
    const dateA = new Date(a.date.year, monthMap[a.date.month] - 1, a.date.day);
    const dateB = new Date(b.date.year, monthMap[b.date.month] - 1, b.date.day);
    return dateB - dateA; // yeni → eski
  });
  const staticRoutes = buildStaticPages(events);
  const listTemplate = read(LIST_TEMPLATE);
  const detailTemplate = read(DETAIL_TEMPLATE);

  buildListPage(events, listTemplate);
  buildDetailPages(events, detailTemplate);
  buildSitemap(events, staticRoutes);
  buildRedirects(events);
  buildRobots();
  buildVercelConfig();

  console.log(`Build tamamlandı: ${events.length} etkinlik ve ${staticRoutes.length} statik sayfa üretildi.`);
  console.log(`Çıktı klasörü: ${DIST_DIR}`);
}

main();
