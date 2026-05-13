# Módulo de Domicilios — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar soporte de pedidos a domicilio al POS, permitiendo que mesero y cajera creen pedidos con datos de cliente, historial de clientes frecuentes, seguimiento del estado de entrega, y pago anticipado o contra entrega.

**Architecture:** Se extiende el flujo existente de pedidos: la tabla `pedidos` gana campos opcionales de domicilio, se crea una tabla `clientes`, y se añade una API `/api/clientes`. En el frontend, Mesero y Caja obtienen un modo "Domicilio" que reemplaza la selección de mesa. Cocina y Admin/Reportes reciben cambios menores (etiqueta y filtro).

**Tech Stack:** Node.js + Express + TypeScript + MySQL2 + Zod + Socket.IO | React 18 + TailwindCSS + Axios

**Nota sobre tests:** El proyecto no tiene framework de tests configurado. Cada tarea backend usa `npx tsc --noEmit` como verificación de tipos. Las tareas frontend se verifican visualmente en `localhost:5173`.

---

## Mapa de archivos

### Crear
- `server/migrations/004_domicilios.sql` — tabla clientes + alter pedidos
- `server/src/schemas/clientes.schema.ts` — Zod schemas + DTOs de clientes
- `server/src/services/clientes.service.ts` — lógica de negocio clientes
- `server/src/controllers/clientes.ts` — controladores HTTP clientes
- `server/src/routes/clientes.ts` — rutas /api/clientes
- `client/src/components/FormularioDomicilio.tsx` — formulario búsqueda/creación cliente

### Modificar
- `server/src/schemas/pedidos.schema.ts` — extender para domicilios
- `server/src/services/pedidos.service.ts` — lógica domicilio en createOrder, getCashierOrders, etc.
- `server/src/controllers/pedidos.ts` — nuevos endpoints estado-domicilio y domicilios
- `server/src/routes/pedidos.ts` — nuevas rutas domicilio
- `server/src/index.ts` — registrar /api/clientes
- `client/src/pages/Mesero.tsx` — modo domicilio
- `client/src/pages/Caja.tsx` — modo domicilio + gestión estado entrega
- `client/src/pages/Cocina.tsx` — etiqueta DOMICILIO
- `client/src/pages/Admin.tsx` — filtro por tipo en reportes

---

## Task 1: Migración de base de datos

**Files:**
- Create: `server/migrations/004_domicilios.sql`

- [ ] **Step 1: Crear archivo de migración**

```sql
-- 004_domicilios.sql

-- Tabla de clientes frecuentes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`     VARCHAR(100) NOT NULL,
  `telefono`   VARCHAR(20)  NOT NULL,
  `direccion`  TEXT         NOT NULL,
  `notas`      TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_telefono` (`telefono`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hacer mesa_id nullable (domicilios no tienen mesa)
ALTER TABLE `pedidos`
  MODIFY COLUMN `mesa_id` INT NULL;

-- Nuevos campos en pedidos
ALTER TABLE `pedidos`
  ADD COLUMN `tipo`              ENUM('mesa','domicilio') NOT NULL DEFAULT 'mesa' AFTER `id`,
  ADD COLUMN `cliente_id`        INT          NULL AFTER `tipo`,
  ADD COLUMN `direccion_entrega` TEXT         NULL AFTER `cliente_id`,
  ADD COLUMN `costo_domicilio`   DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `direccion_entrega`,
  ADD COLUMN `estado_domicilio`  ENUM('pendiente','en_camino','entregado') NULL AFTER `costo_domicilio`,
  ADD COLUMN `entregado_por`     INT          NULL AFTER `estado_domicilio`,
  ADD CONSTRAINT `fk_pedido_cliente`  FOREIGN KEY (`cliente_id`)   REFERENCES `clientes`(`id`),
  ADD CONSTRAINT `fk_pedido_empleado` FOREIGN KEY (`entregado_por`) REFERENCES `empleados`(`id`);
```

- [ ] **Step 2: Ejecutar la migración**

```powershell
cd server
npx ts-node src/db/migrate.ts
```

Salida esperada:
```
Aplicando migración: 004_domicilios.sql...
  ✔ 004_domicilios.sql
1 migración(es) aplicada(s) correctamente.
```

- [ ] **Step 3: Verificar en MySQL que las tablas existen**

```sql
DESCRIBE clientes;
DESCRIBE pedidos;
-- Debe aparecer: tipo, cliente_id, direccion_entrega, costo_domicilio, estado_domicilio, entregado_por
```

- [ ] **Step 4: Commit**

```bash
git add server/migrations/004_domicilios.sql
git commit -m "feat(db): add clientes table and domicilio columns to pedidos"
```

---

## Task 2: Schemas de clientes (Zod + DTOs)

**Files:**
- Create: `server/src/schemas/clientes.schema.ts`

- [ ] **Step 1: Crear el schema**

```typescript
// server/src/schemas/clientes.schema.ts
import { z } from 'zod';

export const crearClienteSchema = z.object({
  nombre:    z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono:  z.string().min(7, 'El teléfono debe tener al menos 7 dígitos').max(20),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  notas:     z.string().optional(),
});

export const actualizarClienteSchema = crearClienteSchema.partial();

export type CrearClienteDTO      = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteDTO = z.infer<typeof actualizarClienteSchema>;
```

- [ ] **Step 2: Verificar tipos**

