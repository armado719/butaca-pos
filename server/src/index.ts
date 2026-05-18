import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";

import authRoutes from "./routes/auth";
import mesasRoutes from "./routes/mesas";
import productosRoutes from "./routes/productos";
import pedidosRoutes from "./routes/pedidos";
import adminRoutes from "./routes/admin";
import reportesRoutes from "./routes/reportes";
import administrativoRoutes from "./routes/administrativo";
import clientesRoutes from "./routes/clientes";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./lib/logger";
import pool from "./db/connection";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = FRONTEND_URL.split(",").map((o) => o.trim());

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});

const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use((req, _res, next) => {
  (req as any).io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/mesas", mesasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/administrativo", administrativoRoutes);
app.use("/api/clientes", clientesRoutes);

app.get("/", (_req, res) => {
  res.send("API La Butaca Restaurante funcionando correctamente.");
});

// Endpoint temporal de migración — eliminar después de usarlo
app.get("/api/run-migrations", async (req, res) => {
  const secret = req.query.secret as string;
  if (secret !== process.env.SETUP_SECRET) {
    res.status(403).json({ msg: "No autorizado" });
    return;
  }
  const results: string[] = [];
  const run = async (label: string, sql: string) => {
    try {
      await pool.query(sql);
      results.push(`OK: ${label}`);
    } catch (e: any) {
      results.push(`SKIP: ${label} — ${e.message}`);
    }
  };

  await run(
    "crear clientes",
    `CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_telefono (telefono)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );

  await run(
    "crear empleados",
    `CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(30) NOT NULL UNIQUE,
    cargo VARCHAR(80) NOT NULL,
    salario_base DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    fecha_ingreso DATE NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    fecha_nacimiento DATE,
    banco VARCHAR(80),
    cuenta_bancaria VARCHAR(30),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );

  await run(
    "crear egresos",
    `CREATE TABLE IF NOT EXISTS egresos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    categoria ENUM('nomina','insumos','servicios','mantenimiento','otros') NOT NULL DEFAULT 'otros',
    empleado_id INT DEFAULT NULL,
    usuario_id INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );

  await run(
    "crear insumos",
    `CREATE TABLE IF NOT EXISTS insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL,
    stock_actual DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    stock_minimo DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );

  await run(
    "mesa_id nullable",
    `ALTER TABLE pedidos MODIFY COLUMN mesa_id INT NULL`,
  );
  await run(
    "add tipo",
    `ALTER TABLE pedidos ADD COLUMN tipo ENUM('mesa','domicilio') NOT NULL DEFAULT 'mesa' AFTER id`,
  );
  await run(
    "add cliente_id",
    `ALTER TABLE pedidos ADD COLUMN cliente_id INT NULL AFTER tipo`,
  );
  await run(
    "add direccion_entrega",
    `ALTER TABLE pedidos ADD COLUMN direccion_entrega TEXT NULL AFTER cliente_id`,
  );
  await run(
    "add costo_domicilio",
    `ALTER TABLE pedidos ADD COLUMN costo_domicilio DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER direccion_entrega`,
  );
  await run(
    "add estado_domicilio",
    `ALTER TABLE pedidos ADD COLUMN estado_domicilio ENUM('pendiente','en_camino','entregado') NULL AFTER costo_domicilio`,
  );
  await run(
    "add entregado_por",
    `ALTER TABLE pedidos ADD COLUMN entregado_por INT NULL AFTER estado_domicilio`,
  );

  res.json({ results });
});

// Endpoint temporal de seed — eliminar después de usarlo
app.get("/api/setup-seed", async (req, res) => {
  const secret = req.query.secret as string;
  if (secret !== process.env.SETUP_SECRET) {
    res.status(403).json({ msg: "No autorizado" });
    return;
  }
  try {
    const hash = await bcrypt.hash("admin123", 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ["Administrador", "admin@labutaca.com", hash, "admin"],
    );
    res.json({
      msg: "Usuario admin creado. Email: admin@labutaca.com / Pass: admin123",
    });
  } catch (e: any) {
    res.status(500).json({ msg: e.message });
  }
});

app.use(errorHandler);

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Cliente conectado");
  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Cliente desconectado");
  });
});

httpServer.listen(PORT, () => {
  logger.info({ port: PORT, origins: allowedOrigins }, "Servidor iniciado");
});
