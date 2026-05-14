-- Base de datos para La Butaca Restaurante

USE `defaultdb`;

-- 1. usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('admin', 'mesero', 'cocina', 'cajero') NOT NULL,
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. mesas
CREATE TABLE IF NOT EXISTS `mesas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero` INT NOT NULL UNIQUE,
  `capacidad` INT DEFAULT 4,
  `estado` ENUM('disponible', 'ocupada', 'reservada') DEFAULT 'disponible',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. categorias
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. productos
CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `categoria_id` INT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10,2) NOT NULL,
  `disponible` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE RESTRICT
);

-- 5. pedidos
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mesa_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `estado` ENUM('pendiente', 'en_cocina', 'listo', 'entregado', 'pagado', 'cancelado') DEFAULT 'pendiente',
  `total` DECIMAL(12,2) DEFAULT 0.00,
  `observaciones` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`mesa_id`) REFERENCES `mesas`(`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
);

-- 6. pedido_detalle
CREATE TABLE IF NOT EXISTS `pedido_detalle` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pedido_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `observaciones` TEXT,
  FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
);

-- 7. pagos
CREATE TABLE IF NOT EXISTS `pagos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pedido_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `monto` DECIMAL(12,2) NOT NULL,
  `metodo_pago` ENUM('efectivo', 'transferencia', 'nequi', 'daviplata') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
);

-- 8. empleados
CREATE TABLE IF NOT EXISTS `empleados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `documento` VARCHAR(30) NOT NULL UNIQUE,
  `cargo` VARCHAR(80) NOT NULL,
  `salario_base` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fecha_ingreso` DATE NOT NULL,
  `telefono` VARCHAR(20),
  `direccion` VARCHAR(255),
  `fecha_nacimiento` DATE,
  `banco` VARCHAR(80),
  `cuenta_bancaria` VARCHAR(30),
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. egresos
CREATE TABLE IF NOT EXISTS `egresos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `concepto` VARCHAR(255) NOT NULL,
  `monto` DECIMAL(12,2) NOT NULL,
  `categoria` ENUM('nomina', 'insumos', 'servicios', 'mantenimiento', 'otros') NOT NULL DEFAULT 'otros',
  `empleado_id` INT DEFAULT NULL,
  `usuario_id` INT NOT NULL,
  `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
);

-- 10. insumos
CREATE TABLE IF NOT EXISTS `insumos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `unidad_medida` VARCHAR(30) NOT NULL,
  `stock_actual` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  `stock_minimo` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  `precio_compra` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. configuracion
CREATE TABLE IF NOT EXISTS `configuracion` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clave` VARCHAR(100) NOT NULL UNIQUE,
  `valor` TEXT NOT NULL
);

-- SEEDERS --

-- Usuario Admin ('butaca2024' encriptado con bcrypt)
INSERT INTO `usuarios` (`nombre`, `email`, `password`, `rol`)
VALUES ('Administrador', 'admin@labutaca.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin');

-- Mesas iniciales
INSERT INTO `mesas` (`numero`, `capacidad`) VALUES
(1, 4), (2, 4), (3, 4), (4, 4), (5, 6), (6, 6), (7, 2), (8, 2);

-- Categorias
INSERT INTO `categorias` (`id`, `nombre`) VALUES
(1, 'Carnes'),
(2, 'Pataconazos'),
(3, 'Hamburguesas'),
(4, 'Crepes'),
(5, 'Burritos y Tacos'),
(6, 'Perros y Picadas'),
(7, 'Bebidas');

-- Productos
INSERT INTO `productos` (`categoria_id`, `nombre`, `precio`) VALUES
-- Carnes
(1, 'Picada Sanjuanera', 55000),
(1, 'Butaca Entre Dos', 32000),
(1, 'Lomo de Cerdo Hawai', 20000),
(1, 'Lomo de Cerdo Criollo', 20000),
(1, 'Lomo de Cerdo', 18000),
(1, 'Pechuga de Pollo', 18000),
(1, 'Pechuga Mozzarella', 20000),
(1, 'Pechuga en Salsa de Champiñones', 20000),
(1, 'Alitas BBQ', 18000),
(1, 'Lomo de Res', 20000),
(1, 'Picada 4 Carnes Personal', 16500),
(1, 'Picada 4 Carnes Extra', 22500),
-- Pataconazos
(2, 'Patacon Mixto', 19000),
(2, 'Patacon Ranchero', 16500),
(2, 'Patacon Pizao', 15000),
(2, 'Patacon Mexicano', 15000),
(2, 'Patacolos', 11000),
-- Hamburguesas
(3, 'Tradicional', 11500),
(3, 'Butaca', 13500),
(3, 'Chorihamburguesa', 14500),
(3, 'Pollo Apanado', 14500),
(3, 'Hawai', 15000),
(3, 'Champiburguer', 15000),
(3, 'Italiana', 15000),
(3, 'Mexicana', 15000),
(3, 'Megahamburguesa', 17000),
(3, 'Mixta', 17000),
(3, 'Burguer XXL', 17000),
(3, 'Tortiburguer', 12000),
(3, 'Toxicosteña', 17000),
(3, 'Garoza Pepa Pig', 23000),
-- Crepes
(4, 'Ranchero', 15000),
(4, 'Pollo con Champiñones', 16000),
-- Burritos y Tacos
(5, 'Burritos Chingones x2', 18500),
(5, 'Burrito Criollo', 21500),
(5, 'Nachos de Jalisco', 14500),
(5, 'Papas Monstruosas', 17000),
(5, 'Taco Mexicano', 14000),
(5, 'Butataco', 13000),
(5, 'Quesadillas', 11500),
(5, 'Mazorcada', 18500),
(5, 'Mazorcada Extrema', 23500),
-- Perros y Picadas
(6, 'Picada Callejera', 25000),
(6, 'Picada de Suizo', 14500),
(6, 'Picada Mixta', 20000),
(6, 'Picada de Chorizo', 13000),
(6, 'Salchipapas', 11000),
(6, 'Perro Americano', 11000),
(6, 'Choriperro', 13000),
(6, 'Perro a la Butaca', 14000),
(6, 'Perro Mexicano', 12000),
-- Bebidas
(7, 'Granizados en Leche', 7000),
(7, 'Piña Colada', 8000),
(7, 'Ginger Personal', 5000),
(7, 'Gaseosa Personal Pet', 4500),
(7, 'Gaseosa Personal Vidrio', 4000),
(7, 'Jugo Hit Pet', 4000),
(7, 'Gaseosa Litro 1/4 Postobón', 8000),
(7, 'Gaseosa Litro 1/4 Coca Cola', 9000),
(7, 'Cerveza Michelada', 5500),
(7, 'Cerveza', 4500),
(7, 'Limonadas (Cerezada/Coco/Café)', 7500),
(7, 'Limonada', 5000),
(7, 'Agua en Botella', 3000),
(7, 'Sodas Italianas', 9000);

-- Configuracion basica
INSERT INTO `configuracion` (`clave`, `valor`) VALUES
('nombre_restaurante', 'La Butaca Restaurante'),
('direccion', 'Aipe, Huila, Colombia');
