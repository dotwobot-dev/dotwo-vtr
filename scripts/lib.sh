#!/usr/bin/env bash
set -euo pipefail

project_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/.." && pwd
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "No encuentro '$1' en PATH"
}

file_size() {
  stat -f%z "$1" 2>/dev/null || stat -c%s "$1"
}

is_stable_file() {
  local f="$1"
  local wait="${2:-5}"
  local s1 s2
  s1="$(file_size "$f")" || return 1
  sleep "$wait"
  s2="$(file_size "$f")" || return 1
  [[ "$s1" == "$s2" ]]
}

sanitize_name() {
  local raw="$1"
  local no_ext ascii clean
  no_ext="${raw%.*}"

  if command -v iconv >/dev/null 2>&1; then
    ascii="$(printf '%s' "$no_ext" | iconv -f UTF-8 -t 'ASCII//TRANSLIT' 2>/dev/null || printf '%s' "$no_ext")"
  else
    ascii="$no_ext"
  fi

  clean="$(printf '%s' "$ascii" \
    | tr '[:lower:]' '[:upper:]' \
    | sed -E 's/[^A-Z0-9]+/_/g; s/_+/_/g; s/^_+//; s/_+$//')"

  if [[ -z "$clean" ]]; then
    clean="VIDEO"
  fi

  printf '%s' "$clean"
}

default_validated_output() {
  local input="$1"
  local dir base clean candidate stem n
  dir="$(cd "$(dirname "$input")" && pwd)"
  base="$(basename "$input")"
  clean="$(sanitize_name "$base")"
  stem="${clean}_VALIDADO"
  candidate="$dir/$stem.mov"
  n=1

  while [[ -e "$candidate" ]]; do
    candidate="$(printf '%s/%s_%03d.mov' "$dir" "$stem" "$n")"
    n=$((n + 1))
  done

  printf '%s' "$candidate"
}

json_quote() {
  jq -Rs . <<< "${1:-}"
}
