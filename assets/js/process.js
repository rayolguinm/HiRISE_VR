// "From orbit to your headset": one real HiRISE DTM shown in four views that follow the pipeline.
//   1 Elevation   (GeoTIFF extraction, raster intake, elevation screening)
//   2 Mesh        (mesh synthesis, downsampling factor)
//   3 Photograph  (ortho texture mapping, under Twinmotion's Default lighting)
//   4 Unlit       (the faithful view used in the headset)
// Terrain: a 3.6 km window of the Gully Monitoring DTM DTEEC_084570_1445_066516_1445_A01 and its RED
// ortho, true scale (see real-terrain.js). HiRISE data: NASA/JPL/University of Arizona.
// Author: Raymundo "R@y" Olguin, HiROC and SIC, LPL, University of Arizona.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadTerrain } from "./real-terrain.js";

const $ = (id) => document.getElementById(id);
const canvas = $("demo3d");
const T = await loadTerrain();
const fmt = (n) => Math.round(n).toLocaleString("en-US");

const STEPS = [
  { stage: "Pipeline stages 1 to 3: GeoTIFF extraction, raster intake, elevation screening",
    title: "Elevation",
    text: "A HiRISE DTM is a grid of elevation posts extracted by stereo matching two RED images acquired at different emission angles: 1 m post spacing, estimated vertical precision of tens of centimetres. Colour is elevation. The pipeline converts the PDS .IMG to GeoTIFF, reads its map projection and screens out NoData posts." },
  { stage: "Pipeline stage 4: mesh synthesis",
    title: "Mesh",
    text: "Each square of four valid posts becomes two triangles. The downsampling factor keeps every N-th post on both axes; AUTO keeps the full DTM under the 10,000,000-triangle budget (factor 3 here)." },
  { stage: "Pipeline stage 5: ortho texture mapping",
    title: "Orthoimage",
    text: "The selected RED orthoimage, orthorectified to this DTM, is draped 1:1 on the mesh UVs. Under Twinmotion's Default lighting it is shaded a second time, on top of the solar illumination already recorded in its pixels at the time of acquisition." },
  { stage: "Stage 6 and Twinmotion: asset serialization, view mode Unlit",
    title: "Unlit",
    text: "Unlit switches all engine lighting off, so each pixel displays its recorded value. This is the faithful view you walk through in the headset." }
];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 2, 40000);
const k = T.SIZE / 2055;
camera.position.set(900 * k, 1100 * k, 1500 * k);
const controls = new OrbitControls(camera, canvas);
controls.target.set(-150, T.meta.relief_m * 0.3, 150); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 120; controls.maxDistance = 9000;

// ---------------------------------------------------------------- materials
const texture = T.texture();
const RAMP = ["#1E2A4A", "#2F5E78", "#7E8A6A", "#C08A5A", "#E9D6B8"].map((c) => new THREE.Color(c));
const elevMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
const meshMat = new THREE.MeshBasicMaterial({ color: 0x07080c, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const wireMat = new THREE.MeshBasicMaterial({ color: 0x9cc4e4, wireframe: true, transparent: true, opacity: 0.55 });
const litMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 });
const unlitMat = new THREE.MeshBasicMaterial({ map: texture });
// Default lighting: engine sun opposite the real solar azimuth (the ortho was imaged with the Sun in the west)
const sun = new THREE.DirectionalLight(0xfff1dd, 2.6);
sun.position.copy(T.sunDir).multiplyScalar(-3000).setY(T.sunDir.y * 3000);
// relief light for the elevation view: along the real Sun direction
const relief = new THREE.DirectionalLight(0xffffff, 2.2);
relief.position.copy(T.sunDir).multiplyScalar(3000);
const amb = new THREE.HemisphereLight(0x9fb4c8, 0x3a2a1c, 0.55);
scene.add(sun, relief, amb);

const state = { step: 0, s: 2, ve: 1, touchedS: false };
let mesh = null, wire = null;

