// Hero: a pushbroom "image acquisition" reveal, then a scroll-driven descent from orbit to eye height.
// Phone portrait cover: turntable orbit around the crater, a rising elevation contour and soft window edges.
// Renderer: three.js r187 WebGPURenderer (falls back to WebGL 2 automatically where WebGPU is missing).
// Scroll: GSAP ScrollTrigger, smoothed by Lenis (see ui.js).
// Terrain: real HiRISE data, a 3.6 km window of the Gully Monitoring DTM DTEEC_084570_1445_066516_1445_A01
// with its ortho, true scale (see real-terrain.js). HiRISE data: NASA/JPL/University of Arizona.
// Author: Raymundo "R@y" Olguin, HiROC, LPL, University of Arizona.
import * as THREE from "three/webgpu";
import { texture as texNode, positionLocal, uv, uniform, float, vec3, smoothstep, abs, fract, mix, length, max, min, fwidth } from "three/tsl";
import { loadTerrain } from "./real-terrain.js";
import { framing, applyFraming } from "./framing.js";

const canvas = document.getElementById("heroGL");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
await renderer.init();
$("gpuInfo").textContent = renderer.backend && renderer.backend.isWebGPUBackend ? "Rendered with WebGPU." : "Rendered with WebGL 2.";

const scene = new THREE.Scene();
renderer.setClearColor(0x000000, 0);
const camera = new THREE.PerspectiveCamera(42, 1, 1, 40000);
const T = await loadTerrain();

// ---------------------------------------------------------------- texture revealed line by line, like a pushbroom camera
const src = document.createElement("canvas"); src.width = src.height = Math.min(2048, T.image.naturalWidth);
src.getContext("2d").drawImage(T.image, 0, 0, src.width, src.height);
const disp = document.createElement("canvas"); disp.width = src.width; disp.height = src.height;
const dctx = disp.getContext("2d");
const tex = new THREE.CanvasTexture(disp); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
// Cover look on phones in portrait (fx = 1 while the intro copy is visible, 0 once you scroll):
//   a warm elevation contour rising from the crater floor to the rim, faint iso-elevation lines,
//   and a radial fade that dissolves the square window into the background.
const relief = T.meta.relief_m;
const uFx = uniform(0), uLevel = uniform(-1e4);
const STEP = Math.max(10, Math.round(relief / 14 / 5) * 5);     // contour interval in metres
const BAND = relief * 0.035;
const base = texNode(tex);
const h = positionLocal.y;
const sweep = float(1).sub(smoothstep(0, BAND, abs(h.sub(uLevel))));
const d = abs(fract(h.div(STEP).add(0.5)).sub(0.5)).mul(STEP);
const iso = float(1).sub(smoothstep(0, STEP * 0.07, d));
const glow = vec3(0.88, 0.62, 0.40);
const edge = float(1).sub(smoothstep(0.30, 0.5, length(uv().sub(0.5))));
const mat = new THREE.MeshBasicNodeMaterial({ transparent: true });
// Auto-triangulation (end of each cover cycle): the posts are joined into the same mesh the pipeline
// writes, every quad of four posts split into two triangles, revealed outward from the crater centre.
const uTri = uniform(-1), uTriA = uniform(0), uCtr = uniform(new THREE.Vector2(0, 0)), uRad = uniform(1);
const CELLS = 34;                                          // triangulation cells across the window (display)
const gq = uv().mul(CELLS), fu = fract(gq.x), fv = fract(gq.y);
const aa = fwidth(gq.x).add(fwidth(gq.y)).mul(0.45);
const onU = float(1).sub(smoothstep(0, aa, min(fu, float(1).sub(fu))));
const onV = float(1).sub(smoothstep(0, aa, min(fv, float(1).sub(fv))));
const onD = float(1).sub(smoothstep(0, aa.mul(1.3), abs(fu.sub(fv))));   // the diagonal that splits each quad
const wire = max(max(onU, onV), onD);
const rr = length(positionLocal.xz.sub(uCtr)).div(uRad);
const built = smoothstep(rr.sub(0.05), rr, uTri).mul(uTriA);               // edges already placed
const crest = float(1).sub(smoothstep(0, 0.045, abs(rr.sub(uTri)))).mul(uTriA); // the advancing front
const blue = vec3(0.61, 0.77, 0.89);
const triCol = blue.mul(wire.mul(built.mul(0.85).add(crest.mul(1.2)))).add(blue.mul(crest.mul(0.10)));
mat.colorNode = base.rgb.mul(float(1).sub(built.mul(0.55).mul(uFx)))
  .add(glow.mul(sweep.mul(0.75).add(iso.mul(0.06))).mul(uFx))
  .add(triCol.mul(uFx));
