// Closing flight: a scroll-driven flyover of Gorgonum Chaos, from an oblique overview of the whole
// window down across the chaos mesas to the rim of a fresh impact crater.
// Terrain: real HiRISE data, a 3.6 km window of DTEEC_074396_1425_074251_1425_A01 draped with the
// RED ortho of ESP_074251_1425, true scale, vertical exaggeration 1.0, unlit (see real-terrain.js).
// HiRISE data: NASA/JPL/University of Arizona.
// Author: Raymundo "R@y" Olguin, HiROC and SIC, LPL, University of Arizona.
import * as THREE from "three";
import { loadTerrain } from "./real-terrain.js";
import { framing, applyFraming } from "./framing.js";

const canvas = document.getElementById("outroGL");
const section = document.getElementById("gorgonum");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 1, 40000);
const T = await loadTerrain("gorgonum");
// unlit; on phones every 2nd post (12 m) keeps the flight smooth, the ortho still carries the detail
const small = matchMedia("(max-width: 700px)").matches;
scene.add(new THREE.Mesh(T.buildGeometry(small ? 2 : 1), new THREE.MeshBasicMaterial({ map: T.texture() })));

// ---------------------------------------------------------------- path fitted to the real terrain
const S = T.SIZE, g = (x, z) => T.heightAt(x, z);
// fresh crater: lowest point near the south-centre of the window
let best = Infinity, cx = 0, cz = 0;
for (let x = -0.15 * S; x <= 0.25 * S; x += 8) for (let z = 0.08 * S; z <= 0.38 * S; z += 8) { const h = g(x, z); if (h < best) { best = h; cx = x; cz = z; } }
// north rim: highest point due north of the floor
let rimD = 0.12 * S, rimH = -Infinity;
for (let d = 0.04 * S; d <= 0.2 * S; d += 4) { const h = g(cx, cz - d); if (h > rimH) { rimH = h; rimD = d; } }
const eyeZ = cz - rimD - 40;
const eye = new THREE.Vector3(cx, g(cx, eyeZ) + 34, eyeZ);
const R = T.meta.relief_m;
const posPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.05 * S, R + 0.95 * S, -0.95 * S),
  new THREE.Vector3(-0.32 * S, R + 0.32 * S, -0.42 * S),
  new THREE.Vector3(-0.18 * S, R + 0.12 * S, -0.06 * S),
  new THREE.Vector3(cx - 0.05 * S, rimH + 0.06 * S, eyeZ - 0.12 * S),
  eye], false, "centripetal");
const crater = new THREE.Vector3(cx, best, cz);
const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, R * 0.4, 0.05 * S),
  new THREE.Vector3(-0.05 * S, R * 0.4, 0.12 * S),
  crater.clone().lerp(new THREE.Vector3(0, R * 0.4, 0), 0.4),
  crater.clone(),
  new THREE.Vector3(cx, best + 30, cz + rimD * 0.55)], false, "centripetal");

const STAGES = [
  [0.00, "Overview", "a 3.6 km window of the DTM, 1 m posts downsampled by a factor of 6"],
  [0.33, "Stereo pair", "ESP_074396_1425 at e 19.77°, ESP_074251_1425 at e 6.49°, both bin 1"],
  [0.62, "Orthoimage", "ESP_074251_1425 RED: lowest score E, displayed unlit"],
  [0.86, "Crater rim", "true scale, vertical exaggeration 1.0"]];
const stageEls = Array.from(document.querySelectorAll("#stages2 li"));
const copy = section.querySelector(".hero-copy");

let progress = reduce ? 0.95 : 0, idleOn = false;
const descentEl = section.querySelector(".descent");
const tmp = new THREE.Vector3();
function place(p) {
  posPath.getPointAt(p, camera.position);
  camera.position.y = Math.max(camera.position.y, g(camera.position.x, camera.position.z) + 25);
  lookPath.getPointAt(p, tmp); camera.lookAt(tmp);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  const fr = framing(W, H, reduce ? 1 : p, 0.32, { py: 0.25 });
  applyFraming(camera, tmp, W, H, fr, g, 25, reduce ? null : { tilt: 0.12, yaw: 0.24, period: 20 }, performance.now() / 1000);
  idleOn = !reduce && fr.intro > 0.001;
  if (descentEl) descentEl.style.opacity = fr.portrait ? String(1 - fr.intro) : "";
  let k = 0; STAGES.forEach((s, i) => { if (p >= s[0]) k = i; });
  $("altVal2").textContent = STAGES[k][1];
  $("altLbl2").textContent = STAGES[k][2];
  stageEls.forEach((el, i) => el.classList.toggle("on", i === k));
  $("hgt2").textContent = Math.round(camera.position.y - g(camera.position.x, camera.position.z)).toLocaleString("en-US") + " m above the ground";
  if (!reduce && copy) { const o = Math.max(0, 1 - Math.max(0, p - 0.1) * 4.5); copy.style.opacity = o; copy.style.transform = `translateY(${(1 - o) * -24}px)`; }
}

if (!reduce && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({ trigger: "#gorgonum", start: "top top", end: "bottom bottom", scrub: 0.6,
    onUpdate: (st) => { progress = st.progress; } });
}

// ---------------------------------------------------------------- loop (paused when off screen)
let visible = false;
new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
let dirty = true, shown = -1;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < 700 ? 60 : 42; camera.updateProjectionMatrix(); dirty = true;
}
new ResizeObserver(resize).observe(canvas); resize();
place(progress); renderer.render(scene, camera);
renderer.setAnimationLoop(() => {
  if (!visible) return;
  if (shown !== progress || dirty || idleOn) { place(progress); shown = progress; dirty = false; renderer.render(scene, camera); }
});
