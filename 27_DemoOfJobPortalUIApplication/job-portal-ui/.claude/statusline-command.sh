#!/bin/bash
# Claude Code status line
# Shows: model display name + a context-usage progress bar with percentage

input=$(cat)

read -r model used_pct <<< "$(node -e '
let data = "";
process.stdin.on("data", d => data += d);
process.stdin.on("end", () => {
  let parsed = {};
  try { parsed = JSON.parse(data); } catch (e) {}
  const model = (parsed.model && parsed.model.display_name) || "Claude";
  const pct = parsed.context_window && parsed.context_window.used_percentage;
  process.stdout.write(model.replace(/ /g, "_") + " " + (pct === undefined || pct === null ? "" : pct));
});
' <<< "$input")"

model="${model//_/ }"

bar_width=20

RESET='\033[0m'
DIM='\033[2m'
GREEN='\033[2;32m'
YELLOW='\033[2;33m'
RED='\033[2;31m'

if [ -z "$used_pct" ]; then
  # No messages yet - show an empty bar
  filled=0
  pct_rounded=0
  bar_color="$DIM"
else
  read -r filled pct_rounded <<< "$(awk -v p="$used_pct" -v w="$bar_width" \
    'BEGIN { f = int((p * w / 100) + 0.5); if (f > w) f = w; if (f < 0) f = 0; printf "%d %d", f, int(p + 0.5) }')"

  if [ "$pct_rounded" -ge 80 ]; then
    bar_color="$RED"
  elif [ "$pct_rounded" -ge 50 ]; then
    bar_color="$YELLOW"
  else
    bar_color="$GREEN"
  fi
fi

empty=$((bar_width - filled))

bar="["
i=0
while [ "$i" -lt "$filled" ]; do bar="${bar}#"; i=$((i + 1)); done
i=0
while [ "$i" -lt "$empty" ]; do bar="${bar}-"; i=$((i + 1)); done
bar="${bar}]"

printf "${DIM}%s${RESET}  ${bar_color}%s %d%%${RESET}\n" "$model" "$bar" "$pct_rounded"
