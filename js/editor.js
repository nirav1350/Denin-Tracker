/* =========================================================================
   EDITOR — sidebar UI. Reads SCHEMAS to build forms, mutates Store.data.
   ========================================================================= */

const Editor = {
  pageId: null,
  selectedId: null,

  page() { return Store.getPage(this.pageId); },
  selected() { return this.page()?.sections.find(s => s.id === this.selectedId) || null; }
};

/* ---------------- canvas ---------------- */

let _renderTimer = null;
function scheduleRender() {              // debounced repaint; history commit is further debounced
  clearTimeout(_renderTimer);
  _renderTimer = setTimeout(() => { renderCanvas(); History.commitDebounced(); }, 120);
}

function renderCanvas() {
  const canvas = document.getElementById("canvas");
  const page = Editor.page();
  MediaDB.resolveAll(page).then(() => {
    renderPage(page, canvas, { editable: true });
    if (Editor.selectedId) {
      canvas.querySelector(`[data-sid="${Editor.selectedId}"]`)?.classList.add("selected");
    }
  });
}

/* Click a section on the canvas → open its settings */
document.getElementById("canvas").addEventListener("click", e => {
  if (document.body.classList.contains("preview")) return;
  if (e.target.closest(".slide-arrow")) return;   // arrows scroll the slideshow instead
  const secEl = e.target.closest(".sec");
  if (!secEl) return;
  if (e.target.closest("a")) e.preventDefault();   // don't navigate while editing
  openEdit(secEl.dataset.sid);
});

/* ---------------- page selector ---------------- */

function refreshPageSelect() {
  const sel = document.getElementById("pageSelect");
  sel.innerHTML = "";
  Store.pages().forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name;
    sel.appendChild(o);
  });
  sel.value = Editor.pageId;
  const page = Editor.page();
  document.getElementById("btnViewSite").href = "index.html?p=" + encodeURIComponent(page ? page.slug : "home");
}

function switchPage(id) {
  Editor.pageId = id;
  Editor.selectedId = null;
  showListPanel();
  refreshPageSelect();
  renderSectionList();
  renderCanvas();
}

/* ---------------- panel switching ---------------- */

function showListPanel() {
  document.getElementById("panelList").hidden = false;
  document.getElementById("panelEdit").hidden = true;
}
function showEditPanel() {
  document.getElementById("panelList").hidden = true;
  document.getElementById("panelEdit").hidden = false;
}

/* ---------------- section list (left panel) ---------------- */

