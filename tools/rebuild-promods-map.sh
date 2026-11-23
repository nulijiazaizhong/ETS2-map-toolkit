#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${1:-F:/Game/steam/steamapps/common/Euro Truck Simulator 2}"
PROMODS_DIR="${2:-E:/文档/Euro Truck Simulator 2/mod}"
MAX_ZOOM="${3:-8}"
TMP_MODS_DIR="${4:-}"
SOURCE="Europe_Promods"
if [[ -n "$TMP_MODS_DIR" ]]; then SOURCE="TMP_Promods"; fi
source "$ROOT/tools/map-data-path.sh"
STAGING="$ROOT/work/ets2_promods_export/$MAP_VERSION/$SOURCE"
mkdir -p "$DATA_DIR"

# TsMapper reverses this list, so pass highest priority first.
mods=(
  promods-ma-defmap-v105.scs
  promods-ma-assets-v105.scs
  promods-ma-models-v105.scs
  promods-me-defmap-v285.scs
  promods-me-assets-v285.scs
  promods-eu-dlcsupport-v285.zip
  promods-eu-def-v285.scs
  promods-eu-map-v285.scs
  promods-eu-model1-v285.scs
  promods-eu-model2-v285.scs
  promods-eu-model3-v285.scs
  promods-eu-media-v285.scs
  promods-eu-assets-v285.scs
  promods-tgs-defmap-v171.scs
  promods-tgs-assets-v171.scs
)
mod_paths=()
if [[ -n "$TMP_MODS_DIR" ]]; then
  if [[ ! -d "$TMP_MODS_DIR" ]]; then
    echo "TruckersMP mod path does not exist: $TMP_MODS_DIR" >&2
    exit 1
  fi
  mod_paths+=("$TMP_MODS_DIR")
fi
for mod in "${mods[@]}"; do
  if [[ ! -f "$PROMODS_DIR/$mod" ]]; then
    echo "Missing ProMods archive: $PROMODS_DIR/$mod" >&2
    exit 1
  fi
  mod_paths+=("$PROMODS_DIR/$mod")
done

if git -C "$ROOT/tools/ts-map" apply --check "$ROOT/tools/patches/ts-map-export-metadata.patch" 2>/dev/null; then
  git -C "$ROOT/tools/ts-map" apply "$ROOT/tools/patches/ts-map-export-metadata.patch"
fi

dotnet build "$ROOT/tools/exporter/TsMapExporter.csproj" -c Release
rm -rf "$STAGING"
"$ROOT/tools/exporter/bin/Release/TsMapExporter.exe" "$GAME_DIR" "$STAGING" "$MAX_ZOOM" "$SOURCE" "${mod_paths[@]}"
rm -rf "$DATA_DIR/$SOURCE" "$DATA_DIR/metadata/$SOURCE"
mkdir -p "$DATA_DIR/metadata/$SOURCE"
mv "$STAGING/$SOURCE" "$DATA_DIR/$SOURCE"
for file in Cities.json Countries.json DlcSectors.json Overlays.json TileMapInfo.json; do
  mv "$STAGING/$file" "$DATA_DIR/metadata/$SOURCE/$file"
done
cp "$DATA_DIR/metadata/Europe/Background.png" "$DATA_DIR/metadata/Europe/Background.json" "$DATA_DIR/metadata/Europe/DlcRegions.json" "$DATA_DIR/metadata/$SOURCE/"
mv "$STAGING/Overlays" "$DATA_DIR/metadata/$SOURCE/Overlays"
rm -rf "$STAGING"
printf '{\n  "version": "%s"\n}\n' "$MAP_VERSION" > "$ROOT/data/maps/active.json"
node "$ROOT/ets2-map/scripts/manifest.mjs"
