-- =====================================================
-- Travel Planning & Booking System - Database Verification
-- Database: travel_booking_db
-- Phase: 3 - Verification & Integrity Tests
-- =====================================================

USE `travel_booking_db`;

-- 1. Verify All 10 Tables Exist and Output Row Counts
SELECT '1. TABLE RECORD COUNTS' AS 'VERIFICATION SECTION';
SELECT 
    (SELECT COUNT(*) FROM `users`) AS users_count,
    (SELECT COUNT(*) FROM `destinations`) AS destinations_count,
    (SELECT COUNT(*) FROM `packages`) AS packages_count,
    (SELECT COUNT(*) FROM `trips`) AS trips_count,
    (SELECT COUNT(*) FROM `trip_itineraries`) AS trip_itineraries_count,
    (SELECT COUNT(*) FROM `bookings`) AS bookings_count,
    (SELECT COUNT(*) FROM `payments`) AS payments_count,
    (SELECT COUNT(*) FROM `reviews`) AS reviews_count,
    (SELECT COUNT(*) FROM `favorites`) AS favorites_count,
    (SELECT COUNT(*) FROM `notifications`) AS notifications_count;

-- 2. Verify Foreign Keys and Relations: Bookings -> Users -> Destinations -> Packages -> Payments
SELECT '2. BOOKINGS & PAYMENTS INTEGRITY' AS 'VERIFICATION SECTION';
SELECT 
    b.booking_reference,
    u.full_name AS traveler_name,
    u.email,
    d.name AS destination_name,
    p.title AS package_title,
    b.travel_date,
    b.num_travelers,
    b.final_amount,
    b.status AS booking_status,
    pay.transaction_id,
    pay.payment_status,
    pay.payment_method
FROM `bookings` b
JOIN `users` u ON b.user_id = u.id
JOIN `destinations` d ON b.destination_id = d.id
LEFT JOIN `packages` p ON b.package_id = p.id
LEFT JOIN `payments` pay ON pay.booking_id = b.id;

-- 3. Verify Trip Planning & Day-wise Itineraries
SELECT '3. TRIPS & DAY-WISE ITINERARIES' AS 'VERIFICATION SECTION';
SELECT 
    t.id AS trip_id,
    u.full_name AS planned_by,
    t.title AS trip_title,
    d.name AS destination,
    ti.day_number,
    ti.activity_date,
    ti.activity_time,
    ti.title AS activity_title,
    ti.activity_type,
    ti.cost
FROM `trips` t
JOIN `users` u ON t.user_id = u.id
JOIN `destinations` d ON t.destination_id = d.id
JOIN `trip_itineraries` ti ON ti.trip_id = t.id
ORDER BY t.id ASC, ti.day_number ASC, ti.activity_time ASC;

-- 4. Verify Reviews & Ratings Aggregates
SELECT '4. REVIEWS & RATINGS' AS 'VERIFICATION SECTION';
SELECT 
    r.id AS review_id,
    u.full_name AS reviewer,
    COALESCE(d.name, p.title) AS reviewed_item,
    r.rating,
    r.title AS review_title,
    r.is_verified_booking
FROM `reviews` r
JOIN `users` u ON r.user_id = u.id
LEFT JOIN `destinations` d ON r.destination_id = d.id
LEFT JOIN `packages` p ON r.package_id = p.id;

-- 5. Verify User Wishlists & Notifications
SELECT '5. USER WISHLISTS & NOTIFICATIONS' AS 'VERIFICATION SECTION';
SELECT 
    u.full_name,
    COUNT(DISTINCT f.id) AS total_favorites,
    COUNT(DISTINCT n.id) AS total_notifications,
    SUM(CASE WHEN n.is_read = FALSE THEN 1 ELSE 0 END) AS unread_notifications
FROM `users` u
LEFT JOIN `favorites` f ON f.user_id = u.id
LEFT JOIN `notifications` n ON n.user_id = u.id
GROUP BY u.id, u.full_name;
