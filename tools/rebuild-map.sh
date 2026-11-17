#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${1:-F:/Game/steam/steamapps/common/Euro Truck Simulator 2}"
MAX_ZOOM="${2:-8}"

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
rm -rf "$ROOT/ets2-map/public/ets"
"$ROOT/tools/exporter/bin/Release/TsMapExporter.exe" "$GAME_DIR" "$ROOT/ets2-map/public" "$MAX_ZOOM"
python "$ROOT/tools/prepare_background.py"
python "$ROOT/tools/prepare_dlc_regions.py"
