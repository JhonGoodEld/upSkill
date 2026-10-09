USE upskill_crm;

-- =========================================================
-- ETAPA 2 - SCM (Semanas 4-6)
-- Migracion acumulativa sobre la base CRM existente.
-- =========================================================

CREATE TABLE IF NOT EXISTS proveedores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    direccion VARCHAR(255) NULL,
    estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NULL,
    INDEX idx_proveedores_nombre(nombre),
    INDEX idx_proveedores_estado(estado)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    categoria VARCHAR(100) NOT NULL,
    stock_actual INT UNSIGNED NOT NULL DEFAULT 0,
    stock_minimo INT UNSIGNED NOT NULL DEFAULT 0,
    proveedor_id INT UNSIGNED NULL,
    costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estrategia_logistica ENUM('PUSH','PULL') NOT NULL DEFAULT 'PULL',
    imagen VARCHAR(255) NULL,
    estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NULL,
    INDEX idx_productos_categoria(categoria),
    INDEX idx_productos_estrategia(estrategia_logistica),
    INDEX idx_productos_stock(stock_actual,stock_minimo),
    CONSTRAINT fk_productos_proveedor
      FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id INT UNSIGNED NOT NULL,
    tipo ENUM('entrada','salida') NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    motivo ENUM('venta','ajuste','reposición','compra','devolución','otro') NOT NULL DEFAULT 'otro',
    detalle VARCHAR(255) NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT UNSIGNED NOT NULL,
    pedido_id INT UNSIGNED NULL,
    INDEX idx_mov_producto_fecha(producto_id,fecha),
    INDEX idx_mov_tipo_fecha(tipo,fecha),
    INDEX idx_mov_usuario(usuario_id),
    CONSTRAINT fk_mov_producto
      FOREIGN KEY (producto_id) REFERENCES productos(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_mov_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(30) NOT NULL UNIQUE,
    producto_id INT UNSIGNED NOT NULL,
    proveedor_id INT UNSIGNED NULL,
    cantidad INT UNSIGNED NOT NULL,
    tipo ENUM('reposición','venta') NOT NULL,
    estado ENUM('pendiente','en_proceso','surtido','cancelado') NOT NULL DEFAULT 'pendiente',
    origen ENUM('manual','automatico_push') NOT NULL DEFAULT 'manual',
    notas VARCHAR(500) NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED NOT NULL,
    actualizado_en DATETIME NULL,
    INDEX idx_pedidos_estado(estado),
    INDEX idx_pedidos_producto(producto_id),
    INDEX idx_pedidos_fecha(fecha),
    CONSTRAINT fk_pedidos_producto
      FOREIGN KEY (producto_id) REFERENCES productos(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_proveedor
      FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_usuario
      FOREIGN KEY (creado_por) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

ALTER TABLE movimientos_inventario
  ADD CONSTRAINT fk_mov_pedido
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS scm_configuracion (
    id TINYINT UNSIGNED PRIMARY KEY,
    nivel_scm ENUM('Inicial','En desarrollo','Optimizado') NOT NULL DEFAULT 'Inicial',
    descripcion VARCHAR(500) NULL,
    actualizado_por INT UNSIGNED NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_scm_config_usuario
      FOREIGN KEY (actualizado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO scm_configuracion(id,nivel_scm,descripcion)
VALUES (1,'Inicial','Procesos básicos de productos, proveedores e inventario.')
ON DUPLICATE KEY UPDATE id=id;

-- Vista de inventario: evita duplicar stock en una tabla separada.
-- El PDF pide Inventario como entidad mínima, mientras que el modelo Producto
-- ya contiene stock_actual y stock_minimo; esta vista ofrece la entidad Inventario
-- sin introducir datos redundantes.
CREATE OR REPLACE VIEW inventario AS
SELECT
  p.id AS producto_id,
  p.nombre AS producto,
  p.categoria,
  p.stock_actual,
  p.stock_minimo,
  CASE WHEN p.stock_actual <= p.stock_minimo THEN 'Stock bajo' ELSE 'Normal' END AS estado_stock,
  p.estrategia_logistica,
  p.proveedor_id
FROM productos p
WHERE p.estado='activo';

-- Datos demo del diagrama, insertados solo si no existen.
INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'Artesanía del Sur','Juan Pérez','juan@sur.com','5512345678','México'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='juan@sur.com');
INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'Textiles Oaxaca','María López','maria@oax.com','5587654321','Oaxaca'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='maria@oax.com');
INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'Barro y Tradición','Carlos Ruiz','carlos@barro.com','5522223333','Puebla'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='carlos@barro.com');

INSERT INTO productos(nombre,descripcion,categoria,stock_actual,stock_minimo,proveedor_id,costo_unitario,estrategia_logistica)
SELECT 'Vasija de barro','Pieza artesanal de barro','Cerámica',25,10,(SELECT id FROM proveedores WHERE correo='juan@sur.com' LIMIT 1),180.00,'PUSH'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Vasija de barro');
INSERT INTO productos(nombre,descripcion,categoria,stock_actual,stock_minimo,proveedor_id,costo_unitario,estrategia_logistica)
SELECT 'Textil bordado','Textil artesanal bordado','Textil',12,10,(SELECT id FROM proveedores WHERE correo='maria@oax.com' LIMIT 1),250.00,'PULL'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Textil bordado');
INSERT INTO productos(nombre,descripcion,categoria,stock_actual,stock_minimo,proveedor_id,costo_unitario,estrategia_logistica)
SELECT 'Alebrije','Figura artesanal decorativa','Decoración',8,5,(SELECT id FROM proveedores WHERE correo='carlos@barro.com' LIMIT 1),320.00,'PUSH'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Alebrije');
INSERT INTO productos(nombre,descripcion,categoria,stock_actual,stock_minimo,proveedor_id,costo_unitario,estrategia_logistica)
SELECT 'Collar artesanal','Collar artesanal','Joyería',30,15,(SELECT id FROM proveedores WHERE correo='juan@sur.com' LIMIT 1),150.00,'PULL'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Collar artesanal');
INSERT INTO productos(nombre,descripcion,categoria,stock_actual,stock_minimo,proveedor_id,costo_unitario,estrategia_logistica)
SELECT 'Figura de barro','Figura decorativa de barro','Cerámica',6,10,(SELECT id FROM proveedores WHERE correo='juan@sur.com' LIMIT 1),140.00,'PUSH'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre='Figura de barro');
