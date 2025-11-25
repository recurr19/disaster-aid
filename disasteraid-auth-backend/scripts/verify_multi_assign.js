const mongoose = require('mongoose');
const { findNGOCombinations } = require('../utils/multiAssignMatching');
const { matchTicket } = require('../utils/matching');

// Mock data
const mockTicket = {
    locationGeo: { coordinates: [77.2090, 28.6139] },
    helpTypes: ['food'],
    requestedQuantities: { food: 1000 }, // Needs 1000 food
    adults: 100, children: 0, elderly: 0
};

const mockNGOs = [
    {
        _id: new mongoose.Types.ObjectId(),
        organizationName: 'NGO A',
        areasOfWork: ['food'],
        locationGeo: { coordinates: [77.2090, 28.6139] },
        distance: 1,
        foodCapacity: 600, // Can provide 600
        availability: 'full-time'
    },
    {
        _id: new mongoose.Types.ObjectId(),
        organizationName: 'NGO B',
        areasOfWork: ['food'],
        locationGeo: { coordinates: [77.2090, 28.6139] },
        distance: 2,
        foodCapacity: 500, // Can provide 500
        availability: 'full-time'
    },
    {
        _id: new mongoose.Types.ObjectId(),
        organizationName: 'NGO C',
        areasOfWork: ['food'],
        locationGeo: { coordinates: [77.2090, 28.6139] },
        distance: 10,
        foodCapacity: 100,
        availability: 'full-time'
    }
];

// Simple mock factory
const createMock = (returnValue) => {
    const mock = () => {
        return {
            exec: async () => returnValue,
            limit: () => ({ lean: () => ({ exec: async () => returnValue }) })
        };
    };
    return mock;
};

// Create a mock model object
const MockModel = {
    aggregate: createMock(mockNGOs),
    find: createMock(mockNGOs)
};

async function runTest() {
    console.log('--- Testing Multi-Assign Matcher ---');

    // Test: Should combine NGO A and NGO B to fulfill 1000 food
    console.log('\nTest: 1000 Food Request');

    // Pass model to findNGOCombinations -> matchTicket
    const combinations = await findNGOCombinations(mockTicket, { model: MockModel });

    if (combinations.length > 0) {
        const best = combinations[0];
        console.log(`Best Combination Score: ${best.totalScore}`);
        console.log(`Number of NGOs assigned: ${best.assignments.length}`);

        let totalFoodAssigned = 0;
        best.assignments.forEach(a => {
            console.log(`- ${a.ngo.organizationName}: Assigned ${a.assignedCapacities.food} food`);
            totalFoodAssigned += a.assignedCapacities.food;
        });

        console.log(`Total Food Assigned: ${totalFoodAssigned}`);

        if (totalFoodAssigned >= 1000) {
            console.log('SUCCESS: Requirement fulfilled.');
        } else {
            console.error('FAILURE: Requirement not fulfilled.');
        }

        if (best.assignments.length >= 2) {
            console.log('SUCCESS: Multiple NGOs used.');
        } else {
            console.log('NOTE: Single NGO used (unexpected for this test case).');
        }

    } else {
        console.error('FAILURE: No combinations found.');
    }
}

runTest().catch(console.error);
