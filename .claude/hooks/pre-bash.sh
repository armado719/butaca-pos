#!/bin/bash
# Hook PreToolUse[Bash]: bloquea comandos destructivos o peligrosos
# Claude Code pasa el contexto de la herramienta via stdin como JSON

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# ── Comandos destructivos del sistema ─────────────────────────────────────────
if echo "$COMMAND" | grep -qiE '(^|\s|;|&&|\|\|)rm\s+-[a-z]*r[a-z]*f|rm\s+-[a-z]*f[a-z]*r'; then
  echo "BLOQUEADO: 'rm -rf' esta prohibido. Usa 'rm' con rutas especificas y sin -rf."
  exit 2
fi

if echo "$COMMAND" | grep -qiE 'git\s+push\s+(.*\s)?--force|git\s+push\s+(.*\s)?-f(\s|$)'; then
  echo "BLOQUEADO: 'git push --force' esta prohibido para proteger el historial remoto."
  exit 2
fi

if echo "$COMMAND" | grep -qiE 'git\s+reset\s+--hard'; then
  echo "BLOQUEADO: 'git reset --hard' puede destruir cambios sin commit. Usa --soft o --mixed."
  exit 2
fi

# ── Comandos SQL peligrosos ────────────────────────────────────────────────────
if echo "$COMMAND" | grep -qiE 'DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+(TABLE\s+)?\w+'; then
  echo "BLOQUEADO: Comando SQL destructivo (DROP/TRUNCATE) detectado. Requiere ejecucion manual."
  exit 2
fi

# DELETE sin WHERE: detecta DELETE FROM tabla; o DELETE FROM tabla al final de linea
if echo "$COMMAND" | grep -qiP 'DELETE\s+FROM\s+\w+(\s*\.\s*\w+)?\s*;' || \
   echo "$COMMAND" | grep -qiP 'DELETE\s+FROM\s+\w+(\s*\.\s*\w+)?\s*$'; then
  echo "BLOQUEADO: DELETE sin clausula WHERE detectado. Agrega una condicion WHERE explicita."
  exit 2
fi

# ── Variables de entorno de produccion ────────────────────────────────────────
if echo "$COMMAND" | grep -qiE '(export|set)\s+\w*(PROD|PRODUCTION|SECRET|JWT|DB_PASS|PASSWORD|TOKEN|API_KEY)\w*\s*='; then
  echo "BLOQUEADO: Intento de modificar variable de entorno sensible de produccion."
  exit 2
fi

# Sobreescritura directa de .env
if echo "$COMMAND" | grep -qiE '(echo|printf|cat|sed|tee)\s+.*>{1,2}\s*\.?/?[^/]*\.env(\.\w+)?\s*$'; then
  echo "BLOQUEADO: Intento de sobreescribir un archivo .env."
  exit 2
fi

exit 0
