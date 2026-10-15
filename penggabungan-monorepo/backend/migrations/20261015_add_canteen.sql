-- Kantin terintegrasi: jalankan setelah backup database yang sudah ada.
-- Skema aman dijalankan ulang; seed sample hanya menambah baris yang belum ada.
CREATE TABLE IF NOT EXISTS canteen_stands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stand_id INT NOT NULL,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_canteen_users_stand FOREIGN KEY (stand_id) REFERENCES canteen_stands(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stand_id INT NOT NULL,
  name VARCHAR(140) NOT NULL,
  description VARCHAR(500) NULL,
  category ENUM('food','drink') NOT NULL,
  price INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_canteen_menu_stand (stand_id, is_available, sort_order),
  CONSTRAINT fk_canteen_menu_stand FOREIGN KEY (stand_id) REFERENCES canteen_stands(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  stand_id INT NOT NULL,
  buyer_name VARCHAR(120) NOT NULL,
  buyer_class VARCHAR(60) NOT NULL,
  fulfillment ENUM('delivery','pickup') NOT NULL,
  subtotal INT UNSIGNED NOT NULL,
  delivery_fee INT UNSIGNED NOT NULL DEFAULT 0,
  total INT UNSIGNED NOT NULL,
  status ENUM('awaiting_payment','received','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'awaiting_payment',
  payment_status ENUM('pending','paid','failed','expired','refunded') NOT NULL DEFAULT 'pending',
  buyer_token_hash CHAR(64) NOT NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_canteen_orders_seller (stand_id, payment_status, status, created_at),
  CONSTRAINT fk_canteen_orders_stand FOREIGN KEY (stand_id) REFERENCES canteen_stands(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  menu_item_id INT NULL,
  item_name VARCHAR(140) NOT NULL,
  unit_price INT UNSIGNED NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  line_total INT UNSIGNED NOT NULL,
  CONSTRAINT fk_canteen_order_items_order FOREIGN KEY (order_id) REFERENCES canteen_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_canteen_order_items_menu FOREIGN KEY (menu_item_id) REFERENCES canteen_menu_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  provider VARCHAR(40) NOT NULL DEFAULT 'midtrans_snap',
  transaction_id VARCHAR(120) NULL,
  snap_token VARCHAR(255) NULL,
  redirect_url VARCHAR(1000) NULL,
  provider_status VARCHAR(60) NULL,
  amount INT UNSIGNED NOT NULL,
  raw_notification JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_canteen_payments_order FOREIGN KEY (order_id) REFERENCES canteen_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_payment_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  event_key VARCHAR(160) NOT NULL UNIQUE,
  provider_status VARCHAR(60) NOT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_canteen_payment_events_order (order_id),
  CONSTRAINT fk_canteen_payment_events_order FOREIGN KEY (order_id) REFERENCES canteen_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO canteen_stands (slug, name, description, image_url)
VALUES ('kang-asep', 'Stand Kang Asep', 'Menu makanan dan minuman pilihan untuk warga sekolah.', '/images/kantin-sekolah.svg')
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);

INSERT INTO canteen_menu_items (stand_id, name, description, category, price, sort_order)
SELECT s.id, seed.name, seed.description, seed.category, seed.price, seed.sort_order
FROM canteen_stands s
CROSS JOIN (
  SELECT 'Nasi Goreng Kang Asep' AS name, 'Nasi goreng hangat dengan telur.' AS description, 'food' AS category, 15000 AS price, 1 AS sort_order UNION ALL
  SELECT 'Ayam Geprek', 'Ayam geprek sambal, disajikan dengan nasi.', 'food', 18000, 2 UNION ALL
  SELECT 'Mie Goreng Spesial', 'Mie goreng dengan sayuran dan telur.', 'food', 13000, 3 UNION ALL
  SELECT 'Es Teh Manis', 'Teh manis dingin.', 'drink', 5000, 4 UNION ALL
  SELECT 'Es Jeruk', 'Jeruk segar dingin.', 'drink', 7000, 5 UNION ALL
  SELECT 'Air Mineral', 'Air mineral botol.', 'drink', 4000, 6
) AS seed
WHERE s.slug = 'kang-asep'
  AND NOT EXISTS (SELECT 1 FROM canteen_menu_items m WHERE m.stand_id = s.id AND m.name = seed.name);
