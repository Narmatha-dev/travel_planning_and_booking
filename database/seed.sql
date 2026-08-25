-- =====================================================
-- Travel Planning & Booking System - Seed Data
-- Database: travel_booking_db
-- Phase: 3 - Seed Data with BCrypt Hashed Passwords
-- =====================================================

USE `travel_booking_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- 1. Seed: users
-- Passwords hashed with bcrypt (cost: 10)
-- Default demo password for all accounts: "TravelPass123!"
-- Hash: $2b$10$8tYixCT8KL5Lm16H2vI66e45g6lD7qjWsqAO.2uYy4gQRGenQ8Oey
-- -----------------------------------------------------
TRUNCATE TABLE `users`;
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `phone_number`, `role`, `profile_image_url`, `address`, `bio`, `is_active`) VALUES
(1, 'System Administrator', 'admin@travelplanner.com', '$2b$10$8tYixCT8KL5Lm16H2vI66e45g6lD7qjWsqAO.2uYy4gQRGenQ8Oey', '+1-555-0100', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', '100 Global Way, Tech Hub, CA', 'Lead Administrator for Travel Planning & Booking System.', 1),
(2, 'Sarah Jenkins', 'sarah.agent@travelplanner.com', '$2b$10$8tYixCT8KL5Lm16H2vI66e45g6lD7qjWsqAO.2uYy4gQRGenQ8Oey', '+1-555-0102', 'agent', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300', '45 Ocean Avenue, Miami, FL', 'Certified Luxury & Adventure Travel Specialist with 8+ years experience.', 1),
(3, 'Alexander Reed', 'alex.reed@example.com', '$2b$10$8tYixCT8KL5Lm16H2vI66e45g6lD7qjWsqAO.2uYy4gQRGenQ8Oey', '+1-555-0199', 'traveler', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', '742 Evergreen Terrace, Springfield, OR', 'Passionate globe-trotter, photographer, and coffee enthusiast.', 1),
(4, 'Elena Rostova', 'elena.rostova@example.com', '$2b$10$8tYixCT8KL5Lm16H2vI66e45g6lD7qjWsqAO.2uYy4gQRGenQ8Oey', '+44-20-7946-0912', 'traveler', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300', '12 Kensington Gardens, London, UK', 'Solo traveler and cultural heritage lover exploring historic landmarks.', 1),
(5, 'Kenji Sato', 'kenji.sato@example.com', '$2b$10$8tYixCT8KL5Lm16H2vI66e45g6lD7qjWsqAO.2uYy4gQRGenQ8Oey', '+81-3-5555-0143', 'traveler', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', '3-2-1 Shibuya, Tokyo, Japan', 'Outdoor explorer, hiker, and culinary traveler.', 1);

-- -----------------------------------------------------
-- 2. Seed: destinations
-- -----------------------------------------------------
TRUNCATE TABLE `destinations`;
INSERT INTO `destinations` (`id`, `name`, `slug`, `country`, `city`, `description`, `category`, `featured_image_url`, `gallery_images`, `rating`, `popularity_score`, `climate`, `best_time_to_visit`, `price_level`, `is_featured`, `is_active`) VALUES
(1, 'Bali Paradise Island', 'bali-paradise-island', 'Indonesia', 'Bali', 'Tropical paradise known for lush volcanic mountains, iconic rice paddies, serene beaches, and vibrant coral reefs.', 'beach', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', '["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800"]', 4.90, 98, 'Tropical warm, average 28°C', 'April to October', 'moderate', 1, 1),
(2, 'Kyoto & Tokyo Highlights', 'kyoto-tokyo-highlights', 'Japan', 'Tokyo', 'Experience the futuristic skyline of Tokyo combined with the timeless shrines, bamboo groves, and tea ceremonies of Kyoto.', 'cultural', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', '["https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800", "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800"]', 4.95, 99, 'Temperate four seasons', 'March to May & Sept to Nov', 'expensive', 1, 1),
(3, 'Swiss Alpine Wonders', 'swiss-alpine-wonders', 'Switzerland', 'Zermatt', 'Majestic snow-capped peaks, alpine lakes, scenic panoramic trains, and world-class ski and spa resorts.', 'mountain', 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800', '["https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"]', 4.88, 92, 'Alpine continental', 'June to August & Dec to March', 'luxury', 1, 1),
(4, 'Parisian Elegance', 'parisian-elegance', 'France', 'Paris', 'The City of Light offers iconic architecture, world-renowned gastronomy, haute couture, and romantic Seine river cruises.', 'city_break', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', '["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800"]', 4.85, 95, 'Oceanic mild', 'April to June & Sept to Oct', 'expensive', 1, 1),
(5, 'Santorini Sunsets', 'santorini-sunsets', 'Greece', 'Oia', 'Iconic whitewashed cubic villages perched upon high cliffs overlooking the turquoise Aegean Sea with breathtaking sunsets.', 'luxury', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', '["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800", "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800"]', 4.92, 94, 'Mediterranean sunny', 'May to October', 'luxury', 1, 1);

-- -----------------------------------------------------
-- 3. Seed: packages
-- -----------------------------------------------------
TRUNCATE TABLE `packages`;
INSERT INTO `packages` (`id`, `destination_id`, `title`, `slug`, `description`, `package_type`, `duration_days`, `duration_nights`, `base_price`, `discount_price`, `inclusions`, `exclusions`, `max_group_size`, `difficulty_level`, `is_available`) VALUES
(1, 1, 'Bali Tropical Bliss & Yoga Retreat', 'bali-tropical-bliss-yoga-retreat', '7-day complete wellness, surfing, temple exploration, and rice terrace photography tour in Ubud and Seminyak.', 'standard', 7, 6, 1299.00, 1099.00, '["4-star Villa Accommodation", "Daily Breakfast & 3 Dinners", "Airport Transfers", "Ubud Tour Guide", "Yoga Sessions"]', '["International Flights", "Personal Expenses", "Travel Insurance"]', 14, 'easy', 1),
(2, 2, 'Grand Japan Explorer: Tokyo to Kyoto', 'grand-japan-explorer-tokyo-kyoto', '9-day bullet train journey through futuristic Tokyo, ancient Kyoto shrines, Mount Fuji views, and street food tours.', 'premium', 9, 8, 2899.00, 2699.00, '["7-Day JR Bullet Train Pass", "4-star Hotel Stays", "Private English Guide", "TeamLab Tickets", "Tea Ceremony"]', '["International Flights", "Visa Fees", "Alcoholic Beverages"]', 10, 'moderate', 1),
(3, 3, 'Swiss Alps Grand Ski & Glacier Tour', 'swiss-alps-grand-ski-glacier-tour', '6-day luxury alpine experience featuring the Glacier Express panoramic train, Zermatt Matterhorn views, and thermal spas.', 'luxury', 6, 5, 3450.00, 3199.00, '["5-star Chalet Resort Stay", "First Class Glacier Express", "Ski Lift Passes", "Thermal Spa Access", "Gourmet Fondue Dinner"]', '["Ski Gear Rental", "International Flights"]', 8, 'moderate', 1),
(4, 4, 'Romantic Paris & Versailles Gourmet Getaway', 'romantic-paris-versailles-gourmet', '5-day luxury discovery of Parisian museums, private Seine dinner cruise, Louvre VIP access, and Versailles Palace tour.', 'premium', 5, 4, 1850.00, 1699.00, '["Boutique Hotel near Eiffel Tower", "Louvre Priority Tickets", "Gourmet Seine Dinner Cruise", "Versailles Day Tour"]', '["Lunches", "Tips", "Flights"]', 12, 'easy', 1),
(5, 5, 'Santorini Sunset Catamaran & Wine Trail', 'santorini-sunset-catamaran-wine-trail', '5-day Aegean escape with a private catamaran cruise, volcanic wine tasting, and cliffside infinity pool resort.', 'luxury', 5, 4, 2199.00, 1999.00, '["Cliffside Cave Suite with Jacuzzi", "Private Sunset Catamaran Cruise with BBQ", "Wine Tasting Tour", "Daily Champagne Breakfast"]', '["International Flights", "Personal Shopping"]', 6, 'easy', 1);

-- -----------------------------------------------------
-- 4. Seed: trips
-- -----------------------------------------------------
TRUNCATE TABLE `trips`;
INSERT INTO `trips` (`id`, `user_id`, `destination_id`, `package_id`, `title`, `trip_type`, `start_date`, `end_date`, `total_budget`, `estimated_cost`, `status`, `notes`) VALUES
(1, 3, 1, 1, 'Alex\'s Bali Summer Escape', 'solo', '2026-09-10', '2026-09-17', 2000.00, 1450.00, 'planned', 'Looking forward to photography at Tegallalang Rice Terrace and yoga at Ubud.'),
(2, 4, 4, 4, 'Elena\'s Paris Art & Architecture Tour', 'solo', '2026-10-05', '2026-10-10', 2500.00, 2100.00, 'planned', 'Special interest in Musee d\'Orsay, Louvre, and architecture photography.'),
(3, 5, 2, 2, 'Kenji & Friends Autumn Japan Quest', 'friends', '2026-11-01', '2026-11-10', 4000.00, 3600.00, 'ongoing', 'Exploring autumn foliage in Kyoto and culinary hot spots in Osaka and Tokyo.');

-- -----------------------------------------------------
-- 5. Seed: trip_itineraries
-- -----------------------------------------------------
TRUNCATE TABLE `trip_itineraries`;
INSERT INTO `trip_itineraries` (`id`, `trip_id`, `day_number`, `activity_date`, `activity_time`, `title`, `description`, `activity_type`, `location_name`, `cost`, `booking_reference`) VALUES
(1, 1, 1, '2026-09-10', '14:00:00', 'Airport Arrival & Villa Check-in', 'Private airport pickup and check-in at Ubud boutique villa resort.', 'hotel', 'Ngurah Rai International Airport & Ubud Villa', 0.00, 'PK-BALI-D1'),
(2, 1, 2, '2026-09-11', '08:30:00', 'Tegallalang Rice Terraces & Jungle Swing', 'Sunrise photography and exploration of emerald-green rice terraces.', 'sightseeing', 'Tegallalang, Ubud', 45.00, 'ACT-BALI-02'),
(3, 1, 3, '2026-09-12', '10:00:00', 'Sacred Monkey Forest & Yoga Session', 'Visit ancient forest sanctuary followed by a relaxing sound healing session.', 'leisure', 'Sacred Monkey Forest Sanctuary', 60.00, 'ACT-BALI-03'),
(4, 2, 1, '2026-10-05', '15:00:00', 'Hotel Check-in & Evening Seine Cruise', 'Check-in near Saint-Germain and board evening illuminated Seine dinner cruise.', 'sightseeing', 'Port de la Bourdonnais, Paris', 120.00, 'ACT-PAR-01'),
(5, 2, 2, '2026-10-06', '09:30:00', 'Louvre Museum VIP Guided Tour', 'Skip-the-line guided masterpiece tour including Mona Lisa and Venus de Milo.', 'sightseeing', 'Musée du Louvre, Rue de Rivoli', 85.00, 'ACT-PAR-02');

-- -----------------------------------------------------
-- 6. Seed: bookings
-- -----------------------------------------------------
TRUNCATE TABLE `bookings`;
INSERT INTO `bookings` (`id`, `booking_reference`, `user_id`, `trip_id`, `package_id`, `destination_id`, `booking_type`, `travel_date`, `return_date`, `num_travelers`, `total_amount`, `discount_amount`, `final_amount`, `status`, `special_requests`) VALUES
(1, 'BK-2026-001', 3, 1, 1, 1, 'package', '2026-09-10', '2026-09-17', 1, 1299.00, 200.00, 1099.00, 'confirmed', 'High-floor villa room requested; vegetarian meal preference.'),
(2, 'BK-2026-002', 4, 2, 4, 4, 'package', '2026-10-05', '2026-10-10', 1, 1850.00, 151.00, 1699.00, 'confirmed', 'Quiet room facing courtyard; late arrival around 8 PM.'),
(3, 'BK-2026-003', 5, 3, 2, 2, 'package', '2026-11-01', '2026-11-10', 2, 5798.00, 400.00, 5398.00, 'pending', 'Non-smoking twin room requested.');

-- -----------------------------------------------------
-- 7. Seed: payments
-- -----------------------------------------------------
TRUNCATE TABLE `payments`;
INSERT INTO `payments` (`id`, `booking_id`, `user_id`, `transaction_id`, `payment_method`, `payment_status`, `amount`, `currency`, `payment_gateway`, `gateway_response`, `paid_at`) VALUES
(1, 1, 3, 'TXN-STRIPE-891023', 'credit_card', 'completed', 1099.00, 'USD', 'Stripe', '{"status":"succeeded","card_brand":"Visa","last4":"4242"}', '2026-08-10 14:23:10'),
(2, 2, 4, 'TXN-PPAL-771928', 'paypal', 'completed', 1699.00, 'USD', 'PayPal', '{"status":"COMPLETED","payer_id":"PAYER_UK_4492"}', '2026-08-12 11:15:45'),
(3, 3, 5, 'TXN-STRIPE-338192', 'credit_card', 'pending', 5398.00, 'USD', 'Stripe', '{"status":"requires_action","client_secret":"pi_3Mtw..._secret_..."}', NULL);

-- -----------------------------------------------------
-- 8. Seed: reviews
-- -----------------------------------------------------
TRUNCATE TABLE `reviews`;
INSERT INTO `reviews` (`id`, `user_id`, `destination_id`, `package_id`, `booking_id`, `rating`, `title`, `comment`, `travel_date`, `is_verified_booking`, `is_approved`) VALUES
(1, 3, 1, 1, 1, 5, 'Unforgettable Balinese Escape!', 'The yoga retreat and private villa in Ubud exceeded all my expectations. The local guide was very knowledgeable.', '2026-07-15', 1, 1),
(2, 4, 4, 4, 2, 5, 'Magical Paris Experience', 'The Louvre VIP access was seamless, and the Seine river dinner was pure magic. Highly recommend this package!', '2026-06-20', 1, 1),
(3, 5, 2, 2, NULL, 5, 'Dream Trip to Tokyo and Kyoto', 'Japan is mesmerizing! From the neon streets of Shinjuku to the peaceful temples in Arashiyama, everything was top-notch.', '2026-05-10', 0, 1);

-- -----------------------------------------------------
-- 9. Seed: favorites
-- -----------------------------------------------------
TRUNCATE TABLE `favorites`;
INSERT INTO `favorites` (`id`, `user_id`, `destination_id`, `package_id`) VALUES
(1, 3, 3, NULL),
(2, 3, NULL, 3),
(3, 4, 1, NULL),
(4, 4, NULL, 5),
(5, 5, 5, NULL);

-- -----------------------------------------------------
-- 10. Seed: notifications
-- -----------------------------------------------------
TRUNCATE TABLE `notifications`;
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `link_url`) VALUES
(1, 3, 'Booking Confirmed!', 'Your booking #BK-2026-001 for Bali Tropical Bliss is confirmed. Prepare for your adventure!', 'booking_update', 1, '/my-trips'),
(2, 3, 'Payment Receipt', 'We received your payment of $1,099.00 via Stripe. Transaction ID: TXN-STRIPE-891023.', 'payment_status', 1, '/my-trips'),
(3, 4, 'Trip Countdown: Paris in 50 Days', 'Get ready for your Parisian elegance trip starting Oct 5th. Check your daily itinerary now.', 'trip_reminder', 0, '/my-trips'),
(4, 5, 'Booking Action Required', 'Your reservation #BK-2026-003 is awaiting payment confirmation.', 'booking_update', 0, '/booking');

-- -----------------------------------------------------
-- 11. Seed: trusted_contacts
-- -----------------------------------------------------
TRUNCATE TABLE `trusted_contacts`;
INSERT INTO `trusted_contacts` (`id`, `user_id`, `name`, `phone`, `relationship`, `email`, `is_primary`) VALUES
(1, 3, 'Sarah Reed (Mother)', '+1-555-0188', 'Mother', 'sarah.reed.mom@example.com', 1),
(2, 3, 'David Reed (Father)', '+1-555-0189', 'Father', 'david.reed.dad@example.com', 0),
(3, 4, 'Mikhail Rostov (Brother)', '+44-20-7946-0955', 'Brother', 'mikhail.r@example.com', 1),
(4, 5, 'Yuki Sato (Spouse)', '+81-3-5555-0188', 'Spouse', 'yuki.sato@example.com', 1);

SET FOREIGN_KEY_CHECKS = 1;
