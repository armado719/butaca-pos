-- Migración 001: Schema inicial
CREATE DATABASE IF NOT EXISTS `butaca_pos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `butaca_pos`;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`     VARCHAR(100) NOT NULL,
  `email`      VARCHAR(100) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `rol`        ENUM('admin','mesero','cocina','cajero') NOT NULL,
  `activo`     BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `mesas` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `numero`     INT NOT NULL UNIQUE,
  `capacidad`  INT DEFAULT 4,
  `estado`     ENUM('disponible','ocupada','reservada') DEFAULT 'disponible',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `categorias` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`     VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `activo`     BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `productos` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `categoria_id` INT NOT NULL,
  `nombre`       VARCHAR(150) NOT NULL,
  `descripcion`  TEXT,
  `precio`       DECIMAL(10,2) NOT NULL,
  `disponible`   BOOLEAN DEFAULT TRUE,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS `pedidos` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `mesa_id`       INT NOT NULL,
  `usuario_id`    INT NOT NULL,
  `estado`        ENUM('pendiente','en_cocina','listo','entregado','pagado','cancelado') DEFAULT 'pendiente',
  `total`         DECIMAL(12,2) DEFAULT 0.00,
  `observaciones` TEXT,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`mesa_id`)    REFERENCES `mesas`(`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
);

CREATE TABLE IF NOT EXISTS `pedido_detalle` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `pedido_id`       INT NOT NULL,
  `producto_id`     INT NOT NULL,
  `cantidad`        INT NOT NULL DEFAULT 1,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal`        DECIMAL(12,2) NOT NULL,
  `observaciones`   TEXT,
  FOREIGN KEY (`pedido_id`)   REFERENCES `pedidos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
);

CREATE TABLE IF NOT EXISTS `pagos` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `pedido_id`   INT NOT NULL,
  `usuario_id`  INT NOT NULL,
  `monto`       DECIMAL(12,2) NOT NULL,
  `metodo_pago` ENUM('efectivo','transferencia','nequi','daviplata') NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pedido_id`)  REFERENCES `pedidos`(`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
);

CREATE TABLE IF NOT EXISTS `configuracion` (
  `id`    INT AUTO_INCREMENT PRIMARY KEY,
  `clave` VARCHAR(100) NOT NULL UNIQUE,
  `valor` TEXT NOT NULL
);

-- Índices para columnas de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_pedidos_estado      ON `pedidos`(`estado`);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at  ON `pedidos`(`created_at`);
CREATE INDEX IF NOT EXISTS idx_pagos_created_at    ON `pagos`(`created_at`);
CREATE INDEX IF NOT EXISTS idx_pedido_detalle_pid  ON `pedido_detalle`(`pedido_id`);
