/* =========================================================================
   RENDER — turns section data into HTML. Pure functions, no editor state.
   ========================================================================= */

/* Escape text for safe insertion into HTML / attributes */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* Render a video from an MP4/WebM URL or a YouTube / Vimeo link */
function videoEmbed(url) {
  if (!url) return '<div class="video-frame video-empty">Add a video URL or upload a file</div>';
  const yt = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `<div class="video-frame"><iframe src="https://www.youtube.com/embed/${yt[1]}" title="Video" loading="lazy" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
  const vm = String(url).match(/vimeo\.com\/(\d+)/);
  if (vm) return `<div class="video-frame"><iframe src="https://player.vimeo.com/video/${vm[1]}" title="Video" loading="lazy" allowfullscreen></iframe></div>`;
  return `<div class="video-frame"><video controls preload="metadata" src="${esc(mediaURL(url))}"></video></div>`;
}

/* Background video for the video hero: MP4/upload plays inline;
   YouTube/Vimeo links fall back to a muted looping embed. */
function videoBg(url, fallbackImage) {
  const src = mediaURL(url);
  if (!src) {
    return fallbackImage ? `<img class="bg-media" src="${esc(mediaURL(fallbackImage))}" alt="">` : "";
  }
  const yt = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `<iframe class="bg-media bg-frame" src="https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}&controls=0&playsinline=1" title="Background video" allow="autoplay" tabindex="-1"></iframe>`;
  const vm = String(url).match(/vimeo\.com\/(\d+)/);
  if (vm) return `<iframe class="bg-media bg-frame" src="https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&background=1" title="Background video" tabindex="-1"></iframe>`;
  return `<video class="bg-media" autoplay muted loop playsinline src="${esc(src)}"></video>`;
}

const TEMPLATES = {

  hero(sec) {
    const st = sec.settings;
    const min = { small: "42vh", medium: "62vh", full: "92vh" }[st.height] || "62vh";
    return `
      <div class="hero align-${esc(st.align || "center")}"
           style="min-height:${min};${st.bg_image ? `background-image:url('${esc(mediaURL(st.bg_image))}')` : ""}">
        <div class="hero-overlay" style="opacity:${(Number(st.overlay ?? 45)) / 100}"></div>
        <div class="hero-inner">
          ${st.kicker ? `<p class="kicker">${esc(st.kicker)}</p>` : ""}
          ${st.heading ? `<h1>${esc(st.heading)}</h1>` : ""}
          ${st.subheading ? `<p class="hero-sub">${esc(st.subheading)}</p>` : ""}
          ${st.button_label ? `<a class="btn" href="${esc(st.button_link || "#")}">${esc(st.button_label)}</a>` : ""}
        </div>
      </div>`;
  },

  media_text(sec) {
    const st = sec.settings;
    const media = st.media_type === "video"
      ? videoEmbed(st.video)
      : (st.image
          ? `<img src="${esc(mediaURL(st.image))}" alt="${esc(st.heading || "")}" loading="lazy">`
          : `<div class="img-empty">Add an image</div>`);
    return `
      <div class="split layout-${esc(st.layout || "left")}">
        <div class="split-media">${media}</div>
        <div class="split-copy">
          ${st.heading ? `<h2>${esc(st.heading)}</h2>` : ""}
          ${st.body ? `<p>${esc(st.body)}</p>` : ""}
          ${st.button_label ? `<a class="btn btn-ink" href="${esc(st.button_link || "#")}">${esc(st.button_label)}</a>` : ""}
        </div>
      </div>`;
  },

  gallery(sec) {
    const st = sec.settings;
    const items = sec.blocks.map(b => {
      const s = b.settings;
      const img = s.image
        ? `<img src="${esc(mediaURL(s.image))}" alt="${esc(s.caption || "Gallery image")}" loading="lazy">`
        : `<div class="img-empty">Add an image</div>`;
      const fig = `<figure class="${st.rounded ? "rounded" : ""}">${img}${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ""}</figure>`;
      return s.link ? `<a class="gal-item" href="${esc(s.link)}">${fig}</a>` : `<div class="gal-item">${fig}</div>`;
    }).join("");
    return `
      <div class="wrap">
        ${st.heading ? `<h2 class="sec-title">${esc(st.heading)}</h2>` : ""}
        <div class="gal-grid cols-${esc(st.columns || "3")}">${items || '<p class="empty-note">No images yet — add Image blocks in the editor.</p>'}</div>
      </div>`;
  },

  videos(sec) {
    const st = sec.settings;
    const items = sec.blocks.map(b => `
      <div class="vid-item">
        ${videoEmbed(b.settings.video)}
        ${b.settings.title ? `<p class="vid-title">${esc(b.settings.title)}</p>` : ""}
      </div>`).join("");
    return `
      <div class="wrap">
        ${st.heading ? `<h2 class="sec-title">${esc(st.heading)}</h2>` : ""}
        ${st.intro ? `<p class="sec-intro">${esc(st.intro)}</p>` : ""}
        <div class="vid-grid cols-${esc(st.columns || "2")}">${items || '<p class="empty-note">No videos yet — add Video blocks in the editor.</p>'}</div>
      </div>`;
  },

  features(sec) {
    const st = sec.settings;
    const items = sec.blocks.map(b => {
      const s = b.settings;
      return `
        <div class="feat">
          ${s.image ? `<img class="feat-img" src="${esc(mediaURL(s.image))}" alt="" loading="lazy">` : `<span class="feat-dot"></span>`}
          ${s.title ? `<h3>${esc(s.title)}</h3>` : ""}
          ${s.body ? `<p>${esc(s.body)}</p>` : ""}
        </div>`;
    }).join("");
    return `
      <div class="wrap">
        ${st.heading ? `<h2 class="sec-title">${esc(st.heading)}</h2>` : ""}
        <div class="feat-grid cols-${esc(st.columns || "3")}">${items || '<p class="empty-note">No features yet — add Feature blocks in the editor.</p>'}</div>
      </div>`;
  },

  quotes(sec) {
    const st = sec.settings;
    const items = sec.blocks.map(b => {
      const s = b.settings;
      return `
        <blockquote class="quote">
          <p>“${esc(s.quote)}”</p>
          <footer>
            ${s.avatar ? `<img src="${esc(mediaURL(s.avatar))}" alt="" loading="lazy">` : ""}
            <span><strong>${esc(s.author || "")}</strong>${s.role ? ` · ${esc(s.role)}` : ""}</span>
          </footer>
        </blockquote>`;
    }).join("");
    return `
      <div class="quotes-band" style="background:${esc(st.tint || "#eef1f6")}">
        <div class="wrap">
          ${st.heading ? `<h2 class="sec-title">${esc(st.heading)}</h2>` : ""}
          <div class="quote-grid">${items || '<p class="empty-note">No quotes yet — add Quote blocks in the editor.</p>'}</div>
        </div>
      </div>`;
  }
  ,

  /* ---------------- 7. Video hero ---------------- */
  video_hero(sec) {
    const st = sec.settings;
    const min = { small: "48vh", medium: "64vh", full: "92vh" }[st.height] || "64vh";
    return `
      <div class="vhero" style="min-height:${min}">
        ${videoBg(st.video, st.fallback_image)}
        <div class="hero-overlay" style="opacity:${(Number(st.overlay ?? 45)) / 100}"></div>
        <div class="hero-inner" style="text-align:center">
          ${st.kicker ? `<p class="kicker">${esc(st.kicker)}</p>` : ""}
          ${st.heading ? `<h1>${esc(st.heading)}</h1>` : ""}
          ${st.subheading ? `<p class="hero-sub" style="margin-inline:auto">${esc(st.subheading)}</p>` : ""}
          ${st.button_label ? `<a class="btn" href="${esc(st.button_link || "#")}">${esc(st.button_label)}</a>` : ""}
        </div>
      </div>`;
  },

  /* ---------------- 8. Slideshow ---------------- */
  slideshow(sec) {
    const st = sec.settings;
    const slides = sec.blocks.map(b => {
      const s = b.settings;
      const img = s.image
        ? `<img src="${esc(mediaURL(s.image))}" alt="${esc(s.caption || "Slide")}" loading="lazy">`
        : `<div class="img-empty">Add an image</div>`;
      const inner = `${img}${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ""}`;
      return s.link
        ? `<figure class="slide"><a href="${esc(s.link)}">${inner}</a></figure>`
        : `<figure class="slide">${inner}</figure>`;
    }).join("");
    return `
      <div class="slideshow ${st.height === "tall" ? "tall" : ""}">
        <div class="slide-track">${slides || '<p class="empty-note" style="padding:40px">No slides yet — add Slide blocks in the editor.</p>'}</div>
        ${sec.blocks.length > 1 ? `
          <button class="slide-arrow prev" data-dir="prev" aria-label="Previous slide">‹</button>
          <button class="slide-arrow next" data-dir="next" aria-label="Next slide">›</button>` : ""}
      </div>`;
  },

  /* ---------------- 9. Image collage (masonry) ---------------- */
  collage(sec) {
    const st = sec.settings;
    const items = sec.blocks.map(b => {
      const s = b.settings;
      const img = s.image
        ? `<img src="${esc(mediaURL(s.image))}" alt="${esc(s.caption || "Collage image")}" loading="lazy">`
        : `<div class="img-empty">Add an image</div>`;
      return `<figure class="collage-item">${img}${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ""}</figure>`;
    }).join("");
    return `
      <div class="wrap">
        ${st.heading ? `<h2 class="sec-title">${esc(st.heading)}</h2>` : ""}
        <div class="collage cols-${esc(st.columns || "3")}">${items || '<p class="empty-note">No images yet — add Image blocks in the editor.</p>'}</div>
      </div>`;
  },

  /* ---------------- 10. Logo / image strip ---------------- */
  image_strip(sec) {
    const st = sec.settings;
    const size = Number(st.size || 64);
    const items = sec.blocks.map(b => {
      const s = b.settings;
      const img = s.image
        ? `<img src="${esc(mediaURL(s.image))}" alt="${esc(s.alt || "")}" style="height:${size}px" loading="lazy">`
        : `<div class="img-empty" style="min-height:${size}px;min-width:${size * 2}px">Image</div>`;
      return s.link ? `<a href="${esc(s.link)}">${img}</a>` : img;
    }).join("");
    return `
      <div class="wrap strip-wrap">
        ${st.heading ? `<p class="strip-heading">${esc(st.heading)}</p>` : ""}
        <div class="strip ${st.grayscale ? "gray" : ""}">${items || '<p class="empty-note">No images yet — add Image blocks in the editor.</p>'}</div>
      </div>`;
  },

  /* ---------------- 11. Media cards ---------------- */
  media_cards(sec) {
    const st = sec.settings;
    const cards = sec.blocks.map(b => {
      const s = b.settings;
      const media = s.media_type === "video"
        ? videoEmbed(s.video)
        : (s.image
            ? `<img src="${esc(mediaURL(s.image))}" alt="${esc(s.title || "")}" loading="lazy">`
            : `<div class="img-empty">Add an image</div>`);
      return `
        <article class="mcard">
          ${media}
          <div class="mcard-body">
            ${s.title ? `<h3>${esc(s.title)}</h3>` : ""}
            ${s.body ? `<p>${esc(s.body)}</p>` : ""}
            ${s.link_label ? `<a class="mcard-link" href="${esc(s.link || "#")}">${esc(s.link_label)} →</a>` : ""}
          </div>
        </article>`;
    }).join("");
    return `
      <div class="wrap">
        ${st.heading ? `<h2 class="sec-title">${esc(st.heading)}</h2>` : ""}
        <div class="card-grid cols-${esc(st.columns || "3")}">${cards || '<p class="empty-note">No cards yet — add Card blocks in the editor.</p>'}</div>
      </div>`;
  }
};

/* Slideshow prev/next — event delegation so it works in the editor
   canvas and on the live site alike. */
document.addEventListener("click", e => {
  const btn = e.target.closest(".slide-arrow");
  if (!btn) return;
  e.preventDefault();
  const track = btn.closest(".slideshow")?.querySelector(".slide-track");
  if (track) track.scrollBy({ left: (btn.dataset.dir === "next" ? 1 : -1) * track.clientWidth, behavior: "smooth" });
});

/* Render a whole page into a mount element.
   opts.editable → clicking a section selects it in the editor. */
function renderPage(page, mount, opts = {}) {
  mount.innerHTML = "";
  if (!page || !page.sections.length) {
    mount.innerHTML = `<div class="empty-canvas">This page has no sections yet.<br><span>Use “＋ Add section” in the sidebar.</span></div>`;
    return;
  }
  page.sections.forEach(sec => {
    const el = document.createElement("section");
    el.className = `sec sec-${sec.type}`;
    el.dataset.sid = sec.id;
    el.innerHTML = (TEMPLATES[sec.type] || (() => `<div class="wrap">Unknown section type “${esc(sec.type)}”.</div>`))(sec);
    if (opts.editable) {
      el.classList.add("editable");
      el.title = SCHEMAS[sec.type] ? SCHEMAS[sec.type].name : sec.type;
    }
    mount.appendChild(el);
  });
}
