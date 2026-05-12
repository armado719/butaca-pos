# Módulo de Domicilios — Diseño

**Fecha:** 2026-05-12
**Proyecto:** butaca-pos
**Estado:** Aprobado

## Contexto

La Butaca Restaurante también realiza entregas a domicilio. La cajera atiende las llamadas y toma los pedidos. A veces el mismo mesero hace la entrega. Se necesita integrar el flujo de domicilios al sistema POS existente sin romper el flujo actual de mesas.

## Alcance

- Mesero y cajera pueden crear pedidos de domicilio
- Historial de clientes frecuentes (búsqueda por teléfono)
- Pago contra entrega o anticipado (transferencia/Nequi)
- Cocina ve los domicilios igual que los pedidos de mesa
- Caja gestiona el estado del domicilio (en camino / entregado)
- Reportes diferenciados por tipo (mesa vs domicilio)

## Base de Datos

### Nueva tabla `clientes`

```sql
CREATE TABLE clientes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL UNIQUE,
  direccion TEXT NOT NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cambios a tabla `pedidos`

```sql
ALTER TABLE pedidos
  ADD COLUMN tipo ENUM('mesa', 'domicilio') NOT NULL DEFAULT 'mesa',
  ADD COLUMN cliente_id INT NULL,
  ADD COLUMN direccion_entrega TEXT NULL,
  ADD COLUMN costo_domicilio DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN estado_domicilio ENUM('pendiente', 'en_camino', 'entregado') NULL,
  ADD COLUMN entregado_por INT NULL,
  ADD CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  ADD CONSTRAINT fk_pedido_empleado FOREIGN KEY (entregado_por) REFERENCES empleados(id);
```

La tabla `pagos` no requiere cambios — ya soporta todos los métodos necesarios incluyendo contra entrega.

## Backend

### Nuevas rutas `/api/clientes`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/clientes?q=:telefono` | mesero, cajero | Buscar cliente por teléfono (autocompletar) |
| POST | `/api/clientes` | mesero, cajero | Crear cliente nuevo |
| PUT | `/api/clientes/:id` | mesero, cajero | Actualizar datos del cliente |

### Cambios a `/api/pedidos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/pedidos` | Acepta campos opcionales: `tipo`, `cliente_id`, `direccion_entrega`, `costo_domicilio` |
| PUT | `/api/pedidos/:id/estado-domicilio` | Actualiza `estado_domicilio` a `en_camino` o `entregado`, registra `entregado_por` |
| GET | `/api/pedidos/domicilios` | Lista domicilios activos (estado_domicilio != 'entregado') |

### WebSocket

Sin cambios. Al crear un domicilio se emite `nueva_comanda` igual que un pedido de mesa. La cocina recibe la notificación normalmente.

### Validaciones (Zod)

- Pedido domicilio: requiere `cliente_id` o datos de cliente nuevo, `direccion_entrega` obligatoria
- `costo_domicilio` >= 0
- `estado_domicilio` solo aplicable cuando `tipo = 'domicilio'`

## Frontend

### Pantalla Mesero

- Nuevo botón **"Domicilio"** junto a la selección de mesa
- Al seleccionar "Domicilio":
  - Campo de búsqueda por teléfono con autocompletar
  - Si el cliente existe: muestra nombre y dirección, permite editar
  - Si no existe: formulario para nombre, teléfono, dirección, notas
  - Campo para costo de domicilio
- El resto del flujo (agregar productos, enviar a cocina) sin cambios

### Pantalla Caja

- Mismo botón **"Domicilio"** para crear pedidos entrantes por teléfono
- Lista de pedidos muestra etiqueta **DOMICILIO** en color distinto (amber/naranja)
- Al procesar pago: opción adicional **"Contra entrega"** junto a los métodos actuales
- Botón **"En camino"** → selecciona empleado que entrega
- Botón **"Entregado"** → cierra el ciclo del domicilio

### Pantalla Cocina

- Sin cambios en el flujo
- Las comandas de domicilio muestran etiqueta **DOMICILIO** para contexto visual

### Admin → Reportes

- Filtro por tipo: **Todos / Mesa / Domicilio**
- Métricas adicionales: total domicilios del día, ingreso por domicilios, costo promedio de envío

## Flujo Completo

```
Llamada cliente
     ↓
Cajera/Mesero busca cliente por teléfono
     ↓ (nuevo)         ↓ (frecuente)
Crea cliente      Autocompletado
     ↓
Selecciona productos + costo domicilio
     ↓
POST /api/pedidos (tipo: 'domicilio')
     ↓
Socket → nueva_comanda → Cocina
     ↓
Cocina prepara → marca listo
     ↓
Caja procesa pago (anticipado o contra entrega)
     ↓
Caja asigna empleado → "En camino"
     ↓
Confirman entrega → "Entregado"
```

## Fuera de Alcance (v1)

- Múltiples direcciones por cliente
- Tracking en tiempo real del domiciliario
- Integración con apps de delivery externas (Rappi, etc.)
- Notificaciones al cliente (SMS/WhatsApp)
