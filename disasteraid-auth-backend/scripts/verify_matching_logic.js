const mongoose = require('mongoose');
const { matchTicket } = require('../utils/matching');

// Mock data
const mockTicket = {
    locationGeo: { coordinates: [77.2090, 28.6139] }, // New Delhi
    helpTypes: ['food', 'medical']
};

const mockNGOs = [
    {
        _id: new mongoose.Types.ObjectId(),
        organizationName: 'Nearby NGO',
        areasOfWork: ['food', 'medical'],
        locationGeo: { coordinates: [77.2095, 28.6140] }, // Very close
        distance: 0.1, // Mocked distance from aggregation
        foodCapacity: 100,
        availability: 'full-time'
    },
    {
        _id: new mongoose.Types.ObjectId(),
        organizationName: 'Far Away NGO',
        areasOfWork: ['food'],
        locationGeo: { coordinates: [77.5000, 28.9000] }, // Far
        distance: 50, // Mocked distance
        foodCapacity: 500, // High capacity
        availability: 'on-call'
    },
    {
        _id: new mongoose.Types.ObjectId(),
        organizationName: 'Excluded NGO',
        areasOfWork: ['food'],
        locationGeo: { coordinates: [77.2090, 28.6139] },
        distance: 0,
        foodCapacity: 50
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
    console.log('--- Testing Matcher ---');

    // Test 1: Normal match
    console.log('\nTest 1: Normal Match');
    const results1 = await matchTicket(mockTicket, { model: MockModel });
    if (results1.length > 0) {
        console.log('Top match:', results1[0].organizationName, 'Score:', results1[0].score);
    } else {
        console.log('No matches found for Test 1');
    }

    // Test 2: Exclusion
    console.log('\nTest 2: Exclusion');
    const excludedId = mockNGOs[2]._id.toString();
    const results2 = await matchTicket(mockTicket, { excludedNgoIds: [excludedId], model: MockModel });
    const foundExcluded = results2.find(r => r.ngoId.toString() === excludedId);
    if (!foundExcluded) {
        console.log('SUCCESS: Excluded NGO not found in results.');
    } else {
        console.error('FAILURE: Excluded NGO found!');
    }

    // Test 3: Distance Decay
    console.log('\nTest 3: Distance Decay Check');
    const near = results1.find(r => r.organizationName === 'Nearby NGO');
    const far = results1.find(r => r.organizationName === 'Far Away NGO');

    if (near && far) {
        console.log(`Near Score: ${near.score}, Far Score: ${far.score}`);
        if (near.score > far.score) {
            console.log('Result: Near NGO scored higher (expected).');
        } else {
            console.log('Result: Far NGO scored higher (check if intended).');
        }
    } else {
        console.log('Could not find both NGOs for comparison');
    }
}

runTest().catch(console.error);