mat.opacityNode = base.a.mul(mix(float(1), edge, uFx));
const mesh = new THREE.Mesh(T.buildGeometry(2), mat);
scene.add(mesh);


let scanRow = reduce || new URLSearchParams(location.search).has("noreveal") ? src.height : 0;
function drawReveal() {
  const H = src.height, W = src.width;
  dctx.drawImage(src, 0, 0, W, Math.max(1, scanRow), 0, 0, W, Math.max(1, scanRow));
  if (scanRow < H) {
    dctx.clearRect(0, scanRow, W, H - scanRow);
    dctx.fillStyle = "rgba(236,229,220,0.9)"; dctx.fillRect(0, scanRow, W, 4);
  }
  tex.needsUpdate = true;
}
drawReveal();

// ---------------------------------------------------------------- the descent path, fitted to the real crater
const groundAt = (x, z) => T.heightAt(x, z);
const k = T.SIZE / 2055;                        // path designed for a 2.05 km window, scaled to this one
// crater floor: lowest point in the central half of the window
let best = Infinity, cx = 0, cz = 0;
const half4 = T.SIZE / 4;
for (let x = -half4; x <= half4; x += 10) for (let z = -half4; z <= half4; z += 10) { const h = groundAt(x, z); if (h < best) { best = h; cx = x; cz = z; } }
const craterC = new THREE.Vector3(cx, best, cz);
uCtr.value.set(cx, cz); uRad.value = T.SIZE * 0.72;
// rim: highest point along the south-east ray from the floor
const dir = new THREE.Vector2(0.7, 0.72).normalize();
let rimD = 300 * k, rimH = -Infinity;
for (let d = 0.12 * T.SIZE; d <= 0.5 * T.SIZE; d += 5) { const h = groundAt(cx + dir.x * d, cz + dir.y * d); if (h > rimH) { rimH = h; rimD = d; } }
const standX = cx + dir.x * (rimD + 15 * k), standZ = cz + dir.y * (rimD + 15 * k);
const eye = new THREE.Vector3(standX, groundAt(standX, standZ) + 28 * k, standZ);
const far = new THREE.Vector3(cx - dir.x * rimD * 0.55, best + 70 * k, cz - dir.y * rimD * 0.55);   // down into the crater, toward the far wall
const V = (x, y, z) => new THREE.Vector3(cx + x * k, y * k, cz + z * k);
const posPath = new THREE.CatmullRomCurve3([
  V(-400, 3700, 0.01), V(160, 2100, 1150), V(460, 1100, 1050), V(400, 560, 650), eye], false, "centripetal");
// early frames look a little west of the crater so it sits to the right of the headline
const lookPath = new THREE.CatmullRomCurve3([
  craterC.clone().add(new THREE.Vector3(-400 * k, 0, 0)), craterC.clone().add(new THREE.Vector3(-240 * k, 0, 0)), craterC.clone(),
  craterC.clone().lerp(far, 0.5), far], false, "centripetal");

