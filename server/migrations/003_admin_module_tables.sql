-- Migración 003: Tablas del módulo administrativo

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
