/**
 * Utility to generate and trigger PDF download / print dialog for AI Trip Itineraries
 */
export function exportItineraryToPdf(itinerary) {
  if (!itinerary) {
    alert('No active itinerary to export to PDF');
    return;
  }

  const {
    destination = 'Custom Destination',
    numberOfDays = 3,
    travelers = 2,
    travelPreference = 'Balanced',
    budget = 0,
    totalEstimatedCost = 0,
    currencySymbol = '₹',
    summary = '',
    selectedTransport,
    days = [],
    costBreakdown,
  } = itinerary;

  const sym = currencySymbol || '₹';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const cb = costBreakdown || {
    transport: Math.round(totalEstimatedCost * 0.18),
    accommodation: Math.round(totalEstimatedCost * 0.42),
    food: Math.round(totalEstimatedCost * 0.25),
    activities: Math.round(totalEstimatedCost * 0.10),
    other: Math.round(totalEstimatedCost * 0.05),
    total: totalEstimatedCost,
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Travelora Itinerary - ${destination}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      color: #2D1520;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #BE5985;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      color: #BE5985;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #EC7FA9;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 800;
      color: #2D1520;
      margin: 4px 0 2px 0;
    }
    .meta-pill {
      display: inline-block;
      background: #FFEDFA;
      color: #BE5985;
      border: 1px solid #FFB8E0;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      margin-right: 6px;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #FFF5FB;
      border: 1px solid #F3D2E5;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 16px;
    }
    .overview-item {
      font-size: 11px;
    }
    .overview-item .lbl {
      color: #7A5366;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
      text-transform: uppercase;
      font-size: 9px;
    }
    .overview-item .val {
      font-size: 13px;
      font-weight: 800;
      color: #BE5985;
    }
    .summary-box {
      background: #fdf2f8;
      border-left: 3px solid #EC7FA9;
      padding: 8px 12px;
      font-size: 12px;
      color: #502838;
      margin-bottom: 16px;
      border-radius: 0 8px 8px 0;
    }
    .cost-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .cost-table th, .cost-table td {
      padding: 6px 10px;
      border: 1px solid #F3D2E5;
      text-align: left;
    }
    .cost-table th {
      background: #FFF5FB;
      color: #BE5985;
      font-weight: 800;
    }
    .cost-table .total-row {
      background: #FFEDFA;
      font-weight: 900;
      color: #BE5985;
    }
    .day-card {
      border: 1px solid #F3D2E5;
      border-radius: 8px;
      margin-bottom: 12px;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .day-header {
      background: #FFF5FB;
      border-bottom: 1px solid #F3D2E5;
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .day-title {
      font-size: 13px;
      font-weight: 800;
      color: #BE5985;
      margin: 0;
    }
    .day-theme {
      font-size: 11px;
      color: #7A5366;
      font-weight: 600;
    }
    .day-content {
      padding: 8px 10px;
    }
    .slot-row {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .slot-time {
      min-width: 65px;
      font-weight: 700;
      color: #BE5985;
      font-size: 11px;
    }
    .slot-desc strong {
      color: #2D1520;
    }
    .culinary-row {
      background: #fdf4ff;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 11px;
      margin-top: 6px;
      color: #6b21a8;
      display: flex;
      gap: 12px;
    }
    .tip-box {
      font-size: 11px;
      background: #fefce8;
      border-left: 2px solid #eab308;
      padding: 4px 8px;
      margin-top: 4px;
      color: #854d0e;
    }
    .footer {
      border-top: 1px solid #F3D2E5;
      padding-top: 8px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #7A5366;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">TRAVEL<span>ORA</span></div>
      <div class="doc-title">${destination} — ${numberOfDays} Days Detailed Itinerary</div>
      <div>
        <span class="meta-pill">👥 ${travelers} Travelers</span>
        <span class="meta-pill">✨ ${travelPreference?.toUpperCase()}</span>
        <span class="meta-pill">📅 Generated ${currentDate}</span>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; color: #7A5366; text-transform: uppercase; font-weight: 700;">Estimated Total</div>
      <div style="font-size: 18px; font-weight: 900; color: #BE5985;">${sym}${totalEstimatedCost?.toLocaleString()}</div>
    </div>
  </div>

  ${summary ? `<div class="summary-box"><strong>Trip Overview:</strong> ${summary}</div>` : ''}

  <div class="overview-grid">
    <div class="overview-item">
      <span class="lbl">Destination</span>
      <span class="val">${destination}</span>
    </div>
    <div class="overview-item">
      <span class="lbl">Duration</span>
      <span class="val">${numberOfDays} Days</span>
    </div>
    <div class="overview-item">
      <span class="lbl">Target Budget</span>
      <span class="val">${sym}${budget?.toLocaleString()}</span>
    </div>
    <div class="overview-item">
      <span class="lbl">Transport</span>
      <span class="val">${selectedTransport?.title || 'Train / Cab Transit'}</span>
    </div>
  </div>

  <table class="cost-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>Transport</th>
        <th>Hotel & Stays</th>
        <th>Dining & Food</th>
        <th>Sightseeing</th>
        <th>Total Estimated</th>
      </tr>
    </thead>
    <tbody>
      <tr class="total-row">
        <td>Cost (${sym})</td>
        <td>${sym}${cb.transport?.toLocaleString()}</td>
        <td>${sym}${cb.accommodation?.toLocaleString()}</td>
        <td>${sym}${cb.food?.toLocaleString()}</td>
        <td>${sym}${cb.activities?.toLocaleString()}</td>
        <td>${sym}${totalEstimatedCost?.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <h3 style="font-size: 14px; font-weight: 800; color: #BE5985; margin: 12px 0 8px 0;">🗓️ Day-by-Day Schedule</h3>

  ${days
    .map(
      (d) => `
    <div class="day-card">
      <div class="day-header">
        <h4 class="day-title">Day ${d.day}: ${d.title || d.dayTheme || 'Exploration & Sightseeing'}</h4>
        <span class="day-theme">${d.dayTheme ? `Theme: ${d.dayTheme}` : ''}</span>
      </div>
      <div class="day-content">
        ${
          d.morning
            ? `
          <div class="slot-row">
            <span class="slot-time">🌅 Morning</span>
            <div class="slot-desc"><strong>${d.morning.spot || d.morning.title || 'Attraction'}:</strong> ${d.morning.activity || d.morning.description || ''}</div>
          </div>
        `
            : ''
        }
        ${
          d.afternoon
            ? `
          <div class="slot-row">
            <span class="slot-time">☀️ Afternoon</span>
            <div class="slot-desc"><strong>${d.afternoon.spot || d.afternoon.title || 'Sightseeing'}:</strong> ${d.afternoon.activity || d.afternoon.description || ''}</div>
          </div>
        `
            : ''
        }
        ${
          d.evening
            ? `
          <div class="slot-row">
            <span class="slot-time">🌆 Evening</span>
            <div class="slot-desc"><strong>${d.evening.spot || d.evening.title || 'Sunset & Market'}:</strong> ${d.evening.activity || d.evening.description || ''}</div>
          </div>
        `
            : ''
        }

        ${
          d.foodSuggestions
            ? `
          <div class="culinary-row">
            ${d.foodSuggestions.lunch ? `<span>🍽️ <strong>Lunch:</strong> ${d.foodSuggestions.lunch.dish} @ ${d.foodSuggestions.lunch.spot}</span>` : ''}
            ${d.foodSuggestions.dinner ? `<span>🌆 <strong>Dinner:</strong> ${d.foodSuggestions.dinner.dish} @ ${d.foodSuggestions.dinner.spot}</span>` : ''}
          </div>
        `
            : ''
        }

        ${d.aiTravelTip ? `<div class="tip-box">💡 <strong>Travel Tip:</strong> ${d.aiTravelTip}</div>` : ''}
      </div>
    </div>
  `
    )
    .join('')}

  <div class="footer">
    <span>Travelora Smart Travel Planner • Instant 24/7 AI Assistance</span>
    <span>support@travelora.com • www.travelora.com</span>
  </div>

  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>
  `;

  try {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      window.print();
    }
  } catch (err) {
    window.print();
  }
}

/**
 * Utility to generate and trigger PDF download / print dialog for Official Tax Invoice & Bill
 */
export function exportBillToPdf(billData) {
  if (!billData) return;

  const {
    bookingReference = 'BK-2026-CONFIRMED',
    transactionId = 'TXN-RAZORPAY-CONFIRMED',
    customerName = 'Alexander Reed',
    customerEmail = 'alex.reed@example.com',
    customerPhone = '+91 98765 43210',
    destinationName = 'Bali Paradise Island',
    travelDate = '2026-09-02',
    returnDate = '',
    numTravelers = 2,
    packageTitle = 'Curated Travel Package',
    transportTitle = 'Standard Road Transit',
    hotelName = 'Recommended Luxury Stay',
    subtotal = 21875,
    taxesAndFees = 1094,
    discountAmount = 0,
    totalAmount = 22969,
    paymentMethod = 'UPI (Google Pay)',
    paidAt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    currencySymbol = '₹',
  } = billData;

  const sym = currencySymbol || '₹';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Travelora Tax Invoice - ${bookingReference}</title>
  <style>
    @page { size: A4; margin: 12mm 15mm 12mm 15mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { color: #2D1520; background: #ffffff; margin: 0; padding: 0; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 2px solid #BE5985; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 24px; font-weight: 900; color: #BE5985; letter-spacing: -0.5px; }
    .brand span { color: #EC7FA9; }
    .company-details { font-size: 11px; color: #7A5366; line-height: 1.4; margin-top: 4px; }
    .invoice-badge { background: #FFEDFA; border: 1.5px solid #FFB8E0; color: #BE5985; padding: 6px 14px; border-radius: 12px; text-align: right; }
    .invoice-title { font-size: 16px; font-weight: 900; margin: 0 0 4px 0; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .meta-box { background: #FFF5FB; border: 1px solid #F3D2E5; border-radius: 12px; padding: 12px 14px; }
    .meta-box h4 { margin: 0 0 6px 0; font-size: 12px; color: #BE5985; text-transform: uppercase; }
    .meta-box p { margin: 0; font-size: 12px; color: #2D1520; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #FFEDFA; color: #BE5985; font-weight: 800; text-align: left; padding: 10px; border: 1px solid #F3D2E5; }
    td { padding: 10px; border: 1px solid #F3D2E5; color: #2D1520; }
    .text-right { text-align: right; }
    .summary-table { width: 320px; margin-left: auto; margin-bottom: 20px; }
    .summary-table td { border: none; padding: 4px 8px; }
    .total-row { font-size: 15px; font-weight: 900; color: #BE5985; border-top: 2px solid #BE5985 !important; }
    .paid-stamp { display: inline-block; border: 2px solid #16a34a; color: #16a34a; padding: 6px 16px; font-size: 14px; font-weight: 900; border-radius: 8px; text-transform: uppercase; transform: rotate(-3deg); }
    .footer { border-top: 1px solid #F3D2E5; padding-top: 12px; margin-top: 24px; font-size: 11px; color: #7A5366; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">TRAVELORA <span>EXPLORE</span></div>
      <div class="company-details">
        Travelora Travels Pvt. Ltd. • GSTIN: 33AAACT7891K1Z8<br>
        SAC Code: 998553 (Passenger Transport & Tour Services)<br>
        HQ: Brigade Road, Bangalore, KA 560001 • support@travelora.com
      </div>
    </div>
    <div class="invoice-badge">
      <div class="invoice-title">TAX INVOICE & RECEIPT</div>
      <div><strong>Invoice #:</strong> INV-${bookingReference.replace('BK-', '')}</div>
      <div><strong>Date:</strong> ${paidAt}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Billed To (Lead Guest)</h4>
      <p>
        <strong>${customerName}</strong><br>
        Email: ${customerEmail}<br>
        Phone: ${customerPhone}<br>
        Guests: ${numTravelers} Traveller(s)
      </p>
    </div>
    <div class="meta-box">
      <h4>Booking & Payment Details</h4>
      <p>
        <strong>Booking ID:</strong> ${bookingReference}<br>
        <strong>Transaction ID:</strong> ${transactionId}<br>
        <strong>Payment Mode:</strong> ${paymentMethod}<br>
        <strong>Status:</strong> <span style="color: #16a34a; font-weight: 800;">CONFIRMED & PAID ✓</span>
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Description / Service Item</th>
        <th>Travel Dates</th>
        <th>Qty / Travellers</th>
        <th class="text-right">Amount (${sym})</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><strong>${destinationName}</strong><br><span style="font-size: 11px; color: #7A5366;">${packageTitle}</span></td>
        <td>${travelDate} ${returnDate ? 'to ' + returnDate : ''}</td>
        <td>${numTravelers} Guest(s)</td>
        <td class="text-right">${sym}${subtotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td>2</td>
        <td><strong>Transit / Road Conveyance</strong><br><span style="font-size: 11px; color: #7A5366;">${transportTitle}</span></td>
        <td>${travelDate}</td>
        <td>${numTravelers} Guest(s)</td>
        <td class="text-right" style="color: #16a34a;">Included</td>
      </tr>
      <tr>
        <td>3</td>
        <td><strong>Accommodation & Hotel Booking</strong><br><span style="font-size: 11px; color: #7A5366;">${hotelName}</span></td>
        <td>${travelDate}</td>
        <td>1 Room / Suite</td>
        <td class="text-right" style="color: #16a34a;">Included</td>
      </tr>
      <tr>
        <td>4</td>
        <td><strong>AI Travel Assistant & Digital Itinerary</strong></td>
        <td>Instant</td>
        <td>1 Itinerary</td>
        <td class="text-right" style="color: #16a34a;">FREE (₹0)</td>
      </tr>
    </tbody>
  </table>

  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div class="paid-stamp">PAID & VERIFIED ✓</div>
      <div style="font-size: 11px; color: #7A5366; margin-top: 8px;">
        * This is a computer generated invoice and does not require physical signature.
      </div>
    </div>

    <table class="summary-table">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right"><strong>${sym}${subtotal.toLocaleString()}</strong></td>
      </tr>
      <tr>
        <td>GST / Taxes (5%):</td>
        <td class="text-right"><strong>${sym}${taxesAndFees.toLocaleString()}</strong></td>
      </tr>
      ${
        discountAmount > 0
          ? `
      <tr style="color: #16a34a;">
        <td>Discount Applied:</td>
        <td class="text-right"><strong>-${sym}${discountAmount.toLocaleString()}</strong></td>
      </tr>
      `
          : ''
      }
      <tr class="total-row">
        <td>Total Paid Amount:</td>
        <td class="text-right">${sym}${totalAmount.toLocaleString()}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <span>Travelora Customer Care: support@travelora.com • 24/7 Helpline: +91 80 4000 2026</span>
    <span>Thank you for booking with Travelora!</span>
  </div>

  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>
  `;

  try {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      window.print();
    }
  } catch (err) {
    window.print();
  }
}

