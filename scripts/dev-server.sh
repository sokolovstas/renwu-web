#!/bin/bash
# Держит локальный фронт (npm start, :4200) запущенным.
#
#   ./scripts/dev-server.sh install     # автозапуск при логине и после ребута
#   ./scripts/dev-server.sh uninstall
#   ./scripts/dev-server.sh status
#   ./scripts/dev-server.sh stop        # пауза: сторож не поднимает, пока не start
#   ./scripts/dev-server.sh start
#   ./scripts/dev-server.sh restart
#   ./scripts/dev-server.sh logs
#
# launchd запускает `watch`: раз в DEV_SERVER_INTERVAL секунд проверяет,
# что :4200 слушает. Если процесс умер — стартует снова. Если процесс жив,
# но порт не открылся за DEV_SERVER_GRACE секунд — перезапускает.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="ru.renwu.web"
PLIST="${HOME}/Library/LaunchAgents/${LABEL}.plist"
DOMAIN="gui/$(id -u)"
PORT="${DEV_SERVER_PORT:-4200}"
INTERVAL="${DEV_SERVER_INTERVAL:-30}"
GRACE="${DEV_SERVER_GRACE:-300}"

TMP="$ROOT/tmp"
PIDFILE="$TMP/npm-start.pid"
STAMP="$TMP/dev-server.started"
PAUSE="$TMP/dev-server.paused"
LOCK="$TMP/dev-server.lock"
STATE_FILE="$TMP/dev-server.state"
NPMLOG="$TMP/npm-start.log"
WATCHLOG="$TMP/dev-server-watch.log"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

setup_path() {
  export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin${PATH:+:$PATH}"
  if command -v npm >/dev/null 2>&1; then
    return 0
  fi
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  local ver="" candidate=""
  if [[ -f "$nvm_dir/alias/default" ]]; then
    ver="$(tr -d '[:space:]' < "$nvm_dir/alias/default")"
  fi
  if [[ -n "$ver" && -x "$nvm_dir/versions/node/v${ver}/bin/npm" ]]; then
    candidate="$nvm_dir/versions/node/v${ver}/bin"
  elif [[ -n "$ver" && -x "$nvm_dir/versions/node/${ver}/bin/npm" ]]; then
    candidate="$nvm_dir/versions/node/${ver}/bin"
  else
    candidate="$(ls -1d "$nvm_dir"/versions/node/v${ver}.* 2>/dev/null | sort -V | tail -1 || true)"
    if [[ -z "$candidate" ]]; then
      candidate="$(ls -1d "$nvm_dir"/versions/node/v* 2>/dev/null | sort -V | tail -1 || true)"
    fi
    if [[ -n "$candidate" ]]; then
      candidate="$candidate/bin"
    fi
  fi
  if [[ -n "$candidate" && -x "$candidate/npm" ]]; then
    export PATH="$candidate:$PATH"
  fi
}

port_up() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

read_pid() {
  if [[ -f "$PIDFILE" ]]; then
    tr -d '[:space:]' < "$PIDFILE" || true
  fi
}

our_pid_alive() {
  local pid cmd
  pid="$(read_pid)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  case "$cmd" in
    *npm*|*node*|*nx*) return 0 ;;
    *) return 1 ;;
  esac
}

# nx, запущенный из этого репозитория, но не нами (например из терминала).
stray_nx_pids() {
  local p cwd pids
  pids="$(pgrep -f 'nx run-many' || true)"
  for p in $pids; do
    cwd="$(lsof -a -p "$p" -d cwd -Fn 2>/dev/null | awk 'substr($0,1,1)=="n" {print substr($0,2); exit}' || true)"
    if [[ "$cwd" == "$ROOT" ]]; then
      printf '%s\n' "$p"
    fi
  done
}

proc_alive() {
  if our_pid_alive; then
    return 0
  fi
  local stray
  stray="$(stray_nx_pids | head -1 || true)"
  [[ -n "$stray" ]]
}

within_grace() {
  local now started
  if [[ ! -f "$STAMP" ]]; then
    date +%s > "$STAMP"
    return 0
  fi
  now="$(date +%s)"
  started="$(cat "$STAMP")"
  (( now - started < GRACE ))
}

set_state() {
  local name="$1" msg="$2" old=""
  if [[ -f "$STATE_FILE" ]]; then
    old="$(cat "$STATE_FILE")"
  fi
  if [[ "$old" != "$name" ]]; then
    printf '%s\n' "$name" > "$STATE_FILE"
    log "$msg"
  fi
}

