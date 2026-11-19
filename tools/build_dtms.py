# Builds true-scale terrain windows for all 40 DTMs listed in R@y's HiRISE_Phone gallery.
# Author: Raymundo "R@y" Olguin. HiRISE data: NASA/JPL/University of Arizona.
import json, re, sys, os, io, struct, math, concurrent.futures as cf
import numpy as np, requests
from PIL import Image
S = requests.Session()
a = requests.adapters.HTTPAdapter(pool_connections=32, pool_maxsize=32, max_retries=3); S.mount("https://", a)
N = 256; TEX = 1024; THUMB = 240
OUT = sys.argv[2]

def get(url, rng=None):
    h = {"Range": "bytes=%d-%d" % rng} if rng else {}
    for k in range(4):
        try:
            r = S.get(url, headers=h, timeout=60); r.raise_for_status(); return r.content
        except Exception as e:
            err = e
    raise err

def label(txt, key, cast=str):
    m = re.search(r"^\s*" + key + r"\s*=\s*\"?([^\"<\r\n]+)", txt, re.M)
    return cast(m.group(1).strip()) if m else None

def slug(name):
    return re.sub(r"_+", "-", name).lower()

def build(rec):
    sl = slug(rec["name"]); d = os.path.join(OUT, sl); os.makedirs(d, exist_ok=True)
    extras = rec["ortho"].rsplit("/", 1)[0] + "/"
    pdsdir = extras.replace("/PDS/EXTRAS/DTM/", "/PDS/DTM/")
    listing = get(pdsdir).decode("latin-1")
    img = re.findall(r'href="(DTE[A-Z]{2}_[^"]+\.IMG)"', listing)[0]
    url = pdsdir + img
    head = get(url, (0, 60000)).decode("latin-1")
    rb = label(head, "RECORD_BYTES", int); rec_img = int(re.search(r"\^IMAGE\s*=\s*(\d+)", head).group(1))
    L = label(head, "LINES", int); W = label(head, "LINE_SAMPLES", int)
    scale = float(label(head, "MAP_SCALE").split()[0])
    loff = float(label(head, "LINE_PROJECTION_OFFSET").split()[0]); soff = float(label(head, "SAMPLE_PROJECTION_OFFSET").split()[0])
    proj = label(head, "MAP_PROJECTION_TYPE")
    off0 = (rec_img - 1) * rb
    row = lambda r, c0=0, c1=None: np.frombuffer(get(url, (off0 + r * W * 4 + c0 * 4, off0 + r * W * 4 + (c1 if c1 else W) * 4 - 1)), "<f4")
    # 1) coarse validity mask from 96 full rows
    rows = np.linspace(0, L - 1, 96).astype(int)
    with cf.ThreadPoolExecutor(16) as ex: R = list(ex.map(row, rows))
    cs = max(1, W // 96); M = np.array([r[::cs][:96] for r in R]) > -1e30
    # largest all-valid square in the coarse grid (aspect-correct: row step vs col step)
    rs = (L - 1) / 95.0
    best = (0, 0, 0)
    for side_m in np.linspace(min(L, W) * 0.95, min(L, W) * 0.2, 30):
        h = int(math.ceil(side_m / rs)) + 1; w = int(math.ceil(side_m / cs)) + 1
        if h > M.shape[0] or w > M.shape[1]: continue
        ii = np.cumsum(np.cumsum(np.pad(~M, ((1, 0), (1, 0))), 0), 1)
        bad = ii[h:, w:] - ii[:-h, w:] - ii[h:, :-w] + ii[:-h, :-w]
        ok = np.argwhere(bad == 0)
        if len(ok):
            cy, cx = (np.array(M.shape) - [h, w]) / 2.0
            i, j = ok[np.argmin((ok[:, 0] - cy) ** 2 + (ok[:, 1] - cx) ** 2)]
            best = (side_m, i * rs, j * cs); break
    side, r0, c0 = best
    side = int(side * 0.9); r0 = int(r0 + side * 0.055); c0 = int(c0 + side * 0.055)
    side = min(side, L - r0 - 1, W - c0 - 1)
    # 2) N x N posts inside the window
    rr = np.linspace(r0, r0 + side, N).round().astype(int); cc = np.linspace(0, side, N).round().astype(int)
    with cf.ThreadPoolExecutor(16) as ex: R = list(ex.map(lambda r: row(r, c0, c0 + side + 1), rr))
    Z = np.array([r[cc] for r in R], dtype=np.float64); Z[Z < -1e30] = np.nan
    zmin, zmax = np.nanmin(Z), np.nanmax(Z); zs = max((zmax - zmin) / 65000.0, 1e-4)
    q = np.where(np.isnan(Z), 65535, np.round((Z - zmin) / zs)).astype(np.uint32)
    rgb = np.stack([(q >> 8) & 255, q & 255, np.zeros_like(q)], -1).astype(np.uint8)
    Image.fromarray(rgb, "RGB").save(os.path.join(d, "height.png"), optimize=True)
    # 3) texture: crop of the selected ortho browse, aligned through the ortho label
    oname = rec["ortho"].rsplit("/", 1)[1].replace(".br.jpg", "")
    olbl = get(pdsdir + oname + ".LBL").decode("latin-1")
    oL = label(olbl, "LINES", int); oW = label(olbl, "LINE_SAMPLES", int)
    oscale = float(label(olbl, "MAP_SCALE").split()[0])
    oloff = float(label(olbl, "LINE_PROJECTION_OFFSET").split()[0]); osoff = float(label(olbl, "SAMPLE_PROJECTION_OFFSET").split()[0])
    em = label(olbl, "EMISSION_ANGLE")
    br = Image.open(io.BytesIO(get(rec["ortho"]))).convert("L")
    fx = br.width / oW; fy = br.height / oL
    def o_px(line, samp):  # DTM pixel -> ortho pixel through map metres
        x = (samp - soff) * scale; y = (loff - line) * scale
        return (x / oscale + osoff) * fx, (oloff - y / oscale) * fy
    xa, ya = o_px(r0, c0); xb, yb = o_px(r0 + side, c0 + side)
    tex = br.crop((round(xa), round(ya), round(xb), round(yb))).resize((TEX, TEX), Image.LANCZOS)
    tex.save(os.path.join(d, "texture.jpg"), quality=82, optimize=True, progressive=True)
    tex.resize((THUMB, THUMB), Image.LANCZOS).save(os.path.join(d, "thumb.jpg"), quality=78, optimize=True)
    tex_gsd = side * scale / ((xb - xa) or 1)
    meta = {
        "title": rec["name"], "slug": sl, "dtm_id": img[:-4], "ortho": oname + ".JP2",
        "grid": N, "post_m": side * scale / (N - 1), "native_post_m": scale,
        "downsample": round(side / (N - 1), 2), "size_m": side * scale,
        "z_offset_m": float(zmin), "z_scale_m": float(zs), "nodata": 65535,
        "relief_m": float(zmax - zmin), "window_px": [int(r0), int(c0), int(side)],
        "texture_px": TEX, "texture_source_gsd_m": tex_gsd, "projection": proj,
        "ortho_emission_deg": float(em.split()[0]) if em else None,
        "valid_fraction": float(np.isfinite(Z).mean()),
        "credit": 'HiRISE data: NASA/JPL/University of Arizona. DTM produced at HiROC by Raymundo "R@y" Olguin.',
    }
    json.dump(meta, open(os.path.join(d, "meta.json"), "w"), indent=1)
    return sl, img[:-4], round(side * scale), round(float(zmax - zmin), 1), round(meta["valid_fraction"], 3), round(tex_gsd, 2)

recs = json.load(open(sys.argv[1]))
only = sys.argv[3:]
for rec in recs:
    if only and slug(rec["name"]) not in only: continue
    try: print(*build(rec), flush=True)
    except Exception as e: print("FAIL", rec["name"], repr(e), flush=True)
