/**
 * Find optimal NGO matches for a ticket considering total capacity needs
 * and minimizing the number of NGOs involved while maximizing coverage.
 */

function findOptimalMatches(ticket, matches) {
    const totalPeople = ticket.adults + ticket.children + ticket.elderly;
    const needsFood = ticket.helpTypes.includes('food');
    const needsMedical = ticket.helpTypes.includes('medical');
    
    // Sort matches by score in descending order
    const sortedMatches = [...matches].sort((a, b) => b.score - a.score);
    
    // Initialize result
    let optimalMatches = {
        primary: null,
        secondary: [],
        totalFoodCapacity: 0,
        totalMedicalTeams: 0,
        coverageDetails: {
            foodCovered: false,
            medicalCovered: false,
            peopleCapacity: 0
        }
    };

    // First, try to find a single NGO that can handle everything
    const singleNGOMatch = sortedMatches.find(ngo => {
        const hasEnoughFood = !needsFood || ngo.capacities.foodCapacity >= totalPeople;
        const hasEnoughMedical = !needsMedical || ngo.capacities.medicalTeamCount > 0;
        return hasEnoughFood && hasEnoughMedical;
    });

    if (singleNGOMatch) {
        return {
            primary: singleNGOMatch,
            secondary: [],
            totalFoodCapacity: singleNGOMatch.capacities.foodCapacity,
            totalMedicalTeams: singleNGOMatch.capacities.medicalTeamCount,
            coverageDetails: {
                foodCovered: true,
                medicalCovered: true,
                peopleCapacity: singleNGOMatch.capacities.foodCapacity
            }
        };
    }

    // If no single NGO can handle everything, find the best combination
    let remainingFoodNeed = needsFood ? totalPeople : 0;
    let remainingMedicalNeed = needsMedical ? 1 : 0; // Assuming we need at least one medical team

    // Start with the highest scoring NGO that has any required capability
    for (const ngo of sortedMatches) {
        if (!optimalMatches.primary && 
            ((needsFood && ngo.capacities.foodCapacity > 0) || 
             (needsMedical && ngo.capacities.medicalTeamCount > 0))) {
            optimalMatches.primary = ngo;
            optimalMatches.totalFoodCapacity += ngo.capacities.foodCapacity;
            optimalMatches.totalMedicalTeams += ngo.capacities.medicalTeamCount;
            
            remainingFoodNeed = Math.max(0, remainingFoodNeed - ngo.capacities.foodCapacity);
            remainingMedicalNeed = Math.max(0, remainingMedicalNeed - (ngo.capacities.medicalTeamCount > 0 ? 1 : 0));
        } else if (optimalMatches.primary && (remainingFoodNeed > 0 || remainingMedicalNeed > 0)) {
            // Add secondary NGOs only if they contribute to remaining needs
            if ((remainingFoodNeed > 0 && ngo.capacities.foodCapacity > 0) ||
                (remainingMedicalNeed > 0 && ngo.capacities.medicalTeamCount > 0)) {
                optimalMatches.secondary.push(ngo);
                optimalMatches.totalFoodCapacity += ngo.capacities.foodCapacity;
                optimalMatches.totalMedicalTeams += ngo.capacities.medicalTeamCount;
                
                remainingFoodNeed = Math.max(0, remainingFoodNeed - ngo.capacities.foodCapacity);
                remainingMedicalNeed = Math.max(0, remainingMedicalNeed - (ngo.capacities.medicalTeamCount > 0 ? 1 : 0));
            }
        }

        // Check if all needs are met
        if (remainingFoodNeed === 0 && remainingMedicalNeed === 0) {
            break;
        }
    }

    // Update coverage details
    optimalMatches.coverageDetails = {
        foodCovered: remainingFoodNeed === 0,
        medicalCovered: remainingMedicalNeed === 0,
        peopleCapacity: optimalMatches.totalFoodCapacity
    };

    return optimalMatches;
}

module.exports = { findOptimalMatches };