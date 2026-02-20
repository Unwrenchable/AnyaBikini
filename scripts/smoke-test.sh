#!/usr/bin/env bash
# Smoke test for AnyaBikini server (run after `cd server && npm start`)
# Usage: ./scripts/smoke-test.sh

set -euo pipefail
BASE_URL=${1:-http://localhost:3000}

echo "Testing base URL: $BASE_URL"

echo "- /api/config"
curl -sS "$BASE_URL/api/config" | jq || echo "(curl /api/config failed)"

echo "- /api/products"
curl -sS "$BASE_URL/api/products" | jq || echo "(curl /api/products failed)"

echo "- /sitemap.xml (HTTP status)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sitemap.xml")
if [ "$STATUS" -ne 200 ]; then
  echo "sitemap.xml returned HTTP $STATUS"
else
  echo "sitemap.xml OK"
fi

echo "- /robots.txt"
curl -sS "$BASE_URL/robots.txt" || echo "(curl /robots.txt failed)"

echo "Smoke test complete. If any checks failed, paste the output here and I'll help debug."
