#!/usr/bin/env bash
# Wait for itch.io to become reachable, then run the creation script.
cd /c/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772
LOG=tools/itch_shots/wait_create.log
NODE=/c/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-6/node.exe
NP=/c/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules
echo "START $(date)" > "$LOG"
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -x 127.0.0.1:7897 --max-time 25 https://itch.io/ 2>/dev/null)
  echo "[$(date +%H:%M:%S)] check $i -> $code" >> "$LOG"
  if [ "$code" = "200" ]; then
    echo "REACHABLE, running create" >> "$LOG"
    NODE_PATH="$NP" "$NODE" tools/itch_create.js >> "$LOG" 2>&1
    echo "CREATE EXIT=$?" >> "$LOG"
    break
  fi
  sleep 55
done
echo "END $(date)" >> "$LOG"