```powershell
cd server
node ../client/node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add server/src/schemas/clientes.schema.ts
git commit -m "feat(schema): add clientes Zod schemas"
```

---

## Task 3: Servicio de clientes

**Files:**
- Create: `server/src/services/clientes.service.ts`

- [ ] **Step 1: Crear el servicio**

```typescript
// server/src/services/clientes.service.ts
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { CrearClienteDTO, ActualizarClienteDTO } from '../schemas/clientes.schema';

export async function buscarClientePorTelefono(telefono: string): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, nombre, telefono, direccion, notas FROM clientes WHERE telefono LIKE ? LIMIT 10',
    [`%${telefono}%`]
  );
  return rows;
}

export async function crearCliente(data: CrearClienteDTO): Promise<{ id: number }> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO clientes (nombre, telefono, direccion, notas) VALUES (?, ?, ?, ?)',
    [data.nombre, data.telefono, data.direccion, data.notas ?? null]
  );
  return { id: result.insertId };
}

export async function actualizarCliente(id: number, data: ActualizarClienteDTO): Promise<void> {
  const campos: string[] = [];
  const valores: any[] = [];

  if (data.nombre    !== undefined) { campos.push('nombre = ?');    valores.push(data.nombre); }
  if (data.telefono  !== undefined) { campos.push('telefono = ?');  valores.push(data.telefono); }
  if (data.direccion !== undefined) { campos.push('direccion = ?'); valores.push(data.direccion); }
  if (data.notas     !== undefined) { campos.push('notas = ?');     valores.push(data.notas); }

  if (campos.length === 0) return;

  valores.push(id);
  await pool.query(`UPDATE clientes SET ${campos.join(', ')} WHERE id = ?`, valores);
}
```

- [ ] **Step 2: Verificar tipos**

```powershell
cd server
node ../client/node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/clientes.service.ts
git commit -m "feat(service): add clientes service"
```

---

## Task 4: Controlador y rutas de clientes

**Files:**
- Create: `server/src/controllers/clientes.ts`
- Create: `server/src/routes/clientes.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Crear el controlador**

```typescript
// server/src/controllers/clientes.ts
import { Response, NextFunction } from 'express';
import { CustomRequest } from '../middlewares/validateToken';
import { buscarClientePorTelefono, crearCliente, actualizarCliente } from '../services/clientes.service';
import type { CrearClienteDTO, ActualizarClienteDTO } from '../schemas/clientes.schema';

export const buscarCliente = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = (req.query.q as string) ?? '';
    res.json(await buscarClientePorTelefono(q));
  } catch (error) { next(error); }
};

export const nuevoCliente = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await crearCliente(req.body as CrearClienteDTO);
    res.status(201).json({ msg: 'Cliente creado', ...result });
  } catch (error) { next(error); }
};

export const editarCliente = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await actualizarCliente(Number(req.params.id), req.body as ActualizarClienteDTO);
    res.json({ msg: 'Cliente actualizado' });
  } catch (error) { next(error); }
};
```

- [ ] **Step 2: Crear las rutas**

```typescript
// server/src/routes/clientes.ts
import { Router } from 'express';
import { buscarCliente, nuevoCliente, editarCliente } from '../controllers/clientes';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validate } from '../middlewares/validate';
import { crearClienteSchema, actualizarClienteSchema } from '../schemas/clientes.schema';

const router = Router();

router.get('/',     validateToken, authorizeRoles('mesero', 'cajero', 'admin'),                              buscarCliente);
router.post('/',    validateToken, authorizeRoles('mesero', 'cajero', 'admin'), validate(crearClienteSchema), nuevoCliente);
router.put('/:id',  validateToken, authorizeRoles('mesero', 'cajero', 'admin'), validate(actualizarClienteSchema), editarCliente);

export default router;
```

- [ ] **Step 3: Registrar la ruta en index.ts**

En `server/src/index.ts`, agregar después de `import administrativoRoutes`:

```typescript
import clientesRoutes from './routes/clientes';
```

Y después de `app.use('/api/administrativo', administrativoRoutes);`:

```typescript
app.use('/api/clientes', clientesRoutes);
```

- [ ] **Step 4: Verificar tipos**

```powershell
cd server
node ../client/node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/clientes.ts server/src/routes/clientes.ts server/src/index.ts
git commit -m "feat(api): add /api/clientes endpoints"
```

---

## Task 5: Extender schema de pedidos para domicilios

**Files:**
- Modify: `server/src/schemas/pedidos.schema.ts`

- [ ] **Step 1: Reemplazar el contenido del schema**

Abrir `server/src/schemas/pedidos.schema.ts` y reemplazar su contenido completo con:

```typescript
import { z } from 'zod';

const productoItemSchema = z.object({
  id:            z.number().int().positive(),
  cantidad:      z.number().int().positive('La cantidad debe ser mayor a 0'),
  precio:        z.number().positive('El precio debe ser mayor a 0'),
  observaciones: z.string().optional(),
});

const clienteNuevoSchema = z.object({
  nombre:    z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono:  z.string().min(7).max(20),
  direccion: z.string().min(5),
  notas:     z.string().optional(),
});

