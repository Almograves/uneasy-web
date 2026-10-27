// Keep a requested "scroll to section after navigation" stable while lazy
// content loads.
//
// htmx's `show:<selector>:top` runs right after a swap. On the home page the
// work cards are still placeholders at that point, so the document is shorter
// than its final height; the scroll can then be clamped to that temporary
// maximum and leave the target below the fold. When a trigger marks a target
// with `data-scroll-target`, retry the scroll after every subsequent swap
// until the target has actually reached its scroll-margin.
(function () {
  "use strict";

  var selector = null;
  var deadline = 0;

  document.addEventListener("htmx:beforeRequest", function (event) {
    var trigger = event.detail.elt;
    if (!trigger || !trigger.getAttribute) return;

    var target = trigger.getAttribute("data-scroll-target");
    if (target) {
      selector = target;
      deadline = Date.now() + 3000;
      return;
    }

    // Any other page-level navigation cancels a pending scroll, so it can't
    // fire later on a page the user has already left.
    if (trigger.getAttribute("hx-target") === "#portfsm-main") {
      selector = null;
    }
  });

  document.addEventListener("htmx:afterSettle", function () {
    if (!selector || Date.now() > deadline) {
      selector = null;
      return;
    }

    var target = document.querySelector(selector);
    if (!target) return;

    target.scrollIntoView({ block: "start" });

    // scroll-margin-top keeps the target clear of the sticky header. Once
    // the page is tall enough for that to be honoured, the target's top is
    // at the margin and no further retries are needed.
    var margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    if (target.getBoundingClientRect().top <= margin + 1) selector = null;
  });
})();
