CREATE TABLE IF NOT EXISTS customer_shop_logins (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  shop_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_shop_logins_customer ON customer_shop_logins(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_shop_logins_shop ON customer_shop_logins(shop_id);
