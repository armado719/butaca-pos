import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import mesasRoutes from './routes/mesas';
import productosRoutes from './routes/productos';
import pedidosRoutes from './routes/pedidos';
import adminRoutes from './routes/admin';
import reportesRoutes from './routes/reportes';
import administrativoRoutes from './routes/administrativo';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = FRONTEND_URL.split(',').map((o) => o.trim());

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use((req, _res, next) => {
  (req as any).io = io;
  next();
});

app.use('/api/auth',           authRoutes);
app.use('/api/mesas',          mesasRoutes);
app.use('/api/productos',      productosRoutes);
app.use('/api/pedidos',        pedidosRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/reportes',       reportesRoutes);
app.use('/api/administrativo', administrativoRoutes);

app.get('/', (_req, res) => {
  res.send('API La Butaca Restaurante funcionando correctamente.');
});

// Debe ir después de todas las rutas
app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
