#!/usr/bin/env bash

if [[ -n "${ETS2_VERSION:-}" ]]; then
  DETECTED_VERSION="$ETS2_VERSION"
else
  if [[ ! -f "$GAME_DIR/bin/win_x64/eurotrucks2.exe" ]]; then
    echo "Cannot detect ETS2 version: $GAME_DIR/bin/win_x64/eurotrucks2.exe" >&2
    return 1
  fi
  DETECTED_VERSION=$(ETS2_EXE="$GAME_DIR/bin/win_x64/eurotrucks2.exe" powershell.exe -NoProfile -Command "(Get-Item \$env:ETS2_EXE).VersionInfo.ProductVersion" | tr -d '\r[:space:]')
fi
if [[ "$DETECTED_VERSION" =~ ^v?([0-9]+\.[0-9]+) ]]; then
  MAP_VERSION="${BASH_REMATCH[1]}"
else
  echo "Invalid ETS2 version: $DETECTED_VERSION" >&2
  return 1
fi
DATA_DIR="$ROOT/data/maps/$MAP_VERSION/ETS2"
export MAP_VERSION DATA_DIR