// Stage names follow the pipeline and the Twinmotion VR User Manual.
const STAGES = [
  [0.00, "Stereo DTM", "1 m post spacing, estimated vertical precision of tens of cm"],
  [0.30, "Textured mesh", "RED orthoimage draped 1:1 on the mesh UVs"],
  [0.60, "Twinmotion", "Unlit view mode: each pixel displays its recorded value"],
  [0.88, "VR headset", "vertical exaggeration 1.0, true scale"]];
const stageEls = Array.from(document.querySelectorAll("#stages li"));
const copy = document.querySelector(".hero-copy");
let progress = reduce ? 0.62 : 0, idleOn = false;
const descentEl = document.querySelector("#top .descent");
const tmp = new THREE.Vector3();
function place(p) {
  posPath.getPointAt(p, camera.position);
  camera.position.y = Math.max(camera.position.y, groundAt(camera.position.x, camera.position.z) + 4);
  lookPath.getPointAt(p, tmp);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  const portrait = W / Math.max(1, H) < 0.9;
  const fr = framing(W, H, reduce ? 1 : p, 0.42, portrait ? { px: 0, py: 0.16, pullMax: 1.28 } : { px: 0.12, py: 0.2, pullMax: 1.55 });
  if (portrait) tmp.lerp(craterC, fr.intro);          // phone cover: orbit around the crater itself
  camera.lookAt(tmp);
  const t = performance.now() / 1000;
  const idle = reduce ? null : portrait ? { tilt: 0.78, breathe: 0.06, period: 11, spin: 46 } : { tilt: 0.8, yaw: 0.34, period: 18 };
  applyFraming(camera, tmp, W, H, fr, groundAt, 4, idle, t);
  uFx.value = portrait && !reduce ? fr.intro : 0;
  // one cover cycle (11 s): contour sweep floor to rim, then the auto-triangulation, then back to the image
  const P = 11, ph = (t % P) / P, ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 2);
  uLevel.value = ph < 0.42 ? -BAND + (relief + 2 * BAND) * ease(ph / 0.42) : -1e4;
  uTri.value = ph < 0.46 ? -1 : 1.15 * ease((ph - 0.46) / 0.3);
  uTriA.value = ph < 0.46 ? 0 : ph < 0.86 ? 1 : 1 - (ph - 0.86) / 0.12;
  if (uTriA.value < 0) uTriA.value = 0;
  idleOn = !reduce && fr.intro > 0.001;
  if (descentEl) descentEl.style.opacity = fr.portrait ? String(1 - fr.intro) : "";
  if (!reduce) {
    let k = 0; STAGES.forEach((s, i) => { if (p >= s[0]) k = i; });
    $("altVal").textContent = STAGES[k][1];
    $("altLbl").textContent = STAGES[k][2];
    stageEls.forEach((el, i) => el.classList.toggle("on", i === k));
    $("cue").style.opacity = p > 0.03 ? 0 : 1;
    const f = Math.min(1, Math.max(0, (p - 0.12) / 0.3)), o = 1 - f * f * (3 - 2 * f);   // smoothstep fade of the intro copy
    copy.style.opacity = o; copy.style.transform = `translateY(${(1 - o) * -24}px)`; copy.style.visibility = o < 0.02 ? "hidden" : "visible";
  }
}

if (!reduce && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({ trigger: "#top", start: "top top", end: "bottom bottom", scrub: 0.6,
    onUpdate: (st) => { progress = st.progress; } });
}

// ---------------------------------------------------------------- loop (paused when the hero is off screen)
let visible = true;
new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < 700 ? 60 : 42; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas); resize();
let shown = -1, dirty = true;
new ResizeObserver(() => { dirty = true; }).observe(canvas);
renderer.setAnimationLoop(() => {
  if (!visible) return;
  if (scanRow < src.height) { scanRow = Math.min(src.height, scanRow + 12); drawReveal(); dirty = true; }
  if (shown !== progress || dirty || idleOn) { place(progress); shown = progress; dirty = false; renderer.render(scene, camera); }
});
