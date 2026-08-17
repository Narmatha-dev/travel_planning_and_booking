const http = require('http');
const app = require('../src/server');
const config = require('../src/config/environment');

async function testPackagesSuite() {
  console.log('=====================================================');
  console.log('  Testing Travel Package Module (Phase 8 Backend)    ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/packages`;
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

  // 1. Test GET /api/packages
  console.log('--- 1. Listing & Browsing Packages ---');
  try {
    const res = await fetch(BASE_URL);
    const json = await res.json();
    assert(
      'GET /api/packages returns HTTP 200 with package array',
      res.status === 200 && Array.isArray(json.data) && json.data.length > 0,
      `Status: ${res.status}, Count: ${json.data?.length}`
    );

    const firstPkg = json.data?.[0];
    assert(
      'Package contains required core fields (id, title, duration_days, base_price, inclusions, exclusions, is_available)',
      firstPkg &&
      firstPkg.id &&
      firstPkg.title &&
      firstPkg.duration_days > 0 &&
      firstPkg.base_price > 0 &&
      Array.isArray(firstPkg.inclusions) &&
      Array.isArray(firstPkg.exclusions) &&
      firstPkg.is_available !== undefined,
      JSON.stringify(firstPkg)
    );
  } catch (err) {
    assert('GET /api/packages returns HTTP 200', false, err.message);
  }

  // 2. Test GET /api/packages/featured
  console.log('\n--- 2. Featured Packages ---');
  try {
    const res = await fetch(`${BASE_URL}/featured?limit=3`);
    const json = await res.json();
    assert(
      'GET /api/packages/featured returns featured packages list',
      res.status === 200 && Array.isArray(json.data) && json.data.length <= 3,
      `Status: ${res.status}, Count: ${json.data?.length}`
    );
  } catch (err) {
    assert('GET /api/packages/featured returns HTTP 200', false, err.message);
  }

  // 3. Test GET /api/packages/:id (Details)
  console.log('\n--- 3. Single Package Retrieval by ID & Slug ---');
  try {
    const resId = await fetch(`${BASE_URL}/1`);
    const jsonId = await resId.json();
    assert(
      'GET /api/packages/1 returns package details with destination details',
      resId.status === 200 &&
      jsonId.data &&
      jsonId.data.id === 1 &&
      Boolean(jsonId.data.destination_name) &&
      Array.isArray(jsonId.data.inclusions) &&
      jsonId.data.inclusions.length > 0,
      `Status: ${resId.status}`
    );

    const slug = jsonId.data?.slug;
    if (slug) {
      const resSlug = await fetch(`${BASE_URL}/${slug}`);
      const jsonSlug = await resSlug.json();
      assert(
        `GET /api/packages/${slug} returns matching package by slug`,
        resSlug.status === 200 && jsonSlug.data?.slug === slug,
        `Status: ${resSlug.status}`
      );
    }
  } catch (err) {
    assert('GET /api/packages/:id returns HTTP 200', false, err.message);
  }

  // 4. Test Filtering & Search
  console.log('\n--- 4. Filtering, Search & Sorting ---');
  try {
    // Filter by package_type
    const resType = await fetch(`${BASE_URL}?packageType=luxury`);
    const jsonType = await resType.json();
    const allLuxury = jsonType.data?.every((p) => p.package_type.toLowerCase() === 'luxury');
    assert(
      'Filter by packageType=luxury returns only luxury packages',
      resType.status === 200 && allLuxury && jsonType.data.length > 0,
      `Count: ${jsonType.data?.length}`
    );

    // Search query
    const resSearch = await fetch(`${BASE_URL}?search=Japan`);
    const jsonSearch = await resSearch.json();
    const hasJapan = jsonSearch.data?.some((p) =>
      p.title.includes('Japan') || p.destination_name.includes('Japan') || p.destination_country.includes('Japan')
    );
    assert(
      'Search query ?search=Japan returns relevant packages',
      resSearch.status === 200 && hasJapan,
      `Count: ${jsonSearch.data?.length}`
    );

    // Sort by price
    const resSort = await fetch(`${BASE_URL}?sortBy=price_desc`);
    const jsonSort = await resSort.json();
    const prices = jsonSort.data?.map((p) => p.discount_price || p.base_price);
    const isSortedDesc = prices.slice(0, -1).every((p, i) => p >= prices[i + 1]);
    assert(
      'Sort ?sortBy=price_desc returns packages ordered from highest to lowest price',
      resSort.status === 200 && isSortedDesc,
      `Prices: ${prices?.slice(0, 4).join(', ')}`
    );
  } catch (err) {
    assert('Filter, Search & Sorting tests failed', false, err.message);
  }

  // 5. Test Package Management (Create, Update, Toggle Availability, Delete)
  console.log('\n--- 5. Package Management APIs (CRUD & Availability) ---');
  let createdPackageId = null;

  try {
    // Create
    const createPayload = {
      destinationId: 1,
      title: 'Bali Ultra Wellness Sanctuary & Spa',
      description: 'Exclusive 8-day rejuvenation with private villa and spiritual retreats.',
      packageType: 'luxury',
      durationDays: 8,
      durationNights: 7,
      basePrice: 2499.00,
      discountPrice: 2199.00,
      inclusions: ['Private Pool Villa', 'Daily Spa Treatments', 'Gourmet Organic Dining', 'Private Yoga Master'],
      exclusions: ['International Flights', 'Travel Insurance'],
      maxGroupSize: 4,
      difficultyLevel: 'easy',
      isAvailable: true,
    };

    const resCreate = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload),
    });
    const jsonCreate = await resCreate.json();

    assert(
      'POST /api/packages creates new package and returns HTTP 201',
      resCreate.status === 201 && jsonCreate.data && jsonCreate.data.title === createPayload.title,
      `Status: ${resCreate.status}`
    );

    createdPackageId = jsonCreate.data?.id;

    if (createdPackageId) {
      // Update
      const updatePayload = {
        title: 'Bali Ultra Rejuvenation & Luxury Spa',
        discountPrice: 1999.00,
      };
      const resUpdate = await fetch(`${BASE_URL}/${createdPackageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const jsonUpdate = await resUpdate.json();
      assert(
        `PUT /api/packages/${createdPackageId} updates package properties`,
        resUpdate.status === 200 && jsonUpdate.data?.discount_price === 1999.00,
        `Status: ${resUpdate.status}`
      );

      // Toggle Availability
      const resAvail = await fetch(`${BASE_URL}/${createdPackageId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: false }),
      });
      const jsonAvail = await resAvail.json();
      assert(
        `PATCH /api/packages/${createdPackageId}/availability toggles availability to false`,
        resAvail.status === 200 && jsonAvail.data?.is_available === false,
        `is_available: ${jsonAvail.data?.is_available}`
      );

      // Delete
      const resDelete = await fetch(`${BASE_URL}/${createdPackageId}`, {
        method: 'DELETE',
      });
      const jsonDelete = await resDelete.json();
      assert(
        `DELETE /api/packages/${createdPackageId} removes package`,
        resDelete.status === 200 && (jsonDelete.status === 'success' || jsonDelete.success === true),
        `Status: ${resDelete.status}`
      );
    }
  } catch (err) {
    assert('Package Management tests failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Package Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Travel Package backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some package tests failed.\n');
    return false;
  }
}

// Auto-run if executed directly
if (require.main === module) {
  testPackagesSuite()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}

module.exports = { testPackagesSuite };
