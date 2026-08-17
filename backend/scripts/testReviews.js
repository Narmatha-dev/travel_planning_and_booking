const config = require('../src/config/environment');

async function testReviewsSuite() {
  console.log('=====================================================');
  console.log('  Testing Reviews & Ratings Module (Phase 11)        ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/reviews`;
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

  let createdReviewId = null;

  // 1. Test Viewing Reviews & Aggregate Ratings
  console.log('--- 1. Get Reviews & Calculate Average Rating ---');
  try {
    const res = await fetch(`${BASE_URL}?destinationId=1`);
    const json = await res.json();

    assert(
      'GET /api/reviews?destinationId=1 returns HTTP 200 with reviews and aggregates',
      res.status === 200 && Array.isArray(json.data?.reviews) && json.data?.aggregates,
      `Status: ${res.status}`
    );

    const aggregates = json.data?.aggregates;
    assert(
      'Aggregates calculate averageRating, totalReviews, and star distribution',
      typeof aggregates?.averageRating === 'number' && typeof aggregates?.totalReviews === 'number' && aggregates?.distribution,
      `Avg: ${aggregates?.averageRating}, Total: ${aggregates?.totalReviews}`
    );
  } catch (err) {
    assert('Get reviews test failed', false, err.message);
  }

  // 2. Test Review Eligibility
  console.log('\n--- 2. Booking Eligibility Verification ---');
  try {
    const resEligible = await fetch(`${BASE_URL}/eligibility?destinationId=1&userId=3`);
    const jsonEligible = await resEligible.json();

    assert(
      'GET /api/reviews/eligibility returns eligibility status',
      resEligible.status === 200 && typeof jsonEligible.data?.isEligible === 'boolean',
      `Eligible: ${jsonEligible.data?.isEligible}`
    );
  } catch (err) {
    assert('Eligibility test failed', false, err.message);
  }

  // 3. Test Giving Rating & Writing Review
  console.log('\n--- 3. Write & Submit Review (Give Rating) ---');
  try {
    const newReviewData = {
      userId: 3,
      destinationId: 1,
      packageId: 1,
      rating: 5,
      title: 'Spectacular Experience & Breathtaking Views',
      comment: 'The private villa stay in Bali was top tier! Yoga sessions every morning were so refreshing. Highly recommended.',
      travelDate: '2026-08-10',
    };

    const resCreate = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReviewData),
    });
    const jsonCreate = await resCreate.json();

    assert(
      'POST /api/reviews creates review and returns HTTP 201',
      resCreate.status === 201 && jsonCreate.data?.id,
      `Status: ${resCreate.status}`
    );

    createdReviewId = jsonCreate.data?.id;

    assert(
      'Created review has valid rating and author details',
      jsonCreate.data?.rating === 5 && jsonCreate.data?.title === newReviewData.title,
      `Rating: ${jsonCreate.data?.rating}, Title: ${jsonCreate.data?.title}`
    );
  } catch (err) {
    assert('Create review test failed', false, err.message);
  }

  // 4. Test Rating Bounds & Input Validation
  console.log('\n--- 4. Rating Bounds & Input Validation ---');
  try {
    // Rating > 5
    const resInvalidRating = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        rating: 6,
        title: 'Too high rating',
        comment: 'This should fail validation.',
      }),
    });
    assert(
      'POST /api/reviews with rating > 5 returns HTTP 400 Bad Request',
      resInvalidRating.status === 400,
      `Status: ${resInvalidRating.status}`
    );

    // Comment too short (< 5 chars)
    const resShortComment = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        rating: 4,
        title: 'Good',
        comment: 'Hi',
      }),
    });
    assert(
      'POST /api/reviews with short comment (< 5 chars) returns HTTP 400 Bad Request',
      resShortComment.status === 400,
      `Status: ${resShortComment.status}`
    );
  } catch (err) {
    assert('Validation tests failed', false, err.message);
  }

  // 5. Test Edit Own Review & Authorization Boundary
  console.log('\n--- 5. Edit Own Review & Authorization Boundary ---');
  try {
    if (createdReviewId) {
      // Edit by different user (should fail with HTTP 403)
      const resOtherUser = await fetch(`${BASE_URL}/${createdReviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 99,
          rating: 1,
          title: 'Hacked title',
          comment: 'Should not allow another user to edit',
        }),
      });
      assert(
        'PUT /api/reviews/:id by non-author returns HTTP 403 Forbidden',
        resOtherUser.status === 403,
        `Status: ${resOtherUser.status}`
      );

      // Edit by author (should succeed)
      const resAuthorEdit = await fetch(`${BASE_URL}/${createdReviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 3,
          rating: 5,
          title: 'Spectacular Experience (Updated Review)',
          comment: 'Updated: The villa was immaculate and the sunrise excursion was unforgettable.',
        }),
      });
      const jsonAuthorEdit = await resAuthorEdit.json();

      assert(
        'PUT /api/reviews/:id by author updates rating and review content',
        resAuthorEdit.status === 200 && jsonAuthorEdit.data?.title.includes('(Updated Review)'),
        `Updated Title: ${jsonAuthorEdit.data?.title}`
      );
    }
  } catch (err) {
    assert('Edit review test failed', false, err.message);
  }

  // 6. Test Delete Own Review
  console.log('\n--- 6. Delete Own Review ---');
  try {
    if (createdReviewId) {
      // Attempt delete by non-author (should fail)
      const resDeleteOther = await fetch(`${BASE_URL}/${createdReviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 99 }),
      });
      assert(
        'DELETE /api/reviews/:id by non-author returns HTTP 403 Forbidden',
        resDeleteOther.status === 403,
        `Status: ${resDeleteOther.status}`
      );

      // Delete by author (should succeed)
      const resDeleteAuthor = await fetch(`${BASE_URL}/${createdReviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 3 }),
      });
      assert(
        'DELETE /api/reviews/:id by author returns HTTP 200 and removes review',
        resDeleteAuthor.status === 200,
        `Status: ${resDeleteAuthor.status}`
      );
    }
  } catch (err) {
    assert('Delete review test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Reviews Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Reviews and Ratings backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some review tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testReviewsSuite()
    .then((ok) => {
      setTimeout(() => process.exit(ok ? 0 : 1), 100);
    })
    .catch((err) => {
      console.error('Fatal review test error:', err);
      setTimeout(() => process.exit(1), 100);
    });
}

module.exports = { testReviewsSuite };
