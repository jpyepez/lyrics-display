#!/usr/bin/env bash
# Uploads a folder of PNG screenshots to the orphan `pr-assets` branch, under `pr-<n>/`, and
# prints the URL prefix for linking them from a PR comment. Earlier PRs' folders are kept.
# GitHub has no API for attaching images to a comment, so the branch hosts them instead.
#
# Usage: scripts/attach-screenshots.sh <pr-number> <folder-of-pngs>
set -euo pipefail

pr=$1
dir=$2
branch=pr-assets
# A throwaway index, so the working tree and its own index stay untouched. Git rejects an
# empty index file, so it gets a path in a fresh folder rather than mktemp's empty file.
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export GIT_INDEX_FILE=$tmp/index

parent=()
if git ls-remote --exit-code --heads origin "$branch" >/dev/null; then
  git fetch -q origin "$branch"
  git read-tree FETCH_HEAD
  parent=(-p FETCH_HEAD)
else
  git read-tree --empty
fi

shopt -s nullglob
files=("$dir"/*.png)
if [ ${#files[@]} -eq 0 ]; then
  echo "No .png files in $dir" >&2
  exit 1
fi
for file in "${files[@]}"; do
  blob=$(git hash-object -w "$file")
  git update-index --add --cacheinfo "100644,$blob,pr-$pr/$(basename "$file")"
done

tree=$(git write-tree)
commit=$(echo "Screenshots for PR #$pr" | git commit-tree "$tree" ${parent[@]+"${parent[@]}"})
git push -q origin "$commit:refs/heads/$branch"

repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
echo "https://github.com/$repo/blob/$branch/pr-$pr"
