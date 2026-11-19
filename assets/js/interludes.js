// Interludes: short scroll-driven flights between the chapters, each over a different HiRISE DTM
// produced at HiROC by Raymundo "R@y" Olguin. Four camera moves, all fitted to the real terrain:
//   rim     orbit around the deepest point, high above the rim, settling lower
//   spiral  spiral descent from an oblique overview to just above the floor
//   valley  low pass across the window, following the relief, looking ahead
//   crane   start low on the floor looking at the highest relief, then rise to an overview
// Terrain: 256 x 256 post windows from assets/data/dtms (true scale, vertical exaggeration 1.0, unlit).
// One WebGL context per interlude, created near the viewport and released when far away (iPhone limit).
// HiRISE data: NASA/JPL/University of Arizona.
// Author: Raymundo "R@y" Olguin, HiROC and SIC, LPL, University of Arizona.
import * as THREE from "three";
import { loadTerrain } from "./real-terrain.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const BG = new THREE.Color(0x0b0d12);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let catalog = null;
const getCatalog = () => catalog || (catalog = fetch(new URL("../data/dtms/catalog.json", import.meta.url)).then((r) => r.json()));
const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// soft rounded-square alpha: the window edges dissolve into the night background, the interior stays whole
let edgeTex = null;
function edgeMap() {
  if (edgeTex) return edgeTex;
  const N = 256, c = document.createElement("canvas"); c.width = c.height = N;
  const x = c.getContext("2d"), im = x.createImageData(N, N);
  const f = (u) => { const t = Math.min(1, Math.max(0, Math.min(u, 1 - u) / 0.14)); return t * t * (3 - 2 * t); };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = 255 * f(i / (N - 1)) * f(j / (N - 1)), k = (j * N + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = v; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0);
  return (edgeTex = new THREE.CanvasTexture(c));
}

function fitPath(move, T) {
  const S = T.SIZE, R = T.meta.relief_m, g = (x, z) => T.heightAt(x, z);
  const scan = (fn, r = 0.36) => { let b = null; for (let x = -r * S; x <= r * S; x += S / 64) for (let z = -r * S; z <= r * S; z += S / 64) { const h = g(x, z); if (b === null || fn(h, b[1])) b = [V(x, h, z), h]; } return b[0]; };
  const low = scan((a, b) => a < b, 0.22), high = scan((a, b) => a > b, 0.3);
  const ctr = V(0, g(0, 0), 0), mid = low.clone().lerp(ctr, 0.5);
  const ring = (c, rad, ang, y) => V(c.x + Math.cos(ang) * rad, y, c.z + Math.sin(ang) * rad);
  let pos = [], look = [];
  if (move === "rim") {
    const a0 = Math.atan2(high.z - mid.z, high.x - mid.x) + Math.PI * 0.8;
    for (let i = 0; i <= 6; i++) { const t = i / 6; pos.push(ring(mid, S * (0.5 - 0.14 * t), a0 + t * 1.7, mid.y + R * (0.9 - 0.3 * t) + S * (0.26 - 0.12 * t))); look.push(mid.clone().setY(mid.y + R * 0.25)); }
  } else if (move === "spiral") {
    for (let i = 0; i <= 8; i++) { const t = i / 8; const c = ctr.clone().lerp(low, t); pos.push(ring(c, S * (0.52 - 0.36 * t), t * Math.PI * 1.5, c.y + R * (1 - 0.6 * t) + S * (0.3 - 0.24 * t) + 40)); look.push(c.clone().setY(c.y + R * 0.15 * (1 - t))); }
  } else if (move === "valley") {
    const d = new THREE.Vector2(high.x - low.x, high.z - low.z).normalize(), n = V(-d.y, 0, d.x);
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, s = (t - 0.5) * 0.85 * S, x = d.x * s + n.x * S * 0.12, z = d.y * s + n.z * S * 0.12;
      let m = -Infinity; for (let k = -2; k <= 4; k++) m = Math.max(m, g(x + d.x * k * S * 0.03, z + d.y * k * S * 0.03));
      pos.push(V(x, m + 90 + 60 * Math.sin(t * Math.PI), z));
      look.push(V(x + d.x * S * 0.3, m - R * 0.15, z + d.y * S * 0.3));
    }
  } else { // crane
    const d = V(high.x - low.x, 0, high.z - low.z).normalize();
    for (let i = 0; i <= 5; i++) {
      const t = i / 5, e = t * t;
      const p = low.clone().addScaledVector(d, -S * (0.06 + 0.4 * e)); p.y = low.y + 45 + (R + S * 0.42) * e;
      pos.push(p); look.push(high.clone().lerp(low, 0.55 * e).setY(high.y - R * 0.25 * e));
    }
  }
  return { pos: new THREE.CatmullRomCurve3(pos, false, "centripetal"), look: new THREE.CatmullRomCurve3(look, false, "centripetal"), g };
}

// ---------------------------------------------------------------- one shared WebGL context
// iPhone Safari drops the oldest WebGL contexts when a page holds several (cover, process demo,
// explorer, flights). All four flights therefore share ONE renderer whose canvas moves to the
// flight on screen; only that flight's terrain is on the GPU. If the context is lost anyway it is
// rebuilt, and if WebGL is unavailable the flight falls back to a still of its orthoimage.
let R = null, active = null, token = 0;

