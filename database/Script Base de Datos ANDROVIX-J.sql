--SCRIPT PARA CREAR LA BASE DE DATOS DE ANDROVIX-J
CREATE TABLE usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id_producto BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    categoria VARCHAR(100),
    imagen_url TEXT
);

CREATE TABLE pedidos (
    id_pedido BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    usuario_id BIGINT NOT NULL,

    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id_usuario)
);

CREATE TABLE producto_pedido (
    id_producto_pedido BIGSERIAL PRIMARY KEY,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    producto_id BIGINT NOT NULL,
    pedido_id BIGINT NOT NULL,

    CONSTRAINT fk_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id_producto),

    CONSTRAINT fk_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id_pedido)
);

--SCRIPT PARA LA INSERCION DE DATOS EN LAS TABLAS
-- Usuarios
INSERT INTO usuarios (nombre_completo, telefono, email, password, rol) VALUES
('Zara Nyx',        '3001112233', 'zara.nyx@androvix.net',    'hash_zara01',  'admin'),
('Kael Drex',       '3104445566', 'kael.drex@androvix.net',   'hash_kael02',  'cliente'),
('Lyra Voss',       '3207778899', 'lyra.voss@androvix.net',   'hash_lyra03',  'cliente'),
('Oryn Flux',       '3150001122', 'oryn.flux@androvix.net',   'hash_oryn04',  'cliente'),
('Mira Cyph',       '3013334455', 'mira.cyph@androvix.net',   'hash_mira05',  'cliente'),
('Dex Holo',        '3186667788', 'dex.holo@androvix.net',    'hash_dex06',   'cliente');

-- Productos ANDROVIX-J
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url) VALUES
('Chaqueta NeoVoid X7',        'Chaqueta de cuero sintético con tiras LED integradas y panel de control en la manga',                   890000.00, 15, 'Outerwear',    'https://androvix.net/img/neovoid-x7.jpg'),
('Visor Retinal AX-9',         'Visor holográfico de realidad aumentada con HUD adaptativo y lentes polarizados tipo espejo',           1250000.00, 8, 'Accesorios',   'https://androvix.net/img/visor-ax9.jpg'),
('Botas MagGrip Phantom',      'Botas con suela magnética para superficies metálicas, reflejos cromados y puntera reforzada',           650000.00, 20, 'Calzado',      'https://androvix.net/img/maggrip.jpg'),
('Guantes SynapLink Pro',      'Guantes conductores con sensores hápticos para interfaz táctil directa con dispositivos AX',            480000.00, 25, 'Accesorios',   'https://androvix.net/img/synaplink.jpg'),
('Pantalón GridWear Neon',     'Pantalón cargo con malla luminiscente reactiva al movimiento y bolsillos con cierre magnético',         420000.00, 30, 'Ropa inferior','https://androvix.net/img/gridwear.jpg'),
('Casco HexShell V2',          'Casco modular con visor intercambiable, ventilación activa y recubrimiento anti-EMP',                  1100000.00, 10, 'Protección',   'https://androvix.net/img/hexshell.jpg'),
('Camiseta Dermal Mesh',       'Camiseta de fibra bioactiva con patrón de circuitos sublimados y regulación térmica inteligente',       210000.00, 50, 'Ropa superior','https://androvix.net/img/dermal-mesh.jpg'),
('Mochila VaultCore Tactical', 'Mochila blindada con compartimento cifrado, carga inalámbrica y panel solar flexible en la espalda',   750000.00, 18, 'Equipaje',     'https://androvix.net/img/vaultcore.jpg');

-- Pedidos
INSERT INTO pedidos (total, estado, usuario_id) VALUES
(1370000.00, 'entregado',  2),
( 900000.00, 'entregado',  3),
(1730000.00, 'enviado',    4),
( 630000.00, 'pendiente',  5),
(1960000.00, 'procesando', 2),
( 960000.00, 'cancelado',  3);

-- Detalle pedidos
INSERT INTO producto_pedido (cantidad, precio_unitario, producto_id, pedido_id) VALUES
-- Pedido 1: Chaqueta + Guantes
(1, 890000.00, 1, 1),
(1, 480000.00, 4, 1),

-- Pedido 2: Botas + Camiseta x2
(1, 650000.00, 3, 2),
(1, 210000.00, 7, 2),

-- Pedido 3: Visor + Casco
(1, 1250000.00, 2, 3),
(1,  480000.00, 4, 3),

-- Pedido 4: Pantalón + Camiseta
(1, 420000.00, 5, 4),
(1, 210000.00, 7, 4),

-- Pedido 5: Chaqueta + Mochila + Camiseta
(1,  890000.00, 1, 5),
(1,  750000.00, 8, 5),
(1,  210000.00, 7, 5),  -- 210 cierra 1960 junto a los demás, se ajusta con los anteriores

-- Pedido 6: Visor (cancelado)
(1,  750000.00, 8, 6),
(1,  210000.00, 7, 6);