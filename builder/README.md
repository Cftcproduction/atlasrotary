# Atlas Rotary Static Site Generator

Bu yapı klasik static site generator mantığıyla çalışır.

## Çıktı mantığı

Build sonrası tüm çıktı `builder/dist/` içine yazılır.

Üretilen temiz URL yapısı:

- Ana sayfa: `https://www.atlasrotary.org/`
- Hakkımızda: `https://www.atlasrotary.org/about/`
- Ekibimiz: `https://www.atlasrotary.org/team/`
- Projeler: `https://www.atlasrotary.org/projects/`
- Sunum: `https://www.atlasrotary.org/presentation/`
- İletişim: `https://www.atlasrotary.org/contact/`
- Etkinlik listesi: `https://www.atlasrotary.org/events/`
- Etkinlik detayı: `https://www.atlasrotary.org/events/etkinlik-slug/`

## Klasör yerleşimi

Bu `builder` klasörü ana proje klasörünün içinde durmalı:

```txt
atlasrotary/
  index.html
  about.html
  team.html
  projects.html
  presentation.html
  contact.html
  css/
  js/
  images/
  fonts/
  builder/
    data/events.json
    scripts/build.js
    templates/events-list.html
    templates/event-detail.html
    dist/
```

## Çalıştırma

```bash
cd builder
npm install
npm run build
```

## Build ne yapar?

1. `../index.html`, `../about.html`, `../team.html`, `../projects.html`, `../presentation.html`, `../contact.html` dosyalarını okur.
2. Bu dosyaları temiz URL mantığıyla `dist/` içine üretir.
3. `data/events.json` içindeki aktif etkinlikleri okur.
4. `/events/` liste sayfasını üretir.
5. Her etkinlik için `/events/slug/index.html` üretir.
6. Eski `.html` linklerini temiz URL'lere çevirir.
7. `sitemap.xml`, `robots.txt`, `_redirects`, `vercel.json` üretir.
8. `css`, `js`, `images`, `fonts`, `webfonts`, `assets` klasörlerini `dist/` içine kopyalar.

## Deploy

Vercel veya hosting tarafında yayınlanacak klasör:

```txt
builder/dist
```

Vercel kullanıyorsan Output Directory alanını `dist` yapman gerekir. Root Directory olarak `builder` seçildiyse build komutu `npm run build` olmalı.
