// Home page visuals: line of sight and ortho score (HiRISE Ortho Selection), native pixel footprints,
// the site folder name decoder and the OBJ to MTL to texture chain (Twinmotion VR User Manual, Section 2;
// Pipeline User Manual, Chapters 6 and 10).
// Author: Raymundo "R@y" Olguin, HiROC and SIC, LPL, University of Arizona.
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var C = { bone: "#ECE5DC", text: "#CFC9C1", muted: "#8E8A85", glow: "#9CC4E4", dust: "#E0B48A", hair: "rgba(236,229,220,.22)" };
  function $(id) { return document.getElementById(id); }
  function el(parent, tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    parent.appendChild(n); return n;
  }
  function setPressed(group, attr, val) {
    group.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset[attr] === String(val))); });
  }

  /* ------------------------------------------------ line of sight: a height error slides the pixel sideways */
  var los = $("losSvg");
  if (los) {
    var DZ = 0.3, ZPX = 70, YT = 236, YD = YT - ZPX, PX = 180;
    var T = { "font-family": "Geist, system-ui, sans-serif", "font-size": 13 };
    function txt(x, y, s, fill, extra) { var a = { x: x, y: y, fill: fill }; for (var k in T) a[k] = T[k]; for (k in extra || {}) a[k] = extra[k]; return el(los, "text", a, s); }
    function line(d, stroke, w, dash) { var a = { d: d, stroke: stroke, "stroke-width": w, fill: "none" }; if (dash) a["stroke-dasharray"] = dash; return el(los, "path", a); }
    function draw(e) {
      var r = e * Math.PI / 180, sn = Math.sin(r), cs = Math.cos(r), tn = Math.tan(r);
      los.textContent = "";
      el(los, "rect", { x: 20, y: YT, width: 420, height: 50, fill: "rgba(224,180,138,.07)" });
      line("M20 " + YT + " H440", C.bone, 1.4);
      txt(440, YT + 20, "true surface", C.muted, { "text-anchor": "end" });
      line("M20 " + YD + " H440", C.bone, 1.2, "6 5");
      txt(440, YD - 9, "DTM surface (vertical error Δz, exaggerated)", C.muted, { "text-anchor": "end" });
      line("M52 " + YD + " V" + YT + " M46 " + YD + " H58 M46 " + YT + " H58", C.text, 1.2);
      txt(64, (YD + YT) / 2 + 5, "Δz", C.bone);
      line("M" + PX + " 34 V" + YT, C.hair, 1, "3 4");
      var sx = PX - sn * 150, sy = YD - cs * 150, tx = PX + ZPX * tn;
      line("M" + sx + " " + sy + " L" + PX + " " + YD, C.glow, 1.8);
      line("M" + PX + " " + YD + " L" + tx + " " + YT, C.glow, 1.5, "5 4");
      el(los, "rect", { x: sx - 10, y: sy - 8, width: 20, height: 16, rx: 3, fill: "#12141A", stroke: C.glow, "stroke-width": 1.4, transform: "rotate(" + (-e) + " " + sx + " " + sy + ")" });
      txt(sx + 16, sy + 4, "HiRISE line of sight", C.glow);
      if (e > 0.6) {
        var ax = PX - 46 * sn, ay = YD - 46 * cs;
        line("M" + PX + " " + (YD - 46) + " A46 46 0 0 0 " + ax + " " + ay, C.bone, 1.2);
        txt(PX - 46 * Math.sin(r / 2) - 14, YD - 46 * Math.cos(r / 2) - 4, "e", C.bone, { "font-style": "italic" });
      }
      el(los, "circle", { cx: PX, cy: YD, r: 5, fill: C.glow });
      el(los, "circle", { cx: tx, cy: YT, r: 5, fill: C.dust });
      if (tx - PX > 2) line("M" + PX + " " + (YT + 26) + " H" + tx + " M" + PX + " " + (YT + 20) + " V" + (YT + 32) + " M" + tx + " " + (YT + 20) + " V" + (YT + 32), C.dust, 1.8);
      txt(Math.max(PX + 6, (PX + tx) / 2), YT + 46, "horizontal displacement Δz · tan e", C.dust, { "text-anchor": "middle" });
    }
    function E(g, e) { var s = DZ * Math.tan(e * Math.PI / 180); return Math.sqrt(g * g + s * s); }
    function set() {
      var e = +$("eIn").value;
      $("eOut").textContent = e.toFixed(1) + "°";
      $("kShift").textContent = (DZ * Math.tan(e * Math.PI / 180) * 100).toFixed(1) + " cm";
      $("kEA").textContent = E(0.25, e).toFixed(3) + " m";
      draw(e);
    }
    $("eIn").addEventListener("input", set); set();
  }

  /* ------------------------------------------------ native pixels inside one 1 m DTM post */
  document.querySelectorAll("svg.cimg").forEach(function (svg) {
    var n = +svg.dataset.n, d = 96 / n;
    el(svg, "rect", { x: 2, y: 2, width: 96, height: 96, fill: "rgba(236,229,220,.04)", stroke: C.bone, "stroke-width": 1.5 });
    for (var i = 1; i < n; i++) {
      el(svg, "path", { d: "M" + (2 + i * d) + " 2 V98 M2 " + (2 + i * d) + " H98", stroke: n === 4 ? C.dust : C.muted, "stroke-width": 1, fill: "none" });
    }
  });

  /* ------------------------------------------------ site folder name */
  var fname = $("fname");
  if (fname) {
    var PARTS = [
      "<b>Region</b>: the site or feature name, here Gully Monitoring.",
      "<b>Longitude 352.5° E</b>: written in tenths of a degree, so 3525 means 352.5.",
      "<b>Latitude 35.1° S</b>: tenths of a degree again, S for south and N for north. The label is an approximate centre; the pipeline's outputs use the exact centre read by GDAL."
    ];
    // longitude 0 to 360 E left to right, latitude 90 N to 90 S top to bottom (1 unit = 1 degree)
    var g = $("graticule"), LON = 352.5, LAT = -35.1, gx = LON, gy = 90 - LAT;
    el(g, "rect", { x: 0.5, y: 0.5, width: 359, height: 179, rx: 6, fill: "rgba(224,180,138,.05)", stroke: C.hair });
    for (var lo = 30; lo < 360; lo += 30) el(g, "path", { d: "M" + lo + " 0 V180", stroke: C.hair, "stroke-width": lo % 90 ? 0.5 : 0.9, fill: "none" });
    for (var la = 30; la < 180; la += 30) el(g, "path", { d: "M0 " + la + " H360", stroke: C.hair, "stroke-width": la === 90 ? 0.9 : 0.5, fill: "none" });
    var gt = { "font-family": "Geist, system-ui, sans-serif", "font-size": 9, fill: C.muted };
    function gtxt(x, y, s, a) { var o = { x: x, y: y }; for (var k in gt) o[k] = gt[k]; for (k in a || {}) o[k] = a[k]; return el(g, "text", o, s); }
    gtxt(4, 88, "0°"); gtxt(4, 176, "90° S"); gtxt(4, 10, "90° N"); gtxt(184, 176, "180° E"); gtxt(356, 176, "360° E", { "text-anchor": "end" });
    var vLine = el(g, "path", { d: "M" + gx + " 0 V180", stroke: C.dust, "stroke-width": 1.2, fill: "none", opacity: 0 });
    var hLine = el(g, "path", { d: "M0 " + gy + " H360", stroke: C.dust, "stroke-width": 1.2, fill: "none", opacity: 0 });
    el(g, "circle", { cx: gx, cy: gy, r: 9, fill: "none", stroke: C.dust, "stroke-width": 1, opacity: 0.5 });
    el(g, "circle", { cx: gx, cy: gy, r: 3.6, fill: C.dust });
    gtxt(gx - 12, gy - 12, "Gully Monitoring", { "text-anchor": "end", fill: C.bone, "font-size": 10 });
    function pick(i) {
      setPressed(fname, "p", i); $("fexp").innerHTML = PARTS[i];
      vLine.setAttribute("opacity", i === 1 ? 1 : 0); hLine.setAttribute("opacity", i === 2 ? 1 : 0);
    }
    fname.addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (b) pick(+b.dataset.p); });
    pick(0);
  }

  /* ------------------------------------------------ site folder: OBJ -> MTL -> JPG chain */
  var bseg = $("breakSeg");
  if (bseg) {
    var CASES = {
      ok: "The OBJ names its material file in its <code>mtllib</code> line, and the MTL names the texture in its <code>map_Kd</code> line. Both are plain file names, so the three files must stay side by side in MESH with their original names. Twinmotion then applies the orthoimage automatically on import.",
      rename: "<b>Renamed texture.</b> The MTL still asks for <code>&lt;id&gt;_Texture01.jpg</code>, which no longer exists. The mesh imports with the default white material: the relief is there, the HiRISE image is not. Restore the name, or load the JPG in the material's Texture slot.",
      move: "<b>Moved material.</b> The OBJ asks for <code>&lt;id&gt;_Material_01.mtl</code> next to itself and cannot find it, so no material and no texture are applied: white again. Always copy the whole site folder, never single files."
    };
    function brk(k) {
      setPressed(bseg, "b", k);
      var ren = k === "rename", mov = k === "move";
      $("jpgName").textContent = ren ? "<id>_Texture01_v2.jpg" : "<id>_Texture01.jpg";
      $("fJpg").classList.toggle("bad", ren);
      $("fJpg").querySelector(".rl").textContent = ren ? "renamed: the MTL no longer matches" : "orthoimage texture";
      $("refMtl").classList.toggle("bad", ren);
      $("fMtl").hidden = mov; $("fMoved").hidden = !mov;
      $("refObj").classList.toggle("bad", mov);
      $("fImgOk").hidden = k !== "ok"; $("fImgBad").hidden = k === "ok";
      $("ftile").classList.toggle("broken", k !== "ok");
      $("fCap").textContent = k === "ok" ? "Illustration: orthoimage applied" : "Illustration: plain white, no orthoimage";
      $("bexp").innerHTML = CASES[k];
    }
    bseg.addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (b) brk(b.dataset.b); });
    brk("ok");
  }
})();
