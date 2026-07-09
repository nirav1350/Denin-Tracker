/* =========================================================================
   APP — bootstraps the editor (editor.html).
   The public site lives in index.html and is driven by js/view.js.
   ========================================================================= */

(async function init() {
  const source = await Store.load();
  startEditor(source);
})();

/* ---------------- editor mode ---------------- */

function startEditor(source) {
  Editor.pageId = Store.pages()[0].id;
  refreshPageSelect();
  renderSectionList();
  renderCanvas();
  History.init();

  if (source === "seed") toast("Loaded demo content — click Save (or Ctrl+S) to keep your changes.");
  if (source === "published") toast("Loaded published data.json — click Save to keep local edits, Export to publish.");

  /* page controls */
  const pageSelect = document.getElementById("pageSelect");
  pageSelect.addEventListener("change", () => switchPage(pageSelect.value));

  document.getElementById("btnNewPage").addEventListener("click", () => {
    const name = prompt("Name of the new page:");
    if (!name) return;
    const page = Store.addPage(name.trim());
    History.commit();
    switchPage(page.id);
    toast(`Page “${page.name}” created (slug: ${page.slug}).`);
  });

  document.getElementById("btnRenamePage").addEventListener("click", () => {
    const page = Editor.page();
    const name = prompt("Rename page:", page.name);
    if (!name) return;
    page.name = name.trim();
    page.slug = uniqueSlug(page.name, Store.pages().filter(p => p.id !== page.id));
    History.commit();
    refreshPageSelect();
  });

  document.getElementById("btnDeletePage").addEventListener("click", () => {
    if (Store.pages().length === 1) { toast("You can't delete the last page.", "warn"); return; }
    const page = Editor.page();
    if (!confirm(`Delete page “${page.name}” and all its sections?`)) return;
    Store.deletePage(page.id);
    History.commit();
    switchPage(Store.pages()[0].id);
  });

  /* sidebar */
  document.getElementById("btnAddSection").addEventListener("click", openAddModal);
  document.getElementById("btnCloseModal").addEventListener("click", closeAddModal);
  document.getElementById("modal").addEventListener("click", e => {
    if (e.target.id === "modal") closeAddModal();
  });
  document.getElementById("btnBack").addEventListener("click", () => {
    Editor.selectedId = null;
    showListPanel();
    renderSectionList();
    renderCanvas();
  });

  /* preview toggle */
  const exitBtn = document.getElementById("btnExitPreview");
  document.getElementById("btnPreview").addEventListener("click", () => {
    document.body.classList.add("preview");
    exitBtn.hidden = false;
    renderCanvas();
  });
  exitBtn.addEventListener("click", () => {
    document.body.classList.remove("preview");
    exitBtn.hidden = true;
    renderCanvas();
  });

  /* export / import */
  document.getElementById("btnExport").addEventListener("click", async () => {
    toast("Preparing export…");
    /* uploaded media lives in IndexedDB (only in this browser), so embed it
       into data.json as base64 so visitors can see it too */
    const ids = [...new Set(JSON.stringify(Store.data).match(/idb:[a-z0-9]+/g) || [])];
    const map = {};
    for (const id of ids) {
      try {
        const blobFile = await MediaDB.getBlob(id);
        if (blobFile) map[id] = await blobToDataURL(blobFile);
      } catch (e) { /* missing media stays as an empty ref */ }
    }
    const data = JSON.parse(JSON.stringify(Store.data), (k, v) =>
      (typeof v === "string" && map[v]) ? map[v] : v);

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(a.href);

    const mb = json.length / 1024 / 1024;
    toast(mb > 25
      ? `data.json is ${mb.toFixed(1)} MB — it will work, but consider putting big videos in /assets and pasting URLs instead.`
      : "data.json downloaded — commit it to your repo root to publish.");
  });

  const importInput = document.getElementById("importInput");
  document.getElementById("btnImport").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", () => {
    const f = importInput.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data.pages)) throw new Error("Missing pages array");
        Store.data = data;
        History.commit();
        switchPage(Store.pages()[0].id);
        toast("Imported — press Save to keep it (or Undo to go back).");
      } catch (err) {
        toast("Import failed: that file isn't valid Blocksmith data.", "warn");
      }
      importInput.value = "";
    };
    r.readAsText(f);
  });

  /* save / undo / redo */
  document.getElementById("btnSave").addEventListener("click", () => History.save());
  document.getElementById("btnUndo").addEventListener("click", () => History.undo());
  document.getElementById("btnRedo").addEventListener("click", () => History.redo());

  /* keyboard shortcuts */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeAddModal(); return; }
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === "s") { e.preventDefault(); History.save(); return; }
    /* leave Ctrl+Z/Y alone while typing in a field — the browser's own
       text undo should win there; use the toolbar buttons instead */
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName);
    if (typing) return;
    if (key === "z" && !e.shiftKey) { e.preventDefault(); History.undo(); }
    if (key === "y" || (key === "z" && e.shiftKey)) { e.preventDefault(); History.redo(); }
  });
}
