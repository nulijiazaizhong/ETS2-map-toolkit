from pathlib import Path
import struct
import sys

from PIL import Image

if len(sys.argv) < 3 or len(sys.argv) > 4:
    raise SystemExit("Usage: prepare_game_icons.py <ets2-ui-dir> <ats-ui-dir> [output-dir]")
sources = {"ETS2": Path(sys.argv[1]), "ATS": Path(sys.argv[2])}
output = Path(sys.argv[3]) if len(sys.argv) == 4 else Path(__file__).resolve().parent.parent / "ets2-map/public/vendor/icons"
output.mkdir(parents=True, exist_ok=True)

for game, source in sources.items():
    path = source / "loading/logo.dds"
    if not path.is_file():
        print(f"{game}: no official icon found, skipped")
        continue
    data = path.read_bytes()
    height, width = struct.unpack_from("<II", data, 12)
    offset = 148 if data[84:88] == b"DX10" else 128
    image = Image.frombytes("RGBA", (width, height), data[offset:offset + width * height * 4], "raw", "BGRA")
    image.save(output / f"{game.lower()}.png", optimize=True)
    print(f"{game}: {width}x{height} -> {output / f'{game.lower()}.png'}")
