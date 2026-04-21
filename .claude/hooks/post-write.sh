#!/bin/bash
# Hook PostToolUse[Write|Edit]: auto-formatea el archivo modificado y registra la actividad
# Stack del proyecto: TypeScript/TSX (React + Node.js), CSS, JSON, SQL

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE=".claude/hooks/activity.log"

# Normalizar ruta
FILE_PATH="${FILE_PATH#./}"

# Asegurar directorio de logs
mkdir -p "$(dirname "$LOG_FILE")"

# ── Inicializar log si no existe ──────────────────────────────────────────────
if [ ! -f "$LOG_FILE" ]; then
  echo "# butaca-pos | Claude Code Activity Log" > "$LOG_FILE"
  echo "# formato: [fecha hora] herramienta=X | archivo=Y | formato=Z" >> "$LOG_FILE"
  echo "# ────────────────────────────────────────────────────────" >> "$LOG_FILE"
fi

# ── Detectar extension y aplicar formatter ────────────────────────────────────
EXT="${FILE_PATH##*.}"
FORMAT_STATUS="sin_formatter"

case "$EXT" in
  ts|tsx)
    # TypeScript / React: Prettier (disponible via npx en este proyecto Vite)
    if command -v npx &>/dev/null && [ -f "$FILE_PATH" ]; then
      # Buscar config de prettier en raiz del cliente si aplica
      PRETTIER_OPTS="--parser typescript --log-level silent"
      npx prettier $PRETTIER_OPTS --write "$FILE_PATH" 2>/dev/null \
        && FORMAT_STATUS="prettier:ok" \
        || FORMAT_STATUS="prettier:error"
    fi
    ;;
  js|jsx|mjs|cjs)
    # JavaScript
    if command -v npx &>/dev/null && [ -f "$FILE_PATH" ]; then
      npx prettier --parser babel --log-level silent --write "$FILE_PATH" 2>/dev/null \
        && FORMAT_STATUS="prettier:ok" \
        || FORMAT_STATUS="prettier:error"
    fi
    ;;
  css|scss)
    # CSS / TailwindCSS
    if command -v npx &>/dev/null && [ -f "$FILE_PATH" ]; then
      npx prettier --parser css --log-level silent --write "$FILE_PATH" 2>/dev/null \
        && FORMAT_STATUS="prettier:ok" \
        || FORMAT_STATUS="prettier:error"
    fi
    ;;
  json)
    # JSON: jq para formato canonico
    if command -v jq &>/dev/null && [ -f "$FILE_PATH" ]; then
      FORMATTED=$(jq . "$FILE_PATH" 2>/dev/null)
      if [ $? -eq 0 ]; then
        echo "$FORMATTED" > "$FILE_PATH" \
          && FORMAT_STATUS="jq:ok" \
          || FORMAT_STATUS="jq:write_error"
      else
        FORMAT_STATUS="jq:json_invalido"
      fi
    fi
    ;;
  sql)
    # SQL: sin formatter automatico disponible en el entorno
    FORMAT_STATUS="sql:no_formatter"
    ;;
  sh|bash)
    # Shell scripts: shfmt si esta disponible
    if command -v shfmt &>/dev/null && [ -f "$FILE_PATH" ]; then
      shfmt -w -i 2 "$FILE_PATH" 2>/dev/null \
        && FORMAT_STATUS="shfmt:ok" \
        || FORMAT_STATUS="shfmt:error"
    else
      FORMAT_STATUS="shfmt:no_disponible"
    fi
    ;;
  md)
    FORMAT_STATUS="markdown:no_formatter"
    ;;
  *)
    FORMAT_STATUS="extension_desconocida:.$EXT"
    ;;
esac

# ── Registrar en activity.log ─────────────────────────────────────────────────
echo "[$TIMESTAMP] herramienta=$TOOL_NAME | archivo=$FILE_PATH | formato=$FORMAT_STATUS" >> "$LOG_FILE"

exit 0
