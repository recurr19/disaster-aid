const RegisteredNGO = require('../models/RegisteredNGO');

/**
 * matchTicket
 * Finds candidate NGOs for a given ticket.
 * Input: ticket object (from DB or request) with optional locationGeo.coordinates [lng, lat] and helpTypes array
 * Output: array of matches sorted by score and distance. Each match contains NGO summary, distanceKm, score, etaMinutes, matchedHelpTypes
 */
// Scoring Constants
const SCORING = {
  HELP_TYPE_MATCH: 10,
  AVAILABILITY: {
    'on-call': 4,
    'full-time': 2
  },
  REGISTRATION_BONUS: 2,
  CAPACITY: {
    MEDICAL_MULTIPLIER: 3,
    VEHICLE_MULTIPLIER: 2,
    FOOD_DIVISOR: 10,
    FOOD_MAX_SCORE: 10
  },
  DISTANCE: {
    DECAY_FACTOR: 100 // score *= (100 / (100 + distance))
  }
};

/**
 * matchTicket
 * Finds candidate NGOs for a given ticket.
 * Input: ticket object (from DB or request) with optional locationGeo.coordinates [lng, lat] and helpTypes array
 * Options: 
 *  - avgSpeedKmph (default 30)
 *  - maxResults (default 20)
 *  - excludedNgoIds (array of strings, NGOs to skip)
 * Output: array of matches sorted by score and distance.
 */
async function matchTicket(ticket, options = {}) {
  const avgSpeedKmph = options.avgSpeedKmph || 30;
  const maxResults = options.maxResults || 20;
  const excludedNgoIds = options.excludedNgoIds || [];
  const Model = options.model || RegisteredNGO;

  const coords = ticket.locationGeo?.coordinates || ticket.coordinates;
  const requiredHelpTypes = Array.isArray(ticket.helpTypes) ? ticket.helpTypes : (ticket.helpTypes ? [ticket.helpTypes] : []);

  // Base query: match help types and exclude previous assignments
  const baseQuery = {
    areasOfWork: { $in: requiredHelpTypes }
  };

  if (excludedNgoIds.length > 0) {
    baseQuery._id = { $nin: excludedNgoIds };
  }

  let ngos = [];

  if (coords && Array.isArray(coords) && coords.length === 2) {
    try {
      // Geo match
      const geoQuery = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: coords },
            distanceField: 'distance',
            spherical: true,
            distanceMultiplier: 0.001, // meters to km
            key: 'locationGeo',
            query: baseQuery // Apply base filters (help types, exclusions) here
          }
        },
        // Filter by coverage radius if it exists
        {
          $match: {
            $expr: {
              $or: [
                { $lte: ["$distance", "$coverageRadius"] },
                { $eq: [{ $type: "$coverageRadius" }, "missing"] } // If no radius defined, assume global/unlimited
              ]
            }
          }
        },
        { $limit: 200 }
      ];

      ngos = await Model.aggregate(geoQuery).exec();
    } catch (e) {
      console.warn('Geo match failed, falling back to basic query', e.message);
      // Fallback to basic find if geo fails
      ngos = await Model.find(baseQuery).limit(200).lean().exec();
    }

    // Double check if geo query returned nothing, try fallback
    if (!ngos || ngos.length === 0) {
      ngos = await Model.find(baseQuery).limit(200).lean().exec();
    }
  } else {
    // No coords, just basic find
    ngos = await Model.find(baseQuery).limit(200).lean().exec();
  }

  // Double check: Filter out excluded NGOs (in case DB query didn't catch it or for fallback)
  if (excludedNgoIds.length > 0) {
    ngos = ngos.filter(n => !excludedNgoIds.includes(n._id.toString()));
  }

  // Score and enrich results
  const scored = ngos.map(ngo => {
    let score = 0;
    const matches = [];

    // 1. Help type matches
    for (const ht of requiredHelpTypes) {
      if (ngo.areasOfWork && ngo.areasOfWork.includes(ht)) {
        score += SCORING.HELP_TYPE_MATCH;
        matches.push(ht);
      }
    }

    // 2. Capacity heuristics
    if (requiredHelpTypes.includes('food') && ngo.foodCapacity > 0) {
      // Logarithmic scaling or capped linear
      // Old: Math.min(5, Math.floor(ngo.foodCapacity / 10))
      // New: Allow up to 10 points
      score += Math.min(SCORING.CAPACITY.FOOD_MAX_SCORE, Math.floor(ngo.foodCapacity / SCORING.CAPACITY.FOOD_DIVISOR));
    }
    if (requiredHelpTypes.includes('medical') && ngo.medicalTeamCount > 0) {
      score += ngo.medicalTeamCount * SCORING.CAPACITY.MEDICAL_MULTIPLIER;
    }
    if (requiredHelpTypes.includes('transport') && ngo.vehiclesAvailable > 0) {
      score += ngo.vehiclesAvailable * SCORING.CAPACITY.VEHICLE_MULTIPLIER;
    }

    // 3. Availability boost
    if (ngo.availability === 'on-call') score += SCORING.AVAILABILITY['on-call'];
    if (ngo.availability === 'full-time') score += SCORING.AVAILABILITY['full-time'];

    // 4. Verification boost
    if (ngo.registrationId) score += SCORING.REGISTRATION_BONUS;

    // 5. Distance Decay (Multiplicative instead of Subtractive)
    // This prevents negative scores and handles long distances better
    const distanceKm = ngo.distance ?? null;
    if (distanceKm != null) {
      // Factor: 100 / (100 + dist)
      // at 0km -> 1.0
      // at 100km -> 0.5
      // at 900km -> 0.1
      const decay = SCORING.DISTANCE.DECAY_FACTOR / (SCORING.DISTANCE.DECAY_FACTOR + distanceKm);
      score *= decay;
    }

    // ETA calculation
    const etaMinutes = distanceKm != null ? Math.max(1, Math.round((distanceKm / avgSpeedKmph) * 60)) : null;

    return {
      ngoId: ngo._id,
      organizationName: ngo.organizationName,
      contactPerson: ngo.contactPerson,
      phone: ngo.phone,
      location: ngo.location,
      distanceKm: distanceKm,
      score: Math.round(score * 10) / 10,
      etaMinutes,
      matches,
      capacities: {
        foodCapacity: ngo.foodCapacity || 0,
        medicalTeamCount: ngo.medicalTeamCount || 0,
        vehiclesAvailable: ngo.vehiclesAvailable || 0
      },
      raw: ngo
    };
  });

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults);
}

module.exports = { matchTicket };
