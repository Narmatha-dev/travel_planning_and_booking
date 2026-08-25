-- =====================================================
-- Travel Planning & Booking System - MySQL Database Schema
-- Database: travel_booking_db
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- Phase: 3 - Database Architecture & Implementation
-- =====================================================

CREATE DATABASE IF NOT EXISTS `travel_booking_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `travel_booking_db`;

-- Set SQL mode for strict integrity and disable FK checks during drop
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- 1. Table: users
-- Description: Stores customer, agent, and administrator accounts
-- Note: Passwords must be securely hashed (e.g. bcrypt/argon2)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `google_id` VARCHAR(255) DEFAULT NULL,
  `auth_provider` ENUM('local', 'google') NOT NULL DEFAULT 'local',
  `phone_number` VARCHAR(30) DEFAULT NULL,
  `role` ENUM('traveler', 'agent', 'admin') NOT NULL DEFAULT 'traveler',
  `profile_image_url` VARCHAR(500) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_google_id` (`google_id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2. Table: destinations
-- Description: Stores travel destinations, locations, categories & metadata
-- -----------------------------------------------------
DROP TABLE IF EXISTS `destinations`;
CREATE TABLE `destinations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('beach', 'mountain', 'cultural', 'adventure', 'city_break', 'wildlife', 'luxury') NOT NULL DEFAULT 'cultural',
  `featured_image_url` VARCHAR(500) NOT NULL,
  `gallery_images` JSON DEFAULT NULL,
  `rating` DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  `popularity_score` INT UNSIGNED NOT NULL DEFAULT 0,
  `climate` VARCHAR(100) DEFAULT NULL,
  `best_time_to_visit` VARCHAR(150) DEFAULT NULL,
  `price_level` ENUM('budget', 'moderate', 'expensive', 'luxury') NOT NULL DEFAULT 'moderate',
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_destinations_slug` (`slug`),
  KEY `idx_destinations_country_city` (`country`, `city`),
  KEY `idx_destinations_category` (`category`),
  KEY `idx_destinations_is_featured` (`is_featured`),
  KEY `idx_destinations_rating` (`rating`),
  CONSTRAINT `chk_destinations_rating` CHECK (`rating` >= 0.00 AND `rating` <= 5.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3. Table: packages
-- Description: Curated travel packages tied to destinations
-- -----------------------------------------------------
DROP TABLE IF EXISTS `packages`;
CREATE TABLE `packages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `destination_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `description` TEXT NOT NULL,
  `package_type` ENUM('standard', 'premium', 'luxury', 'custom') NOT NULL DEFAULT 'standard',
  `duration_days` INT UNSIGNED NOT NULL,
  `duration_nights` INT UNSIGNED NOT NULL,
  `base_price` DECIMAL(10, 2) NOT NULL,
  `discount_price` DECIMAL(10, 2) DEFAULT NULL,
  `inclusions` JSON DEFAULT NULL,
  `exclusions` JSON DEFAULT NULL,
  `max_group_size` INT UNSIGNED NOT NULL DEFAULT 12,
  `difficulty_level` ENUM('easy', 'moderate', 'challenging', 'strenuous') NOT NULL DEFAULT 'easy',
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_packages_slug` (`slug`),
  KEY `idx_packages_destination_id` (`destination_id`),
  KEY `idx_packages_package_type` (`package_type`),
  KEY `idx_packages_base_price` (`base_price`),
  KEY `idx_packages_is_available` (`is_available`),
  CONSTRAINT `fk_packages_destination` FOREIGN KEY (`destination_id`)
    REFERENCES `destinations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_packages_duration_days` CHECK (`duration_days` >= 1),
  CONSTRAINT `chk_packages_base_price` CHECK (`base_price` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4. Table: trips
-- Description: User-planned customized itineraries and trip schedules
-- -----------------------------------------------------
DROP TABLE IF EXISTS `trips`;
CREATE TABLE `trips` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `destination_id` BIGINT UNSIGNED NOT NULL,
  `package_id` BIGINT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `trip_type` ENUM('solo', 'family', 'couple', 'friends', 'business') NOT NULL DEFAULT 'solo',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_budget` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `estimated_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('draft', 'planned', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trips_user_id` (`user_id`),
  KEY `idx_trips_destination_id` (`destination_id`),
  KEY `idx_trips_package_id` (`package_id`),
  KEY `idx_trips_status` (`status`),
  KEY `idx_trips_dates` (`start_date`, `end_date`),
  CONSTRAINT `fk_trips_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trips_destination` FOREIGN KEY (`destination_id`)
    REFERENCES `destinations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_trips_package` FOREIGN KEY (`package_id`)
    REFERENCES `packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_trips_dates` CHECK (`end_date` >= `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 5. Table: trip_itineraries
-- Description: Day-wise activities and schedule items for a trip
-- -----------------------------------------------------
DROP TABLE IF EXISTS `trip_itineraries`;
CREATE TABLE `trip_itineraries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `trip_id` BIGINT UNSIGNED NOT NULL,
  `day_number` INT UNSIGNED NOT NULL,
  `activity_date` DATE NOT NULL,
  `activity_time` TIME DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `activity_type` ENUM('flight', 'hotel', 'sightseeing', 'dining', 'transport', 'leisure', 'adventure') NOT NULL DEFAULT 'sightseeing',
  `location_name` VARCHAR(200) DEFAULT NULL,
  `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `booking_reference` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_itineraries_trip_day` (`trip_id`, `day_number`),
  KEY `idx_itineraries_activity_type` (`activity_type`),
  CONSTRAINT `fk_itineraries_trip` FOREIGN KEY (`trip_id`)
    REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_itineraries_day` CHECK (`day_number` >= 1),
  CONSTRAINT `chk_itineraries_cost` CHECK (`cost` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 6. Table: bookings
-- Description: Reservations for travel packages, custom trips, hotels, or flights
-- -----------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_reference` VARCHAR(30) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `trip_id` BIGINT UNSIGNED DEFAULT NULL,
  `package_id` BIGINT UNSIGNED DEFAULT NULL,
  `destination_id` BIGINT UNSIGNED NOT NULL,
  `booking_type` ENUM('package', 'flight', 'hotel', 'activity', 'custom_trip') NOT NULL DEFAULT 'package',
  `travel_date` DATE NOT NULL,
  `return_date` DATE DEFAULT NULL,
  `num_travelers` INT UNSIGNED NOT NULL DEFAULT 1,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `final_amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed', 'refunded') NOT NULL DEFAULT 'pending',
  `special_requests` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bookings_reference` (`booking_reference`),
  KEY `idx_bookings_user_id` (`user_id`),
  KEY `idx_bookings_trip_id` (`trip_id`),
  KEY `idx_bookings_package_id` (`package_id`),
  KEY `idx_bookings_destination_id` (`destination_id`),
  KEY `idx_bookings_status` (`status`),
  KEY `idx_bookings_travel_date` (`travel_date`),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_trip` FOREIGN KEY (`trip_id`)
    REFERENCES `trips` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_package` FOREIGN KEY (`package_id`)
    REFERENCES `packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_destination` FOREIGN KEY (`destination_id`)
    REFERENCES `destinations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_bookings_num_travelers` CHECK (`num_travelers` >= 1),
  CONSTRAINT `chk_bookings_total_amount` CHECK (`total_amount` >= 0.00),
  CONSTRAINT `chk_bookings_final_amount` CHECK (`final_amount` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 7. Table: payments
-- Description: Financial transactions, payment status, and audit logs
-- -----------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL,
  `payment_method` ENUM('credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'upi') NOT NULL,
  `payment_status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `payment_gateway` VARCHAR(50) NOT NULL DEFAULT 'Stripe',
  `gateway_response` JSON DEFAULT NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_transaction_id` (`transaction_id`),
  KEY `idx_payments_booking_id` (`booking_id`),
  KEY `idx_payments_user_id` (`user_id`),
  KEY `idx_payments_payment_status` (`payment_status`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`)
    REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_payments_amount` CHECK (`amount` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 8. Table: reviews
-- Description: Customer ratings and reviews for destinations and packages
-- -----------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `destination_id` BIGINT UNSIGNED DEFAULT NULL,
  `package_id` BIGINT UNSIGNED DEFAULT NULL,
  `booking_id` BIGINT UNSIGNED DEFAULT NULL,
  `rating` INT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `comment` TEXT NOT NULL,
  `travel_date` DATE DEFAULT NULL,
  `is_verified_booking` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_approved` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_user_id` (`user_id`),
  KEY `idx_reviews_destination_id` (`destination_id`),
  KEY `idx_reviews_package_id` (`package_id`),
  KEY `idx_reviews_booking_id` (`booking_id`),
  KEY `idx_reviews_rating` (`rating`),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_destination` FOREIGN KEY (`destination_id`)
    REFERENCES `destinations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_package` FOREIGN KEY (`package_id`)
    REFERENCES `packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`)
    REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 9. Table: favorites
-- Description: Saved wishlist destinations and packages per user
-- -----------------------------------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `destination_id` BIGINT UNSIGNED DEFAULT NULL,
  `package_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_favorites_user_destination` (`user_id`, `destination_id`),
  UNIQUE KEY `uq_favorites_user_package` (`user_id`, `package_id`),
  KEY `idx_favorites_user_id` (`user_id`),
  KEY `idx_favorites_destination_id` (`destination_id`),
  KEY `idx_favorites_package_id` (`package_id`),
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorites_destination` FOREIGN KEY (`destination_id`)
    REFERENCES `destinations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorites_package` FOREIGN KEY (`package_id`)
    REFERENCES `packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 10. Table: notifications
-- Description: User notifications for bookings, trips, payments and system alerts
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('booking_update', 'payment_status', 'trip_reminder', 'promotion', 'system') NOT NULL DEFAULT 'system',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `link_url` VARCHAR(300) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_unread` (`user_id`, `is_read`),
  KEY `idx_notifications_type` (`type`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 11. Table: trusted_contacts
-- Description: Emergency trusted contacts saved per user (Phase 25)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `trusted_contacts`;
CREATE TABLE `trusted_contacts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `relationship` VARCHAR(50) DEFAULT 'Family',
  `email` VARCHAR(191) DEFAULT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trusted_contacts_user_id` (`user_id`),
  CONSTRAINT `fk_trusted_contacts_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restore foreign key checks
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
