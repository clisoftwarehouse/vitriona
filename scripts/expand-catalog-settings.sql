-- Expand catalog_settings with new customization columns
ALTER TABLE catalog_settings
  ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS surface_color text DEFAULT '#f9fafb',
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS rounded_corners boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS grid_columns integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS announcement_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS announcement_text text,
  ADD COLUMN IF NOT EXISTS announcement_bg_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS announcement_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS hero_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS hero_badge_text text,
  ADD COLUMN IF NOT EXISTS hero_cta_primary_text text DEFAULT 'Ver productos',
  ADD COLUMN IF NOT EXISTS hero_cta_primary_link text,
  ADD COLUMN IF NOT EXISTS hero_cta_secondary_text text,
  ADD COLUMN IF NOT EXISTS hero_cta_secondary_link text,
  ADD COLUMN IF NOT EXISTS hero_style text DEFAULT 'centered',
  ADD COLUMN IF NOT EXISTS featured_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured_title text DEFAULT 'Productos destacados',
  ADD COLUMN IF NOT EXISTS categories_style text DEFAULT 'tabs',
  ADD COLUMN IF NOT EXISTS about_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS about_image_url text,
  ADD COLUMN IF NOT EXISTS social_links jsonb,
  ADD COLUMN IF NOT EXISTS og_image_url text;

-- Update font enum to include new options (recreate check constraint)
ALTER TABLE catalog_settings DROP CONSTRAINT IF EXISTS catalog_settings_font_check;
ALTER TABLE catalog_settings ADD CONSTRAINT catalog_settings_font_check
  CHECK (font IN ('inter', 'playfair', 'dm-sans', 'poppins', 'roboto', 'space-grotesk', 'outfit'));

-- Add check for new enums
ALTER TABLE catalog_settings DROP CONSTRAINT IF EXISTS catalog_settings_card_style_check;
ALTER TABLE catalog_settings ADD CONSTRAINT catalog_settings_card_style_check
  CHECK (card_style IN ('default', 'minimal', 'bordered', 'shadow'));

ALTER TABLE catalog_settings DROP CONSTRAINT IF EXISTS catalog_settings_hero_style_check;
ALTER TABLE catalog_settings ADD CONSTRAINT catalog_settings_hero_style_check
  CHECK (hero_style IN ('centered', 'split', 'banner', 'minimal'));

ALTER TABLE catalog_settings DROP CONSTRAINT IF EXISTS catalog_settings_categories_style_check;
ALTER TABLE catalog_settings ADD CONSTRAINT catalog_settings_categories_style_check
  CHECK (categories_style IN ('tabs', 'pills', 'cards'));
