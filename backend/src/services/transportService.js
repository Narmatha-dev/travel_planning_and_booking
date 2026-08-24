const locationService = require('./locationService');

// Configurable transport fare configuration
const TRANSPORT_CONFIG = {
  currency: 'INR',
  currencySymbol: '₹',
  fuel: {
    pricePerLiter: 102, // INR / liter
    avgKmPerLiter: 15,  // standard passenger car mileage
    tollPer100Km: 90,   // approximate highway toll
  },
  cab: {
    baseFare: 120,      // flag down fare
    ratePerKm: 14.5,    // per km rate for sedan / outstation
    driverAllowancePerDay: 300,
  },
  bus: {
    baseFare: 25,
    expressRatePerKm: 1.6, // Ordinary / Express bus
    volvoRatePerKm: 2.3,   // AC Multi-Axle / Sleeper
  },
  train: {
    secondSittingBase: 30,
    secondSittingRatePerKm: 0.55,
    sleeperBase: 70,
    sleeperRatePerKm: 1.05,
    ac3TierBase: 180,
    ac3TierRatePerKm: 1.75,
  },
  flight: {
    minDistanceKm: 320,
    baseFare: 2900,
    ratePerKm: 3.4,
    airportBufferMinutes: 105, // 1 hr 45 min check-in + security
    cruiseSpeedKmh: 680,
  },
};

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs} hr ${mins > 0 ? `${mins} min` : ''}`.trim();
  }
  return `${Math.max(1, mins)} min`;
}

const transportService = {
  /**
   * Generates tailored transport options from origin to destination coordinates (Phase 4)
   */
  async getTransportOptions({
    originLat,
    originLng,
    destLat,
    destLng,
    distanceKm = null,
    durationSeconds = null,
    preference = 'any',
    currency = 'INR',
  }) {
    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
      const error = new Error('Valid origin and destination coordinates are required for transport options');
      error.statusCode = 400;
      throw error;
    }

    // 1. Obtain accurate road distance if not provided
    let distKm = distanceKm ? parseFloat(distanceKm) : null;
    let drivingSec = durationSeconds ? parseInt(durationSeconds, 10) : null;

    if (!distKm || !drivingSec) {
      try {
        const routeData = await locationService.calculateRoute({
          originLat: oLat,
          originLng: oLng,
          destLat: dLat,
          destLng: dLng,
          travelMode: 'driving',
        });
        distKm = routeData.distance_km;
        drivingSec = routeData.duration_seconds;
      } catch (err) {
        // Fallback distance calculation
        const R = 6371;
        const dLatRad = ((dLat - oLat) * Math.PI) / 180;
        const dLonRad = ((dLng - oLng) * Math.PI) / 180;
        const a =
          Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
          Math.cos((oLat * Math.PI) / 180) *
            Math.cos((dLat * Math.PI) / 180) *
            Math.sin(dLonRad / 2) *
            Math.sin(dLonRad / 2);
        const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distKm = parseFloat((straight * 1.25).toFixed(1));
        drivingSec = Math.round((distKm / 50) * 3600);
      }
    }

    const cfg = TRANSPORT_CONFIG;
    const sym = cfg.currencySymbol;
    const options = [];

    // -------------------------------------------------------------
    // Option 1: 🚗 Car / Private Vehicle
    // -------------------------------------------------------------
    const fuelLiters = distKm / cfg.fuel.avgKmPerLiter;
    const fuelCost = Math.round(fuelLiters * cfg.fuel.pricePerLiter);
    const tolls = Math.round((distKm / 100) * cfg.fuel.tollPer100Km);
    const totalCarCost = fuelCost + tolls;

    options.push({
      id: 'transport_car',
      type: 'car',
      title: 'Car / Private Vehicle',
      icon: '🚗',
      category: 'road',
      distance_km: distKm,
      distance_text: `${distKm} km`,
      duration_seconds: drivingSec,
      duration_text: formatDuration(drivingSec),
      estimated_cost: totalCarCost,
      cost_text: `${sym}${totalCarCost.toLocaleString()}`,
      cost_label: 'Estimated Fuel & Tolls',
      cost_breakdown: `~${fuelLiters.toFixed(1)}L fuel (${sym}${fuelCost}) + ${sym}${tolls} tolls`,
      comfort_rating: 4.5,
      frequency_label: 'Immediate / Any Time',
      features: ['Personal privacy', 'Flexible stops along the route', 'Trunk luggage capacity'],
      is_estimated: true,
      estimation_note: 'Approximate fuel expense based on average 15 km/l consumption.',
    });

    // -------------------------------------------------------------
    // Option 2: 🚕 Cab / Outstation Taxi
    // -------------------------------------------------------------
    if (distKm <= 650) {
      let cabFare = Math.round(cfg.cab.baseFare + distKm * cfg.cab.ratePerKm);
      if (distKm > 100) {
        cabFare += cfg.cab.driverAllowancePerDay;
      }

      options.push({
        id: 'transport_cab',
        type: 'cab',
        title: 'Cab / Taxi',
        icon: '🚕',
        category: 'road',
        distance_km: distKm,
        distance_text: `${distKm} km`,
        duration_seconds: drivingSec,
        duration_text: formatDuration(drivingSec),
        estimated_cost: cabFare,
        cost_text: `${sym}${cabFare.toLocaleString()}`,
        cost_label: 'Approximate Cab Fare',
        cost_breakdown: `Base ${sym}${cfg.cab.baseFare} + ${distKm} km @ ${sym}${cfg.cab.ratePerKm}/km`,
        comfort_rating: 4.8,
        frequency_label: 'On-demand (5-15 mins pickup)',
        features: ['Doorstep pickup & drop', 'Air-conditioned sedan / SUV', 'No self-driving stress'],
        is_estimated: true,
        estimation_note: 'Approximate fare for standard 4-seater outstation cab.',
      });
    }

    // -------------------------------------------------------------
    // Option 3: 🚌 Bus (Express & AC Sleeper)
    // -------------------------------------------------------------
    if (distKm >= 12 && distKm <= 750) {
      const busFare = Math.round(cfg.bus.baseFare + distKm * cfg.bus.expressRatePerKm);
      const volvoFare = Math.round(cfg.bus.baseFare + distKm * cfg.bus.volvoRatePerKm);
      const busSec = Math.round(drivingSec * 1.3 + 900); // stops buffer

      options.push({
        id: 'transport_bus',
        type: 'bus',
        title: 'Bus (Express / AC)',
        icon: '🚌',
        category: 'transit',
        distance_km: distKm,
        distance_text: `${distKm} km`,
        duration_seconds: busSec,
        duration_text: formatDuration(busSec),
        estimated_cost: busFare,
        cost_text: `${sym}${busFare.toLocaleString()} - ${sym}${volvoFare.toLocaleString()}`,
        cost_label: 'Estimated Bus Ticket',
        cost_breakdown: `State Express: ${sym}${busFare} | AC Volvo: ${sym}${volvoFare}`,
        comfort_rating: 3.8,
        frequency_label: distKm < 80 ? 'Frequent departures every 20-30 mins' : 'Hourly intercity services',
        features: ['Economical travel', 'AC and Non-AC seater/sleeper options', 'Central bus terminal access'],
        is_estimated: true,
        estimation_note: 'Estimated ticket price based on standard state transport and private bus slabs.',
      });
    }

    // -------------------------------------------------------------
    // Option 4: 🚆 Train (Express / Superfast)
    // -------------------------------------------------------------
    if (distKm >= 20) {
      const train2SFare = Math.max(35, Math.round(cfg.train.secondSittingBase + distKm * cfg.train.secondSittingRatePerKm));
      const trainSLFare = Math.max(80, Math.round(cfg.train.sleeperBase + distKm * cfg.train.sleeperRatePerKm));
      const train3ACFare = Math.max(220, Math.round(cfg.train.ac3TierBase + distKm * cfg.train.ac3TierRatePerKm));
      
      // Train avg speed ~65 km/h + 20 mins buffer
      const trainSec = Math.round((distKm / 65) * 3600 + 1200);

      options.push({
        id: 'transport_train',
        type: 'train',
        title: 'Train (Express / Rail)',
        icon: '🚆',
        category: 'rail',
        distance_km: distKm,
        distance_text: `${distKm} km`,
        duration_seconds: trainSec,
        duration_text: formatDuration(trainSec),
        estimated_cost: trainSLFare,
        cost_text: `${sym}${train2SFare} - ${sym}${train3ACFare}`,
        cost_label: 'Estimated Train Fare',
        cost_breakdown: `2S: ${sym}${train2SFare} | Sleeper: ${sym}${trainSLFare} | 3AC: ${sym}${train3ACFare}`,
        comfort_rating: 4.2,
        frequency_label: 'Multiple daily scheduled trains',
        features: ['Smooth & scenic rail journey', 'Overnight berths available', 'Avoid highway traffic congestion'],
        is_estimated: true,
        estimation_note: 'Estimated railway tariff based on standard distance slabs (2S, SL, 3AC).',
      });
    }

    // -------------------------------------------------------------
    // Option 5: ✈️ Flight (Where applicable: distance >= 320 km)
    // -------------------------------------------------------------
    if (distKm >= cfg.flight.minDistanceKm) {
      const flightAirHours = distKm / cfg.flight.cruiseSpeedKmh;
      const flightTotalSec = Math.round((flightAirHours * 3600) + (cfg.flight.airportBufferMinutes * 60));
      const flightFare = Math.round(cfg.flight.baseFare + distKm * cfg.flight.ratePerKm);

      options.push({
        id: 'transport_flight',
        type: 'flight',
        title: 'Flight (Domestic / Connecting)',
        icon: '✈️',
        category: 'air',
        distance_km: distKm,
        distance_text: `${distKm} km`,
        duration_seconds: flightTotalSec,
        duration_text: formatDuration(flightTotalSec),
        estimated_cost: flightFare,
        cost_text: `${sym}${flightFare.toLocaleString()}`,
        cost_label: 'Estimated Flight Fare',
        cost_breakdown: `Economy airfare with standard 15kg cabin/check-in baggage`,
        comfort_rating: 4.9,
        frequency_label: 'Daily scheduled non-stop / 1-stop flights',
        features: ['Fastest long-distance travel', 'Complimentary baggage allowance', 'In-flight refreshment options'],
        is_estimated: true,
        estimation_note: 'Approximate economy airfare including taxes and airport security buffer.',
      });
    }

    // -------------------------------------------------------------
    // Recommendation Logic based on distance and user preference
    // -------------------------------------------------------------
    const pref = (preference || 'any').toLowerCase();
    let recommendedId = 'transport_car';
    let recommendationReason = 'Best balance of travel time, privacy, and route flexibility.';

    if (pref === 'cheapest') {
      const cheapestOpt = [...options].sort((a, b) => a.estimated_cost - b.estimated_cost)[0];
      if (cheapestOpt) {
        recommendedId = cheapestOpt.id;
        recommendationReason = `Lowest estimated travel cost (${cheapestOpt.cost_text}) for this ${distKm} km journey.`;
      }
    } else if (pref === 'fastest') {
      const fastestOpt = [...options].sort((a, b) => a.duration_seconds - b.duration_seconds)[0];
      if (fastestOpt) {
        recommendedId = fastestOpt.id;
        recommendationReason = `Shortest travel time (${fastestOpt.duration_text}) to reach your destination.`;
      }
    } else if (pref === 'comfortable') {
      const comfortableOpt = [...options].sort((a, b) => b.comfort_rating - a.comfort_rating)[0];
      if (comfortableOpt) {
        recommendedId = comfortableOpt.id;
        recommendationReason = `Highest comfort and direct convenience with premium travel experience.`;
      }
    } else {
      // Balanced 'any' default
      if (distKm <= 80) {
        recommendedId = 'transport_car';
        recommendationReason = `Quickest and most convenient direct route for this short ${distKm} km drive.`;
      } else if (distKm > 80 && distKm <= 350) {
        const trainOpt = options.find((o) => o.type === 'train');
        if (trainOpt) {
          recommendedId = 'transport_train';
          recommendationReason = `Comfortable scenic train connection with lower cost compared to long-distance cab.`;
        } else {
          recommendedId = 'transport_cab';
          recommendationReason = `Direct private journey with doorstep pickup.`;
        }
      } else if (distKm > 350) {
        const flightOpt = options.find((o) => o.type === 'flight');
        if (flightOpt) {
          recommendedId = 'transport_flight';
          recommendationReason = `Fastest way to bridge this ${distKm} km distance without extended road travel.`;
        } else {
          recommendedId = 'transport_train';
          recommendationReason = `Comfortable overnight express train connection.`;
        }
      }
    }

    return {
      distance_km: distKm,
      driving_duration_seconds: drivingSec,
      driving_duration_text: formatDuration(drivingSec),
      origin: { latitude: oLat, longitude: oLng },
      destination: { latitude: dLat, longitude: dLng },
      currency: cfg.currency,
      currency_symbol: cfg.currencySymbol,
      user_preference: pref,
      recommended_transport_id: recommendedId,
      recommended_reason: recommendationReason,
      options,
    };
  },
};

module.exports = transportService;