export const crearPedidoSchema = z.object({
  tipo:              z.enum(['mesa', 'domicilio']).default('mesa'),
  mesa_id:           z.number().int().positive().optional(),
  cliente_id:        z.number().int().positive().optional(),
  cliente_nuevo:     clienteNuevoSchema.optional(),
  direccion_entrega: z.string().min(5).optional(),
  costo_domicilio:   z.number().min(0).default(0),
  productos:         z.array(productoItemSchema).min(1, 'El pedido debe incluir al menos un producto'),
  observaciones:     z.string().optional(),
})
.refine(
  (d) => d.tipo === 'domicilio' || d.mesa_id !== undefined,
  { message: 'mesa_id es requerido para pedidos de mesa' }
)
.refine(
  (d) => d.tipo === 'mesa' || d.cliente_id !== undefined || d.cliente_nuevo !== undefined,
  { message: 'Se requiere cliente_id o cliente_nuevo para domicilios' }
)
.refine(
  (d) => d.tipo === 'mesa' || d.direccion_entrega !== undefined,
  { message: 'direccion_entrega es requerida para domicilios' }
);

export const actualizarEstadoSchema = z.object({
  estado: z.enum(['pendiente', 'en_cocina', 'listo', 'entregado', 'pagado', 'cancelado'], {
    errorMap: () => ({ message: 'Estado no válido' }),
  }),
});

export const actualizarEstadoDomicilioSchema = z.object({
  estado_domicilio: z.enum(['en_camino', 'entregado']),
  entregado_por:    z.number().int().positive().optional(),
});

export const pagarPedidoSchema = z.object({
  metodo_pago: z.enum(['efectivo', 'transferencia', 'nequi', 'daviplata', 'contra_entrega'], {
    errorMap: () => ({ message: 'Método de pago no válido' }),
  }),
  monto: z.number().positive('El monto debe ser mayor a 0'),
});

export type CrearPedidoDTO              = z.infer<typeof crearPedidoSchema>;
export type ActualizarEstadoDTO         = z.infer<typeof actualizarEstadoSchema>;
export type ActualizarEstadoDomicilioDTO = z.infer<typeof actualizarEstadoDomicilioSchema>;
export type PagarPedidoDTO              = z.infer<typeof pagarPedidoSchema>;
export type ProductoItem                = z.infer<typeof productoItemSchema>;
export type ClienteNuevoDTO             = z.infer<typeof clienteNuevoSchema>;
```

- [ ] **Step 2: Verificar tipos**

```powershell
cd server
node ../client/node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores (o errores de servicios que aún no se han actualizado — se resuelven en Task 6).

- [ ] **Step 3: Commit**

```bash
git add server/src/schemas/pedidos.schema.ts
git commit -m "feat(schema): extend pedidos schema for domicilios"
```

---

## Task 6: Extender servicio de pedidos

**Files:**
- Modify: `server/src/services/pedidos.service.ts`

- [ ] **Step 1: Reemplazar el contenido completo del servicio**

```typescript
// server/src/services/pedidos.service.ts
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Server } from 'socket.io';
import type { ProductoItem, ClienteNuevoDTO, ActualizarEstadoDomicilioDTO } from '../schemas/pedidos.schema';
import { crearCliente } from './clientes.service';

interface Usuario { id: number; nombre: string; }

export async function createOrder(
  tipo: 'mesa' | 'domicilio',
  productos: ProductoItem[],
  observaciones: string,
  usuario: Usuario,
  io?: Server,
  opts?: {
    mesa_id?: number;
    cliente_id?: number;
    cliente_nuevo?: ClienteNuevoDTO;
    direccion_entrega?: string;
    costo_domicilio?: number;
  }
): Promise<{ pedido_id: number }> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let cliente_id = opts?.cliente_id ?? null;

    if (tipo === 'domicilio' && !cliente_id && opts?.cliente_nuevo) {
      const { id } = await crearCliente(opts.cliente_nuevo);
      cliente_id = id;
    }

    const productosTotal = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    const costo_domicilio = opts?.costo_domicilio ?? 0;
    const total = productosTotal + costo_domicilio;

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO pedidos
        (tipo, mesa_id, cliente_id, direccion_entrega, costo_domicilio, estado_domicilio,
         usuario_id, estado, total, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`,
      [
        tipo,
        opts?.mesa_id ?? null,
        cliente_id,
        opts?.direccion_entrega ?? null,
        costo_domicilio,
        tipo === 'domicilio' ? 'pendiente' : null,
        usuario.id,
        total,
        observaciones || '',
      ]
    );

    const pedido_id = result.insertId;

    for (const item of productos) {
      await conn.query(
        'INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
        [pedido_id, item.id, item.cantidad, item.precio, item.precio * item.cantidad, item.observaciones || '']
      );
    }

    if (tipo === 'mesa' && opts?.mesa_id) {
      await conn.query('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [opts.mesa_id]);
    }

    await conn.commit();

    io?.emit('nueva_comanda', {
      id: pedido_id,
      tipo,
      mesa_id: opts?.mesa_id ?? null,
      mesero: usuario.nombre,
      productos,
      observaciones,
      estado: 'pendiente',
      created_at: new Date(),
    });

    return { pedido_id };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

function groupByPedido<T extends Record<string, any>>(rows: T[], extraFields: (keyof T)[]): any[] {
  const map = new Map<number, any>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      const base: any = {
        id: row.id,
        tipo: row.tipo,
        mesa_id: row.mesa_id,
        estado: row.estado,
        created_at: row.created_at,
        mesero: row.mesero,
        mesa_numero: row.mesa_numero,
        productos: [],
      };
      for (const f of extraFields) base[f as string] = row[f];
      map.set(row.id, base);
    }
    if (row.producto_nombre) {
      map.get(row.id).productos.push({
        nombre: row.producto_nombre,
        cantidad: row.cantidad,
        ...(row.subtotal     !== undefined ? { subtotal: row.subtotal }         : {}),
        ...(row.det_obs      !== undefined ? { observaciones: row.det_obs }     : {}),
      });
    }
  }
  return [...map.values()];
}

