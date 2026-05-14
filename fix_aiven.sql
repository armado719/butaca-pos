USE defaultdb;

-- Migración 003: tablas admin
CREATE TABLE IF NOT EXISTS `empleados` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`          VARCHAR(100) NOT NULL,
  `documento`       VARCHAR(30)  NOT NULL UNIQUE,
  `cargo`           VARCHAR(80)  NOT NULL,
  `salario_base`    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fecha_ingreso`   DATE NOT NULL,
  `telefono`        VARCHAR(20),
  `direccion`       VARCHAR(255),
  `fecha_nacimiento` DATE,
  `banco`           VARCHAR(80),
  `cuenta_bancaria` VARCHAR(30),
  `activo`          BOOLEAN DEFAULT TRUE,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `egresos` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `concepto`    VARCHAR(255) NOT NULL,
  `monto`       DECIMAL(12,2) NOT NULL,
  `categoria`   ENUM('nomina','insumos','servicios','mantenimiento','otros') NOT NULL DEFAULT 'otros',
  `empleado_id` INT DEFAULT NULL,
  `usuario_id`  INT NOT NULL,
  `fecha`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`usuario_id`)  REFERENCES `usuarios`(`id`)
);

CREATE TABLE IF NOT EXISTS `insumos` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`        VARCHAR(150) NOT NULL,
  `unidad_medida` VARCHAR(30)  NOT NULL,
  `stock_actual`  DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  `stock_minimo`  DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  `precio_compra` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migración 004: clientes y columnas en pedidos
CREATE TABLE IF NOT EXISTS `clientes` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`     VARCHAR(100) NOT NULL,
  `telefono`   VARCHAR(20)  NOT NULL,
  `direccion`  TEXT         NOT NULL,
  `notas`      TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_telefono` (`telefono`)
);

-- Hacer mesa_id nullable
ALTER TABLE `pedidos` MODIFY COLUMN `mesa_id` INT NULL;

-- Agregar columnas nuevas (ignorar si ya existen)
ALTER TABLE `pedidos`
  ADD COLUMN IF NOT EXISTS `tipo`              ENUM('mesa','domicilio') NOT NULL DEFAULT 'mesa' AFTER `id`,
  ADD COLUMN IF NOT EXISTS `cliente_id`        INT          NULL AFTER `tipo`,
  ADD COLUMN IF NOT EXISTS `direccion_entrega` TEXT         NULL AFTER `cliente_id`,
  ADD COLUMN IF NOT EXISTS `costo_domicilio`   DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `direccion_entrega`,
  ADD COLUMN IF NOT EXISTS `estado_domicilio`  ENUM('pendiente','en_camino','entregado') NULL AFTER `costo_domicilio`,
  ADD COLUMN IF NOT EXISTS `entregado_por`     INT          NULL AFTER `estado_domicilio`;

-- Foreign keys (pueden fallar si ya existen, no importa)
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedido_cliente`  FOREIGN KEY (`cliente_id`)   REFERENCES `clientes`(`id`),
  ADD CONSTRAINT `fk_pedido_empleado` FOREIGN KEY (`entregado_por`) REFERENCES `usuarios`(`id`);
