/* events-detail.js
   events-detail.html yapisini bozmadan JSON'dan sayfayi doldurur.
*/

;(() => {
  "use strict"

  // TODO: Bunu projenizdeki gerçek JSON yoluna göre değiştirin.
  // Örn: "data/events.json" veya "js/events.json" vb.
  const JSON_URL = "data/events.json"

  const $ = window.jQuery

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get("slug")
    return slug ? decodeURIComponent(slug).trim() : ""
  }

  // JSON içindeki slug bazen yanlışlıkla "events-detail.html?slug=...?...".
  // Bu fonksiyon hem temizler hem de karşılaştırmayı toleranslı yapar.
  function normalizeSlug(s) {
    if (!s) return ""
    let x = String(s).trim()

    // Eğer içinde "slug=" geçiyorsa en sondaki slug değerini al
    // Örn: "events-detail.html?slug=abc?slug=abc" -> "abc"
    const idx = x.lastIndexOf("slug=")
    if (idx !== -1) {
      x = x.slice(idx + 5)
    }

    // Sonda saçma query parçaları kalmışsa kes
    x = x.split("&")[0].split("?")[0].trim()

    return decodeURIComponent(x)
  }

  async function fetchEvents() {
    const res = await fetch(JSON_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`JSON okunamadı: ${res.status}`)
    const data = await res.json()
    if (!data || !Array.isArray(data.events)) throw new Error("JSON formatı beklenen gibi değil (events[] yok).")
    return data.events
  }

  function setText(el, text) {
    if (!el) return
    el.textContent = text ?? ""
  }

  function setHTML(el, html) {
    if (!el) return
    el.innerHTML = html ?? ""
  }

  function ensureMeta(nameOrProp, value, isProperty = false) {
    if (!value) return
    const selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`
    let tag = document.head.querySelector(selector)
    if (!tag) {
      tag = document.createElement("meta")
      if (isProperty) tag.setAttribute("property", nameOrProp)
      else tag.setAttribute("name", nameOrProp)
      document.head.appendChild(tag)
    }
    tag.setAttribute("content", value)
  }

  function rebuildGallery(galleryArr) {
    const gallery = document.querySelector(".event-gallery")
    if (!gallery) return

    // Owl init olmuşsa önce destroy (bozulmayı önler)
    if ($ && $(gallery).hasClass("owl-loaded")) {
      $(gallery).trigger("destroy.owl.carousel")
      // Owl bazı wrapper'lar bırakabiliyor; temizleyelim
      gallery.classList.remove("owl-loaded")
      gallery.innerHTML = ""
    } else {
      gallery.innerHTML = ""
    }

    ;(galleryArr || []).forEach(src => {
      const img = document.createElement("img")
      img.src = src
      img.alt = ""
      gallery.appendChild(img)
    })

    // Yeniden init
    if ($ && typeof $(gallery).owlCarousel === "function") {
      $(gallery).owlCarousel({
        items: 1,
        loop: true,
        nav: true,
        dots: false,
        autoplay: true,
        autoplayTimeout: 4000,
        navText: ['<span class="gallery-arrow left">&#10094;</span>', '<span class="gallery-arrow right">&#10095;</span>'],
      })
    }
  }

  function fillSidebar(sidebar, eventObj) {
    // Başlık
    const sidebarTitle = document.querySelector(".event-detail-sidebar .event-detail-item h3.event__title")
    setText(sidebarTitle, sidebar?.title || "")

    // Liste
    const list = document.querySelector(".event-detail-sidebar .event__list")
    if (list) {
      list.innerHTML = ""
      ;(sidebar?.items || []).forEach(it => {
        const li = document.createElement("li")
        li.innerHTML = `<span>${it.label ?? ""}</span> ${it.value ?? ""}`
        list.appendChild(li)
      })

      // Eğer sidebar.items boşsa, yine de event alanlarından minimum doldur
      if (!(sidebar?.items || []).length) {
        const fallback = [
          { label: "Saat", value: eventObj?.date?.time },
          { label: "Tarih", value: `${eventObj?.date?.day ?? ""} ${eventObj?.date?.month ?? ""} ${eventObj?.date?.year ?? ""}`.trim() },
          { label: "Kategori", value: eventObj?.category },
          { label: "İletişim", value: eventObj?.contact?.phone },
          { label: "Website", value: eventObj?.contact?.website?.replace(/^https?:\/\//, "") },
          { label: "Yer", value: eventObj?.location?.address },
        ].filter(x => x.value)

        fallback.forEach(it => {
          const li = document.createElement("li")
          li.innerHTML = `<span>${it.label}</span> ${it.value}`
          list.appendChild(li)
        })
      }
    }

    // Harita iframe
    const iframe = document.querySelector(".event-detail-sidebar iframe")
    if (iframe && eventObj?.location?.mapEmbedSrc) {
      iframe.src = eventObj.location.mapEmbedSrc
    }
  }

  function fillDateTag(eventObj) {
    const dayEl = document.querySelector(".blog_tag .date__num-text")
    const monEl = document.querySelector(".blog_tag .date__mon-text")
    setText(dayEl, eventObj?.date?.day || "")
    setText(monEl, eventObj?.date?.month || "")
  }

  function fillMainContent(eventObj) {
    // Başlık: ilk bloktaki h3.event__title
    const titleEl = document.querySelector(".event-detail-content .event-detail-item h3.event__title")
    setText(titleEl, eventObj?.title || "")

    // Metin alanı: elindeki HTML şu an 2 adet event-detail-item içeriyor.
    // Biz JSON'daki content[] kadar dinamik oluşturup event-detail-content'u baştan kuracağız.
    const container = document.querySelector(".event-detail-content")
    if (!container) return

    container.innerHTML = ""

    ;(eventObj?.content || []).forEach((block, idx) => {
      const item = document.createElement("div")
      item.className = "event-detail-item"

      // İstersen 2. başlığa senin HTML'indeki gibi ek class verelim (mevcut CSS'i korumak için)
      const h3 = document.createElement("h3")
      h3.className = "event__title" + (idx === 1 ? " event__title2" : "")
      setText(h3, block.heading || "")
      item.appendChild(h3)

      ;(block.paragraphs || []).forEach(pText => {
        const p = document.createElement("p")
        p.className = "event__text"
        // JSON'da istersen <strong> gibi HTML kullanabil diye innerHTML ile basıyorum.
        // Plain text ise yine sorun olmaz.
        setHTML(p, pText || "")
        item.appendChild(p)
      })

      container.appendChild(item)
    })
  }

  function fillHeroImage(eventObj) {
    // Bu sayfada heroImage doğrudan IMG olarak kullanılmıyor, ama istersen:
    // - ilk galerinin yerine tek görsel basmak yerine
    // - galerinin ilk elemanına heroImage ekleyebilirsin
    // Ben burada: eğer gallery boşsa heroImage'ı gallery'e tek eleman olarak koyuyorum.
    if ((!eventObj?.gallery || !eventObj.gallery.length) && eventObj?.heroImage) {
      eventObj.gallery = [eventObj.heroImage]
    }
  }

  function applySEO(eventObj) {
    const seo = eventObj?.seo || {}
    if (seo.title) document.title = seo.title
    if (seo.description) ensureMeta("description", seo.description)
    if (Array.isArray(seo.keywords) && seo.keywords.length) {
      ensureMeta("keywords", seo.keywords.join(", "))
    }

    // Bonus: Open Graph (paylaşım önizleme)
    if (seo.title) ensureMeta("og:title", seo.title, true)
    if (seo.description) ensureMeta("og:description", seo.description, true)
    if (eventObj?.heroImage) ensureMeta("og:image", eventObj.heroImage, true)
  }

  async function init() {
    try {
      const events = await fetchEvents()

      const slugFromUrl = normalizeSlug(getSlugFromUrl())

      // slug yoksa 1. active etkinlik
      let selected = events.find(e => normalizeSlug(e.slug) === slugFromUrl) || events.find(e => normalizeSlug(e.slug).includes(slugFromUrl) && slugFromUrl) || events.find(e => e.status === "active") || events[0]

      if (!selected) return

      fillHeroImage(selected)
      rebuildGallery(selected.gallery)
      fillDateTag(selected)
      fillMainContent(selected)
      fillSidebar(selected.sidebar, selected)
      applySEO(selected)
    } catch (err) {
      console.error("[events-detail] hata:", err)

      // Minimal kullanıcı mesajı (HTML/CSS bozmadan)
      const container = document.querySelector(".event-detail-content")
      if (container) {
        container.innerHTML = '<div class="event-detail-item"><h3 class="event__title">Etkinlik bulunamadı</h3><p class="event__text">İlgili etkinlik verisi yüklenemedi. Konsolda hata detayını görebilirsin.</p></div>'
      }
    }
  }

  // DOM hazır olunca çalış
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
