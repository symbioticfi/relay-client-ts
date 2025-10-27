#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PROTO_DIR="$ROOT_DIR/api/proto/v1"

rm -rf "$ROOT_DIR/api" "$ROOT_DIR/src/gen"
mkdir -p "$PROTO_DIR"

curl -sfL https://raw.githubusercontent.com/symbioticfi/relay/dev/api/proto/v1/api.proto -o "$PROTO_DIR/api.proto"

cd "$ROOT_DIR"
buf format -w
buf lint
buf generate

# TypeScript specific: ensure index file exists for consumers
if [ ! -f src/index.ts ]; then
  mkdir -p src
  cat > src/index.ts <<'EOF'
export * from "./gen/api/proto/v1/api_pb";
EOF
fi
