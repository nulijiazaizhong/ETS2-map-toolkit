from pathlib import Path
from collections import defaultdict
import json

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "ets2-map/public"
SECTOR_SIZE = 4000
sectors = json.loads((PUBLIC / "DlcSectors.json").read_text(encoding="utf-8"))
background = json.loads((PUBLIC / "Background.json").read_text(encoding="utf-8"))
tile_info = json.loads((PUBLIC / "TileMapInfo.json").read_text(encoding="utf-8"))
gray = np.asarray(Image.open(PUBLIC / "Background.png").convert("L"))
land = (gray > 20) & (gray < 110)
land = cv2.morphologyEx(land.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0
height, width = gray.shape
world_width = tile_info["x2"] - tile_info["x1"]
world_height = tile_info["y2"] - tile_info["y1"]
scale = background["scale"]
mosaic_size = background["mosaicSize"]
tx = background["translateX"]
ty = background["translateY"]


def world_to_pixel(x, y):
    tile_x = (x - tile_info["x1"]) / world_width * mosaic_size
    tile_y = (y - tile_info["y1"]) / world_height * mosaic_size
    return (tile_x - tx) / scale, (tile_y - ty) / scale


def pixel_to_world(x, y):
    world_x = tile_info["x1"] + (tx + scale * x) / mosaic_size * world_width
    world_y = tile_info["y1"] + (ty + scale * y) / mosaic_size * world_height
    return [round(world_x, 3), round(world_y, 3)]


by_archive = defaultdict(list)
for sector in sectors:
    by_archive[sector["Archive"]].append((sector["X"], sector["Y"]))

regions = []
for archive, cells in by_archive.items():
    coverage = np.zeros((height, width), dtype=np.uint8)
    for sector_x, sector_y in cells:
        left, top = world_to_pixel(sector_x * SECTOR_SIZE, sector_y * SECTOR_SIZE)
        right, bottom = world_to_pixel((sector_x + 1) * SECTOR_SIZE, (sector_y + 1) * SECTOR_SIZE)
        x1, x2 = max(0, int(np.floor(left))), min(width, int(np.ceil(right)))
        y1, y2 = max(0, int(np.floor(top))), min(height, int(np.ceil(bottom)))
        if x1 < x2 and y1 < y2:
            coverage[y1:y2, x1:x2] = 1

    mask = (coverage & land).astype(np.uint8)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polygons = []
    for contour in contours:
        if cv2.contourArea(contour) < 16:
            continue
        polygon = cv2.approxPolyDP(contour, 1.2, True).reshape(-1, 2)
        if len(polygon) >= 3:
            polygons.append([pixel_to_world(float(x), float(y)) for x, y in polygon])
    regions.append({"Archive": archive, "Polygons": polygons})

(PUBLIC / "DlcRegions.json").write_text(json.dumps(regions, indent=2), encoding="utf-8")
for region in regions:
    print(region["Archive"], len(region["Polygons"]), sum(len(polygon) for polygon in region["Polygons"]))