acquire_lock() {
  local now mtime i=0
  mkdir -p "$TMP"
  while ! mkdir "$LOCK" 2>/dev/null; do
    now="$(date +%s)"
    mtime="$(stat -f %m "$LOCK" 2>/dev/null || echo "$now")"
    if (( now - mtime > 60 )); then
      rm -rf "$LOCK"
      continue
    fi
    i=$((i + 1))
    if (( i > 100 )); then
      return 1
    fi
    sleep 0.1
  done
}

release_lock() {
  rmdir "$LOCK" 2>/dev/null || rm -rf "$LOCK"
}

kill_tree() {
  local pid="$1" child children
  children="$(pgrep -P "$pid" || true)"
  for child in $children; do
    kill_tree "$child"
  done
  kill -TERM "$pid" 2>/dev/null || true
}

wait_dead() {
  local pid="$1" i=0
  while kill -0 "$pid" 2>/dev/null && (( i < 20 )); do
    sleep 0.5
    i=$((i + 1))
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL "$pid" 2>/dev/null || true
  fi
}

kill_server() {
  local pid p
  if ! acquire_lock; then
    log "не взял lock, остановка пропущена"
    return 1
  fi
  pid="$(read_pid)"
  if our_pid_alive; then
    log "останавливаю npm start (pid $pid)"
    # Свой процесс — лидер новой сессии, гасим всю группу.
    kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    wait_dead "$pid"
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL -- "-$pid" 2>/dev/null || true
    fi
  fi
  rm -f "$PIDFILE"
  while IFS= read -r p; do
    [[ -n "$p" ]] || continue
    log "останавливаю nx pid $p"
    kill_tree "$p"
    wait_dead "$p"
  done < <(stray_nx_pids || true)
  release_lock
}

