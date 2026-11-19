#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${1:-F:/Game/steam/steamapps/common/American Truck Simulator}"
TMP_MODS_DIR="${2:-C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ats/mods}"
PROMODS_DIR="${3:-E:/文档/American Truck Simulator/mod}"
MAX_ZOOM="${4:-8}"
EXPORTER="$ROOT/tools/exporter/bin/Release/TsMapExporter.exe"

for path in "$GAME_DIR/base.scs" "$GAME_DIR/base_map.scs" "$GAME_DIR/bin/win_x64/amtrucks.exe" "$TMP_MODS_DIR" "$PROMODS_DIR"; do
  if [[ ! -e "$path" ]]; then
    echo "Required game or mod path does not exist: $path" >&2
    exit 1
  fi
done

if [[ -n "${ATS_VERSION:-}" ]]; then
  DETECTED_VERSION="$ATS_VERSION"
else
  DETECTED_VERSION=$(ATS_EXE="$GAME_DIR/bin/win_x64/amtrucks.exe" powershell.exe -NoProfile -Command "(Get-Item \$env:ATS_EXE).VersionInfo.ProductVersion" | tr -d '\r[:space:]')
fi
if [[ "$DETECTED_VERSION" =~ ^v?([0-9]+\.[0-9]+) ]]; then
  MAP_VERSION="${BASH_REMATCH[1]}"
else
  echo "Invalid ATS version: $DETECTED_VERSION" >&2
  exit 1
fi
DATA_DIR="$ROOT/data/maps/$MAP_VERSION/ATS"
EXTRACT_DIR="$ROOT/work/ats/$MAP_VERSION"
mkdir -p "$DATA_DIR" "$EXTRACT_DIR"
printf 'ATS %s -> %s\n' "$MAP_VERSION" "$DATA_DIR"

archives=(base base_map dlc_arizona dlc_nm dlc_or dlc_wa dlc_ut dlc_id dlc_co dlc_wy dlc_mt dlc_tx dlc_ok dlc_ks dlc_ne dlc_mo dlc_ar dlc_la dlc_ia dlc_il dlc_sd dlc_nevada dlc_route_66 dlc_space)
for archive in "${archives[@]}"; do
  if [[ ! -f "$GAME_DIR/$archive.scs" ]]; then
    echo "Missing map archive: $GAME_DIR/$archive.scs" >&2
    exit 1
  fi
  output="$EXTRACT_DIR/map_archives/$archive"
  if [[ "$archive" == "base" ]]; then output="$EXTRACT_DIR/base"; fi
  if [[ "$archive" == "base_map" ]]; then output="$EXTRACT_DIR/base_map"; fi
  if [[ ! -f "$output/.extracted" ]]; then
    mkdir -p "$output"
    "$ROOT/tools/scs_extractor.exe" "$GAME_DIR/$archive.scs" "$output"
    touch "$output/.extracted"
  fi
done

if git -C "$ROOT/tools/ts-map" apply --check "$ROOT/tools/patches/ts-map-export-metadata.patch" 2>/dev/null; then
  git -C "$ROOT/tools/ts-map" apply "$ROOT/tools/patches/ts-map-export-metadata.patch"
fi
"$ROOT/tools/nuget.exe" restore "$ROOT/tools/ts-map/TsMap.sln"
dotnet build "$ROOT/tools/exporter/TsMapExporter.csproj" -c Release

render() {
  local source="$1"
  shift
  local staging="$ROOT/work/ats_export/$MAP_VERSION/$source"
  if [[ "${CLEAN_ATS:-0}" == "1" ]]; then rm -rf "$staging"; fi
  mkdir -p "$staging"
  "$EXPORTER" "$GAME_DIR" "$staging" "$MAX_ZOOM" "$source" "$@"
  rm -rf "$DATA_DIR/$source" "$DATA_DIR/metadata/$source"
  mkdir -p "$DATA_DIR/metadata/$source"
  mv "$staging/$source" "$DATA_DIR/$source"
  for file in Cities.json Countries.json DlcSectors.json Overlays.json TileMapInfo.json; do
    mv "$staging/$file" "$DATA_DIR/metadata/$source/$file"
  done
  if [[ -d "$staging/Overlays" ]]; then
    mv "$staging/Overlays" "$DATA_DIR/metadata/$source/Overlays"
  fi
  rm -rf "$staging"
  printf 'Completed %s\n' "$source"
}

render American
render TMP "$TMP_MODS_DIR"
render American_Promods "$PROMODS_DIR"
render TMP_Promods "$PROMODS_DIR" "$TMP_MODS_DIR"

python "$ROOT/tools/prepare_background.py" "$DATA_DIR/metadata/American" "$EXTRACT_DIR/base/material/ui/map" American "$DATA_DIR/American"
python "$ROOT/tools/prepare_dlc_regions.py" "$DATA_DIR/metadata/American" 200
for source in TMP American_Promods TMP_Promods; do
  cp "$DATA_DIR/metadata/American/Background.png" "$DATA_DIR/metadata/American/Background.json" "$DATA_DIR/metadata/American/DlcRegions.json" "$DATA_DIR/metadata/$source/"
done

node "$ROOT/ets2-map/scripts/verify-ats.mjs" "$DATA_DIR"
