/* =========================================================================
   SCHEMAS — the "section schema" catalog, modeled on Shopify's {% schema %}.
   Each section type declares:
     name / glyph / desc  → shown in the "Add section" catalog
     settings             → section-level fields (text, image, video, select…)
     blocks               → repeatable child blocks with their own settings
     preset               → default blocks inserted when the section is added
   Field types supported by the editor:
     text | textarea | url | select | range | checkbox | color | image | video
   ========================================================================= */

const SCHEMAS = {

  /* ---------------- 1. Hero banner ---------------- */
  hero: {
    name: "Hero banner",
    glyph: "▲",
    desc: "Full-width banner with background image, heading and button.",
    settings: [
      { id: "kicker",       type: "text",     label: "Kicker (small line above)", default: "New collection" },
      { id: "heading",      type: "text",     label: "Heading", default: "Build pages out of blocks" },
      { id: "subheading",   type: "textarea", label: "Subheading", default: "A section-based page builder that runs entirely in the browser." },
      { id: "bg_image",     type: "image",    label: "Background image", default: "https://picsum.photos/seed/bsmith-hero/1600/900" },
      { id: "overlay",      type: "range",    label: "Overlay darkness", min: 0, max: 80, step: 5, default: 45 },
      { id: "height",       type: "select",   label: "Section height", default: "medium",
        options: [ {v:"small",t:"Small"}, {v:"medium",t:"Medium"}, {v:"full",t:"Full screen"} ] },
      { id: "align",        type: "select",   label: "Content alignment", default: "center",
        options: [ {v:"left",t:"Left"}, {v:"center",t:"Center"} ] },
      { id: "button_label", type: "text",     label: "Button label", default: "Explore sections" },
      { id: "button_link",  type: "url",      label: "Button link", default: "#" }
    ],
    blocks: null
  },

  /* ---------------- 2. Media + text split ---------------- */
  media_text: {
    name: "Media with text",
    glyph: "◧",
    desc: "Image or video beside a text column. Flippable layout.",
    settings: [
      { id: "layout",     type: "select",   label: "Media position", default: "left",
        options: [ {v:"left",t:"Media left"}, {v:"right",t:"Media right"} ] },
      { id: "media_type", type: "select",   label: "Media type", default: "image",
        options: [ {v:"image",t:"Image"}, {v:"video",t:"Video"} ] },
      { id: "image",      type: "image",    label: "Image", default: "https://picsum.photos/seed/bsmith-split/900/700" },
      { id: "video",      type: "video",    label: "Video (used when media type is video)", default: "" },
      { id: "heading",    type: "text",     label: "Heading", default: "Edit everything from the sidebar" },
      { id: "body",       type: "textarea", label: "Text", default: "Every section is described by a schema — the same idea Shopify themes use. The editor reads the schema and builds the form for you: swap images, rewrite copy, reorder blocks." },
      { id: "button_label", type: "text",   label: "Button label", default: "" },
      { id: "button_link",  type: "url",    label: "Button link", default: "#" }
    ],
    blocks: null
  },

  /* ---------------- 3. Image gallery ---------------- */
  gallery: {
    name: "Image gallery",
    glyph: "▦",
    desc: "Responsive grid of images with optional captions.",
    settings: [
      { id: "heading", type: "text",   label: "Heading", default: "Gallery" },
      { id: "columns", type: "select", label: "Columns (desktop)", default: "3",
        options: [ {v:"2",t:"2"}, {v:"3",t:"3"}, {v:"4",t:"4"} ] },
      { id: "rounded", type: "checkbox", label: "Rounded corners", default: true }
    ],
    blocks: {
      max: 12,
      types: {
        image: {
          name: "Image",
          settings: [
            { id: "image",   type: "image", label: "Image", default: "" },
            { id: "caption", type: "text",  label: "Caption", default: "" },
            { id: "link",    type: "url",   label: "Link (optional)", default: "" }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-g1/800/600", caption: "Sample one" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-g2/800/600", caption: "Sample two" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-g3/800/600", caption: "Sample three" } }
    ]}
  },

  /* ---------------- 4. Video showcase ---------------- */
  videos: {
    name: "Video showcase",
    glyph: "▸",
    desc: "Grid of videos — MP4 uploads/URLs, YouTube or Vimeo links.",
    settings: [
      { id: "heading", type: "text", label: "Heading", default: "Watch it work" },
      { id: "intro",   type: "textarea", label: "Intro text", default: "" },
      { id: "columns", type: "select", label: "Columns (desktop)", default: "2",
        options: [ {v:"1",t:"1"}, {v:"2",t:"2"}, {v:"3",t:"3"} ] }
    ],
    blocks: {
      max: 9,
      types: {
        video: {
          name: "Video",
          settings: [
            { id: "video", type: "video", label: "Video file or YouTube/Vimeo URL", default: "" },
            { id: "title", type: "text",  label: "Title", default: "" }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "video", settings: { video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", title: "Sample MP4" } },
      { type: "video", settings: { video: "https://www.youtube.com/watch?v=ysz5S6PUM-U", title: "Sample YouTube embed" } }
    ]}
  },

  /* ---------------- 5. Feature columns ---------------- */
  features: {
    name: "Feature columns",
    glyph: "☰",
    desc: "Columns of icon/image + title + text.",
    settings: [
      { id: "heading", type: "text", label: "Heading", default: "Why sections?" },
      { id: "columns", type: "select", label: "Columns (desktop)", default: "3",
        options: [ {v:"2",t:"2"}, {v:"3",t:"3"}, {v:"4",t:"4"} ] }
    ],
    blocks: {
      max: 8,
      types: {
        feature: {
          name: "Feature",
          settings: [
            { id: "image", type: "image",    label: "Icon / image (optional)", default: "" },
            { id: "title", type: "text",     label: "Title", default: "Feature title" },
            { id: "body",  type: "textarea", label: "Text", default: "Describe the feature in a sentence or two." }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "feature", settings: { title: "Schema-driven", body: "Sections declare their settings and blocks; the editor builds the form automatically." } },
      { type: "feature", settings: { title: "No backend", body: "Everything is HTML, CSS and vanilla JavaScript — perfect for GitHub Pages." } },
      { type: "feature", settings: { title: "Portable content", body: "Export your pages as data.json and commit it next to the code." } }
    ]}
  },

  /* ---------------- 6. Quotes ---------------- */
  quotes: {
    name: "Quotes",
    glyph: "❝",
    desc: "Testimonials or pull-quotes with author and avatar.",
    settings: [
      { id: "heading", type: "text", label: "Heading", default: "What people say" },
      { id: "tint",    type: "color", label: "Background tint", default: "#eef1f6" }
    ],
    blocks: {
      max: 6,
      types: {
        quote: {
          name: "Quote",
          settings: [
            { id: "quote",  type: "textarea", label: "Quote", default: "This is exactly the kind of tool I wanted." },
            { id: "author", type: "text",     label: "Author", default: "A. Person" },
            { id: "role",   type: "text",     label: "Role", default: "" },
            { id: "avatar", type: "image",    label: "Avatar (optional)", default: "" }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "quote", settings: { quote: "Reordering sections is instant, and exporting to JSON means my content lives in the repo with the code.", author: "Demo user", role: "Front-end tinkerer" } },
      { type: "quote", settings: { quote: "Feels like a tiny Shopify theme editor that fits in a static site.", author: "Another user", role: "Indie maker" } }
    ]}
  },

  /* ---------------- 7. Video hero ---------------- */
  video_hero: {
    name: "Video hero",
    glyph: "▶",
    desc: "Full-width banner with a looping background video.",
    settings: [
      { id: "video",          type: "video",    label: "Background video (MP4 upload/URL, YouTube or Vimeo)", default: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
      { id: "fallback_image", type: "image",    label: "Fallback image (shown if no video)", default: "" },
      { id: "kicker",         type: "text",     label: "Kicker (small line above)", default: "Now in motion" },
      { id: "heading",        type: "text",     label: "Heading", default: "A hero that moves" },
      { id: "subheading",     type: "textarea", label: "Subheading", default: "Background video plays muted and loops automatically." },
      { id: "overlay",        type: "range",    label: "Overlay darkness", min: 0, max: 80, step: 5, default: 45 },
      { id: "height",         type: "select",   label: "Section height", default: "medium",
        options: [ {v:"small",t:"Small"}, {v:"medium",t:"Medium"}, {v:"full",t:"Full screen"} ] },
      { id: "button_label",   type: "text",     label: "Button label", default: "" },
      { id: "button_link",    type: "url",      label: "Button link", default: "#" }
    ],
    blocks: null
  },

  /* ---------------- 8. Slideshow ---------------- */
  slideshow: {
    name: "Slideshow",
    glyph: "⧉",
    desc: "Full-width image carousel with arrows and captions.",
    settings: [
      { id: "height", type: "select", label: "Slide height", default: "short",
        options: [ {v:"short",t:"Short"}, {v:"tall",t:"Tall"} ] }
    ],
    blocks: {
      max: 10,
      types: {
        slide: {
          name: "Slide",
          settings: [
            { id: "image",   type: "image", label: "Image", default: "" },
            { id: "caption", type: "text",  label: "Caption", default: "" },
            { id: "link",    type: "url",   label: "Link (optional)", default: "" }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "slide", settings: { image: "https://picsum.photos/seed/bs-s1/1600/800", caption: "First slide" } },
      { type: "slide", settings: { image: "https://picsum.photos/seed/bs-s2/1600/800", caption: "Second slide" } },
      { type: "slide", settings: { image: "https://picsum.photos/seed/bs-s3/1600/800", caption: "Third slide" } }
    ]}
  },

  /* ---------------- 9. Image collage ---------------- */
  collage: {
    name: "Image collage",
    glyph: "▤",
    desc: "Masonry-style collage that keeps each image's natural shape.",
    settings: [
      { id: "heading", type: "text",   label: "Heading", default: "Collage" },
      { id: "columns", type: "select", label: "Columns (desktop)", default: "3",
        options: [ {v:"2",t:"2"}, {v:"3",t:"3"}, {v:"4",t:"4"} ] }
    ],
    blocks: {
      max: 16,
      types: {
        image: {
          name: "Image",
          settings: [
            { id: "image",   type: "image", label: "Image", default: "" },
            { id: "caption", type: "text",  label: "Caption", default: "" }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-c1/700/900", caption: "Tall" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-c2/700/500", caption: "Wide" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-c3/700/700", caption: "Square" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-c4/700/560", caption: "" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-c5/700/980", caption: "" } }
    ]}
  },

  /* ---------------- 10. Logo / image strip ---------------- */
  image_strip: {
    name: "Image strip",
    glyph: "═",
    desc: "A slim centered row of logos or small images.",
    settings: [
      { id: "heading",   type: "text",     label: "Heading", default: "Trusted by" },
      { id: "size",      type: "range",    label: "Image height (px)", min: 40, max: 120, step: 4, default: 64 },
      { id: "grayscale", type: "checkbox", label: "Grayscale images", default: true }
    ],
    blocks: {
      max: 12,
      types: {
        image: {
          name: "Image",
          settings: [
            { id: "image", type: "image", label: "Image / logo", default: "" },
            { id: "alt",   type: "text",  label: "Alt text", default: "" },
            { id: "link",  type: "url",   label: "Link (optional)", default: "" }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-l1/240/120", alt: "Logo one" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-l2/240/120", alt: "Logo two" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-l3/240/120", alt: "Logo three" } },
      { type: "image", settings: { image: "https://picsum.photos/seed/bs-l4/240/120", alt: "Logo four" } }
    ]}
  },

  /* ---------------- 11. Media cards ---------------- */
  media_cards: {
    name: "Media cards",
    glyph: "▣",
    desc: "Cards mixing images and videos with title, text and link.",
    settings: [
      { id: "heading", type: "text",   label: "Heading", default: "Highlights" },
      { id: "columns", type: "select", label: "Columns (desktop)", default: "3",
        options: [ {v:"2",t:"2"}, {v:"3",t:"3"} ] }
    ],
    blocks: {
      max: 9,
      types: {
        card: {
          name: "Card",
          settings: [
            { id: "media_type", type: "select",   label: "Media type", default: "image",
              options: [ {v:"image",t:"Image"}, {v:"video",t:"Video"} ] },
            { id: "image",      type: "image",    label: "Image", default: "" },
            { id: "video",      type: "video",    label: "Video (used when media type is video)", default: "" },
            { id: "title",      type: "text",     label: "Title", default: "Card title" },
            { id: "body",       type: "textarea", label: "Text", default: "" },
            { id: "link_label", type: "text",     label: "Link label", default: "" },
            { id: "link",       type: "url",      label: "Link", default: "#" }
          ]
        }
      }
    },
    preset: { blocks: [
      { type: "card", settings: { media_type: "image", image: "https://picsum.photos/seed/bs-m1/800/500", title: "An image card", body: "Cards can hold an image or a video." } },
      { type: "card", settings: { media_type: "video", video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", title: "A video card", body: "This one plays a video instead." } },
      { type: "card", settings: { media_type: "image", image: "https://picsum.photos/seed/bs-m3/800/500", title: "Another image", body: "Add a link label to show a link.", link_label: "Learn more" } }
    ]}
  }
};

/* =========================================================================
   SEED — starter content used the first time the app runs
   (and whenever no localStorage data or data.json is found).
   ========================================================================= */

const SEED = {
  version: 1,
  pages: [
    {
      id: "pg-home",
      name: "Home",
      slug: "home",
      sections: [
        { id: "s-hero", type: "hero", settings: {
            kicker: "Static-site page builder", heading: "Build pages out of blocks",
            subheading: "Add sections, edit their content, reorder them — then export and push to GitHub Pages.",
            bg_image: "https://picsum.photos/seed/bsmith-hero/1600/900",
            overlay: 45, height: "medium", align: "center",
            button_label: "See the sections", button_link: "#"
          }, blocks: [] },
        { id: "s-feat", type: "features", settings: { heading: "Why sections?", columns: "3" },
          blocks: [
            { id: "b-f1", type: "feature", settings: { image: "", title: "Schema-driven", body: "Sections declare their settings and blocks; the editor builds the form automatically." } },
            { id: "b-f2", type: "feature", settings: { image: "", title: "No backend", body: "Everything is HTML, CSS and vanilla JavaScript — perfect for GitHub Pages." } },
            { id: "b-f3", type: "feature", settings: { image: "", title: "Portable content", body: "Export your pages as data.json and commit it next to the code." } }
          ] },
        { id: "s-split", type: "media_text", settings: {
            layout: "left", media_type: "image",
            image: "https://picsum.photos/seed/bsmith-split/900/700", video: "",
            heading: "Edit everything from the sidebar",
            body: "Select a section to open its settings. Text, images, videos and repeatable blocks are all editable — the same mental model as Shopify's theme editor.",
            button_label: "", button_link: "#"
          }, blocks: [] },
        { id: "s-gal", type: "gallery", settings: { heading: "Gallery", columns: "3", rounded: true },
          blocks: [
            { id: "b-g1", type: "image", settings: { image: "https://picsum.photos/seed/bs-g1/800/600", caption: "Sample one", link: "" } },
            { id: "b-g2", type: "image", settings: { image: "https://picsum.photos/seed/bs-g2/800/600", caption: "Sample two", link: "" } },
            { id: "b-g3", type: "image", settings: { image: "https://picsum.photos/seed/bs-g3/800/600", caption: "Sample three", link: "" } },
            { id: "b-g4", type: "image", settings: { image: "https://picsum.photos/seed/bs-g4/800/600", caption: "Sample four", link: "" } },
            { id: "b-g5", type: "image", settings: { image: "https://picsum.photos/seed/bs-g5/800/600", caption: "Sample five", link: "" } },
            { id: "b-g6", type: "image", settings: { image: "https://picsum.photos/seed/bs-g6/800/600", caption: "Sample six", link: "" } }
          ] },
        { id: "s-vid", type: "videos", settings: { heading: "Watch it work", intro: "MP4 files, YouTube and Vimeo links all render correctly.", columns: "2" },
          blocks: [
            { id: "b-v1", type: "video", settings: { video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", title: "Sample MP4" } },
            { id: "b-v2", type: "video", settings: { video: "https://www.youtube.com/watch?v=ysz5S6PUM-U", title: "Sample YouTube embed" } }
          ] },
        { id: "s-quo", type: "quotes", settings: { heading: "What people say", tint: "#eef1f6" },
          blocks: [
            { id: "b-q1", type: "quote", settings: { quote: "Reordering sections is instant, and exporting to JSON means my content lives in the repo with the code.", author: "Demo user", role: "Front-end tinkerer", avatar: "" } },
            { id: "b-q2", type: "quote", settings: { quote: "Feels like a tiny Shopify theme editor that fits in a static site.", author: "Another user", role: "Indie maker", avatar: "" } }
          ] }
      ]
    },
    {
      id: "pg-about",
      name: "About",
      slug: "about",
      sections: [
        { id: "s-ah", type: "hero", settings: {
            kicker: "About", heading: "A second page, to prove pages work",
            subheading: "Create as many pages as you like — each one is its own stack of sections.",
            bg_image: "https://picsum.photos/seed/bsmith-about/1600/900",
            overlay: 50, height: "small", align: "left",
            button_label: "", button_link: "#"
          }, blocks: [] },
        { id: "s-at", type: "media_text", settings: {
            layout: "right", media_type: "image",
            image: "https://picsum.photos/seed/bsmith-about2/900/700", video: "",
            heading: "Content lives in data.json",
            body: "While you edit, everything is saved to your browser's localStorage. When you're happy, hit Export and commit the file — visitors will see exactly what you built.",
            button_label: "", button_link: "#"
          }, blocks: [] }
      ]
    }
  ]
};