export async function getPendingOrders(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.tipo, p.mesa_id, p.estado, p.observaciones, p.estado_domicilio, p.created_at,
           u.nombre AS mesero,
           m.numero AS mesa_numero,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           p.direccion_entrega,
           pd.cantidad, pd.observaciones AS det_obs, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u              ON p.usuario_id   = u.id
    LEFT JOIN mesas m            ON p.mesa_id      = m.id
    LEFT JOIN clientes c         ON p.cliente_id   = c.id
    LEFT JOIN pedido_detalle pd  ON pd.pedido_id   = p.id
    LEFT JOIN productos prod     ON pd.producto_id = prod.id
    WHERE p.estado IN ('pendiente', 'en_cocina')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, ['observaciones', 'estado_domicilio', 'cliente_nombre', 'cliente_telefono', 'direccion_entrega']);
}

export async function updateOrderStatus(id: string, estado: string, io?: Server): Promise<void> {
  await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
  io?.emit('pedido_actualizado', { id: parseInt(id), estado });
}

export async function getCashierOrders(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.tipo, p.mesa_id, p.estado, p.total, p.costo_domicilio,
           p.estado_domicilio, p.created_at, p.direccion_entrega,
           u.nombre AS mesero,
           m.numero AS mesa_numero,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           pd.cantidad, pd.subtotal, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u              ON p.usuario_id   = u.id
    LEFT JOIN mesas m            ON p.mesa_id      = m.id
    LEFT JOIN clientes c         ON p.cliente_id   = c.id
    LEFT JOIN pedido_detalle pd  ON pd.pedido_id   = p.id
    LEFT JOIN productos prod     ON pd.producto_id = prod.id
    WHERE p.estado IN ('listo', 'entregado')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, [
    'total', 'costo_domicilio', 'estado_domicilio',
    'cliente_nombre', 'cliente_telefono', 'direccion_entrega',
  ]);
}

export async function updateDomicilioStatus(
  id: string,
  data: ActualizarEstadoDomicilioDTO,
  io?: Server
): Promise<void> {
  await pool.query(
    'UPDATE pedidos SET estado_domicilio = ?, entregado_por = ? WHERE id = ?',
    [data.estado_domicilio, data.entregado_por ?? null, id]
  );
  io?.emit('domicilio_actualizado', { id: parseInt(id), estado_domicilio: data.estado_domicilio });
}

export async function getDomiciliosActivos(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.estado, p.estado_domicilio, p.total, p.costo_domicilio,
           p.direccion_entrega, p.created_at,
           u.nombre AS mesero,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           pd.cantidad, pd.subtotal, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u              ON p.usuario_id   = u.id
    LEFT JOIN clientes c         ON p.cliente_id   = c.id
    LEFT JOIN pedido_detalle pd  ON pd.pedido_id   = p.id
    LEFT JOIN productos prod     ON pd.producto_id = prod.id
    WHERE p.tipo = 'domicilio'
      AND p.estado NOT IN ('pagado', 'cancelado')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, [
    'total', 'costo_domicilio', 'estado_domicilio',
    'cliente_nombre', 'cliente_telefono', 'direccion_entrega',
  ]);
}

export async function processPayment(
  id: string,
  metodo_pago: string,
  monto: number,
  usuario_id: number,
  io?: Server
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'INSERT INTO pagos (pedido_id, usuario_id, monto, metodo_pago) VALUES (?, ?, ?, ?)',
      [id, usuario_id, monto, metodo_pago]
    );
    await conn.query('UPDATE pedidos SET estado = "pagado" WHERE id = ?', [id]);

    const [pedido] = await conn.query<RowDataPacket[]>(
      'SELECT tipo, mesa_id FROM pedidos WHERE id = ?',
      [id]
    );
    if (pedido.length > 0 && pedido[0].tipo === 'mesa' && pedido[0].mesa_id) {
      await conn.query('UPDATE mesas SET estado = "disponible" WHERE id = ?', [pedido[0].mesa_id]);
    }

    await conn.commit();
    io?.emit('pedido_pagado', { pedido_id: parseInt(id) });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
```

- [ ] **Step 2: Verificar tipos**

```powershell
cd server
node ../client/node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/pedidos.service.ts
git commit -m "feat(service): extend pedidos service for domicilios"
```

---

## Task 7: Extender controlador y rutas de pedidos

**Files:**
- Modify: `server/src/controllers/pedidos.ts`
- Modify: `server/src/routes/pedidos.ts`

- [ ] **Step 1: Reemplazar el controlador**

```typescript
// server/src/controllers/pedidos.ts
import { Response, NextFunction } from 'express';
import { CustomRequest } from '../middlewares/validateToken';
import {
  createOrder, getPendingOrders, updateOrderStatus,
  getCashierOrders, processPayment, updateDomicilioStatus, getDomiciliosActivos,
} from '../services/pedidos.service';
import type {
  CrearPedidoDTO, ActualizarEstadoDTO, PagarPedidoDTO, ActualizarEstadoDomicilioDTO,
} from '../schemas/pedidos.schema';

