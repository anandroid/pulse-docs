#!/usr/bin/env bash

# setup.sh - Configure GitHub authentication and clone all Pulse repositories.
# Usage: ./setup.sh [target-directory]
# Environment variables required:
#   GITHUB_USERNAME - GitHub username
#   GITHUB_TOKEN    - GitHub personal access token

set -euo pipefail

if [[ -z "${GITHUB_USERNAME:-}" || -z "${GITHUB_TOKEN:-}" ]]; then
  echo "[ERROR] GITHUB_USERNAME and GITHUB_TOKEN must be set in the environment" >&2
  exit 1
fi

# Preserve existing credential helper if any
ORIGINAL_HELPER=$(git config --global --get credential.helper || true)
TEMP_CREDS="$(mktemp)"

cleanup() {
  if [[ -n "${ORIGINAL_HELPER}" ]]; then
    git config --global credential.helper "${ORIGINAL_HELPER}"
  else
    git config --global --unset credential.helper >/dev/null 2>&1 || true
  fi
  rm -f "${TEMP_CREDS}"
}
trap cleanup EXIT

# Store temporary credentials for GitHub
printf "https://%s:%s@github.com\n" "$GITHUB_USERNAME" "$GITHUB_TOKEN" > "${TEMP_CREDS}"
git config --global credential.helper "store --file=${TEMP_CREDS}"

# Run repository setup with the provided target directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"${SCRIPT_DIR}/setup_repos.sh" "${1:-.}"

