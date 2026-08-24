-- =====================================================
-- Migration: Add Google OAuth 2.0 Support to users table
-- Target Database: travel_booking_db
-- =====================================================

USE `travel_booking_db`;

-- 1. Modify password_hash to allow NULL for OAuth users who sign in without a password
ALTER TABLE `users` 
  MODIFY COLUMN `password_hash` VARCHAR(255) NULL;

-- 2. Add google_id and auth_provider columns if they do not exist
SET @dbname = DATABASE();
SET @tablename = 'users';

-- Add google_id column safely
SET @columnname = 'google_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(255) DEFAULT NULL AFTER `password_hash`;'
));
PREPARE alterTableIfNotExists FROM @preparedStatement;
EXECUTE alterTableIfNotExists;
DEALLOCATE PREPARE alterTableIfNotExists;

-- Add auth_provider column safely
SET @columnname = 'auth_provider';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  "ALTER TABLE `users` ADD COLUMN `auth_provider` ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER `google_id`;"
));
PREPARE alterTableIfNotExists FROM @preparedStatement;
EXECUTE alterTableIfNotExists;
DEALLOCATE PREPARE alterTableIfNotExists;

-- Add unique index on google_id safely
SET @indexname = 'uq_users_google_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `users` ADD UNIQUE KEY `uq_users_google_id` (`google_id`);'
));
PREPARE addIndexIfNotExists FROM @preparedStatement;
EXECUTE addIndexIfNotExists;
DEALLOCATE PREPARE addIndexIfNotExists;
