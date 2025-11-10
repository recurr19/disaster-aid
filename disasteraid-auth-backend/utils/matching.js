const RegisteredNGO = require('../models/RegisteredNGO');

/**
 * matchTicket
 * Finds candidate NGOs for a given ticket.
 * Input: ticket object (from DB or request) with optional locationGeo.coordinates [lng, lat] and helpTypes array
 * Output: array of matches sorted by score and distance. Each match contains NGO summary, distanceKm, score, etaMinutes, matchedHelpTypes
 */
async function matchTicket(ticket, options = {}) {
  const avgSpeedKmph = options.avgSpeedKmph || 30; // used for ETA calculation
  const maxResults = options.maxResults || 20;

  const coords = ticket.locationGeo?.coordinates || ticket.coordinates;
  const requiredHelpTypes = Array.isArray(ticket.helpTypes) ? ticket.helpTypes : (ticket.helpTypes ? [ticket.helpTypes] : []);

  let ngos = [];

  if (coords && Array.isArray(coords) && coords.length === 2) {
    // Use aggregation to compute distance to each NGO
    const nearAgg = await RegisteredNGO.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: coords },
          distanceField: 'distance',
          spherical: true,
          distanceMultiplier: 0.001, // meters -> kilometers
          key: 'locationGeo' // explicitly use the locationGeo 2dsphere index
        }
      },
      // mark if within NGO's coverage radius (coverageRadius in km)
      {
        $addFields: {
          withinCoverage: { $lte: ["$distance", "$coverageRadius"] }
        }
      },
      // Keep NGOs that explicitly say they cover this area (withinCoverage true) OR those with a default small coverageRadius
      {
        $match: { $or: [{ withinCoverage: true }, { coverageRadius: { $exists: false } }] }
      },
      { $limit: 200 }
    ]).exec();

    ngos = nearAgg;
  } else {
    // Fallback: find NGOs whose areasOfWork intersect requested help types, limit by 200
    ngos = await RegisteredNGO.find({ areasOfWork: { $in: requiredHelpTypes } }).limit(200).lean().exec();
  }

  // Score and enrich results
  const scored = ngos.map(ngo => {
    let score = 0;
    const matches = [];

    // help type matches
    for (const ht of requiredHelpTypes) {
      if (ngo.areasOfWork && ngo.areasOfWork.includes(ht)) {
        score += 10;
        matches.push(ht);
      }
    }

    // capacity heuristics
    if (requiredHelpTypes.includes('food') && ngo.foodCapacity && ngo.foodCapacity > 0) {
      score += Math.min(5, Math.floor(ngo.foodCapacity / 10));
    }
    if (requiredHelpTypes.includes('medical') && ngo.medicalTeamCount && ngo.medicalTeamCount > 0) {
      score += ngo.medicalTeamCount * 3;
    }
    if (requiredHelpTypes.includes('transport') && ngo.vehiclesAvailable && ngo.vehiclesAvailable > 0) {
      score += ngo.vehiclesAvailable * 2;
    }

    // availability boost
    if (ngo.availability === 'on-call') score += 4;
    if (ngo.availability === 'full-time') score += 2;

    // small boost if NGO has registrationId (assumed verified)
    if (ngo.registrationId) score += 2;

    // distance penalty (if distance exists)
    const distanceKm = ngo.distance ?? null;
    if (distanceKm != null) {
      // penalize by small amount per km
      score = score - (distanceKm * 0.5);
    }

    // estimated ETA in minutes (distanceKm / speed)
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

  // sort by score desc, then distance asc
  scored.sort((a, b) => {
    if (b.score === a.score) {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    }
    return b.score - a.score;
  });

  return scored.slice(0, maxResults);
}

module.exports = { matchTicket };
