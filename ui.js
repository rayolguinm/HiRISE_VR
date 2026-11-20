/* HiRISE in VR, page chrome: smooth scrolling (Lenis + GSAP ScrollTrigger), the step rail,
   the top bar and the command palette (Ctrl/Cmd K).
   Author: Raymundo "R@y" Olguin, HiROC, LPL, University of Arizona. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------- smooth scroll, shared with ScrollTrigger */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -60 } });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  } else if (window.gsap && window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); }
  window.HiriseVR = window.HiriseVR || {};
  window.HiriseVR.lenis = lenis;
  function go(hash) {
    var el = document.querySelector(hash); if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: hash === "#top" ? 0 : -60 }); else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", hash);
  }
  window.HiriseVR.go = go;

  /* ---------------------------------------------------- top bar and rail */
  var bar = $("bar"), rail = $("rail"), hero = $("top");
  var links = Array.prototype.slice.call(rail.querySelectorAll("a"));
  function onScroll() {
    var past = !hero || hero.getBoundingClientRect().bottom < 150;   // before the hero credit reaches the bar
    bar.classList.toggle("solid", past);
    rail.classList.toggle("show", past);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest('a[href^="#"]'); if (!a || a.getAttribute("href").length < 2) return;
    ev.preventDefault(); go(a.getAttribute("href"));
  });

  /* ---------------------------------------------------- GitHub link when served from github.io */
  var m = /^([^.]+)\.github\.io$/.exec(location.hostname), seg = location.pathname.split("/").filter(Boolean)[0];
  if (m && seg && $("ghLink")) $("ghLink").href = "https://github.com/" + m[1] + "/" + seg;

  /* ---------------------------------------------------- command palette */
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $("kKey").textContent = isMac ? "⌘ K" : "Ctrl K";
  var dlg = $("palette"), q = $("pq"), list = $("pl"), sel = 0, items = [];
  var BASE = [
    ["Contents", "index.html#contents", "Guide"],
    ["1 Overview: one DTM in four views", "index.html#process", "Guide"],
    ["3 Orthoimage selection", "index.html#texture", "Guide"],
    ["4 Output files: inside a site folder", "index.html#files", "Guide"],
    ["5 VR in Twinmotion: screens and speeds", "index.html#pcvr", "Guide"],
    ["Closing flight: Gorgonum Chaos", "index.html#gorgonum", "Guide"],
    ["H Twinmotion VR: requirements, import, controls, performance", "science.html#twinmotion", "Reference"],
    ["A Ortho selection calculator", "science.html#texture", "Reference"],
    ["B Triangle budget", "science.html#mesh", "Reference"],
    ["C Outputs and coordinate conventions", "science.html#outputs", "Reference"],
    ["D RUN.bat, screen by screen", "science.html#pipeline", "Reference"],
    ["E The pipeline front end in detail", "science.html#frontend", "Reference"],
    ["I Troubleshooting", "science.html#help", "Reference"],
    ["2 Running the pipeline: RUN.bat simulation", "index.html#runbat", "Guide"],
    ["6 Results: all 40 DTMs", "index.html#dtms", "Guide"],
    ["Flight: Gullies Tempe Terra", "index.html?dtm=gullies-tempe-terra-4905e-304n#dtms", "DTM"],
    ["Flight: Cavil Angusti South Polar", "index.html?dtm=cavil-angusti-south-polar-2834e-765s#dtms", "DTM"],
    ["Flight: North Polar Layered Deposits Bench", "index.html?dtm=north-polar-layered-deposits-bench-1655e-852n#dtms", "DTM"],
    ["Flight: Guilled Crater", "index.html?dtm=guilled-crater-2226e-438s#dtms", "DTM"],
    ["F Command line, reports and verification", "science.html#cli", "Reference"],
    ["G Inside the pipeline: layers, coordinates, stereo precision", "science.html#anatomy", "Reference"],
    ["J HiRISE glossary", "science.html#glossary", "Reference"],
    ["References (52 publications)", "science.html#refs", "Reference"],
    ["Pipeline Anatomy", "docs/interactive/HiRISE_Pipeline_Anatomy.html", "Explainer"],
    ["Ortho Selection method", "docs/interactive/HiRISE_Ortho_Selection.html", "Explainer"],
    ["Twinmotion VR User Manual (PDF)", "docs/manuals/Twinmotion_VR_User_Manual.pdf", "Manual"],
    ["Pipeline User Manual (PDF)", "docs/manuals/HiRISE_Pipeline_User_Manual.pdf", "Manual"]
  ];
  function all() {
    var ts = (window.HiriseVR.TS || []).map(function (r) { return [r[0], "science.html#help", "Problem", r[0]]; });
    var gl = (window.HiriseVR.GLOSS || []).map(function (g) { return [g[0], "science.html#glossary", "Term", g[0]]; });
    return BASE.concat(gl, ts);
  }
  function render() {
    var t = q.value.trim().toLowerCase();
    items = all().filter(function (it) { return !t || (it[0] + " " + it[2]).toLowerCase().indexOf(t) >= 0; }).slice(0, 40);
    sel = Math.min(sel, Math.max(0, items.length - 1));
    list.innerHTML = items.length ? items.map(function (it, i) {
      return "<li><a href='" + it[1] + "' role='option' data-i='" + i + "' aria-selected='" + (i === sel) + "'><span>" + it[0] + "</span><span>" + it[2] + "</span></a></li>";
    }).join("") : "<li class='small muted' style='padding:12px'>Nothing matches. Try a shorter word.</li>";
  }
  function choose(i) {
    var it = items[i]; if (!it) return;
    dlg.close();
    var parts = it[1].split("#"), page = parts[0], here = location.pathname.split("/").pop() || "index.html";
    if (parts[1] && (page === here || (page === "index.html" && here === ""))) {
      if (it[3] && $("tsFilter")) { $("tsFilter").value = it[3].split(" ").slice(0, 3).join(" "); $("tsFilter").dispatchEvent(new Event("input")); }
      go("#" + parts[1]);
    } else location.href = it[1];
  }
  function open() { q.value = ""; sel = 0; render(); dlg.showModal(); q.focus(); if (lenis) lenis.stop(); }
  dlg.addEventListener("close", function () { if (lenis) lenis.start(); });
  $("kOpen").addEventListener("click", open);
  addEventListener("keydown", function (e) {
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); dlg.open ? dlg.close() : open(); }
    else if (e.key === "/" && !dlg.open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
  q.addEventListener("input", function () { sel = 0; render(); });
  q.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(sel); }
  });
  list.addEventListener("click", function (e) { var a = e.target.closest("a"); if (!a) return; e.preventDefault(); choose(+a.dataset.i); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();
