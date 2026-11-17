from pathlib import Path
import json
import struct

import numpy as np
from PIL import Image
from scipy.optimize import differential_evolution
from scipy.ndimage import map_coordinates

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "work/base/material/ui/map"
TILE_SIZE = 512
GRID_SIZE = 4
MOSAIC_SIZE = TILE_SIZE * GRID_SIZE
TILES = ROOT / "ets2-map/public/ets/2"
OUTPUT = ROOT / "ets2-map/public"
WORK = ROOT / "work"


def read_dds(path):
    data = path.read_bytes()
    height, width = struct.unpack_from("<II", data, 12)
    offset = 148 if data[84:88] == b"DX10" else 128
    return Image.frombytes("RGBA", (width, height), data[offset:offset + width * height * 4], "raw", "BGRA").convert("RGB")


background = Image.new("RGB", (4096, 4096))
for name, position in [("map0.dds", (0, 0)), ("map2.dds", (2048, 0)), ("map1.dds", (0, 2048)), ("map3.dds", (2048, 2048))]:
    background.paste(read_dds(SOURCE / name), position)
background.save(OUTPUT / "Background.png", optimize=True)

roads = Image.new("RGB", (MOSAIC_SIZE, MOSAIC_SIZE))
for x in range(GRID_SIZE):
    for y in range(GRID_SIZE):
        roads.paste(Image.open(TILES / str(x) / f"{y}.png").convert("RGB"), (x * TILE_SIZE, y * TILE_SIZE))
road_mask = np.asarray(roads.convert("L")) > 180
road_y, road_x = np.nonzero(road_mask)
indices = np.linspace(0, len(road_x) - 1, min(15000, len(road_x)), dtype=int)
road_x = road_x[indices]
road_y = road_y[indices]
land = np.asarray(background.convert("L")) < 110


def score(params):
    scale, tx, ty = params
    source_x = (road_x - tx) / scale
    source_y = (road_y - ty) / scale
    values = map_coordinates(land.astype(np.uint8), [source_y, source_x], order=0, mode="constant", cval=0)
    return -float(values.mean())


result = differential_evolution(score, [(0.60, 0.76), (-600, -160), (-440, 60)], seed=42, maxiter=100, popsize=12, tol=0.0001)
scale, tx, ty = [float(value) for value in result.x]
alignment = -float(result.fun)
if alignment < 0.8:
    raise RuntimeError(f"Background alignment score is too low: {alignment:.3f}")

metadata = {
    "bounds": [[-(ty + 4096 * scale) / GRID_SIZE, tx / GRID_SIZE], [-ty / GRID_SIZE, (tx + 4096 * scale) / GRID_SIZE]],
    "imageWidth": 4096,
    "imageHeight": 4096,
    "tileSize": TILE_SIZE,
    "mosaicSize": MOSAIC_SIZE,
    "alignmentScore": alignment,
    "scale": scale,
    "translateX": tx,
    "translateY": ty
}
(OUTPUT / "Background.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

preview = Image.new("RGB", (MOSAIC_SIZE, MOSAIC_SIZE), (16, 24, 39))
resized = background.resize((round(4096 * scale), round(4096 * scale)), Image.Resampling.LANCZOS)
preview.paste(resized, (round(tx), round(ty)))
overlay = np.asarray(preview).copy()
overlay[road_mask] = (255, 80, 80)
Image.fromarray(overlay).save(WORK / "background-alignment.png")
print(json.dumps(metadata, indent=2))
