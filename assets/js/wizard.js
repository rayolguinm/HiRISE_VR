/* "Press Run": an interactive simulation of the RUN.bat front end of the HiRISE 3D Topographic
   Reconstruction Pipeline (obj_pipeline v6.3.9), written for the general public.
   It follows the wizard in the Pipeline User Manual (chapters 4 and 5): five questions, two menus in
   Standard mode, then the console stages. Inputs are the featured Gully Monitoring DTM.
   Mesh sizes are estimates; the real pipeline prints exact values.
   Author: Raymundo "R@y" Olguin, HiROC, LPL, University of Arizona. */
(function () {
  "use strict";
  var term = document.getElementById("wzTerm"), side = document.getElementById("wzSide"), opts = document.getElementById("wzOpts");
  var restart = document.getElementById("wzRestart");
  if (!term) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The featured DTM: 7,291 x 5,172 posts at 1.004 m, about 79 % inside the data strip.
  var DTM = { id: "DTEEC_084570_1445_066516_1445_A01", H: 7291, W: 5172, post: 1.004, valid: 0.79 };
  var PATH = "D:\\HiRISE\\Gully_Monitoring_3525E_351S";

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function line(html, cls) { var d = document.createElement("div"); d.className = "tl" + (cls ? " " + cls : ""); d.innerHTML = html; term.appendChild(d); term.scrollTop = term.scrollHeight; return d; }
  function explain(title, body) { side.innerHTML = "<h3>" + title + "</h3>" + body; }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function mb(x) { return x >= 1000 ? (x / 1000).toFixed(1) + " GB" : Math.round(x) + " MB"; }

  var A, step;
  var STEPS = [
    { key: "path", q: "Step 1 of 5 &nbsp;Project path:", title: "Input path",
      body: "<p>A single project folder, or a parent folder of many projects (dataset mode, processed sequentially). RUN.bat strips quotes and rejects empty paths, Windows Search URIs, other URIs, missing folders and files.</p><p class='small muted'>The folder label encodes an approximate centre in tenths of a degree: 3525E_351S is 352.5° E, 35.1° S. The authoritative centre is read later from the DTM through GDAL.</p>",
      choices: [["Paste the folder", PATH]] },
    { key: "ds", q: "Step 2 of 5 &nbsp;DTM downsampling [Enter = AUTO]:", title: "Downsampling factor",
      body: "<p>A factor N keeps every Nth DTM post on both axes, so vertices scale as 1/N² and post spacing becomes N times native. <b>AUTO</b> computes the smallest N that fits the 10,000,000-triangle budget: N = ⌈√(T / B)⌉ with T = 2(H − 1)(W − 1).</p>",
      choices: [["AUTO (recommended)", 0], ["1 (native)", 1], ["2 (25 %)", 2], ["4 (6.25 %)", 4], ["8 (1.56 %)", 8]] },
    { key: "full", q: "Step 3 of 5 &nbsp;Full precision? [y/N]:", title: "OBJ numeric precision",
      body: "<p><b>Compact</b> writes vertex coordinates to 4 decimals (0.1 mm), UVs to 6, and no vertex normals; importers derive normals from face winding. <b>Full</b> writes 9 decimals plus per-vertex normals, 3 to 4 times larger, for CAD-grade editing only.</p>",
      choices: [["N: compact (recommended)", false], ["y: full precision", true]] },
    { key: "mode", q: "Step 4 of 5 &nbsp;Output mode [1-4]:", title: "Output mode",
      body: "<p><b>1 Standard</b>: choose container and texture encoding in two menus. <b>2 Apple Vision Pro</b>: one USDZ with the native-resolution PNG embedded (UsdPreviewSurface). <b>3 All formats</b>: OBJ, PLY, FBX, GLB and USDZ with PNG. <b>4 GeoTIFF only</b>: converts every PDS .IMG to GeoTIFF, no meshes.</p>",
      choices: [["1 Standard", 1], ["2 Apple Vision Pro", 2], ["3 All formats", 3], ["4 GeoTIFF only", 4]] },
    { key: "rep", q: "Step 5 of 5 &nbsp;Technical reports? [Y/n]:", title: "Technical reports",
      body: "<p>HTML, PDF and LaTeX reports: stereo geometry, DTM quality, slope and roughness statistics, geologic context and landing-site (EDL) terrain checks, each value traced to its source. Meshes are always written; disabling reports shortens the run.</p>",
      choices: [["Yes", true], ["No", false]], skip: function () { return A.mode === 4; } },
    { key: "tab", q: "             Data tables? [Y/n]:", title: "Data tables",
      body: "<p>XLSX workbooks and CSV tables of the same quantities, including a point-cloud CSV with one row per mesh vertex, which dominates the size and time of this output.</p>",
      choices: [["Yes", true], ["No", false]], skip: function () { return A.mode === 4; } },
    { key: "fmt", q: "Mesh format [1-6]:", title: "Mesh serialization format",
      body: "<p><b>OBJ</b>: ASCII mesh + MTL + external texture. <b>PLY</b>: binary little-endian, for MeshLab and CloudCompare. <b>FBX</b> 7.4: Unity, Unreal, Maya. <b>GLB</b>: glTF 2.0 binary, texture embedded, for Twinmotion, Blender and WebXR. <b>USDZ</b>: uncompressed 64-byte-aligned ZIP for visionOS and AR Quick Look.</p>",
      choices: [["1 OBJ", "OBJ"], ["2 PLY", "PLY"], ["3 FBX", "FBX"], ["4 GLB", "GLB"], ["5 USDZ", "USDZ"], ["6 All", "ALL"]], skip: function () { return A.mode !== 1; } },
    { key: "tex", q: "Texture encoding [1-2]:", title: "Orthoimage texture encoding",
      body: "<p><b>PNG</b>: lossless DEFLATE, native pixel grid, full radiometric fidelity of the decoded JPEG 2000. <b>JPG</b>: lossy DCT, quality 95, 4:4:4 chroma, same ground sample distance, about 10× smaller: the choice for VR delivery.</p>",
      choices: [["1 PNG (lossless)", "PNG"], ["2 JPG (VR)", "JPG"]], skip: function () { return A.mode !== 1; } }
  ];

  function start() {
    A = {}; step = 0; term.innerHTML = ""; restart.hidden = true;
    line("<span class='tb'>HiRISE 3D Topographic Reconstruction Pipeline v6.3.9</span>");
    line("Raymundo \"R@y\" Olguin, HiROC, Lunar and Planetary Laboratory, University of Arizona", "dim");
    line("Outputs: 3D mesh + texture, reports, data tables.  Scale: true scale, vertical exaggeration 1.0 (always)", "dim");
    line("&nbsp;");
    ask();
  }
  function ask() {
    while (step < STEPS.length && STEPS[step].skip && STEPS[step].skip()) step++;
    if (step >= STEPS.length) return ready();
    var s = STEPS[step];
    if (s.key === "fmt") { line("&nbsp;"); line("<span class='tb'>MESH SERIALIZATION FORMAT SELECTION</span>"); }
    if (s.key === "tex") { line("<span class='tb'>ORTHOMOSAIC TEXTURE ENCODING SELECTION</span>"); }
    line("<span class='pr'>" + s.q + "</span> <span class='cur'></span>");
    explain(s.title, s.body);
    opts.innerHTML = "";
    s.choices.forEach(function (c, i) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = c[0];
      if (i === 0) b.className = "pref";
      b.addEventListener("click", function () { answer(s, c); });
      opts.appendChild(b);
    });
    var first = opts.querySelector("button"); if (first && document.activeElement && opts.contains(document.activeElement) === false && step > 0) first.focus({ preventScroll: true });
  }
  function answer(s, c) {
    A[s.key] = c[1];
    var cur = term.querySelector(".cur"); if (cur) cur.outerHTML = "<span class='ans'>" + esc(typeof c[1] === "string" ? (s.key === "path" ? c[1] : c[0].replace(/^\d /, "")) : c[0]) + "</span>";
    step++; ask();
  }

  function est() {
    var T = 2 * (DTM.H - 1) * (DTM.W - 1);
    var s = A.ds || Math.max(1, Math.ceil(Math.sqrt(T / 1e7)));
    var h = Math.ceil(DTM.H / s), w = Math.ceil(DTM.W / s);
    var tri = 2 * (h - 1) * (w - 1) * DTM.valid, vert = h * w * DTM.valid;
    var obj = (vert * 50 + tri * 43) / 1e6 * (A.full ? 3.5 : 1);
    return { s: s, tri: tri, vert: vert, full: T * DTM.valid, obj: obj, glb: (vert * 20 + tri * 12) / 1e6 };
  }
  function formats() {
    if (A.mode === 2) return ["USDZ"];
    if (A.mode === 3) return ["OBJ", "PLY", "FBX", "GLB", "USDZ"];
    if (A.mode === 4) return [];
    return A.fmt === "ALL" ? ["OBJ", "PLY", "FBX", "GLB", "USDZ"] : [A.fmt];
  }
  function ready() {
    var e = est();
    line("&nbsp;");
    line("<span class='tb'>RUNNING PIPELINE</span>");
    line("  Input       : " + esc(PATH));
    if (A.mode !== 4) {
      line("  Downsample  : " + (A.ds ? A.ds : "AUTO (" + e.s + ")"));
      line("  Reports     : " + (A.rep ? "yes" : "no") + "    Data tables : " + (A.tab ? "yes" : "no"));
    } else line("  Mode        : GEOTIFF ONLY");
    explain("RUNNING PIPELINE", "<p>RUN.bat prints the resolved parameters and the Python interpreter it will use (the first one that can import osgeo.gdal), then launches the back end with <code>--overwrite</code>.</p>");
    opts.innerHTML = "";
    var b = document.createElement("button"); b.type = "button"; b.className = "pref run"; b.textContent = "Run the pipeline";
    b.addEventListener("click", run); opts.appendChild(b); b.focus({ preventScroll: true });
  }

  function run() {
    opts.innerHTML = "";
    var e = est(), f = formats(), texExt = A.mode === 1 ? (A.tex === "PNG" ? "png" : "jpg") : "png";
    var STAGES = [];
    STAGES.push(["PROJECT DISCOVERY", ["Mode: SINGLE PROJECT", "[1] Gully_Monitoring_3525E_351S   DTM ✓  " + DTM.id + ".IMG"],
      "Project discovery", "Detects single-project or dataset mode and finds each DTM (.TIF or .IMG at the root or in DEM/ or DTM/), skipping output folders and browse products."]);
    STAGES.push(["STAGE 0  GEOTIFF EXTRACTION", ["1 DTM .IMG found, converted to GeoTIF\\" + DTM.id + ".TIF"],
      "Stage 0: GeoTIFF extraction", "The PDS3 .IMG is converted losslessly to GeoTIFF with its georeferencing; already converted files are skipped. Later stages read the GeoTIFF."]);
    if (A.mode !== 4) {
      STAGES.push(["ORTHO SELECTION", [
        "candidates: 4 RED orthos (A and C grids for each image)",
        "  ESP_066516_1445_RED_A_01   0.25 m  native    e 1.37°   bin 1   E 0.250 m",
        "  ESP_066516_1445_RED_C_01   1.00 m  backup    coarser than native A",
        "  ESP_084570_1445_RED_C_01   1.00 m  backup    coarser than native B",
        "  ESP_084570_1445_RED_A_01   0.25 m  rejected  grid finer than the bin-2 pixels",
        "<span class='ok'>SELECTED  ESP_066516_1445_RED_A_01_ORTHO.JP2</span>"],
        "Orthoimage selection", "Each RED candidate is scored by ground error E = √(g² + (Δz·tan e)²): grid spacing g plus the lateral shift a vertical error Δz (0.3 m for 1 m posts) causes at emission angle e. ESP_084570_1445 is mostly bin 2, so its native grid is B (0.5 m) and its A ortho, an interpolation, is rejected. The bin-1 image at 1.37° wins with E = 0.250 m; coarser C grids are backups (with only C orthos in the folder, the same image wins at E = 1.000 m)."]);
      STAGES.push(["STAGE 1  RASTER INTAKE", ["Raster dims   : " + fmt(DTM.W) + " x " + fmt(DTM.H) + " posts at " + DTM.post + " m", "GDAL centre   : 352.5° E, 35.1° S   (Mars)"],
        "Stage 1: raster intake", "GDAL reads raster dimensions, post spacing, CRS and the GeoTransform, and computes the centre longitude and latitude; it is compared with the folder label."]);
      STAGES.push(["STAGE 2  ELEVATION SCREENING", ["valid samples : " + Math.round(DTM.valid * 100) + " % (normal: the map is a slanted strip inside a rectangle)", "range         : 699 m from lowest to highest point"],
        "Stage 2: elevation screening", "Elevation statistics are computed once and NoData and non-finite cells are dropped. A valid fraction near 0.75 is normal: the DTM is a slanted strip inside its bounding rectangle."]);
      STAGES.push(["STAGE 3  MESH SYNTHESIS", ["Downsampling factor " + e.s + "x (every " + (e.s === 1 ? "" : e.s + "th ") + "point)", "triangles     : about " + fmt(e.tri) + " of " + fmt(e.full), "UV mapping    : ORTHO GeoTransform (exact)"],
        "Stage 3: mesh synthesis", "The DTM is downsampled, every quad of valid posts becomes two triangles, and coordinates are in projected metres at vertical exaggeration 1.0. UVs come from the inverse of the orthoimage GeoTransform."]);
      STAGES.push(["STAGE 4  ORTHO TEXTURE MAPPING", ["texture       : JP2_CONVERTED\\ESP_066516_1445_RED_A_01_ORTHO." + texExt, "emission angle 1.37° (from the image label)"],
        "Stage 4: ortho texture mapping", "The selected JPEG 2000 orthoimage is decoded and written as " + texExt.toUpperCase() + " in JP2_CONVERTED, then bound to the mesh; its emission angle comes from the image label."]);
      var files = [];
      f.forEach(function (x) {
        if (x === "OBJ") files.push(DTM.id + "_Mesh01.obj  about " + mb(e.obj), DTM.id + "_Material_01.mtl", DTM.id + "_Texture01." + texExt);
        if (x === "GLB") files.push(DTM.id + "_Mesh01.glb  about " + mb(e.glb) + " + texture");
        if (x === "PLY") files.push(DTM.id + "_Mesh01.ply  about " + mb(e.glb * 1.1));
        if (x === "FBX") files.push(DTM.id + "_Mesh01.fbx  about " + mb(e.obj * 1.3));
        if (x === "USDZ") files.push(DTM.id + "_Mesh01.usdz  about " + mb(e.glb) + " + full-resolution photo");
      });
      if (f.indexOf("OBJ") >= 0) files.push("<span class='ok'>OBJ → MTL → texture chain verified</span>");
      STAGES.push(["STAGE 5  ASSET SERIALIZATION", files.map(function (x) { return "MESH\\" + x; }).map(function (x) { return x.replace("MESH\\<span", "<span"); }),
        "Stage 5: asset serialization", "The selected containers are written to MESH, and the OBJ → MTL → texture reference chain is verified, with a _TEXTURE_LINK.txt sidecar. This catches the most common failure: an untextured mesh."]);
      STAGES.push(["STAGE 6  SCIENCE ANALYSIS AND REPORTS", A.rep || A.tab ? [(A.rep ? "Report\\  HTML, PDF and LaTeX reports" : ""), (A.tab ? "DATA\\    Excel and CSV tables, point cloud" : "")].filter(Boolean) : ["skipped (reports and data tables switched off)"],
        "Stage 6: science analysis", A.rep || A.tab ? "Reports and tables are generated: stereo geometry, DTM quality, terrain statistics and EDL checks." : "Reports and data tables are disabled, so the stage is skipped."]);
    }
    STAGES.push(["PIPELINE COMPLETE", ["<span class='ok'>ALL STAGES NOMINAL</span>", A.mode === 4 ? "GeoTIFF written. No meshes requested." : "check your MESH" + (A.rep ? ", Report" : "") + (A.tab ? ", DATA" : "") + " folders"],
      "PIPELINE COMPLETE", A.mode === 4 ? "<p>GeoTIFF written. Run Standard mode to build a mesh.</p>" :
        "<p>ALL STAGES NOMINAL. Load the mesh from MESH into Twinmotion or Blender" + (f.indexOf("USDZ") >= 0 && f.length === 1 ? ", or transfer the USDZ to an Apple Vision Pro" : "") + ", and check the error log in the input folder.</p>"]);
    var i = 0;
    (function next() {
      if (i >= STAGES.length) { restart.hidden = false; return; }
      var st = STAGES[i++];
      line("&nbsp;"); line("<span class='tb'>┌ " + st[0] + "</span>");
      st[1].forEach(function (t) { line("  " + (t.indexOf("<span") === 0 ? t : esc(t).replace(/&lt;span class='ok'&gt;|&lt;\/span&gt;/g, ""))); });
      explain(st[2], st[3].charAt(0) === "<" ? st[3] : "<p>" + st[3] + "</p>");
      if (reduce) next(); else setTimeout(next, i === STAGES.length ? 400 : 1500);
    })();
  }
  restart.addEventListener("click", start);
  start();
})();
