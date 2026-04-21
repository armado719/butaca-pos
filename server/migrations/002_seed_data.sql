-- Migración 002: Datos iniciales

-- Usuario admin (password: butaca2024)
INSERT IGNORE INTO `usuarios` (`nombre`, `email`, `password`, `rol`)
VALUES ('Administrador', 'admin@labutaca.com',
        '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin');

-- Mesas
INSERT IGNORE INTO `mesas` (`numero`, `capacidad`) VALUES
(1,4),(2,4),(3,4),(4,4),(5,6),(6,6),(7,2),(8,2);

-- Categorías
INSERT IGNORE INTO `categorias` (`id`, `nombre`) VALUES
(1,'Carnes'),(2,'Pataconazos'),(3,'Hamburguesas'),
(4,'Crepes'),(5,'Burritos y Tacos'),(6,'Perros y Picadas'),(7,'Bebidas');

-- Productos
INSERT IGNORE INTO `productos` (`categoria_id`, `nombre`, `precio`) VALUES
(1,'Picada Sanjuanera',55000),(1,'Butaca Entre Dos',32000),
(1,'Lomo de Cerdo Hawai',20000),(1,'Lomo de Cerdo Criollo',20000),
(1,'Lomo de Cerdo',18000),(1,'Pechuga de Pollo',18000),
(1,'Pechuga Mozzarella',20000),(1,'Pechuga en Salsa de Champiñones',20000),
(1,'Alitas BBQ',18000),(1,'Lomo de Res',20000),
(1,'Picada 4 Carnes Personal',16500),(1,'Picada 4 Carnes Extra',22500),
(2,'Patacon Mixto',19000),(2,'Patacon Ranchero',16500),(2,'Patacon Pizao',15000),
(2,'Patacon Mexicano',15000),(2,'Patacolos',11000),
(3,'Tradicional',11500),(3,'Butaca',13500),(3,'Chorihamburguesa',14500),
(3,'Pollo Apanado',14500),(3,'Hawai',15000),(3,'Champiburguer',15000),
(3,'Italiana',15000),(3,'Mexicana',15000),(3,'Megahamburguesa',17000),
(3,'Mixta',17000),(3,'Burguer XXL',17000),(3,'Tortiburguer',12000),
(3,'Toxicosteña',17000),(3,'Garoza Pepa Pig',23000),
(4,'Ranchero',15000),(4,'Pollo con Champiñones',16000),
(5,'Burritos Chingones x2',18500),(5,'Burrito Criollo',21500),
(5,'Nachos de Jalisco',14500),(5,'Papas Monstruosas',17000),
(5,'Taco Mexicano',14000),(5,'Butataco',13000),(5,'Quesadillas',11500),
(5,'Mazorcada',18500),(5,'Mazorcada Extrema',23500),
(6,'Picada Callejera',25000),(6,'Picada de Suizo',14500),
(6,'Picada Mixta',20000),(6,'Picada de Chorizo',13000),
(6,'Salchipapas',11000),(6,'Perro Americano',11000),(6,'Choriperro',13000),
(6,'Perro a la Butaca',14000),(6,'Perro Mexicano',12000),
(7,'Granizados en Leche',7000),(7,'Piña Colada',8000),(7,'Ginger Personal',5000),
(7,'Gaseosa Personal Pet',4500),(7,'Gaseosa Personal Vidrio',4000),
(7,'Jugo Hit Pet',4000),(7,'Gaseosa Litro 1/4 Postobón',8000),
(7,'Gaseosa Litro 1/4 Coca Cola',9000),(7,'Cerveza Michelada',5500),
(7,'Cerveza',4500),(7,'Limonadas (Cerezada/Coco/Café)',7500),
(7,'Limonada',5000),(7,'Agua en Botella',3000),(7,'Sodas Italianas',9000);

-- Configuración
INSERT IGNORE INTO `configuracion` (`clave`, `valor`) VALUES
('nombre_restaurante','La Butaca Restaurante'),
('direccion','Aipe, Huila, Colombia');
