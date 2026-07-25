#!/usr/bin/env bash
# Health check dùng sau deploy. Retry vì app cần vài giây để boot.
set -uo pipefail

URL="${1:-http://127.0.0.1:5000/api/health}"
RETRIES="${2:-10}"
SLEEP="${3:-3}"

for i in $(seq 1 "$RETRIES"); do
  code=$(curl -s -o /tmp/health-body -w '%{http_code}' "$URL" || echo 000)
  if [ "$code" = "200" ]; then
    echo "health OK (attempt $i): $(cat /tmp/health-body)"
    exit 0
  fi
  echo "health attempt $i/$RETRIES failed (HTTP $code), retrying in ${SLEEP}s..."
  sleep "$SLEEP"
done

echo "HEALTH CHECK FAILED after $RETRIES attempts"
cat /tmp/health-body 2>/dev/null || true
exit 1
