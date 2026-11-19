#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${1:-F:/Game/steam/steamapps/common/Euro Truck Simulator 2}"
MAX_ZOOM="${2:-8}"
source "$ROOT/tools/map-data-path.sh"
STAGING="$ROOT/work/ets2_export/$MAP_VERSION"
mkdir -p "$DATA_DIR"

if git -C "$ROOT/tools/ts-map" apply --check "$ROOT/tools/patches/ts-map-export-metadata.patch" 2>/dev/null; then
  git -C "$ROOT/tools/ts-map" apply "$ROOT/tools/patches/ts-map-export-metadata.patch"
fi

for archive in base base_map dlc_east dlc_north dlc_fr dlc_it dlc_balt dlc_balkan_e dlc_balkan_w dlc_iberia dlc_greece dlc_polar dlc_iceland; do
  output="$ROOT/work/map_archives/$archive"
  if [[ "$archive" == "base" ]]; then output="$ROOT/work/base"; fi
  if [[ "$archive" == "base_map" ]]; then output="$ROOT/work/base_map"; fi
  mkdir -p "$output"
  "$ROOT/tools/scs_extractor.exe" "$GAME_DIR/$archive.scs" "$output"
done

dotnet build "$ROOT/tools/exporter/TsMapExporter.csproj" -c Release
rm -rf "$STAGING"
"$ROOT/tools/exporter/bin/Release/TsMapExporter.exe" "$GAME_DIR" "$STAGING" "$MAX_ZOOM" Europe
python "$ROOT/tools/prepare_background.py" "$STAGING"
python "$ROOT/tools/prepare_dlc_regions.py" "$STAGING"
rm -rf "$DATA_DIR/Europe" "$DATA_DIR/metadata/Europe"
mkdir -p "$DATA_DIR/metadata/Europe"
mv "$STAGING/Europe" "$DATA_DIR/Europe"
for file in Background.png Background.json Cities.json Countries.json DlcRegions.json DlcSectors.json Overlays.json TileMapInfo.json; do
  mv "$STAGING/$file" "$DATA_DIR/metadata/Europe/$file"
done
mv "$STAGING/Overlays" "$DATA_DIR/metadata/Europe/Overlays"
rm -rf "$STAGING"
printf '{\n  "version": "%s"\n}\n' "$MAP_VERSION" > "$ROOT/data/maps/active.json"
