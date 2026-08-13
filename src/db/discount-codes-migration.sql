-- Run once on an existing database before using the new discount-code features.
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'percentage';
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS value INTEGER NOT NULL DEFAULT 0;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE discount_codes ALTER COLUMN percentage SET DEFAULT 0;
UPDATE discount_codes
SET value = percentage, type = 'percentage'
WHERE value = 0 AND percentage > 0;