start_server() {
  if [[ -f "$PAUSE" ]]; then
    return 0
  fi
  if ! acquire_lock; then
    log "старт уже выполняется"
    return 0
  fi
  if [[ -f "$PAUSE" ]] || port_up || our_pid_alive; then
    release_lock
    return 0
  fi
  if [[ -n "$(stray_nx_pids | head -1 || true)" ]]; then
    release_lock
    return 0
  fi
  if [[ ! -x "$ROOT/node_modules/.bin/nx" ]]; then
    release_lock
    set_state blocked "нет $ROOT/node_modules/.bin/nx — сначала npm install в web/"
    return 0
  fi
  setup_path
  if ! command -v npm >/dev/null 2>&1; then
    release_lock
    set_state blocked "npm не найден"
    return 1
  fi
  mkdir -p "$TMP"
  log "запускаю npm start, лог $NPMLOG"
  if ! ROOT="$ROOT" NPMLOG="$NPMLOG" PIDFILE="$PIDFILE" python3 - <<'PY'
import os, subprocess, time
from pathlib import Path
root = Path(os.environ["ROOT"])
logp = Path(os.environ["NPMLOG"])
pidp = Path(os.environ["PIDFILE"])
logp.parent.mkdir(parents=True, exist_ok=True)
with open(logp, "a") as logf:
    logf.write("\n===== start %s =====\n" % time.strftime("%Y-%m-%d %H:%M:%S"))
    logf.flush()
    p = subprocess.Popen(
        ["npm", "start"],
        cwd=str(root),
        env=os.environ.copy(),
        stdin=subprocess.DEVNULL,
        stdout=logf,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
pidp.write_text(str(p.pid) + "\n")
print(p.pid)
PY
  then
    release_lock
    return 1
  fi
  date +%s > "$STAMP"
  release_lock
}

ensure_running() {
  if [[ -f "$PAUSE" ]]; then
    set_state paused "пауза: автозапуск выключен до ./scripts/dev-server.sh start"
    return 0
  fi
  if port_up; then
    set_state up "фронт слушает :$PORT"
    return 0
  fi
  if proc_alive; then
    if within_grace; then
      set_state starting "процесс жив, жду :$PORT (до ${GRACE}с)"
      return 0
    fi
    set_state restarting ":$PORT не открылся за ${GRACE}с, перезапускаю"
    rm -f "$STATE_FILE"
    kill_server || true
    start_server || true
    return 0
  fi
  set_state starting "фронт не запущен, стартую npm start"
  start_server || true
}

cmd_watch() {
  setup_path
  mkdir -p "$TMP"
  log "сторож запущен, интервал ${INTERVAL}с, grace ${GRACE}с, порт $PORT"
  while true; do
    ensure_running || log "проверка завершилась с ошибкой"
    sleep "$INTERVAL"
  done
}

cmd_start() {
  setup_path
  mkdir -p "$TMP"
  rm -f "$PAUSE" "$STATE_FILE"
  if port_up; then
    echo "фронт уже слушает http://localhost:$PORT"
    return 0
  fi
  start_server
  echo "старт отправлен, лог: $NPMLOG"
}

cmd_stop() {
  mkdir -p "$TMP"
  if ! acquire_lock; then
    echo "не удалось взять lock" >&2
    return 1
  fi
  touch "$PAUSE"
  printf '%s\n' "paused" > "$STATE_FILE"
  release_lock
  kill_server || true
  echo "фронт остановлен, автозапуск на паузе до: ./scripts/dev-server.sh start"
}

cmd_restart() {
  rm -f "$PAUSE" "$STATE_FILE"
  kill_server || true
  cmd_start
}

cmd_status() {
  local pid state="не загружен"
  if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
    state="$(launchctl print "$DOMAIN/$LABEL" | awk -F'= ' '/^[[:space:]]*state = / {print $2; exit}')"
    [[ -n "$state" ]] || state="загружен"
  fi
  echo "launchd: $state ($LABEL)"
  if [[ -f "$PAUSE" ]]; then
    echo "пауза: да"
  else
    echo "пауза: нет"
  fi
  pid="$(read_pid || true)"
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "npm pid: $pid"
  elif proc_alive; then
    echo "npm pid: нет нашего pidfile, но nx в $ROOT жив"
  else
    echo "npm pid: не запущен"
  fi
  if port_up; then
    echo "http://localhost:$PORT — слушает"
  else
    echo "http://localhost:$PORT — не слушает"
  fi
  echo "лог сторожа: $WATCHLOG"
  echo "лог npm:     $NPMLOG"
  if port_up; then
    return 0
  fi
  return 1
}

cmd_logs() {
  mkdir -p "$TMP"
  touch "$WATCHLOG" "$NPMLOG"
  if [[ "${1:-}" == "-f" ]]; then
    tail -n 40 -f "$WATCHLOG" "$NPMLOG"
  else
    echo "===== $WATCHLOG ====="
    tail -n 30 "$WATCHLOG" 2>/dev/null || true
    echo "===== $NPMLOG ====="
    tail -n 30 "$NPMLOG" 2>/dev/null || true
  fi
}

write_plist() {
  local node_bin
  setup_path
  node_bin="$(dirname "$(command -v node)")"
  mkdir -p "${HOME}/Library/LaunchAgents" "$TMP"
  touch "$WATCHLOG"
  cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${ROOT}/scripts/dev-server.sh</string>
    <string>watch</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>${HOME}</string>
    <key>PATH</key>
    <string>${node_bin}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>AbandonProcessGroup</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>${WATCHLOG}</string>
  <key>StandardErrorPath</key>
  <string>${TMP}/dev-server-watch.err</string>
</dict>
</plist>
EOF
}

cmd_install() {
  setup_path
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm не найден, автозапуск не записан" >&2
    return 1
  fi
  rm -f "$PAUSE"
  write_plist
  launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
  launchctl enable "$DOMAIN/$LABEL"
  launchctl bootstrap "$DOMAIN" "$PLIST"
  echo "автозапуск включён: $PLIST"
  echo "стартует при входе в систему (в том числе после перезагрузки) и проверяет :$PORT каждые ${INTERVAL}с"
}

cmd_uninstall() {
  launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
  rm -f "$PLIST" "$PAUSE"
  kill_server || true
  echo "автозапуск снят, фронт остановлен"
}

usage() {
  cat <<EOF
Usage: $0 <install|uninstall|start|stop|restart|status|logs|watch>

  install     launchd-агент: логин, ребут, проверка что фронт жив
  uninstall   снять агент и остановить фронт
  start       снять паузу и запустить npm start
  stop        остановить и не поднимать, пока не start
  restart     stop + start
  status      агент, pid, порт
  logs [-f]   хвост логов
EOF
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    install) cmd_install ;;
    uninstall) cmd_uninstall ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_restart ;;
    status) cmd_status ;;
    logs) shift || true; cmd_logs "${1:-}" ;;
    watch) cmd_watch ;;
    *) usage; exit 2 ;;
  esac
}

main "$@"
