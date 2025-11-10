const { matchTicket } = require('./matching');

/**
 * Finds combinations of NGOs that can fulfill the total requested quantities
 * @param {Object} ticket - Ticket document with requestedQuantities
 * @param {Object} options - Options for matching
 * @returns {Array} Array of assignment groups, each containing NGOs and their proposed capacity allocation
 */
async function findNGOCombinations(ticket, options = {}) {
    // Get all candidate NGOs first
    const allMatches = await matchTicket(ticket, { 
        ...options,
        maxResults: 50  // Get more candidates for combining
    });

    const requested = ticket.requestedQuantities || {};
    const totalNeeded = {
        food: requested.food || (ticket.adults + ticket.children + ticket.elderly) || 0,
        medical: requested.medical || 1,  // Default to 1 if medical help needed
        transport: requested.transport || (ticket.adults + ticket.children + ticket.elderly) || 0,
        shelter: requested.shelter || (ticket.adults + ticket.children + ticket.elderly) || 0
    };

    // If single NGO can handle it, return that
    const singleNGO = allMatches.find(m => canNGOFulfill(m, totalNeeded));
    if (singleNGO) {
        return [{
            totalScore: singleNGO.score,
            assignments: [{
                ngo: singleNGO,
                assignedCapacities: calculateAssignedCapacities(singleNGO, totalNeeded)
            }]
        }];
    }

    // Try combinations of 2-3 NGOs
    const combinations = [];
    
    // Try pairs
    for (let i = 0; i < allMatches.length - 1; i++) {
        for (let j = i + 1; j < allMatches.length; j++) {
            const combo = tryNGOCombination([allMatches[i], allMatches[j]], totalNeeded);
            if (combo) combinations.push(combo);
        }
    }

    // If needed, try triplets
    if (combinations.length < 3) {
        for (let i = 0; i < allMatches.length - 2; i++) {
            for (let j = i + 1; j < allMatches.length - 1; j++) {
                for (let k = j + 1; k < allMatches.length; k++) {
                    const combo = tryNGOCombination(
                        [allMatches[i], allMatches[j], allMatches[k]], 
                        totalNeeded
                    );
                    if (combo) combinations.push(combo);
                }
            }
        }
    }

    // Sort by total score (adjusted for number of NGOs needed)
    return combinations.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Check if a single NGO can fulfill all needed quantities
 */
function canNGOFulfill(ngo, needed) {
    return (
        (!needed.food || (ngo.capacities.foodCapacity >= needed.food)) &&
        (!needed.medical || (ngo.capacities.medicalTeamCount * 10 >= needed.medical)) && // assume each team can handle 10 patients
        (!needed.transport || (ngo.capacities.vehiclesAvailable * 8 >= needed.transport)) // assume each vehicle can transport 8 people
    );
}

/**
 * Calculate how much capacity to assign from an NGO
 */
function calculateAssignedCapacities(ngo, needed) {
    return {
        food: Math.min(needed.food || 0, ngo.capacities.foodCapacity || 0),
        medical: Math.min(needed.medical || 0, (ngo.capacities.medicalTeamCount || 0) * 10),
        transport: Math.min(needed.transport || 0, (ngo.capacities.vehiclesAvailable || 0) * 8),
        shelter: Math.min(needed.shelter || 0, ngo.capacities.shelterCapacity || 0)
    };
}

/**
 * Try a combination of NGOs to see if they can fulfill needs together
 */
function tryNGOCombination(ngos, totalNeeded) {
    let remaining = { ...totalNeeded };
    const assignments = [];
    let totalScore = 0;

    // Try to fulfill needs with each NGO
    for (const ngo of ngos) {
        const assigned = calculateAssignedCapacities(ngo, remaining);
        
        // If this NGO can contribute something
        if (Object.values(assigned).some(v => v > 0)) {
            assignments.push({ ngo, assignedCapacities: assigned });
            totalScore += ngo.score;

            // Subtract assigned amounts from remaining needs
            Object.keys(remaining).forEach(key => {
                remaining[key] = Math.max(0, remaining[key] - (assigned[key] || 0));
            });
        }
    }

    // Check if all needs are fulfilled
    const fulfilled = Object.values(remaining).every(v => v === 0);
    if (!fulfilled) return null;

    // Adjust score based on number of NGOs (prefer fewer NGOs)
    const adjustedScore = totalScore * (1 - ((assignments.length - 1) * 0.1));

    return {
        totalScore: adjustedScore,
        assignments
    };
}

module.exports = {
    findNGOCombinations,
    canNGOFulfill,
    calculateAssignedCapacities
};