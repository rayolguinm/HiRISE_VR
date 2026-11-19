// Real HiRISE terrain windows for the 3D views. Each dataset folder in assets/data/ holds a 3.6 km
// window of one DTM and its ortho: site/ (Gully Monitoring, DTEEC_084570_1445_066516_1445_A01) and
// gorgonum/ (Gorgonum Chaos, DTEEC_074396_1425_074251_1425_A01). True scale: 1 scene unit = 1 m, vertical exaggeration 1.0.
// Author: Raymundo "R@y" Olguin, HiROC, LPL, University of Arizona.
// HiRISE data: NASA/JPL/University of Arizona.
import * as THREE from "three";

const cache = {};

export function loadTerrain(name = "site") {
  if (cache[name]) return cache[name];
  const BASE = new URL("../data/" + name + "/", import.meta.url);
  cache[name] = (async () => {
    const [meta, hbmp, image] = await Promise.all([
      fetch(new URL("meta.json", BASE)).then((r) => r.json()),
      // lossless terrain-RGB PNG: value = 256 * red + green
      fetch(new URL("height.png", BASE)).then((r) => r.blob())
        .then((b) => createImageBitmap(b, { colorSpaceConversion: "none", premultiplyAlpha: "none" })),
      new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = bad; im.src = new URL("texture.jpg", BASE).href; })
    ]);
    const N = meta.grid, SIZE = meta.size_m;
    const cv = document.createElement("canvas"); cv.width = hbmp.width; cv.height = hbmp.height;
    const cx2 = cv.getContext("2d", { willReadFrequently: true, colorSpace: "srgb" });
    cx2.drawImage(hbmp, 0, 0);
    const px = cx2.getImageData(0, 0, N, N).data;
    const Z = new Float32Array(N * N);                      // metres above the window's lowest point
    for (let i = 0; i < Z.length; i++) { const v = px[i * 4] * 256 + px[i * 4 + 1]; Z[i] = v === meta.nodata ? NaN : v * meta.z_scale_m; }

    function buildGeometry(s = 1) {
      const n = Math.floor((N - 1) / s) + 1;
      const pos = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const r = i * s, c = j * s, k = i * n + j, z = Z[r * N + c];
        pos[k * 3] = (c / (N - 1) - 0.5) * SIZE;
        pos[k * 3 + 1] = Number.isFinite(z) ? z : 0;
        pos[k * 3 + 2] = (r / (N - 1) - 0.5) * SIZE;          // +Z is south, north is -Z
        uv[k * 2] = c / (N - 1); uv[k * 2 + 1] = 1 - r / (N - 1);
      }
      const idx = [];
      const ok = (r, c) => Number.isFinite(Z[r * s * N + c * s]);
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < n - 1; j++) {
        if (!(ok(i, j) && ok(i, j + 1) && ok(i + 1, j) && ok(i + 1, j + 1))) continue;
        const a = i * n + j, b = a + 1, c = a + n + 1, d = a + n;
        idx.push(a, d, c, a, c, b);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    // bilinear height at scene x, z
    function heightAt(x, z) {
      const c = (x / SIZE + 0.5) * (N - 1), r = (z / SIZE + 0.5) * (N - 1);
      const c0 = Math.max(0, Math.min(N - 2, Math.floor(c))), r0 = Math.max(0, Math.min(N - 2, Math.floor(r)));
      const fc = Math.min(1, Math.max(0, c - c0)), fr = Math.min(1, Math.max(0, r - r0));
      const h = (rr, cc) => { const v = Z[rr * N + cc]; return Number.isFinite(v) ? v : 0; };
      return (h(r0, c0) * (1 - fc) + h(r0, c0 + 1) * fc) * (1 - fr) + (h(r0 + 1, c0) * (1 - fc) + h(r0 + 1, c0 + 1) * fc) * fr;
    }
    function texture() {
      const t = new THREE.Texture(image); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
      return t;
    }
    // sun direction in scene axes (x east, y up, z south) from the RDR label
    const inc = (meta.sun && meta.sun.incidence_deg) || 45;
    const az = ((meta.sun && meta.sun.sub_solar_azimuth_deg) || 180) * Math.PI / 180;  // clockwise from +sample (east)
    const el = (90 - inc) * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).normalize();
    return { meta, N, SIZE, Z, image, buildGeometry, heightAt, texture, sunDir };
  })();
  return cache[name];
}
