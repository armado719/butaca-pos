#!/bin/bash
# Hook PreToolUse[Write|Edit]: bloquea escritura en archivos y carpetas sensibles
# Cubre tanto la herramienta Write como Edit (ambas exponen tool_input.file_path)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Normalizar: quitar ./ del inicio
FILE_PATH="${FILE_PATH#./}"

# ── Archivos de credenciales y secretos ───────────────────────────────────────
if echo "$FILE_PATH" | grep -qiE '(^|/)\.env($|\.|/)'; then
  echo "BLOQUEADO: Escritura en archivo .env prohibida. Editalo manualmente fuera de Claude."
  exit 2
fi

if echo "$FILE_PATH" | grep -qiE '\.(pem|key|p12|pfx|crt|cer|jks)$'; then
  echo "BLOQUEADO: Escritura en certificado o clave privada: $FILE_PATH"
  exit 2
fi

if echo "$FILE_PATH" | grep -qiE '(^|/)(secret|credential|private[_-]?key)(s)?[^/]*$'; then
  echo "BLOQUEADO: El nombre del archivo contiene terminos de credenciales sensibles: $FILE_PATH"
  exit 2
fi

# ── Carpetas de infraestructura ───────────────────────────────────────────────
if echo "$FILE_PATH" | grep -qE '^(\.github|docker|k8s|terraform|\.terraform)/'; then
  echo "BLOQUEADO: Escritura en carpeta de infraestructura protegida: $FILE_PATH"
  exit 2
fi

# ── Archivos criticos especificos de butaca-pos ───────────────────────────────
# Identificados por revision del proyecto:
#   - connection.ts    : credenciales y pool de BD
#   - validateToken.ts : logica central de autenticacion JWT
#   - butaca_pos.sql   : schema de produccion con hashes de passwords
#   - settings.json    : este mismo sistema de hooks
CRITICAL_FILES=(
  "server/src/db/connection.ts"
  "server/src/middlewares/validateToken.ts"
  "butaca_pos.sql"
  ".claude/settings.json"
)

for critical in "${CRITICAL_FILES[@]}"; do
  if [ "$FILE_PATH" = "$critical" ]; then
    echo "BLOQUEADO: '$FILE_PATH' es un archivo critico del proyecto. Requiere revision y edicion manual."
    exit 2
  fi
done

exit 0
