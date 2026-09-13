ALTER TABLE shops ADD COLUMN IF NOT EXISTS secondary_slug VARCHAR(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS banner_mobile_image TEXT;
ALTER TABLE slider_banners ADD COLUMN IF NOT EXISTS mobile_image TEXT;
ALTER TABLE bottom_banners ADD COLUMN IF NOT EXISTS mobile_image TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS shops_secondary_slug_unique
  ON shops (secondary_slug) WHERE secondary_slug IS NOT NULL;
