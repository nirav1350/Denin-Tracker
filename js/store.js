/* =========================================================================
   STORE — loads/saves site data.
   Priority when loading:  localStorage → data.json (published) → SEED.
   ========================================================================= */

const LS_KEY = "blocksmith:v1";

const Store = {
  data: null,

  async load() {
    // 1. Draft in this browser
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try { this.data = JSON.parse(raw); return "local"; } catch (e) { /* corrupt → fall through */ }
    }
    // 2. Published data committed to the repo
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (res.ok) { this.data = await res.json(); return "published"; }
    } catch (e) { /* file:// or missing → fall through */ }
    // 3. Demo seed
    this.data = structuredClone(SEED);
    return "seed";
  },

  save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.data));
    } catch (e) {
      toast("Browser storage is full — prefer image/video URLs over big uploads.", "warn");
    }
  },

  pages()            { return this.data.pages; },
  getPage(id)        { return this.data.pages.find(p => p.id === id); },
  getPageBySlug(s)   { return this.data.pages.find(p => p.slug === s); },

  addPage(name) {
    const page = { id: uid(), name, slug: uniqueSlug(name, this.data.pages), sections: [] };
    this.data.pages.push(page);
    return page;
  },

  deletePage(id) {
    this.data.pages = this.data.pages.filter(p => p.id !== id);
  }
};

/* ---------------- small helpers ---------------- */

function uid() {
  return "x" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "page";
}

function uniqueSlug(name, pages) {
  let base = slugify(name), slug = base, n = 2;
  while (pages.some(p => p.slug === slug)) slug = base + "-" + n++;
  return slug;
}

/* Build a fresh section instance from its schema (defaults + preset blocks) */
function newSection(type) {
  const sc = SCHEMAS[type];
  const s = { id: uid(), type, settings: {}, blocks: [] };
  (sc.settings || []).forEach(f => { s.settings[f.id] = f.default ?? ""; });
  if (sc.preset && sc.preset.blocks) {
    sc.preset.blocks.forEach(b => s.blocks.push(newBlock(type, b.type, b.settings)));
  }
  return s;
}

/* Build a fresh block instance for a section type */
function newBlock(sectionType, blockType, overrides = {}) {
  const bs = SCHEMAS[sectionType].blocks.types[blockType];
  const b = { id: uid(), type: blockType, settings: {} };
  (bs.settings || []).forEach(f => { b.settings[f.id] = f.default ?? ""; });
  Object.assign(b.settings, overrides);
  return b;
}

/* Move an array item from index i to index j (clamped) */
function moveItem(arr, i, j) {
  if (j < 0 || j >= arr.length) return;
  const [item] = arr.splice(i, 1);
  arr.splice(j, 0, item);
}

/* Tiny toast helper (defined here so Store.save can use it early) */
function toast(msg, kind = "ok") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast " + kind;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 3200);
}
