#!/usr/bin/env bash
# Scaffolds a new Pinia store at src/store/<scope>/<store>.ts from the template.
#
# Usage: ./scripts/init-store.sh <scope> <store>
#
#   scope: store group dir under src/store/ (e.g. core, ui). Created if missing.
#   store: store name, used as the defineStore id and (PascalCased) the export.
#
# Example: ./scripts/init-store.sh core service
#   -> src/store/core/service.ts exporting useServiceStore = defineStore('service', ...)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$SCRIPT_DIR/store.template.ts"

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <scope> <store>" >&2
  exit 1
fi

SCOPE="$1"
STORE="$2"

# PascalCase the store name for the export var (handles kebab/snake-case).
STORE_PASCAL=$(echo "$STORE" \
  | sed -E 's/[-_]+/ /g' \
  | awk '{ for (i = 1; i <= NF; i++) $i = toupper(substr($i, 1, 1)) substr($i, 2); print }' \
  | tr -d ' ')

TARGET_DIR="$FRONTEND_DIR/src/store/$SCOPE"
TARGET="$TARGET_DIR/$STORE.ts"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "ERROR: template not found at $TEMPLATE" >&2
  exit 1
fi

if [[ -e "$TARGET" ]]; then
  echo "ERROR: store already exists at $TARGET" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

sed -e "s/{Store}/$STORE_PASCAL/g" -e "s/{store}/$STORE/g" "$TEMPLATE" > "$TARGET"

echo "Created $TARGET (use${STORE_PASCAL}Store)"
