#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${1:-F:/Game/steam/steamapps/common/Euro Truck Simulator 2}"
MODS_DIR="${2:-C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods}"
STAGING="$ROOT/work/tmp_s1_export"
source "$ROOT/tools/map-data-path.sh"
mkdir -p "$DATA_DIR"

if git -C "$ROOT/tools/ts-map" apply --check "$ROOT/tools/patches/ts-map-export-metadata.patch" 2>/dev/null; then
  git -C "$ROOT/tools/ts-map" apply "$ROOT/tools/patches/ts-map-export-metadata.patch"
fi

rm -rf "$STAGING"
dotnet build "$ROOT/tools/exporter/TsMapExporter.csproj" -c Release
"$ROOT/tools/exporter/bin/Release/TsMapExporter.exe" "$GAME_DIR" "$STAGING" 8 tmp_s1 "$MODS_DIR"
rm -rf "$DATA_DIR/tmp_s1"
mv "$STAGING/tmp_s1" "$DATA_DIR/tmp_s1"
rm -rf "$STAGING"
printf '{\n  "version": "%s"\n}\n' "$MAP_VERSION" > "$ROOT/data/maps/active.json"
