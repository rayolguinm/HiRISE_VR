/* HiRISE in VR, page logic.
   Author: Raymundo "R@y" Olguin, HiROC, LPL, University of Arizona.
   The ortho calculator is ported from HiRISE_Ortho_Selection.html (same rules as hirise_vr.py select). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  /* View Transitions API for user-triggered swaps; plain update where unsupported or motion is reduced */
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function vt(fn, imgId) {
    if (!document.startViewTransition || reduce) return fn();
    var el = imgId && $(imgId); if (el) el.style.setProperty("--vt", "shot");
    var t = document.startViewTransition(fn);
    t.finished.then(function () { if (el) el.style.removeProperty("--vt"); });
  }
  window.HiriseVR = { TS: null };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ------------------------------------------------------------ copy buttons */
  function addCopy(pre) {
    if (pre.querySelector(".copy")) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "copy"; b.textContent = "copy";
    b.addEventListener("click", function () {
      var t = pre.cloneNode(true); t.querySelector(".copy").remove();
      (navigator.clipboard ? navigator.clipboard.writeText(t.textContent.trim()) : Promise.reject()).then(
        function () { b.textContent = "copied"; setTimeout(function () { b.textContent = "copy"; }, 1400); },
        function () { b.textContent = "select + Ctrl+C"; });
    });
    pre.appendChild(b);
  }


  // Label every cell with its column header so tables can stack into cards on phones (site.css).
  function stackTables(root) {
    (root || document).querySelectorAll(".tbl table").forEach(function (t) {
      var th = t.querySelectorAll("thead th"); if (th.length < 3) return;
      var heads = Array.prototype.map.call(th, function (h) { return h.textContent.trim(); });
      t.querySelectorAll("tbody tr").forEach(function (tr) {
        Array.prototype.forEach.call(tr.children, function (td, i) { if (heads[i]) td.setAttribute("data-label", heads[i]); });
      });
      t.closest(".tbl").classList.add("stack");
    });
  }
  window.HiriseVR = window.HiriseVR || {}; window.HiriseVR.stackTables = stackTables;
  function setPressed(group, attr, val) { group.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(+x.dataset[attr] === +val || x.dataset[attr] === val)); }); }
  if ($("calc")) {
    /* ------------------------------------------------------------ ortho calculator */
    var GRID = { 1: 0.25, 2: 0.5, 4: 1.0 }, LET = { 1: "A", 2: "B", 4: "C" };
    var st = { dz: 0.3, b: [1, 2], names: ["ESP_066516_1445", "ESP_084570_1445"] };
    var PRESETS = {
      site: { dz: 0.3, b: [1, 2], e: [1.37, 8.48], c: [100, 100], names: ["ESP_066516_1445", "ESP_084570_1445"],
        note: "Real values from the PDS RDR labels on a 1 m DTM: ESP_066516_1445 is bin 1 at 1.37° emission; ESP_084570_1445 is mostly bin 2 at 8.48°, so its native grid is B and its 0.25 m A ortho is only an interpolation. The bin-1 A ortho wins with E = 0.250 m: ESP_066516_1445_RED_A_01_ORTHO.JP2. The 0.502 m shown for ESP_084570_1445 is the best it could score; no B ortho is released for it, and its 1 m C ortho scores 1.001 m. Move the sliders to explore." }
    };
    function E(g, e, dz) { var dx = dz * Math.tan(e * Math.PI / 180); return [Math.hypot(g, dx), dx]; }
    function compute() {
      var im = [0, 1].map(function (i) {
        var e = +$("e" + i).value, c = +$("c" + i).value, j = $("j" + i).checked, g = GRID[st.b[i]], r = E(g, e, st.dz);
        return { i: i, e: e, c: c, j: j, g: g, L: LET[st.b[i]], E: r[0], dx: r[1], out: "", why: "" };
      });
      var cmax = Math.max(im[0].c, im[1].c);
      var live = im.filter(function (x) { if (x.c < cmax - 1) { x.out = "drop"; x.why = "coverage " + x.c.toFixed(1) + " % is more than 1 point below " + cmax.toFixed(1) + " %"; return false; } return true; });
      var clean = live.filter(function (x) { return !x.j; });
      if (clean.length && clean.length < live.length) { live.forEach(function (x) { if (x.j) { x.out = "drop"; x.why = "flagged for spacecraft jitter"; } }); live = clean; }
      live.sort(function (a, b) { return a.E - b.E; });
      var win = live[0], tie = live.length > 1 && live[1].E <= win.E * 1.05;
      if (tie) { live.sort(function (a, b) { return a.e - b.e || b.c - a.c; }); win = live[0]; }
      im.forEach(function (x) { if (x === win) x.out = "win"; else if (!x.out) x.out = "lose"; });
      return { im: im, win: win, tie: tie };
    }
    function plot(r) {
      var svg = $("plot"), W = 660, H = 270, L = 52, R = 14, T = 14, B = 36, dz = st.dz, emax = 30;
      var ymax = Math.ceil(Math.max(1.1, E(1.0, emax, dz)[0]) * 5) / 5;
      var x = function (e) { return L + (W - L - R) * e / emax; }, y = function (v) { return T + (H - T - B) * (1 - v / ymax); };
      var s = "", stepY = ymax > 2 ? 0.5 : 0.2;
      for (var v = 0; v <= ymax + 1e-9; v += stepY) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="' + css("--line") + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v.toFixed(1) + "</text>";
      for (var e = 0; e <= 30; e += 5) s += '<text x="' + x(e) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + e + "°</text>";
      s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">emission angle e</text>';
      s += '<text x="14" y="' + ((T + H - B) / 2) + '" text-anchor="middle" transform="rotate(-90 14 ' + ((T + H - B) / 2) + ')">E (m)</text>';
      var cols = { 0.25: css("--data"), 0.5: css("--accent"), 1: css("--muted") };
      [0.25, 0.5, 1.0].forEach(function (g) { var d = ""; for (var e = 0; e <= 30; e += 0.5) d += (e ? "L" : "M") + x(e).toFixed(1) + " " + y(E(g, e, dz)[0]).toFixed(1); s += '<path d="' + d + '" fill="none" stroke="' + cols[g] + '" stroke-width="2"/>'; });
      r.im.forEach(function (m) {
        var cx = x(m.e), cy = y(m.E), win = m.out === "win";
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (win ? 7 : 5) + '" fill="' + (win ? css("--ok") : css("--surface")) + '" stroke="' + cols[m.g] + '" stroke-width="2"/><text x="' + (cx + 10) + '" y="' + (cy - 8) + '" style="fill:' + css("--ink") + '">' + (m.i + 1) + "</text>";
      });
      svg.innerHTML = s;
    }
    function renderCalc() {
      var r = compute();
      r.im.forEach(function (m) {
        $("e" + m.i + "v").textContent = m.e.toFixed(2) + "°"; $("c" + m.i + "v").textContent = m.c.toFixed(1) + " %";
        $("g" + m.i).textContent = m.L + " " + m.g.toFixed(2); $("m" + m.i).textContent = m.dx.toFixed(3); $("s" + m.i).textContent = m.E.toFixed(3);
        $("name" + m.i).textContent = st.names[m.i];
        var el = $("st" + m.i); el.className = "status " + m.out; el.textContent = m.out === "win" ? "texture" : (m.out === "drop" ? "backup" : "not chosen");
      });
      var w = r.win, o = r.im[1 - w.i], nm = function (x) { return st.names[x.i]; }, txt;
      if (o.out === "drop") txt = "<b>" + nm(w) + "</b> (" + w.L + " ortho) is the texture: " + nm(o) + " is a backup because its " + o.why + ".";
      else if (r.tie) txt = "<b>" + nm(w) + "</b> (" + w.L + " ortho) is the texture: the scores are within 5 % (" + w.E.toFixed(3) + " vs " + o.E.toFixed(3) + " m), so the lower emission angle decides.";
      else txt = "<b>" + nm(w) + "</b> (" + w.L + " ortho, E = " + w.E.toFixed(3) + " m) is the texture: " + nm(o) + " scores " + o.E.toFixed(3) + " m. " +
        (w.g > o.g ? "Its pixels are coarser, but the other image would sit " + o.dx.toFixed(2) + " m off the terrain." : (w.g < o.g ? (w.dx <= o.dx ? "It has both the finer grid and the smaller shift from its viewing angle (" + w.dx.toFixed(3) + " m against " + o.dx.toFixed(3) + " m)." : "Its finer pixels outweigh the extra " + (w.dx - o.dx).toFixed(3) + " m shift from its larger viewing angle.") : "Same grid, so its smaller viewing angle wins."));
      $("verdict").innerHTML = txt; plot(r);
    }
    function applyPreset(k) {
      var p = PRESETS[k]; st.dz = p.dz; st.b = p.b.slice(); st.names = p.names.slice();
      $("dz").value = p.dz; setPressed($("dzSeg"), "dz", p.dz);
      document.querySelectorAll("#calc .img").forEach(function (box, i) {
        setPressed(box.querySelector(".bseg"), "b", p.b[i]); $("e" + i).value = p.e[i]; $("c" + i).value = p.c[i]; $("j" + i).checked = false;
      });
      $("calcNote").textContent = p.note; renderCalc();
    }
    $("presetSeg").addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (!b) return; setPressed(this, "p", b.dataset.p); applyPreset(b.dataset.p); });
    $("dzSeg").addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (!b) return; st.dz = +b.dataset.dz; $("dz").value = st.dz; setPressed(this, "dz", st.dz); renderCalc(); });
    $("dz").addEventListener("input", function () { var v = parseFloat(this.value); if (v > 0) { st.dz = v; setPressed($("dzSeg"), "dz", v); renderCalc(); } });
    document.querySelectorAll("#calc .img").forEach(function (box) {
      var i = +box.dataset.i;
      box.querySelector(".bseg").addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (!b) return; st.b[i] = +b.dataset.b; setPressed(this, "b", st.b[i]); renderCalc(); });
    });
    ["e0", "e1", "c0", "c1", "j0", "j1"].forEach(function (id) { $(id).addEventListener("input", renderCalc); $(id).addEventListener("change", renderCalc); });
    applyPreset("site");
    if (window.matchMedia) { var mq = window.matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", renderCalc); }

  }
  if ($("bH")) {
    /* ------------------------------------------------------------ triangle budget */
    var budget = 10000000;
    function autoS(h, w, B) { var t = 2 * (h - 1) * (w - 1), s = Math.max(1, Math.ceil(Math.sqrt(t / B))); while (2 * (Math.ceil(h / s) - 1) * (Math.ceil(w / s) - 1) > B) s++; return s; }
    function renderBudget() {
      var H = Math.max(10, +$("bH").value || 10), W = Math.max(10, +$("bW").value || 10), post = +$("bPost").value;
      var manual = +$("bS").value, s = manual || autoS(H, W, budget);
      var h = Math.ceil(H / s), w = Math.ceil(W / s);
      var tri = 2 * (h - 1) * (w - 1), vert = h * w;   // upper bound: every post valid; NoData posts remove quads
      $("bSv").textContent = manual ? s + " (manual)" : s + " (auto)";
      $("kT").textContent = fmt(tri); $("kV").textContent = fmt(vert);
      $("kP").textContent = (s * post) + " m"; $("kR").textContent = (100 / (s * s)).toFixed(s > 3 ? 2 : 1) + " %";
      $("kF").textContent = (W * post / 1000).toFixed(1) + " × " + (H * post / 1000).toFixed(1) + " km";
      $("kX").textContent = (Math.max(H, W) * post / 8192 * 100).toFixed(0) + " cm/px";
      var pct = Math.min(100, tri / budget * 100);
      $("bars").innerHTML = "<div class='bar-row'><span>Triangle budget B = 10,000,000</span><div class='track'><div class='fill" + (tri > budget ? " over" : "") + "' style='width:" + pct.toFixed(1) + "%'></div></div><span>" + (tri / budget * 100).toFixed(0) + " %</span></div>";
      $("bVerdict").innerHTML = (tri > budget
        ? "<b>Above the triangle budget</b>Use AUTO or a larger downsampling factor. Enable Nanite on import for very dense meshes."
        : "<b>Within the triangle budget</b>If the headset stutters, re-run the pipeline with a higher downsampling factor: the ortho carries most of the visible detail.") +
        "<br><span class='small muted'>An ortho of about 8192 px on the long side is a good balance for VR; at that size one texture pixel covers the ground distance shown above.</span>";
    }
    ["bH", "bW", "bPost", "bS"].forEach(function (id) { $(id).addEventListener("input", renderBudget); });
    renderBudget();

  }
  if ($("routeTabs")) {
    /* ------------------------------------------------------------ tabs */
    var tabs = $("routeTabs");
    tabs.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      var swap = function () { tabs.querySelectorAll("button").forEach(function (x) { var on = x === b; x.setAttribute("aria-selected", on); $(x.dataset.t).hidden = !on; }); };
      vt(swap);
    });

  }
  /* ------------------------------------------------------------ galleries */
  function gallery(prefix, items) {
    var list = $(prefix + "List"), i = 0;
    items.forEach(function (it, k) {
      var li = document.createElement("li"), b = document.createElement("button"); b.type = "button";
      b.innerHTML = "<span><b>" + it.t + "</b><br><span class='small muted'>" + it.s + "</span></span>";
      b.addEventListener("click", function () { show(k, true); }); li.appendChild(b); list.appendChild(li);
    });
    function show(k, animate) {
      if (animate) { vt(function () { show(k, false); }, prefix + "Img"); return; }
      i = (k + items.length) % items.length; var it = items[i];
      $(prefix + "Img").src = "docs/img/" + it.img + ".jpg"; $(prefix + "Img").alt = it.t;
      $(prefix + "Cap").innerHTML = it.c; $(prefix + "Pos").textContent = (i + 1) + " / " + items.length;
      Array.prototype.forEach.call(list.querySelectorAll("button"), function (b, n) { b.setAttribute("aria-current", n === i ? "true" : "false"); });
    }
    $(prefix + "Prev").addEventListener("click", function () { show(i - 1, true); });
    $(prefix + "Next").addEventListener("click", function () { show(i + 1, true); });
    items.forEach(function (it) { var im = new Image(); im.src = "docs/img/" + it.img + ".jpg"; });
    show(0);
  }
  if ($("galList")) {
    gallery("gal", [
      { t: "The workflow", s: "five stages", img: "vr_workflow_overview", c: "Prepare the data, enable Unknown sources (once per PC), connect and launch, import and texture, enter VR." },
      { t: "Enable Unknown sources", s: "Meta Horizon Link > Settings > General, once per PC", img: "vr_fig02_horizon_link_settings", c: "Turn on Unknown sources and confirm Meta Horizon Link is the active OpenXR runtime. Twinmotion is not a Meta store app, so it is blocked until this is on. Only install software you trust." },
      { t: "Connect the headset first", s: "Devices tab shows the Quest", img: "vr_fig03_horizon_link_devices", c: "Set the Quest boundary, confirm the headset under Devices, turn on Link in the headset. A headset connected after Twinmotion opens is not picked up until Twinmotion restarts." },
      { t: "Launch Twinmotion 2025.2", s: "Epic Games Launcher", img: "vr_fig04_epic_launcher", c: "Twinmotion tab, check 2025.2 in the version dropdown, Launch." },
      { t: "New scene", s: "Twinmotion Home", img: "vr_fig05_twinmotion_home", c: "Click New scene, or open a saved template scene." },
      { t: "Import > Geometry", s: "not Landscape or Point cloud", img: "vr_fig06_import_geometry", c: "Import, the large + button, GEOMETRY tab, Open. Settings: Collapse all, Up axis Auto (Z up or Y up if it stands on its edge), Full precision UVs and normals on, Nanite on for dense meshes." },
      { t: "Pick the site folder", s: "one folder per site", img: "vr_fig07_pick_site", c: "Site folders are named Region_LongitudeE_LatitudeN|S in tenths of a degree, for example Chaos_Terrain_3195E_168S." },
      { t: "Select the .obj", s: "inside MESH, not the folder", img: "vr_fig08_select_obj", c: "Choose <code>&lt;name&gt;_Mesh01.obj</code>. The MTL and the JPG beside it are found automatically." },
      { t: "Check the result", s: "terrain in the viewport", img: "vr_fig09_after_import", c: "Dunes and crater rims visible means the ortho is applied. Use the eyedropper on the terrain to see its material on the right." },
      { t: "Verify the texture", s: "Texture slot menu", img: "vr_fig10_texture_slot", c: "The slot should name <code>..._Texture01.jpg</code>. If it is empty, Open and pick it from MESH. Keep Tint white, Grunge 0 %, Saturation and Gamma 1.0, UV scale 1.0." },
      { t: "Switch to Unlit", s: "view mode, top right", img: "vr_fig11_view_modes", c: "Unlit shows the ortho exactly as HiRISE recorded it, with no Twinmotion sun added. The sky turning black is expected. Then set orientation (location 0, 0, 0), check the size reads in kilometres, park the camera near a feature, and File > Save as." },
      { t: "Enter VR", s: "Eye icon > Speed > VR", img: "vr_fig12_speed_menu", c: "Pick a speed (Walk 3 for new viewers), then click VR. The scene appears in the headset within seconds. Click VR again to leave." }
    ]);
  }
  if ($("wzList")) {
    gallery("wz", [
      { t: "Step 1: Project path", s: "one project or a whole dataset", img: "pl_fig01_step1_path", c: "Paste the folder path. RUN.bat rejects empty paths, Windows Search URIs and paths that do not exist." },
      { t: "Step 2: DTM downsampling", s: "Enter = automatic", img: "pl_fig02_step2_downsampling", c: "AUTO fits a 10,000,000-triangle budget. 1 is native posting, 2 / 4 / 8 keep 25 / 6.25 / 1.56 % of the vertices." },
      { t: "Step 3: OBJ precision", s: "compact is enough", img: "pl_fig03_step3_precision", c: "Four decimals of a metre is 0.1 mm, far finer than any HiRISE DTM. Full precision is 3 to 4 times larger." },
      { t: "Step 4: Output mode", s: "standard, Vision Pro, all, GeoTIFF", img: "pl_fig04_step4_output_mode", c: "Standard opens the two menus that follow; mode 2 writes one USDZ per project for Apple Vision Pro." },
      { t: "Step 5: Optional outputs", s: "reports and data tables", img: "pl_fig05_step5_optional", c: "The RUNNING PIPELINE block shows the Python, the input and the choices before anything runs." },
      { t: "Mesh format menu", s: "OBJ, PLY, FBX, GLB, USDZ, ALL", img: "pl_fig06_format_menu", c: "GLB embeds the texture and loads directly in Twinmotion, Blender and WebXR." },
      { t: "Texture encoding", s: "PNG lossless or JPG", img: "pl_fig07_encoding_menu", c: "JPG (quality 95, 4:4:4) is about ten times smaller and is the choice for VR and Twinmotion." },
      { t: "Header and discovery", s: "configuration, manifest, projects", img: "pl_fig08_header_discovery", c: "The emission-angle manifest is loaded once; every project folder with a DTM is listed." },
      { t: "Ortho selection", s: "the evidence table", img: "pl_fig09_ortho_selection", c: "One row per candidate with grid, role, emission angle, coverage and score E. The same rows go to ORTHO_SELECTION.csv." },
      { t: "Stages 1 to 4", s: "intake, screening, mesh, texture", img: "pl_fig10_stages_1_4", c: "A folder-name versus GDAL coordinate warning appears here when a folder is mislabelled; outputs always use the GDAL centre." },
      { t: "Stages 5 and 6", s: "files written, timing", img: "pl_fig11_stages_5_6", c: "Stage 5 verifies the OBJ to MTL to texture chain. ALL STAGES NOMINAL means no stage raised an error." },
      { t: "Pipeline complete", s: "15 projects in 63 s", img: "pl_fig12_complete", c: "Factor 8, OBJ + JPG, no reports or tables. The error log path is repeated at the end." }
    ]);

  }
  if ($("speeds")) {
    /* ------------------------------------------------------------ speeds */
    var SPEEDS = [["Inspect", "Boulders, layering or dune ripples within a few metres", "Very comfortable"],
      ["Handle", "Moving around one small feature, such as a crater rim segment", "Very comfortable"],
      ["Walk", "Walking across the surface like an astronaut would", "Comfortable for almost everyone"],
      ["Cycle", "Crossing a single crater or dune field", "Comfortable for most people"],
      ["Drive", "Moving between features hundreds of metres apart", "May cause discomfort for new users"],
      ["Fly", "Crossing the whole DTM in seconds, or rising to see the whole site", "Experienced VR users only, ideally seated"]];
    var sp = $("speeds");
    SPEEDS.forEach(function (s, i) {
      var b = document.createElement("button"); b.type = "button"; b.innerHTML = s[0] + "<small>speed " + (i + 1) + "</small>";
      b.addEventListener("click", function () { pick(i); }); sp.appendChild(b);
    });
    function pick(i) {
      Array.prototype.forEach.call(sp.children, function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      $("speedInfo").innerHTML = "<b>" + SPEEDS[i][0] + " (" + (i + 1) + ")</b>: " + SPEEDS[i][1] + ". <span class='muted'>Comfort: " + SPEEDS[i][2] + ".</span>" + (i > 3 ? " To reach a distant feature, teleport instead." : "");
    }
    pick(2);

  }
  if ($("checklist")) {
    /* ------------------------------------------------------------ checklist */
    var CK = ["Site folder copied whole; OBJ, MTL and Texture01.jpg side by side in MESH",
      "Unknown sources on and OpenXR runtime set to Meta Horizon Link (first time only)",
      "Quest boundary set, headset connected under Devices, Link on in the headset",
      "Twinmotion 2025.2 launched from the Epic Games Launcher, after the headset",
      "Import > GEOMETRY > Open > *_Mesh01.obj, Collapse all, Full precision UVs on",
      "Eyedropper on terrain: texture slot shows *_Texture01.jpg; Tint white, Grunge 0 %, UV scale 1.0",
      "Terrain upright, at 0, 0, 0, kilometre-scale size in XYZ",
      "View mode set to Unlit, so the ortho shows exactly as recorded",
      "Camera parked near a feature; travel mode and speed chosen",
      "File > Save as <site>.tm", "Eye icon > VR"];
    var saved = {}; try { saved = JSON.parse(store("hirisevr.ck") || "{}"); } catch (e) { saved = {}; }
    var ul = $("checklist");
    function prog() { var n = ul.querySelectorAll("input:checked").length; $("ckProg").textContent = n + " / " + CK.length + " done"; }
    CK.forEach(function (t, i) {
      var li = document.createElement("li"), l = document.createElement("label"), c = document.createElement("input");
      c.type = "checkbox"; c.checked = !!saved[i];
      c.addEventListener("change", function () { saved[i] = c.checked; store("hirisevr.ck", JSON.stringify(saved)); prog(); });
      var sp2 = document.createElement("span"); sp2.textContent = t; l.appendChild(c); l.appendChild(sp2); li.appendChild(l); ul.appendChild(li);
    });
    $("ckClear").addEventListener("click", function () { saved = {}; store("hirisevr.ck", "{}"); ul.querySelectorAll("input").forEach(function (c) { c.checked = false; }); prog(); });
    prog();

  }
  /* ------------------------------------------------------------ troubleshooting */
  var TS = [
    ["ERROR: That is a Windows Search URI", "Path copied from a File Explorer search", "Clear the search, open the real folder, copy its path", "pipeline"],
    ["ERROR: Path does not exist on disk", "Typo, wrong drive letter, or folder moved / unplugged drive", "Check the drive is connected; copy the path again from the address bar", "pipeline"],
    ["ERROR: obj_pipeline folder not found next to RUN.bat", "RUN.bat was copied out of the package", "Run RUN.bat from inside HiRISE_Pipeline", "pipeline"],
    ["ModuleNotFoundError: osgeo, or no GDAL Python found", "Environment not installed or HIRISE_PYTHON points elsewhere", "Run SETUP.bat; check the Python line in RUNNING PIPELINE", "pipeline"],
    ["JP2OpenJPEG driver MISSING; *_ORTHO.JP2 cannot be opened", "libgdal-jp2openjpeg missing", "SETUP.bat /rebuild, then python tools\\check_env.py", "pipeline"],
    ["Project missing from PROJECT DISCOVERY", "No DTM at root, DEM/ or DTM/, or excluded name", "Move or rename the DTM", "pipeline"],
    ["Large discrepancy between folder label and GDAL coords", "Folder name does not follow the tenths rule", "Rename the folder; outputs already use the correct GDAL centre", "pipeline"],
    ["Emission angle N/A", "No .LBL for that image and no manifest entry", "Put labels in HiRISE_Emission_Labels or set HIRISE_EMISSION_LABELS_ROOT", "pipeline"],
    ["Mesh appears flat white", "OBJ, MTL and texture separated or renamed", "Keep the three files together; read _TEXTURE_LINK.txt; or use GLB / USDZ", "pipeline"],
    ["Terrain tipped on its side in Blender", "Default importer axes", "Import OBJ with Up = Z, Forward = Y", "pipeline"],
    ["Run is slow or runs out of memory", "Native posting on a large DTM, all formats, point-cloud CSV", "Use auto or a larger factor, --jobs 1, or --no-data", "pipeline"],
    ["Old outputs were replaced", "The wizard always passes --overwrite", "Use the command line without --overwrite", "pipeline"],
    ["Run hangs briefly per observation", "Reading the online PDS RDR index (about 5 s each, then cached)", "Normal; or use --offline", "pipeline"],
    ["SETUP.bat fails", "Network, disk space or a test failure", "Read SETUP_LOG.txt; send it with the report", "pipeline"],
    ["VR button is grey or nothing appears in the headset", "Unknown sources off, or headset connected after Twinmotion started", "Turn on Unknown sources, confirm Link is on in the headset, then close and reopen Twinmotion", "Twinmotion"],
    ["VR still does not start", "Meta Horizon Link is not the active OpenXR runtime (SteamVR may have taken over)", "Set Meta Horizon Link as the active OpenXR runtime, then restart Twinmotion", "Twinmotion"],
    ["Terrain is white or grey", "MTL could not find the JPG (renamed or moved)", "Load the texture in the material's Texture slot from the same MESH folder", "Twinmotion"],
    ["Texture is shifted, stretched or tiled", "UV tab scale or offset changed", "Reset the UV tab: scale 1.0, no offset or rotation", "Twinmotion"],
    ["Terrain stands on its edge", "Wrong up axis", "Delete and re-import with Up axis Z up or Y up", "Twinmotion"],
    ["Terrain is tiny or huge", "Unit mismatch", "Re-import with Unit conversion set manually", "Twinmotion"],
    ["Shadows look doubled or wrong direction", "Twinmotion sun disagrees with sunlight baked into the ortho", "Switch the view mode to Unlit", "Twinmotion"],
    ["Import fails or takes very long", "Very large OBJ or ortho", "Re-run the pipeline with a higher downsampling factor; downsample the ortho", "Twinmotion"],
    ["Stutter or lag in the headset", "Frame rate below headset refresh rate", "Performance optimization, top to bottom", "Twinmotion"],
    ["Viewer falls through the ground", "Walk mode with collision off on the mesh", "Use Drone travel mode, or check that the mesh is not hidden or set as non-colliding", "Twinmotion"]
  ];
  window.HiriseVR.TS = TS;
  if ($("tsBody")) {
    function renderTS() {
      var q = $("tsFilter").value.trim().toLowerCase();
      $("tsBody").innerHTML = TS.filter(function (r) { return !q || r.join(" ").toLowerCase().indexOf(q) >= 0; })
        .map(function (r) { return "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + "</td><td>" + r[2] + "</td><td class='m'>" + r[3] + "</td></tr>"; }).join("") ||
        "<tr><td colspan='4' class='muted'>Nothing matches. Try a shorter word.</td></tr>";
      stackTables($("tsBody").closest(".tbl"));
    }
    $("tsFilter").addEventListener("input", renderTS); renderTS();

  }
  /* ------------------------------------------------------------ misc */
  document.querySelectorAll("pre:not(.formula)").forEach(addCopy);
  var m = /^([^.]+)\.github\.io$/.exec(location.hostname), seg = location.pathname.split("/").filter(Boolean)[0];
  if (m && seg && $("repoCard")) { $("repoCard").href = "https://github.com/" + m[1] + "/" + seg; $("repoCardTitle").textContent = "github.com/" + m[1] + "/" + seg; }
  stackTables();
})();