export const crearPedido = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as CrearPedidoDTO;
    const result = await createOrder(
      body.tipo ?? 'mesa',
      body.productos,
      body.observaciones ?? '',
      req.usuario!,
      req.io,
      {
        mesa_id:           body.mesa_id,
        cliente_id:        body.cliente_id,
        cliente_nuevo:     body.cliente_nuevo,
        direccion_entrega: body.direccion_entrega,
        costo_domicilio:   body.costo_domicilio,
      }
    );
    res.json({ msg: 'Pedido enviado a cocina correctamente', ...result });
  } catch (error) { next(error); }
};

export const getPendientes = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getPendingOrders());
  } catch (error) { next(error); }
};

export const actualizarEstado = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body as ActualizarEstadoDTO;
    await updateOrderStatus(id, estado, req.io);
    res.json({ msg: `Estado actualizado a ${estado}` });
  } catch (error) { next(error); }
};

export const getCaja = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getCashierOrders());
  } catch (error) { next(error); }
};

export const pagarPedido = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { metodo_pago, monto } = req.body as PagarPedidoDTO;
    await processPayment(id, metodo_pago, monto, req.usuario!.id, req.io);
    res.json({ msg: 'Pago registrado con éxito' });
  } catch (error) { next(error); }
};

export const actualizarEstadoDomicilio = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await updateDomicilioStatus(id, req.body as ActualizarEstadoDomicilioDTO, req.io);
    res.json({ msg: 'Estado de domicilio actualizado' });
  } catch (error) { next(error); }
};

export const getDomicilios = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getDomiciliosActivos());
  } catch (error) { next(error); }
};
```

- [ ] **Step 2: Reemplazar las rutas**

```typescript
// server/src/routes/pedidos.ts
import { Router } from 'express';
import {
  crearPedido, getPendientes, actualizarEstado,
  getCaja, pagarPedido, actualizarEstadoDomicilio, getDomicilios,
} from '../controllers/pedidos';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validate } from '../middlewares/validate';
import {
  crearPedidoSchema, actualizarEstadoSchema,
  pagarPedidoSchema, actualizarEstadoDomicilioSchema,
} from '../schemas/pedidos.schema';

const router = Router();

router.post('/',
  validateToken, authorizeRoles('mesero', 'cajero', 'admin'),
  validate(crearPedidoSchema),
  crearPedido);

router.get('/pendientes',
  validateToken, authorizeRoles('cocina', 'admin'),
  getPendientes);

router.put('/:id/estado',
  validateToken, authorizeRoles('cocina', 'admin'),
  validate(actualizarEstadoSchema),
  actualizarEstado);

router.get('/caja',
  validateToken, authorizeRoles('cajero', 'admin'),
  getCaja);

router.post('/:id/pagar',
  validateToken, authorizeRoles('cajero', 'admin'),
  validate(pagarPedidoSchema),
  pagarPedido);

router.put('/:id/estado-domicilio',
  validateToken, authorizeRoles('cajero', 'admin'),
  validate(actualizarEstadoDomicilioSchema),
  actualizarEstadoDomicilio);

router.get('/domicilios',
  validateToken, authorizeRoles('cajero', 'admin'),
  getDomicilios);

export default router;
```

- [ ] **Step 3: Verificar tipos**

```powershell
cd server
node ../client/node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/pedidos.ts server/src/routes/pedidos.ts
git commit -m "feat(api): extend pedidos endpoints for domicilios"
```

---

## Task 8: Componente FormularioDomicilio

**Files:**
- Create: `client/src/components/FormularioDomicilio.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// client/src/components/FormularioDomicilio.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserPlus, MapPin, Phone, User, FileText } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  notas?: string;
}

interface DomicilioData {
  cliente_id?: number;
  cliente_nuevo?: { nombre: string; telefono: string; direccion: string; notas?: string };
  direccion_entrega: string;
  costo_domicilio: number;
}

interface Props {
  token: string;
  onChange: (data: DomicilioData | null) => void;
}

