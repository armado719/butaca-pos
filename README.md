# La Butaca Restaurante - POS

Sistema de Punto de Venta (POS) para "La Butaca Restaurante", desarrollado con el stack: React + Vite + TailwindCSS, Node.js, Express, MySQL y Socket.io.

## Requisitos Previos
- Node.js (v18 o superior)
- MySQL Server

## Instalación y Configuración

### 1. Base de Datos
- Asegúrate de tener MySQL ejecutándose.
- Importa el archivo \`butaca_pos.sql\` ubicado en la raíz de este proyecto en tu gestor de MySQL. Contiene toda la estructura y datos de prueba.

### 2. Configurar el Backend (Servidor)
1. Entra al directorio \`server\`:
   \`\`\`bash
   cd server
   \`\`\`
2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`
3. Copia el archivo \`.env.example\` a un nuevo archivo \`.env\` e ingresa tus credenciales de base de datos.
4. Levanta el servidor de desarrollo:
   \`\`\`bash
   npx nodemon --exec ts-node index.ts  # o usando npm run dev si se configuró en package.json
   \`\`\`

### 3. Configurar el Frontend (Cliente)
1. Entra al directorio \`client\`:
   \`\`\`bash
   cd client
   \`\`\`
2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`
3. Levanta la aplicación React con Vite:
   \`\`\`bash
   npm run dev
   \`\`\`

## Credenciales de Acceso Inicial
- **Email:** admin@labutaca.com
- **Password:** butaca2024
