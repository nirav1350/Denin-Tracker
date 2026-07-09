/* =========================================================================
   HISTORY — undo/redo stack + explicit Save for the editor.
   - Every change commits a snapshot of Store.data (typing is debounced,
     so one burst of typing = one undo step).
   - Nothing is written to localStorage until the user clicks Save
     (or presses Ctrl/Cmd+S). index.html reads what was last saved.
   ========================================================================= */

const History = {
  stack: [],
  idx: -1,
  max: 60,          // keep the last 60 states
  dirty: false,
  _t: null,

  /* call once after the editor has loaded its data */
  init() {
    this.stack = [JSON.stringify(Store.data)];
    this.idx = 0;
    this.dirty = false;
    this.updateUI();
  },

  /* record the current state as a new undo step */
  commit() {
    const snap = JSON.stringify(Store.data);
    if (snap === this.stack[this.idx]) return;      // nothing actually changed
    this.stack = this.stack.slice(0, this.idx + 1); // drop any redo branch
    this.stack.push(snap);
    if (this.stack.length > this.max) this.stack.shift();
    this.idx = this.stack.length - 1;
    this.dirty = true;
    this.updateUI();
  },

  /* debounced commit for continuous typing / slider drags */
  commitDebounced(delay = 500) {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.commit(), delay);
  },

  undo() { if (this.idx > 0) { this.idx--; this.restore(); } },
  redo() { if (this.idx < this.stack.length - 1) { this.idx++; this.restore(); } },

  restore() {
    Store.data = JSON.parse(this.stack[this.idx]);
    this.dirty = true;

    /* re-sync editor state with the restored data */
    if (!Store.getPage(Editor.pageId)) Editor.pageId = Store.pages()[0].id;
    refreshPageSelect();
    if (Editor.selectedId && Editor.selected()) {
      openEdit(Editor.selectedId);               // rebuild the settings form
    } else {
      Editor.selectedId = null;
      showListPanel();
      renderSectionList();
      renderCanvas();
    }
    this.updateUI();
  },

  /* explicit save → persists to localStorage (what index.html reads) */
  save() {
    clearTimeout(this._t);
    this.commit();                // capture any pending typing first
    Store.save();
    this.dirty = false;
    this.updateUI();
    toast("Saved — index.html now shows these changes in this browser. Export data.json to publish for visitors.");
  },

  updateUI() {
    const u = document.getElementById("btnUndo");
    const r = document.getElementById("btnRedo");
    const s = document.getElementById("btnSave");
    const d = document.getElementById("dirtyDot");
    if (!u) return;
    u.disabled = this.idx <= 0;
    r.disabled = this.idx >= this.stack.length - 1;
    s.disabled = !this.dirty;
    d.hidden = !this.dirty;
    s.title = this.dirty ? "You have unsaved changes (Ctrl+S)" : "All changes saved";
  }
};

/* warn before leaving with unsaved changes */
window.addEventListener("beforeunload", e => {
  if (History.dirty) { e.preventDefault(); e.returnValue = ""; }
});
