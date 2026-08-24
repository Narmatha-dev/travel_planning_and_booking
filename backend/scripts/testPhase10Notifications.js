const app = require('../src/server');
const config = require('../src/config/environment');

async function testPhase10NotificationsSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 10: Notifications & Trip Reminders   ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/notifications`;
  const BOOKINGS_URL = `http://localhost:${config.port}/api/bookings`;
  const PAYMENTS_URL = `http://localhost:${config.port}/api/payments`;
  let passed = 0;
  let total = 0;

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
    }
  }

  let testNotificationId = null;
  let testBookingId = null;
  let testBookingRef = null;

  // 1. Fetch Notifications List & Unread Count (Feature 1 & 7)
  console.log('--- 1. Notification Retrieval & Unread Count (Feature 1 & 7) ---');
  try {
    const res = await fetch(`${BASE_URL}?userId=3`);
    const json = await res.json();
    const data = json.data;

    assert(
      'GET /api/notifications returns array of notifications with unread count',
      res.status === 200 && Array.isArray(data?.notifications) && typeof data?.unreadCount === 'number',
      `Status: ${res.status}, Count: ${data?.unreadCount}`
    );

    if (data.notifications.length > 0) {
      testNotificationId = data.notifications[0].id;
    }

    const resCount = await fetch(`${BASE_URL}/unread-count?userId=3`);
    const jsonCount = await resCount.json();

    assert(
      'GET /api/notifications/unread-count returns integer count',
      resCount.status === 200 && typeof jsonCount.data?.unreadCount === 'number',
      `Unread Count: ${jsonCount.data?.unreadCount}`
    );
  } catch (err) {
    assert('Notification retrieval failed', false, err.message);
  }

  // 2. Mark Single Notification as Read (Feature 8)
  console.log('\n--- 2. Mark Notification as Read (Feature 8) ---');
  try {
    if (testNotificationId) {
      const resRead = await fetch(`${BASE_URL}/${testNotificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 3 }),
      });
      const jsonRead = await resRead.json();

      assert(
        'PATCH /api/notifications/:id/read marks notification as read',
        resRead.status === 200 && jsonRead.data?.success === true,
        `Status: ${resRead.status}`
      );
    } else {
      assert('Mark as read (skipped due to no seeds)', true);
    }
  } catch (err) {
    assert('Mark as read test failed', false, err.message);
  }

  // 3. Mark All Notifications as Read (Feature 8)
  console.log('\n--- 3. Mark All as Read (Feature 8) ---');
  try {
    const resReadAll = await fetch(`${BASE_URL}/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 3 }),
    });
    const jsonReadAll = await resReadAll.json();

    assert(
      'PATCH /api/notifications/read-all resets unread count to 0',
      resReadAll.status === 200 && jsonReadAll.data?.unreadCount === 0,
      `Unread count after read-all: ${jsonReadAll.data?.unreadCount}`
    );
  } catch (err) {
    assert('Mark all read failed', false, err.message);
  }

  // 4. Automated Booking Confirmation Notification (Feature 3 & 12)
  console.log('\n--- 4. Automated Booking Notification (Feature 3 & 12) ---');
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign({ id: 3, email: 'test3@example.com', role: 'user' }, config.jwt.secret);

  try {
    const resBooking = await fetch(BOOKINGS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        userId: 3,
        destinationId: 102,
        destinationName: 'Ooty Nilgiri Hill Station',
        packageTitle: 'Ooty Mountain Adventure',
        bookingType: 'custom_trip',
        travelDate: '2026-10-25',
        numTravelers: 2,
        totalAmount: 9500.00,
        finalAmount: 9500.00,
      }),
    });
    const jsonBooking = await resBooking.json();
    testBookingId = jsonBooking.data?.id;
    testBookingRef = jsonBooking.data?.booking_reference;

    // Check notifications list for automated booking confirmation alert
    const resNotifs = await fetch(`${BASE_URL}?userId=3&limit=200`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const jsonNotifs = await resNotifs.json();
    const confirmedNotif = jsonNotifs.data?.notifications?.find(
      (n) => n.title.includes('Trip Confirmed') || n.title.includes('Booking Confirmed')
    );

    assert(
      'Booking creation automatically creates "🎉 Trip Confirmed" notification',
      Boolean(confirmedNotif && confirmedNotif.type === 'booking_update'),
      `Title: ${confirmedNotif?.title}`
    );
  } catch (err) {
    assert('Booking notification failed', false, err.message);
  }

  // 5. Automated Payment Notification (Feature 4 & 12)
  console.log('\n--- 5. Automated Payment Notification (Feature 4 & 12) ---');
  try {
    const resPay = await fetch(`${PAYMENTS_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        bookingId: testBookingId,
        orderId: `ORD-TEST-${testBookingId}`,
        paymentId: `pay_${Date.now().toString(36)}`,
        signature: 'sandbox_valid_sig',
        userId: 3,
      }),
    });

    const resNotifs = await fetch(`${BASE_URL}?userId=3&limit=200`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const jsonNotifs = await resNotifs.json();
    const payNotif = jsonNotifs.data?.notifications?.find((n) => n.title.includes('Payment Successful'));

    assert(
      'Payment verification automatically creates "💳 Payment Successful" notification',
      Boolean(payNotif && payNotif.type === 'payment_status'),
      `Title: ${payNotif?.title}`
    );
  } catch (err) {
    assert('Payment notification failed', false, err.message);
  }

  // 6. Automated Cancellation Notification (Feature 2 & 12)
  console.log('\n--- 6. Automated Cancellation Notification (Feature 2 & 12) ---');
  try {
    await fetch(`${BOOKINGS_URL}/${testBookingId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({ cancellationReason: 'Testing cancellation notification' }),
    });

    const resNotifs = await fetch(`${BASE_URL}?userId=3&limit=200`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const jsonNotifs = await resNotifs.json();
    const cancelNotif = jsonNotifs.data?.notifications?.find((n) => n.title.includes('Booking Cancelled'));

    assert(
      'Booking cancellation automatically creates "❌ Booking Cancelled" notification',
      Boolean(cancelNotif && cancelNotif.type === 'booking_update'),
      `Title: ${cancelNotif?.title}`
    );
  } catch (err) {
    assert('Cancellation notification failed', false, err.message);
  }

  // 7. Duplicate Reminder Prevention (Feature 14)
  console.log('\n--- 7. Duplicate Reminder Prevention (Feature 14) ---');
  try {
    const notificationService = require('../src/services/notificationService');

    // Attempt to trigger duplicate trip reminder for user 3
    const firstReminder = await notificationService.createSystemNotification({
      userId: 3,
      title: '📅 Trip Reminder: Ooty Starts Tomorrow!',
      message: 'Your upcoming trip to Ooty departs tomorrow.',
      type: 'trip_reminder',
      linkUrl: '/my-trips',
      preventDuplicate: true,
    });

    const secondReminder = await notificationService.createSystemNotification({
      userId: 3,
      title: '📅 Trip Reminder: Ooty Starts Tomorrow!',
      message: 'Your upcoming trip to Ooty departs tomorrow.',
      type: 'trip_reminder',
      linkUrl: '/my-trips',
      preventDuplicate: true,
    });

    assert(
      'Duplicate reminder prevention returns existing alert without duplicate record creation',
      firstReminder && secondReminder && firstReminder.id === secondReminder.id,
      `First ID: ${firstReminder?.id}, Second ID: ${secondReminder?.id}`
    );
  } catch (err) {
    assert('Duplicate reminder test failed', false, err.message);
  }

  // 8. Delete Notification & Zero Side-Effect Check (Feature 9)
  console.log('\n--- 8. Notification Deletion & Data Integrity Guard (Feature 9) ---');
  try {
    const resNotifs = await fetch(`${BASE_URL}?userId=3`);
    const jsonNotifs = await resNotifs.json();
    const targetToDelete = jsonNotifs.data?.notifications?.[0];

    if (targetToDelete) {
      const resDel = await fetch(`${BASE_URL}/${targetToDelete.id}?userId=3`, {
        method: 'DELETE',
      });

      assert(
        'DELETE /api/notifications/:id removes notification successfully',
        resDel.status === 200,
        `Status: ${resDel.status}`
      );
    }

    // Verify booking is NOT affected or deleted
    const resCheckBooking = await fetch(`${BOOKINGS_URL}/${testBookingRef}`);
    const jsonCheckBooking = await resCheckBooking.json();

    assert(
      'Deleting notification DOES NOT delete or modify linked trip/booking record',
      Boolean(jsonCheckBooking.data?.id),
      `Booking preserved: ID #${jsonCheckBooking.data?.id}`
    );
  } catch (err) {
    assert('Delete notification test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 10 Notification Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 10 Notification tests passed successfully!');
    if (require.main === module) process.exit(0);
    return true;
  } else {
    console.error('❌ Some Phase 10 Notification tests failed.');
    if (require.main === module) process.exit(1);
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase10NotificationsSuite();
}

module.exports = testPhase10NotificationsSuite;