function renderer() {
  if (R) return R;
  const canvas = document.createElement("canvas");
  canvas.className = "il-gl"; canvas.setAttribute("aria-hidden", "true");
  let gl;
  try {
    gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "default" });
  } catch (e) { return (R = { failed: true }); }
  gl.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.setClearColor(BG, 1);
  R = { gl, canvas, lost: false };
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); R.lost = true; if (active) active.el.classList.remove("ready"); });
  canvas.addEventListener("webglcontextrestored", () => { R.lost = false; if (active) { const f = active; f.scene = null; activate(f, true); } });
  new ResizeObserver(size).observe(canvas);
  gl.setAnimationLoop(() => {
    const f = active;
    if (!f || !f.scene || R.lost) return;
    f.place(f.progress); gl.render(f.scene, f.camera);
  });
  return R;
}
function size() {
  if (!R || R.failed || !active || !active.camera) return;
  const w = R.canvas.clientWidth, h = R.canvas.clientHeight; if (!w || !h) return;
  R.gl.setSize(w, h, false);
  active.camera.aspect = w / h; active.camera.fov = w / h < 0.9 ? 64 : 46; active.camera.updateProjectionMatrix();
}
function release(f) {
  if (!f || !f.mesh) return;
  f.mesh.geometry.dispose(); f.mesh.material.map.dispose(); f.mesh.material.dispose();
  f.mesh = f.scene = f.camera = null; f.el.classList.remove("ready");
}
async function activate(f, force) {
  if (active === f && !force) return;
  const r = renderer();
  if (r.failed) { f.el.classList.add("nogl"); return; }
  if (active && active !== f) release(active);
  active = f;
  f.el.querySelector(".il-pin").insertBefore(r.canvas, f.el.querySelector(".il-cap"));
  const my = ++token;
  const T = await loadTerrain("dtms/" + f.slug);
  if (my !== token || active !== f) return;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, T.SIZE * 0.55, T.SIZE * 1.6);
  const camera = new THREE.PerspectiveCamera(46, 1, 2, T.SIZE * 6);
  const mesh = new THREE.Mesh(T.buildGeometry(1), new THREE.MeshBasicMaterial({ map: T.texture(), alphaMap: edgeMap(), transparent: true }));
  scene.add(mesh);
  const P = fitPath(f.move, T), tmp = new THREE.Vector3(), t0 = performance.now() / 1000;
  f.place = (p) => {
    const t = performance.now() / 1000 - t0;
    P.pos.getPointAt(p, camera.position);
    camera.position.x += Math.sin(t * 0.21) * T.SIZE * 0.006; camera.position.z += Math.cos(t * 0.17) * T.SIZE * 0.006;
    camera.position.y = Math.max(camera.position.y, P.g(camera.position.x, camera.position.z) + 30);
    P.look.getPointAt(p, tmp); camera.lookAt(tmp);
    if (f.hgt) f.hgt.textContent = fmt(camera.position.y - P.g(camera.position.x, camera.position.z)) + " m above the ground";
  };
  Object.assign(f, { scene, camera, mesh });
  size();
  if (!R.lost) f.el.classList.add("ready");
}

function setup(sec) {
  const f = { el: sec, slug: sec.dataset.dtm, move: sec.dataset.move, hgt: sec.querySelector(".il-hgt"), progress: reduce ? 0.55 : 0 };
  const cap = sec.querySelector(".il-cap");
  const old = sec.querySelector(".il-pin canvas"); if (old) old.remove();
  // still of the orthoimage, shown only when WebGL is unavailable
  sec.querySelector(".il-pin").style.setProperty("--poster", `url("${new URL("../data/dtms/" + f.slug + "/texture.jpg", import.meta.url).href}")`);

  getCatalog().then((c) => {
    const d = c.find((x) => x.slug === f.slug); if (!d) return;
    sec.querySelector(".il-reg").textContent = d.region + ", " + fmt(Math.abs(d.lat), 1) + "° " + (d.lat < 0 ? "S" : "N") + ", " + fmt(d.lon, 1) + "° E";
    sec.querySelector(".il-name").textContent = d.name;
    sec.querySelector(".il-id").textContent = d.dtm_id + ", relief " + fmt(d.relief) + " m";
    const a = sec.querySelector(".il-open"); if (a) a.href = "?dtm=" + f.slug + "#dtms";
  });

  if (!reduce && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6,
      onToggle: (st) => { if (st.isActive) activate(f); },
      onUpdate: (st) => {
        f.progress = st.progress;
        const o = Math.min(1, Math.max(0, (st.progress - 0.18) / 0.14)) * Math.min(1, Math.max(0, (0.92 - st.progress) / 0.1));
        if (cap) { cap.style.opacity = o; cap.style.transform = `translateY(${(1 - o) * 16}px)`; }
      } });
  } else {
    if (cap) cap.style.opacity = 1;
    new IntersectionObserver((e) => { if (e[0].isIntersecting) activate(f); }, { threshold: 0.3 }).observe(sec);
  }
}

document.querySelectorAll(".ilude").forEach(setup);
