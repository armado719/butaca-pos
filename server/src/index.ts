import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import mesasRoutes from './routes/mesas';
import productosRoutes from './routes/productos';
import pedidosRoutes from './routes/pedidos';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuración de Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Inyectar io en las request para usarlo en los controladores
app.use((req, res, next) => {
  (req as any).io = io;
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);

app.get('/', (req, res) => {
  res.send('API La Butaca Restaurante funcionando correctamente.');
});

// Eventos de Socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