function renderSectionList() {
  const ul = document.getElementById("sectionList");
  ul.innerHTML = "";
  const page = Editor.page();
  if (!page) return;

  page.sections.forEach((sec, i) => {
    const sc = SCHEMAS[sec.type] || { name: sec.type, glyph: "?" };
    const li = document.createElement("li");
    li.className = "sec-row" + (sec.id === Editor.selectedId ? " active" : "");
    li.draggable = true;
    li.dataset.sid = sec.id;
    li.innerHTML = `
      <span class="drag" title="Drag to reorder">⋮⋮</span>
      <span class="glyph">${sc.glyph}</span>
      <button class="name" title="Edit this section">${esc(sc.name)}</button>
      <span class="row-actions">
        <button class="mini" data-act="up"   title="Move up">↑</button>
        <button class="mini" data-act="down" title="Move down">↓</button>
        <button class="mini" data-act="dup"  title="Duplicate">⧉</button>
        <button class="mini danger" data-act="del" title="Remove">✕</button>
      </span>`;

    li.querySelector(".name").addEventListener("click", () => openEdit(sec.id));
    li.querySelector('[data-act="up"]').addEventListener("click", () => { moveItem(page.sections, i, i - 1); afterStructureChange(); });
    li.querySelector('[data-act="down"]').addEventListener("click", () => { moveItem(page.sections, i, i + 1); afterStructureChange(); });
    li.querySelector('[data-act="dup"]').addEventListener("click", () => {
      const copy = structuredClone(sec);
      copy.id = uid();
      copy.blocks.forEach(b => b.id = uid());
      page.sections.splice(i + 1, 0, copy);
      afterStructureChange();
    });
    li.querySelector('[data-act="del"]').addEventListener("click", () => {
      if (!confirm(`Remove this “${sc.name}” section?`)) return;
      page.sections.splice(i, 1);
      if (Editor.selectedId === sec.id) { Editor.selectedId = null; showListPanel(); }
      afterStructureChange();
    });

    /* drag & drop reorder */
    li.addEventListener("dragstart", e => {
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", sec.id);
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.addEventListener("dragover", e => { e.preventDefault(); li.classList.add("drop-target"); });
    li.addEventListener("dragleave", () => li.classList.remove("drop-target"));
    li.addEventListener("drop", e => {
      e.preventDefault();
      li.classList.remove("drop-target");
      const fromId = e.dataTransfer.getData("text/plain");
      const from = page.sections.findIndex(s => s.id === fromId);
      const to = page.sections.findIndex(s => s.id === sec.id);
      if (from > -1 && to > -1 && from !== to) { moveItem(page.sections, from, to); afterStructureChange(); }
    });

    ul.appendChild(li);
  });

  if (!page.sections.length) {
    ul.innerHTML = `<li class="empty-note">No sections yet.</li>`;
  }
}

function afterStructureChange() {
  History.commit();
  renderSectionList();
  renderCanvas();
}

/* ---------------- edit panel (section settings + blocks) ---------------- */

function openEdit(sectionId) {
  Editor.selectedId = sectionId;
  const sec = Editor.selected();
  if (!sec) return;
  const sc = SCHEMAS[sec.type];

  document.getElementById("editTitle").textContent = sc.name;
  const body = document.getElementById("editBody");
  body.innerHTML = "";

  /* section settings */
  (sc.settings || []).forEach(field => {
    body.appendChild(buildField(field, sec.settings[field.id], v => {
      sec.settings[field.id] = v;
      scheduleRender();
    }));
  });

  /* blocks */
  if (sc.blocks) {
    const head = document.createElement("div");
    head.className = "blocks-head";
    head.innerHTML = `<h3>Blocks</h3><span class="hint">${sec.blocks.length}/${sc.blocks.max}</span>`;
    body.appendChild(head);

    const list = document.createElement("div");
    list.className = "block-list";
    sec.blocks.forEach((block, bi) => list.appendChild(buildBlockEditor(sec, sc, block, bi)));
    body.appendChild(list);

    /* one "add" button per block type (usually just one type) */
    Object.entries(sc.blocks.types).forEach(([btype, bdef]) => {
      const add = document.createElement("button");
      add.className = "add-btn";
      add.textContent = `＋ Add ${bdef.name.toLowerCase()}`;
      add.addEventListener("click", () => {
        if (sec.blocks.length >= sc.blocks.max) { toast(`Limit reached (${sc.blocks.max} blocks).`, "warn"); return; }
        sec.blocks.push(newBlock(sec.type, btype));
        History.commit();
        openEdit(sec.id);      // rebuild the panel
        renderCanvas();
      });
      body.appendChild(add);
    });
  }

  renderSectionList();
  renderCanvas();
  showEditPanel();
}

function buildBlockEditor(sec, sc, block, index) {
  const bdef = sc.blocks.types[block.type];
  const det = document.createElement("details");
  det.className = "block-card";
  det.innerHTML = `
    <summary>
      <span>${esc(bdef.name)} ${index + 1}</span>
      <span class="row-actions">
        <button class="mini" data-act="up" title="Move up">↑</button>
        <button class="mini" data-act="down" title="Move down">↓</button>
        <button class="mini danger" data-act="del" title="Remove block">✕</button>
      </span>
    </summary>`;
  const inner = document.createElement("div");
  inner.className = "block-fields";
  (bdef.settings || []).forEach(field => {
    inner.appendChild(buildField(field, block.settings[field.id], v => {
      block.settings[field.id] = v;
      scheduleRender();
    }));
  });
  det.appendChild(inner);

  det.querySelectorAll("summary .mini").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const act = btn.dataset.act;
      if (act === "up")   moveItem(sec.blocks, index, index - 1);
      if (act === "down") moveItem(sec.blocks, index, index + 1);
      if (act === "del")  { if (!confirm("Remove this block?")) return; sec.blocks.splice(index, 1); }
      History.commit();
      openEdit(sec.id);
      renderCanvas();
    });
  });
  return det;
}

/* ---------------- field builders (schema → form controls) ---------------- */

function buildField(field, value, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const id = "f_" + uid();
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = field.label || field.id;
  wrap.appendChild(label);

  switch (field.type) {

    case "textarea": {
      const t = document.createElement("textarea");
      t.id = id; t.rows = 4; t.value = value ?? "";
      t.addEventListener("input", () => onChange(t.value));
      wrap.appendChild(t);
      break;
    }

    case "select": {
      const s = document.createElement("select");
      s.id = id;
      field.options.forEach(o => {
        const op = document.createElement("option");
        op.value = o.v; op.textContent = o.t;
        s.appendChild(op);
      });
      s.value = value ?? field.default;
      s.addEventListener("change", () => onChange(s.value));
      wrap.appendChild(s);
      break;
    }

    case "range": {
      const row = document.createElement("div");
      row.className = "range-row";
      const r = document.createElement("input");
      r.type = "range"; r.id = id;
      r.min = field.min ?? 0; r.max = field.max ?? 100; r.step = field.step ?? 1;
      r.value = value ?? field.default ?? 0;
      const out = document.createElement("output");
      out.textContent = r.value;
      r.addEventListener("input", () => { out.textContent = r.value; onChange(Number(r.value)); });
      row.append(r, out);
      wrap.appendChild(row);
      break;
    }

    case "checkbox": {
      wrap.classList.add("field-check");
      const c = document.createElement("input");
      c.type = "checkbox"; c.id = id; c.checked = !!value;
      c.addEventListener("change", () => onChange(c.checked));
      wrap.insertBefore(c, label);
      break;
    }

    case "color": {
      const c = document.createElement("input");
      c.type = "color"; c.id = id;
      c.value = /^#([0-9a-f]{6})$/i.test(value || "") ? value : (field.default || "#eeeeee");
      c.addEventListener("input", () => onChange(c.value));
      wrap.appendChild(c);
      break;
    }

    case "image":
    case "video":
      wrap.appendChild(buildMediaPicker(field, value, onChange, id));
      break;

    default: {  // text | url
      const t = document.createElement("input");
      t.type = field.type === "url" ? "url" : "text";
      t.id = id; t.value = value ?? "";
      t.addEventListener("input", () => onChange(t.value));
      wrap.appendChild(t);
    }
  }
  return wrap;
}