function colorize(g) {
  const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3), R = T.meta.relief_m, c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const t = Math.min(1, Math.max(0, pos.getY(i) / R)) * (RAMP.length - 1), j = Math.min(RAMP.length - 2, Math.floor(t));
    c.copy(RAMP[j]).lerp(RAMP[j + 1], t - j);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
}
function rebuild() {
  if (mesh) { scene.remove(mesh, wire); mesh.geometry.dispose(); }
  const g = T.buildGeometry(state.s); colorize(g);
  mesh = new THREE.Mesh(g, unlitMat); wire = new THREE.Mesh(g, wireMat);
  scene.add(mesh, wire);
  update();
}
function update() {
  const st = state.step;
  mesh.material = [elevMat, meshMat, litMat, unlitMat][st];
  wire.visible = st === 1;
  sun.visible = st === 2; relief.visible = st === 0; amb.visible = st === 0 || st === 2;
  mesh.scale.y = wire.scale.y = state.ve;
  scene.background = new THREE.Color(st === 2 ? 0x2a2e33 : 0x000000);
  const tris = mesh.geometry.index.count / 3;
  $("demoRead").textContent = `${fmt(tris)} triangles, ${(T.meta.native_post_m * T.meta.downsample * state.s).toFixed(0)} m between posts, vertical exaggeration ${state.ve.toFixed(1)}`;
  const S = STEPS[st];
  $("pStage").textContent = S.stage; $("pTitle").textContent = S.title; $("pText").textContent = S.text;
  $("pLegend").hidden = st !== 0; $("pDs").hidden = st !== 1;
  document.querySelectorAll("#pTabs [data-step]").forEach((b) => b.setAttribute("aria-selected", String(+b.dataset.step === st)));
  const f = $("demoFlag"), bad = [];
  if (st === 2) bad.push("Default lighting shades the orthoimage a second time, so shadows look doubled");
  if (state.ve !== 1) bad.push("vertical exaggeration 3.0×: if you exaggerate height for outreach, say so to the viewer");
  if (bad.length) { f.className = "flag bad"; f.innerHTML = "<b>Not faithful:</b> " + bad.join("; ") + "."; }
  else if (st === 3) { f.className = "flag good"; f.innerHTML = "<b>Faithful.</b> Unlit, true scale: what HiRISE recorded."; }
  else { f.className = "flag good"; f.innerHTML = "<b>True scale.</b> 1 mesh unit = 1 projected map metre, vertical exaggeration 1.0."; }
  needs = true;
}
function go(step) {
  state.step = step;
  if (step === 1 && !state.touchedS && state.s < 4) { state.s = 4; setPressed("dsSeg", "s", 4); rebuild(); return; }
  update();
}
function setPressed(id, key, v) { $(id).querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset[key] === v))); }

// ---------------------------------------------------------------- controls
$("pTabs").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-step]"); if (!b) return;
  stopPlay(); go(+b.dataset.step);
});
$("pTabs").addEventListener("keydown", (ev) => {
  if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
  const n = (state.step + (ev.key === "ArrowRight" ? 1 : 3)) % 4; stopPlay(); go(n);
  document.querySelector(`#pTabs [data-step="${n}"]`).focus();
});
$("dsSeg").addEventListener("click", (ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  state.touchedS = true; state.s = +b.dataset.s; setPressed("dsSeg", "s", state.s); rebuild();
});
$("veSeg").addEventListener("click", (ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  state.ve = +b.dataset.v; setPressed("veSeg", "v", state.ve); update();
});
let timer = null;
function stopPlay() { if (timer) { clearInterval(timer); timer = null; } $("pPlay").setAttribute("aria-pressed", "false"); $("pPlay").textContent = "Play"; }
$("pPlay").addEventListener("click", () => {
  if (timer) { stopPlay(); return; }
  $("pPlay").setAttribute("aria-pressed", "true"); $("pPlay").textContent = "Pause";
  go((state.step + 1) % 4);
  timer = setInterval(() => go((state.step + 1) % 4), 4500);
});

$("lgLo").textContent = fmt(T.meta.z_offset_m) + " m";
$("lgHi").textContent = fmt(T.meta.z_offset_m + T.meta.relief_m) + " m";
if ($("statRelief")) $("statRelief").textContent = fmt(T.meta.relief_m) + " m";
setPressed("dsSeg", "s", state.s);

// ---------------------------------------------------------------- render loop (only while visible)
let needs = true, visible = true;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); needs = true;
  }
}
controls.addEventListener("change", () => { needs = true; });
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (!visible) stopPlay(); }).observe(canvas);
function loop() {
  requestAnimationFrame(loop);
  if (!visible) return;
  controls.update();
  if (needs) { resize(); renderer.render(scene, camera); needs = false; }
}
rebuild(); resize(); loop();
