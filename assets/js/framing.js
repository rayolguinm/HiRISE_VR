// Screen-aware framing for the two scroll-driven flights (hero.js, outro.js).
// Desktop and tablet landscape: no change. Phone portrait (e.g. iPhone 18 Pro 402 x 874 pt,
// Pro Max 440 x 956 pt): pull the camera back so the terrain fits the narrow width, and lift the
// subject above the headline while the intro copy is on screen. Phone landscape (short viewport):
// slide the subject to the right of the copy. All three ease back to the original path before the
// final eye-level view, so the ending is identical on every screen.
// Author: Raymundo "R@y" Olguin, HiROC and SIC, LPL, University of Arizona.

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// p: scroll progress 0..1; copyGone: progress at which the intro copy has faded out
// opt.px / opt.py: portrait offsets (fraction of the screen) for a path aimed off-centre
// opt.pullMax: cap on the portrait pull-back
export function framing(w, h, p, copyGone, opt = {}) {
  const a = w / Math.max(1, h);
  const portrait = a < 0.9, shortLandscape = a > 1.3 && h < 520;
  const intro = 1 - smooth(0, copyGone, p);          // 1 while the copy is visible
  const late = 1 - smooth(0.4, 0.9, p);              // 1 until the approach, then 0
  let pull = 1, ox = 0, oy = 0;
  if (portrait) {
    pull = 1 + (Math.min(opt.pullMax ?? 2.2, Math.max(1, 0.95 / a)) - 1) * late;
    oy = (opt.py ?? 0.17) * intro;                    // positive: subject moves up the screen
    ox = (opt.px ?? 0) * intro;                       // positive: subject moves left
  } else if (shortLandscape) {
    pull = 1 + 0.4 * late;                            // short screen: step back so the terrain fits the height
    ox = -0.2 * intro;                                // negative: subject moves right of the copy
  }
  return { pull, ox, oy, portrait, shortLandscape, intro };
}

// Cover motion while the intro copy is on screen: tilt the view to an oblique angle (rotation about
// the east-west axis, camera moving south) and sway slowly around the vertical axis. idle.tilt and
// idle.yaw are in radians at full strength; both scale with f.intro, so they vanish as you scroll.
export function idleOffset(v, t, amount, idle) {
  if (!idle || amount <= 0) return v;
  let a = idle.tilt * amount, b = idle.yaw * amount * Math.sin(t * 2 * Math.PI / (idle.period || 18));
  if (idle.spin) {
    // turntable: one full revolution per idle.spin seconds; the wrapped angle eases back to 0 as you scroll
    let ang = (t * 2 * Math.PI / idle.spin) % (2 * Math.PI); if (ang > Math.PI) ang -= 2 * Math.PI;
    b = ang * amount;
    a = (idle.tilt + (idle.breathe || 0) * Math.sin(t * 2 * Math.PI / (idle.period || 18))) * amount;
  }
  const y1 = v.y * Math.cos(a) - v.z * Math.sin(a), z1 = v.y * Math.sin(a) + v.z * Math.cos(a);
  const x2 = v.x * Math.cos(b) + z1 * Math.sin(b), z2 = -v.x * Math.sin(b) + z1 * Math.cos(b);
  v.x = x2; v.y = y1; v.z = z2; return v;
}

// apply to a camera already placed at its path position, looking at `target`
export function applyFraming(camera, target, w, h, f, groundAt, clearance, idle, t) {
  const moveIdle = idle && f.intro > 0 && t != null;
  if (f.pull !== 1 || moveIdle) {
    camera.position.sub(target).multiplyScalar(f.pull);
    if (moveIdle) idleOffset(camera.position, t, f.intro, idle);
    camera.position.add(target);
    camera.position.y = Math.max(camera.position.y, groundAt(camera.position.x, camera.position.z) + clearance);
    camera.lookAt(target);
  }
  if (f.ox || f.oy) camera.setViewOffset(w, h, f.ox * w, f.oy * h, w, h);
  else if (camera.view && camera.view.enabled) camera.clearViewOffset();
}
