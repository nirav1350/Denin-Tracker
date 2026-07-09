/* =========================================================================
   MEDIA — stores uploaded images/videos in IndexedDB (large quota),
   so page data only holds tiny "idb:xxxx" references instead of base64.
   This removes the old ~5 MB localStorage ceiling on uploads.

   - MediaDB.put(file)        → saves the blob, returns its "idb:…" ref
   - MediaDB.resolveAll(data) → preloads object URLs for every ref in data
   - mediaURL(ref)            → sync lookup used by the render templates
   - blobToDataURL(blob)      → used at export time to embed media into
                                data.json so visitors can see uploads too
   ========================================================================= */

const MediaDB = {
  _db: null,
  _urls: Object.create(null),

  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("blocksmith-media", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("files");
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
      req.onerror = () => reject(req.error);
    });
  },

  async put(blob) {
    const db = await this.open();
    const id = "idb:" + uid();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(blob, id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    this._urls[id] = URL.createObjectURL(blob);
    return id;
  },

  async getBlob(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const rq = db.transaction("files").objectStore("files").get(id);
      rq.onsuccess = () => resolve(rq.result || null);
      rq.onerror = () => reject(rq.error);
    });
  },

  /* Scan any data structure for "idb:…" refs and cache object URLs */
  async resolveAll(any) {
    if (!("indexedDB" in window)) return;
    const ids = [...new Set(JSON.stringify(any || {}).match(/idb:[a-z0-9]+/g) || [])];
    await Promise.all(
      ids.filter(id => !this._urls[id]).map(async id => {
        try {
          const b = await this.getBlob(id);
          if (b) this._urls[id] = URL.createObjectURL(b);
        } catch (e) { /* missing blob → renders empty */ }
      })
    );
  },

  url(id) { return this._urls[id] || ""; }
};

/* Templates call this on every media value */
function mediaURL(v) {
  return (typeof v === "string" && v.startsWith("idb:")) ? MediaDB.url(v) : (v || "");
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(blob);
  });
}
