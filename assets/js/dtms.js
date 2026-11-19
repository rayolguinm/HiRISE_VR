// "Explore all 40 DTMs": every HiRISE DTM produced at HiROC by Raymundo "R@y" Olguin, as true-scale 3D windows.
// Data: assets/data/dtms/catalog.json (from the HiRISE_Phone gallery) and one folder per DTM with a 256 x 256 post
// terrain-RGB window read from the PDS .IMG, the matching crop of the selected RED orthoimage browse, and meta.json.
// HiRISE data: NASA/JPL/University of Arizona.
// Author: Raymundo "R@y" Olguin, HiROC and SIC, LPL, University of Arizona.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadTerrain } from "./real-terrain.js";

const $ = (id) => document.getElementById(id);
const canvas = $("dxGL");
if (canvas) init();

async function init() {
  const all = await fetch(new URL("../data/dtms/catalog.json", import.meta.url)).then((r) => r.json());
  // newest release first, undated last
  all.sort((a, b) => (b.date || "0").localeCompare(a.date || "0"));
  const REGIONS = ["All", "Equatorial", "Mid-Latitude", "High-Latitude", "North Polar", "South Polar"];
  const RCOL = { "Equatorial": "#E0B48A", "Mid-Latitude": "#C9A27A", "High-Latitude": "#9CC4E4", "North Polar": "#ECE5DC", "South Polar": "#8FB8D8" };
  let region = "All", list = all.slice(), cur = 0, ve = 1;

  const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const latS = (v) => fmt(Math.abs(v), 1) + "° " + (v < 0 ? "S" : "N");
  const lonS = (v) => fmt(v, 1) + "° E";
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ------------------------------------------------------------ map
  const NS = "http://www.w3.org/2000/svg", map = $("dxMap");
  const el = (n, a, p = map) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const X = (lon) => lon * 2, Y = (lat) => (90 - lat) * 2;
  el("rect", { x: 0, y: 0, width: 720, height: 360, rx: 10, class: "mframe" });
  for (let l = 30; l < 360; l += 30) el("line", { x1: X(l), y1: 0, x2: X(l), y2: 360, class: "mgrid" });
  for (let b = -60; b <= 60; b += 30) el("line", { x1: 0, y1: Y(b), x2: 720, y2: Y(b), class: b === 0 ? "mgrid meq" : "mgrid" });
  for (let b = -60; b <= 60; b += 30) el("text", { x: 6, y: Y(b) - 4, class: "mlab" }).textContent = b === 0 ? "0°" : Math.abs(b) + "° " + (b < 0 ? "S" : "N");
  for (let l = 60; l < 360; l += 60) el("text", { x: X(l) + 4, y: 352, class: "mlab" }).textContent = l + "° E";
  const ring = el("circle", { r: 11, class: "mring" });
  const dots = all.map((d) => {
    const g = el("g", { class: "mdot", tabindex: 0, role: "button", "aria-label": d.name + ", " + latS(d.lat) + ", " + lonS(d.lon) });
    el("circle", { cx: X(d.lon), cy: Y(d.lat), r: 5, fill: RCOL[d.region] || "#ECE5DC" }, g);
    el("title", {}, g).textContent = d.name;
    const go = () => { if (region !== "All" && d.region !== region) setRegion("All"); select(list.indexOf(d)); };
    g.addEventListener("click", go);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    return g;
  });

  // keep dots and labels legible (and dots tappable) at phone widths
  new ResizeObserver(() => {
    const k = 744 / Math.max(1, map.clientWidth);              // viewBox units per CSS pixel
    map.querySelectorAll(".mdot circle").forEach((c) => c.setAttribute("r", Math.max(5, 5.5 * k)));
    ring.setAttribute("r", Math.max(11, 11 * k));
    map.querySelectorAll(".mlab").forEach((t) => t.style.fontSize = Math.max(11, 11 * k) + "px");
  }).observe(map);

  // ------------------------------------------------------------ region filter + cards
  const seg = $("dxReg2");
  REGIONS.forEach((r) => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.r = r;
    b.textContent = r === "All" ? "All " + all.length : r; b.setAttribute("aria-pressed", String(r === region));
    b.addEventListener("click", () => setRegion(r)); seg.appendChild(b);
  });
  function setRegion(r) {
    region = r; const keep = all[cur] ? list[cur] : null;
    list = r === "All" ? all.slice() : all.filter((d) => d.region === r);
    seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.r === r)));
    all.forEach((d, i) => dots[i].classList.toggle("off", r !== "All" && d.region !== r));
    renderCards();
    const k = keep ? list.indexOf(keep) : -1;
    select(k >= 0 ? k : 0);
  }
  const cards = $("dxCards");
  function renderCards() {
    cards.innerHTML = list.map((d, i) =>
      `<li><button type="button" data-i="${i}" aria-label="${esc(d.name)}">` +
      `<img src="assets/data/dtms/${d.slug}/thumb.jpg" alt="" loading="lazy" decoding="async" width="240" height="240">` +
      `<span class="cn">${esc(d.name)}</span><span class="cm">${latS(d.lat)}, ${lonS(d.lon)}</span></button></li>`).join("");
    $("dxCount").textContent = list.length + (list.length === 1 ? " DTM" : " DTMs");
  }
  cards.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) { select(+b.dataset.i); scrollToViewer(); } });
  function scrollToViewer() {
    const r = canvas.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) {
      const y = scrollY + r.top - 90;
      if (window.HiriseVR && window.HiriseVR.lenis) window.HiriseVR.lenis.scrollTo(y); else scrollTo({ top: y, behavior: "smooth" });
    }
  }

  // ------------------------------------------------------------ 3D viewer (created on first approach)
  let renderer, scene, camera, controls, mesh, dirty = true, token = 0;
  function makeGL() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080c);
    camera = new THREE.PerspectiveCamera(42, 1, 5, 60000);
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49;
    controls.addEventListener("change", () => (dirty = true));
    new ResizeObserver(size).observe(canvas); size();
    renderer.setAnimationLoop(() => { if (controls.update() || dirty) { renderer.render(scene, camera); dirty = false; } });
  }
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  }
  async function show(d) {
    const my = ++token;
    $("dxLoad").hidden = false;
    const T = await loadTerrain("dtms/" + d.slug);
    if (my !== token) return;
    if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); mesh.material.map.dispose(); mesh.material.dispose(); }
    mesh = new THREE.Mesh(T.buildGeometry(1), new THREE.MeshBasicMaterial({ map: T.texture() }));
    mesh.scale.y = ve; scene.add(mesh);
    const S = T.SIZE, mid = T.meta.relief_m * 0.35 * ve;
    const fit = camera.aspect < 1 ? 1.45 : 1;
    camera.position.set(S * 0.3 * fit, (S * 0.78 + T.meta.relief_m * ve) * fit, S * 0.92 * fit);
    controls.target.set(0, mid, 0); controls.minDistance = S * 0.08; controls.maxDistance = S * 3;
    camera.far = S * 12; camera.near = S / 2000; camera.updateProjectionMatrix();
    controls.update(); dirty = true;
    $("dxLoad").hidden = true;
    $("dxKV").lastElementChild.textContent = fmt(T.SIZE / 1000, 1) + " km × " + fmt(T.SIZE / 1000, 1) + " km, " + fmt(T.meta.post_m, 1) + " m posts";
  }

  // ------------------------------------------------------------ selection
  function select(i) {
    if (!list.length) return;
    cur = (i + list.length) % list.length; const d = list[cur];
    $("dxReg").textContent = d.region;
    $("dxName").textContent = d.name;
    $("dxCo").textContent = latS(d.lat) + ", " + lonS(d.lon);
    $("dxKV").innerHTML =
      `<dt>DTM</dt><dd>${d.dtm_id}</dd>` +
      `<dt>Stereo pair</dt><dd>${d.pair.join(" and ")}</dd>` +
      `<dt>Post spacing</dt><dd>${fmt(d.post)} m</dd>` +
      `<dt>Elevation range</dt><dd>${fmt(d.zmin)} to ${fmt(d.zmax)} m (relief ${fmt(d.relief)} m)</dd>` +
      `<dt>Texture</dt><dd>${d.ortho}</dd>` +
      `<dt>PDS release</dt><dd>${d.dstr || "not listed"}</dd>` +
      `<dt>3D window</dt><dd>${fmt(d.win_km, 1)} km × ${fmt(d.win_km, 1)} km</dd>`;
    $("dxGeo").textContent = d.geo;
    $("dxCite").textContent = d.cite;
    $("dxLink").href = d.url;
    $("dxPos").textContent = (cur + 1) + " / " + list.length;
    const k = all.indexOf(d);
    dots.forEach((g, j) => g.classList.toggle("on", j === k));
    ring.setAttribute("cx", X(d.lon)); ring.setAttribute("cy", Y(d.lat));
    cards.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.i === cur)));
    if (renderer) show(d);
  }
  $("dxPrev").addEventListener("click", () => select(cur - 1));
  $("dxNext").addEventListener("click", () => select(cur + 1));
  $("dxVE").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-ve]"); if (!b) return;
    ve = +b.dataset.ve;
    $("dxVE").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    if (mesh) { mesh.scale.y = ve; dirty = true; }
  });

  renderCards();
  const want = new URLSearchParams(location.search).get("dtm");
  const start = Math.max(0, all.findIndex((d) => d.slug === want));
  select(start);
  new IntersectionObserver((en, ob) => {
    if (en.some((x) => x.isIntersecting)) { ob.disconnect(); makeGL(); show(list[cur]); }
  }, { rootMargin: "600px 0px" }).observe(canvas);
}