/* Image/video picker: URL box + Upload (base64) + Clear + live preview.
   Uploads become data-URLs stored in the JSON — fine for small files, but
   for a real site commit files to /assets and paste the relative URL. */
function buildMediaPicker(field, value, onChange, id) {
  const box = document.createElement("div");
  box.className = "media-picker";

  const preview = document.createElement("div");
  preview.className = "media-preview";
  box.appendChild(preview);

  const urlIn = document.createElement("input");
  urlIn.type = "text"; urlIn.id = id;
  urlIn.placeholder = field.type === "image"
    ? "Image URL (or assets/photo.jpg)"
    : "MP4/WebM URL, YouTube or Vimeo link";
  urlIn.value = /^(data:|idb:)/.test(value || "") ? "" : (value || "");
  box.appendChild(urlIn);

  const row = document.createElement("div");
  row.className = "media-btns";
  const upBtn = document.createElement("button");
  upBtn.type = "button"; upBtn.className = "mini wide"; upBtn.textContent = "Upload file";
  const clrBtn = document.createElement("button");
  clrBtn.type = "button"; clrBtn.className = "mini wide danger"; clrBtn.textContent = "Clear";
  row.append(upBtn, clrBtn);
  box.appendChild(row);

  const file = document.createElement("input");
  file.type = "file"; file.hidden = true;
  file.accept = field.type === "image" ? "image/*" : "video/*";
  box.appendChild(file);

  function paint(v) {
    if (!v) { preview.innerHTML = `<span class="hint">No ${field.type} selected</span>`; return; }
    const src = mediaURL(v);
    preview.innerHTML = field.type === "image"
      ? `<img src="${esc(src)}" alt="">`
      : (String(v).match(/youtube|youtu\.be|vimeo/) ? `<span class="hint">Embed: ${esc(v.slice(0, 42))}…</span>`
                                                     : `<video src="${esc(src)}" muted></video>`);
  }
  paint(value);

  urlIn.addEventListener("input", () => { onChange(urlIn.value.trim()); paint(urlIn.value.trim()); });
  upBtn.addEventListener("click", () => file.click());
  clrBtn.addEventListener("click", () => { urlIn.value = ""; onChange(""); paint(""); });

  file.addEventListener("change", async () => {
    const f = file.files[0];
    if (!f) return;
    if (f.size > 200 * 1024 * 1024) {
      toast("That file is over 200 MB — please compress it or host it externally and paste the URL.", "warn");
      file.value = "";
      return;
    }
    try {
      const ref = await MediaDB.put(f);          // stored in IndexedDB, no localStorage limit
      urlIn.value = "";
      onChange(ref);
      paint(ref);
      toast(`Uploaded ${(f.size / 1024 / 1024).toFixed(1)} MB to browser storage.`);
    } catch (err) {
      toast("Upload failed: " + err.message, "warn");
    }
    file.value = "";
  });

  return box;
}

/* ---------------- add-section modal ---------------- */

function openAddModal() {
  const cat = document.getElementById("sectionCatalog");
  cat.innerHTML = "";
  Object.entries(SCHEMAS).forEach(([type, sc]) => {
    const card = document.createElement("button");
    card.className = "cat-card";
    card.innerHTML = `<span class="glyph">${sc.glyph}</span><strong>${esc(sc.name)}</strong><small>${esc(sc.desc)}</small>`;
    card.addEventListener("click", () => {
      const page = Editor.page();
      const sec = newSection(type);
      page.sections.push(sec);
      closeAddModal();
      afterStructureChange();
      openEdit(sec.id);
      sec && document.querySelector(`#canvas [data-sid="${sec.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    cat.appendChild(card);
  });
  document.getElementById("modal").hidden = false;
}
function closeAddModal() { document.getElementById("modal").hidden = true; }
