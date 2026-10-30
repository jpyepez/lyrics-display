#!/usr/bin/env bash
# Sets an issue's Status on the lyrics-display board, adding the issue first if it isn't there.
# Usage: scripts/board-status.sh <issue> <Inbox|HITL|Ready|In progress>
# Needs a token that can edit the user-owned Project (GH_TOKEN, or gh's own login).
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <issue> <Inbox|HITL|Ready|In progress>" >&2
  exit 2
fi

issue=$1
case $2 in
  Inbox) option=549ca079 ;;
  HITL) option=bc2c8ae3 ;;
  Ready) option=d1c6b124 ;;
  "In progress") option=37a6af55 ;;
  *)
    echo "unknown status: $2" >&2
    exit 2
    ;;
esac

item=$(gh project item-add 3 --owner jpyepez \
  --url "https://github.com/jpyepez/lyrics-display/issues/$issue" --format json --jq .id)
gh project item-edit --project-id PVT_kwHOAJXAFM4BpG0W --id "$item" \
  --field-id PVTSSF_lAHOAJXAFM4BpG0Wzhnj5Ps --single-select-option-id "$option" >/dev/null
echo "#$issue → $2"
