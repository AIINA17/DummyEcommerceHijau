-- Skema TokoKu (Neon Postgres)
-- Jalankan lewat: npm run db:setup

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  avatar_url  TEXT,
  balance     BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  price            BIGINT NOT NULL CHECK (price >= 0),
  category         TEXT NOT NULL,
  rating           NUMERIC(2,1) NOT NULL DEFAULT 0,
  stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url        TEXT,
  -- Kata pencarian yang tidak ada di nama produk ("laptop" untuk "Acer Nitro").
  -- Dipisah dari description supaya tidak ikut terbaca user di halaman produk.
  keywords         TEXT NOT NULL DEFAULT '',
  sold             INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
  shop_name        TEXT NOT NULL DEFAULT 'TokoKu Official',
  shop_city        TEXT NOT NULL DEFAULT 'Jakarta Pusat',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrasi untuk database yang tabelnya sudah terlanjur dibuat sebelum kolom
-- ini ada: CREATE TABLE IF NOT EXISTS di atas tidak akan menambahkannya.
ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_price_idx ON products (price);

CREATE TABLE IF NOT EXISTS cart (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL DEFAULT 'UNSELECTED',
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid', 'cancelled')),
  total          BIGINT NOT NULL CHECK (total >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id                SERIAL PRIMARY KEY,
  order_id          INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id        INTEGER NOT NULL REFERENCES products (id),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  -- Harga & nama disalin saat checkout: kalau produk berubah/dihapus nanti,
  -- riwayat pesanan tetap menunjukkan apa yang benar-benar dibeli.
  price_at_purchase BIGINT NOT NULL,
  name_snapshot     TEXT NOT NULL,
  image_snapshot    TEXT
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
