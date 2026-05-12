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
  ADD CONSTRAINT `fk_pedido_empleado` FOREIGN KEY (`entregado_por`) REFERENCES `usuarios`(`id`);
