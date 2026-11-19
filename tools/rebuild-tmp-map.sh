#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${1:-F:/Game/steam/steamapps/common/Euro Truck Simulator 2}"
MODS_DIR="${2:-C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods}"
source "$ROOT/tools/map-data-path.sh"
STAGING="$ROOT/work/ets2_tmp_export/$MAP_VERSION"
mkdir -p "$DATA_DIR"

if git -C "$ROOT/tools/ts-map" apply --check "$ROOT/tools/patches/ts-map-export-metadata.patch" 2>/dev/null; then
  git -C "$ROOT/tools/ts-map" apply "$ROOT/tools/patches/ts-map-export-metadata.patch"
fi

rm -rf "$STAGING"
dotnet build "$ROOT/tools/exporter/TsMapExporter.csproj" -c Release
"$ROOT/tools/exporter/bin/Release/TsMapExporter.exe" "$GAME_DIR" "$STAGING" 8 TMP "$MODS_DIR"
rm -rf "$DATA_DIR/TMP" "$DATA_DIR/metadata/TMP"
mkdir -p "$DATA_DIR/metadata/TMP"
mv "$STAGING/TMP" "$DATA_DIR/TMP"
for file in Cities.json Countries.json DlcSectors.json Overlays.json TileMapInfo.json; do
  mv "$STAGING/$file" "$DATA_DIR/metadata/TMP/$file"
done
cp "$DATA_DIR/metadata/Europe/Background.png" "$DATA_DIR/metadata/Europe/Background.json" "$DATA_DIR/metadata/Europe/DlcRegions.json" "$DATA_DIR/metadata/TMP/"
mv "$STAGING/Overlays" "$DATA_DIR/metadata/TMP/Overlays"
rm -rf "$STAGING"
printf '{\n  "version": "%s"\n}\n' "$MAP_VERSION" > "$ROOT/data/maps/active.json"
