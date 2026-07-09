/* =========================================================================
   VIEW — bootstraps the public site (index.html).
   Loads content (localStorage draft → published data.json → demo seed),
   builds the nav from the page list, and renders the requested page.
   URL contract:
     index.html            → first page (or the one whose slug is "home")
     index.html?p=<slug>   → that page
   ========================================================================= */

(async function initSite() {
  await Store.load();

  const slug = new URLSearchParams(location.search).get("p");
  const page =
    (slug && Store.getPageBySlug(slug)) ||
    Store.getPageBySlug("home") ||
    Store.pages()[0];

  document.title = page ? page.name : "My Site";

  /* nav built from the page list */
  const nav = document.getElementById("viewNav");
  nav.innerHTML = Store.pages().map(p =>
    `<a href="index.html?p=${encodeURIComponent(p.slug)}" class="${page && p.id === page.id ? "on" : ""}">${esc(p.name)}</a>`
  ).join("");

  await MediaDB.resolveAll(page);   // resolve any uploaded media (same-browser drafts)
  renderPage(page, document.getElementById("viewPage"), { editable: false });
})();
