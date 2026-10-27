// Filter UI sync for the works index page.
//
// The work-filter partial is swapped in and out by HTMX; the old inline
// script used a `typeof` guard that never worked (its declarations were
// block-scoped), so the whole block — timers included — re-ran on every
// swap. This module is loaded once from index.ejs and drives everything
// from events, so there is nothing to re-register and no stray timers.
(function () {
  "use strict";

  function filterForm() {
    return document.querySelector("#portfsm-works-filterer form");
  }

  // Make the filter form reflect the current URL query parameters. Safe to
  // call any number of times — it returns true when the form exists.
  function syncFromURL() {
    const form = filterForm();
    if (!form) return false;
    const params = new URLSearchParams(window.location.search);
    const sort = params.get("sort");
    const search = params.get("search");

    const sortSelect = form.querySelector('select[name="sort"]');
    const searchInput = form.querySelector('input[name="search"]');
    if (sortSelect) sortSelect.value = sort || "index";
    if (searchInput) searchInput.value = search || "";
    return true;
  }

  // Ask the filter's hx-get target to reload the list with the current
  // form values (the form's hx-trigger already listens for 'change').
  function refreshList() {
    const form = filterForm();
    if (!form) return;

    // The form normally pushes its /works URL. During a history restore the
    // URL is already the one being restored, so pushing would add a spurious
    // entry (and truncate forward history). Keep the attribute disabled
    // until htmx has handled the response — it reads it then, not at request
    // time — and put it back afterwards.
    const pushUrl = form.getAttribute("hx-push-url");
    form.setAttribute("hx-push-url", "false");

    const restore = function () {
      form.removeEventListener("htmx:afterRequest", restore);
      if (pushUrl === null) {
        form.removeAttribute("hx-push-url");
      } else {
        form.setAttribute("hx-push-url", pushUrl);
      }
    };
    form.addEventListener("htmx:afterRequest", restore);

    form.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Keep the form in sync whenever HTMX swaps content in (home page render,
  // history restore). No re-registration happens — this listener lives for
  // the life of the page.
  document.addEventListener("htmx:load", syncFromURL);

  // Back/forward navigation changes the URL without swapping anything; sync
  // the form and ask for the matching list once.
  window.addEventListener("popstate", function () {
    if (syncFromURL()) refreshList();
  });

  // Initial load: the form arrives with the home partial's first htmx fetch,
  // which htmx:load handles above. If the URL already carries parameters the
  // server renders the matching list, so nothing extra is needed here.
  syncFromURL();
})();