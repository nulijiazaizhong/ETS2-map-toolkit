#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${1:-F:/Game/steam/steamapps/common/Euro Truck Simulator 2}"
MODS_DIR="${2:-C:/Users/bi/AppData/Roaming/TruckersMP/installation/data/ets2/mods}"

for command in git dotnet python node npm; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done
if [[ ! -f "$GAME_DIR/base.scs" || ! -f "$GAME_DIR/base_map.scs" ]]; then
  echo "ETS2 game directory is invalid: $GAME_DIR" >&2
  exit 1
fi
python -c "import PIL, numpy, scipy, cv2"

git -C "$ROOT" submodule update --init --recursive
"$ROOT/tools/nuget.exe" restore "$ROOT/tools/ts-map/TsMap.sln"
bash "$ROOT/tools/rebuild-map.sh" "$GAME_DIR" 8
if [[ -d "$MODS_DIR" ]]; then
  bash "$ROOT/tools/rebuild-tmp-map.sh" "$GAME_DIR" "$MODS_DIR"
else
  echo "TruckersMP mods not found; skipping tmp_s1: $MODS_DIR"
fi
cd "$ROOT/ets2-map"
npm ci
npm run verify
npm run manifest
npm run build