export const FormularioDomicilio = ({ token, onChange }: Props) => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', direccion: '', notas: '' });
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [costoDomicilio, setCostoDomicilio] = useState(0);

  useEffect(() => {
    if (busqueda.length < 3) { setResultados([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/api/clientes?q=${busqueda}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResultados(data);
      } catch { setResultados([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda, token]);

  useEffect(() => {
    const tieneCliente = clienteSeleccionado || (modoNuevo && nuevoCliente.nombre && nuevoCliente.telefono);
    const tieneDireccion = direccionEntrega.trim().length >= 5;

    if (!tieneCliente || !tieneDireccion) { onChange(null); return; }

    onChange({
      cliente_id:        clienteSeleccionado?.id,
      cliente_nuevo:     modoNuevo ? { ...nuevoCliente } : undefined,
      direccion_entrega: direccionEntrega,
      costo_domicilio:   costoDomicilio,
    });
  }, [clienteSeleccionado, modoNuevo, nuevoCliente, direccionEntrega, costoDomicilio]);

  const seleccionarCliente = (c: Cliente) => {
    setClienteSeleccionado(c);
    setDireccionEntrega(c.direccion);
    setResultados([]);
    setBusqueda(c.telefono);
    setModoNuevo(false);
  };

  const limpiar = () => {
    setClienteSeleccionado(null);
    setBusqueda('');
    setResultados([]);
    setModoNuevo(false);
    setNuevoCliente({ nombre: '', telefono: '', direccion: '', notas: '' });
    setDireccionEntrega('');
    setCostoDomicilio(0);
  };

  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      {!clienteSeleccionado && !modoNuevo && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Buscar cliente por teléfono
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Ej: 3001234567"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {resultados.length > 0 && (
            <ul className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              {resultados.map(c => (
                <li
                  key={c.id}
                  onClick={() => seleccionarCliente(c)}
                  className="px-3 py-2 text-sm hover:bg-orange-50 cursor-pointer border-b last:border-b-0"
                >
                  <span className="font-medium">{c.nombre}</span>
                  <span className="text-gray-500 ml-2">{c.telefono}</span>
                  <p className="text-xs text-gray-400 truncate">{c.direccion}</p>
                </li>
              ))}
            </ul>
          )}
          {busqueda.length >= 3 && resultados.length === 0 && (
            <button
              onClick={() => { setModoNuevo(true); setNuevoCliente(prev => ({ ...prev, telefono: busqueda })); }}
              className="mt-2 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <UserPlus size={16} /> Crear cliente nuevo
            </button>
          )}
        </div>
      )}

      {/* Cliente seleccionado */}
      {clienteSeleccionado && (
        <div className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <p className="font-semibold text-green-800 text-sm">{clienteSeleccionado.nombre}</p>
            <p className="text-xs text-green-600">{clienteSeleccionado.telefono}</p>
          </div>
          <button onClick={limpiar} className="text-xs text-gray-400 hover:text-red-500">Cambiar</button>
        </div>
      )}

      {/* Formulario cliente nuevo */}
      {modoNuevo && (
        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-blue-700 uppercase">Nuevo cliente</p>
            <button onClick={limpiar} className="text-xs text-gray-400 hover:text-red-500">Cancelar</button>
          </div>
          {[
            { key: 'nombre', icon: User, placeholder: 'Nombre completo' },
            { key: 'telefono', icon: Phone, placeholder: 'Teléfono' },
            { key: 'direccion', icon: MapPin, placeholder: 'Dirección principal' },
            { key: 'notas', icon: FileText, placeholder: 'Notas (opcional)' },
          ].map(({ key, icon: Icon, placeholder }) => (
            <div key={key} className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={(nuevoCliente as any)[key]}
                onChange={e => setNuevoCliente(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
      )}

      {/* Dirección de entrega y costo */}
      {(clienteSeleccionado || modoNuevo) && (
        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={direccionEntrega}
              onChange={e => setDireccionEntrega(e.target.value)}
              placeholder="Dirección de entrega"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Costo envío $</span>
            <input
              type="number"
              min="0"
              value={costoDomicilio}
              onChange={e => setCostoDomicilio(Number(e.target.value))}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verificar TypeScript en cliente**

```powershell
cd client
node node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/FormularioDomicilio.tsx
git commit -m "feat(ui): add FormularioDomicilio component"
```

---

## Task 9: Mesero — modo domicilio

**Files:**
- Modify: `client/src/pages/Mesero.tsx`

- [ ] **Step 1: Leer el archivo actual completo**

Leer `client/src/pages/Mesero.tsx` para entender la estructura actual antes de modificar.

- [ ] **Step 2: Agregar estado y lógica de domicilio**

Agregar estos imports al inicio del archivo (junto a los existentes):

```tsx
import { FormularioDomicilio } from '../components/FormularioDomicilio';
import { Bike } from 'lucide-react';
```

Agregar estos estados junto a los existentes:

```tsx
const [modoDomicilio, setModoDomicilio] = useState(false);
const [domicilioData, setDomicilioData] = useState<any>(null);
```

- [ ] **Step 3: Modificar `enviarPedido` para soportar domicilio**

Reemplazar la función `enviarPedido` existente con:

```tsx
const enviarPedido = async () => {
  if (!modoDomicilio && !mesaSeleccionada) return alert('Selecciona una mesa primero');
  if (modoDomicilio && !domicilioData) return alert('Completa los datos del domicilio');
  if (carrito.length === 0) return alert('El carrito está vacío');
  try {
    const token = localStorage.getItem('token');
    const body = modoDomicilio
      ? {
          tipo: 'domicilio',
          ...domicilioData,
          productos: carrito,
          observaciones: '',
        }
      : {
          tipo: 'mesa',
          mesa_id: mesaSeleccionada.id,
          productos: carrito,
          observaciones: '',
        };
    await axios.post(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/pedidos`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(modoDomicilio ? '¡Domicilio enviado a cocina!' : '¡Comanda enviada a cocina!');
    setCarrito([]);
    setMesaSeleccionada(null);
    setDomicilioData(null);
    cargarDatos();
  } catch {
    alert('Error al enviar el pedido');
  }
};
```

- [ ] **Step 4: Agregar botón de modo y formulario en el JSX**

Localizar la sección donde se muestra la selección de mesa (buscar `"Selecciona una mesa"` o similar) y agregar antes de ella:

```tsx
{/* Toggle mesa / domicilio */}
<div className="flex gap-2 mb-4">
  <button
    onClick={() => { setModoDomicilio(false); setDomicilioData(null); }}
    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
      !modoDomicilio
        ? 'bg-orange-500 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    Mesa
  </button>
  <button
    onClick={() => { setModoDomicilio(true); setMesaSeleccionada(null); }}
    className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
      modoDomicilio
        ? 'bg-orange-500 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    <Bike size={16} /> Domicilio
  </button>
</div>
```

Y envolver la sección de selección de mesa con un condicional:

```tsx
{!modoDomicilio ? (
  /* ... sección existente de selección de mesa ... */
) : (
  <FormularioDomicilio
    token={localStorage.getItem('token') ?? ''}
    onChange={setDomicilioData}
  />
)}
```

- [ ] **Step 5: Verificar TypeScript**

```powershell
cd client
node node_modules/typescript/bin/tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 6: Verificar en navegador**

Abrir `http://localhost:5173/mesero` (o la ruta del mesero). Debe verse:
- Dos botones: "Mesa" y "Domicilio" en la parte superior del panel
- Al pulsar "Domicilio" aparece el formulario de búsqueda de cliente

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/Mesero.tsx
git commit -m "feat(ui): add domicilio mode to Mesero screen"
```

---

## Task 10: Caja — soporte domicilio

**Files:**
- Modify: `client/src/pages/Caja.tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `client/src/pages/Caja.tsx` completo para entender la estructura.

- [ ] **Step 2: Agregar imports**

```tsx
import { FormularioDomicilio } from '../components/FormularioDomicilio';
import { Bike, MapPin, Navigation } from 'lucide-react';
```

- [ ] **Step 3: Agregar estados**

```tsx
const [modoDomicilio, setModoDomicilio] = useState(false);
const [domicilioData, setDomicilioData] = useState<any>(null);
const [empleados, setEmpleados] = useState<any[]>([]);
```

- [ ] **Step 4: Cargar empleados en `cargarDatos`**

Dentro de la función `cargarDatos`, agregar la llamada para cargar empleados:

```tsx
const empleadosRes = await axios.get(
  `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/administrativo/empleados`,
  { headers }
);
setEmpleados(empleadosRes.data.data ?? empleadosRes.data);
```

- [ ] **Step 5: Agregar función de creación de domicilio desde caja**

```tsx
const crearDomicilioDesdeCaja = async () => {
  if (!domicilioData) return alert('Completa los datos del domicilio');
  if (carrito.length === 0) return alert('El carrito está vacío');
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/pedidos`,
      { tipo: 'domicilio', ...domicilioData, productos: carrito, observaciones: '' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert('¡Domicilio enviado a cocina!');
    setDomicilioData(null);
    setCarrito([]);
    cargarDatos();
  } catch {
    alert('Error al crear el domicilio');
  }
};
```

- [ ] **Step 6: Agregar función para actualizar estado de domicilio**

```tsx
const actualizarEstadoDomicilio = async (pedidoId: number, estadoDomicilio: string, entregadoPor?: number) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/pedidos/${pedidoId}/estado-domicilio`,
      { estado_domicilio: estadoDomicilio, entregado_por: entregadoPor },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    cargarDatos();
  } catch {
    alert('Error actualizando estado');
  }
};
```

- [ ] **Step 7: Mostrar etiqueta DOMICILIO en la lista de pedidos pendientes**

En el JSX donde se renderizan las tarjetas de pedido (lista izquierda), agregar junto al número de mesa:

```tsx
{pedido.tipo === 'domicilio' && (
  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
    <Bike size={12} /> DOMICILIO
  </span>
)}
```

- [ ] **Step 8: Mostrar datos de entrega en el detalle del pedido**

En el panel derecho (detalle del pedido seleccionado), agregar después de los productos:

```tsx
{pedidoSeleccionado?.tipo === 'domicilio' && (
  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
    <p className="text-xs font-semibold text-amber-700 uppercase">Datos de entrega</p>
    <p className="text-sm flex items-center gap-2">
      <span className="font-medium">{pedidoSeleccionado.cliente_nombre}</span>
      <span className="text-gray-500">{pedidoSeleccionado.cliente_telefono}</span>
    </p>
    <p className="text-sm flex items-center gap-1 text-gray-600">
      <MapPin size={14} /> {pedidoSeleccionado.direccion_entrega}
    </p>
    {pedidoSeleccionado.costo_domicilio > 0 && (
      <p className="text-xs text-gray-500">Costo envío: ${pedidoSeleccionado.costo_domicilio.toLocaleString()}</p>
    )}
    {/* Botón En camino */}
    {pedidoSeleccionado.estado_domicilio === 'pendiente' && pedidoSeleccionado.estado === 'listo' && (
      <div className="mt-2">
        <select
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2"
          onChange={e => {
            if (e.target.value) actualizarEstadoDomicilio(pedidoSeleccionado.id, 'en_camino', Number(e.target.value));
          }}
          defaultValue=""
        >
          <option value="" disabled>Seleccionar quien entrega...</option>
          {empleados.map((emp: any) => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </select>
      </div>
    )}
    {/* Botón Entregado */}
    {pedidoSeleccionado.estado_domicilio === 'en_camino' && (
      <button
        onClick={() => actualizarEstadoDomicilio(pedidoSeleccionado.id, 'entregado')}
        className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
      >
        <Navigation size={16} /> Confirmar entregado
      </button>
    )}
  </div>
)}
```

- [ ] **Step 9: Agregar opción "contra entrega" en el selector de pago**

En el JSX del selector de método de pago, agregar la opción:

```tsx
<option value="contra_entrega">Contra entrega</option>
```

- [ ] **Step 10: Agregar sección para crear domicilio desde caja**

Agregar un botón o sección colapsable en la caja para crear pedidos domicilio. Agregar en la parte superior de la columna izquierda:

```tsx
<button
  onClick={() => setModoDomicilio(!modoDomicilio)}
  className="w-full mb-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
>
  <Bike size={16} /> {modoDomicilio ? 'Cancelar domicilio' : 'Nuevo domicilio'}
</button>

{modoDomicilio && (
  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
    <FormularioDomicilio
      token={localStorage.getItem('token') ?? ''}
      onChange={setDomicilioData}
    />
    {/* Aquí iría la selección de productos - reutilizar el modal o sección de menú existente */}
    <button
      onClick={crearDomicilioDesdeCaja}
      disabled={!domicilioData}
      className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg"
    >
      Enviar a cocina
    </button>
  </div>
)}
```

**Nota:** La sección de carrito/productos para domicilio desde caja debe reutilizar el mecanismo existente de la caja para seleccionar productos. Revisar cómo el archivo actual gestiona el carrito y conectarlo.

- [ ] **Step 11: Verificar TypeScript**

```powershell
cd client
node node_modules/typescript/bin/tsc --noEmit
```

- [ ] **Step 12: Verificar en navegador**

Abrir `http://localhost:5173/caja`. Verificar:
- Botón "Nuevo domicilio" visible
- Los pedidos con tipo='domicilio' muestran la etiqueta DOMICILIO en amber
- El panel de detalle muestra dirección, cliente, botones de estado

- [ ] **Step 13: Commit**

```bash
git add client/src/pages/Caja.tsx
git commit -m "feat(ui): add domicilio support to Caja screen"
```

---

## Task 11: Cocina — etiqueta DOMICILIO

**Files:**
- Modify: `client/src/pages/Cocina.tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `client/src/pages/Cocina.tsx` para ubicar la tarjeta de comanda.

- [ ] **Step 2: Agregar etiqueta en la tarjeta**

En el JSX de la tarjeta de comanda, localizar donde se muestra el número de mesa (`mesa_numero` o similar) y agregar:

```tsx
import { Bike } from 'lucide-react';

// En la tarjeta, junto al número de mesa:
{pedido.tipo === 'domicilio' ? (
  <span className="flex items-center gap-1 text-amber-600 font-bold">
    <Bike size={16} /> DOMICILIO
    {pedido.cliente_nombre && <span className="font-normal text-gray-600 ml-1">— {pedido.cliente_nombre}</span>}
  </span>
) : (
  <span>Mesa {pedido.mesa_numero}</span>
)}
```

- [ ] **Step 3: Verificar en navegador**

Abrir `http://localhost:5173/cocina`. Al existir un pedido domicilio debe mostrar la etiqueta "DOMICILIO" en lugar del número de mesa.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Cocina.tsx
git commit -m "feat(ui): show DOMICILIO label in Cocina screen"
```

---

## Task 12: Admin Reportes — filtro por tipo

**Files:**
- Modify: `client/src/pages/Admin.tsx` (o el componente de reportes si está separado)

- [ ] **Step 1: Leer el archivo de reportes**

Leer `client/src/pages/Admin.tsx` para ubicar la sección de reportes y entender cómo se hace la llamada a `/api/reportes`.

- [ ] **Step 2: Agregar estado de filtro**

En el componente de reportes, agregar:

```tsx
const [filtroTipo, setFiltroTipo] = useState<'todos' | 'mesa' | 'domicilio'>('todos');
```

- [ ] **Step 3: Agregar selector de filtro en el JSX**

En la sección de reportes, agregar antes de las métricas:

```tsx
<div className="flex gap-2 mb-4">
  {(['todos', 'mesa', 'domicilio'] as const).map(t => (
    <button
      key={t}
      onClick={() => setFiltroTipo(t)}
      className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
        filtroTipo === t
          ? 'bg-orange-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {t === 'todos' ? 'Todos' : t === 'mesa' ? 'Mesas' : 'Domicilios'}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Filtrar los datos de ventas en el frontend**

Localizar donde se iteran los pedidos o ventas del reporte y agregar el filtro:

```tsx
const ventasFiltradas = ventas.filter((v: any) =>
  filtroTipo === 'todos' ? true : v.tipo === filtroTipo
);
```

Usar `ventasFiltradas` en lugar de `ventas` para renderizar las métricas.

- [ ] **Step 5: Verificar en navegador**

Abrir Admin → Reportes. Los tres botones de filtro deben aparecer y al seleccionar "Domicilios" solo mostrar pedidos de tipo domicilio.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Admin.tsx
git commit -m "feat(ui): add tipo filter to Admin reportes"
```

---

## Verificación final

- [ ] Servidor arranca sin errores: `npm run dev --prefix server`
- [ ] Cliente arranca sin errores: `npm run dev --prefix client`
- [ ] TypeScript sin errores: `node client/node_modules/typescript/bin/tsc --noEmit` (desde `client/`)
- [ ] Flujo completo: crear domicilio desde Mesero → aparece en Cocina con etiqueta → Caja lo ve y procesa pago
- [ ] Flujo desde Caja: crear domicilio, asignar entregador, confirmar entregado
- [ ] Historial: buscar cliente existente por teléfono en Mesero o Caja

```bash
git push origin claude/hardcore-lalande-f08ea7
```
