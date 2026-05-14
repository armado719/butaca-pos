import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

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
