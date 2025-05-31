#!/usr/bin/env bash

# setup_repos.sh - Clone all Pulse project repositories.
# Usage: ./setup_repos.sh [target-directory]
# If no target directory is provided, repositories are cloned into the
# current working directory.

set -euo pipefail

BASE_URL="https://github.com/anandroid"
REPOS=(
  "pulse"
  "pulse-ui"
  "pulse-apis"
  "pulse-type-registry"
  "terraform-gcp",
  "n8n-sync"
)

target_dir="${1:-.}"

mkdir -p "$target_dir"
cd "$target_dir"

for repo in "${REPOS[@]}"; do
  if [ -d "$repo" ]; then
    echo "[INFO] $repo already exists, skipping clone"
  else
    echo "[INFO] Cloning $repo..."
    git clone "${BASE_URL}/${repo}.git" "$repo"
  fi
  echo
done

echo "[INFO] All repositories are ready in $target_dir"
