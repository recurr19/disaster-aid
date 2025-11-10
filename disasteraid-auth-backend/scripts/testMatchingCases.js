/**
 * Comprehensive test cases for multi-NGO matching
 * Tests different scenarios: large groups, medical emergencies, mixed needs
 */

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const RegisteredNGO = require('../models/RegisteredNGO');
const Ticket = require('../models/Ticket');
const { findNGOCombinations } = require('../utils/multiAssignMatching');

async function runTestCase(title, ticket, ngos) {
    console.log('\n' + '='.repeat(80));
    console.log(`TEST CASE: ${title}`);
    console.log('='.repeat(80));

    // Insert NGOs for this test
    const createdNGOs = await RegisteredNGO.insertMany(ngos);
    console.log('\nTest NGOs:');
    createdNGOs.forEach(ngo => {
        console.log(`- ${ngo.organizationName}`);
        console.log(`  Capacities: food=${ngo.foodCapacity}, medical teams=${ngo.medicalTeamCount}, vehicles=${ngo.vehiclesAvailable}`);
        console.log(`  Coverage: ${ngo.coverageRadius}km, Availability: ${ngo.availability}`);
    });

    // Create ticket
    const createdTicket = await Ticket.create(ticket);
    console.log('\nTest Ticket:', ticket.ticketId);
    console.log('Requested:', ticket.requestedQuantities);
    console.log('Help Types:', ticket.helpTypes);
    console.log('Is SOS:', ticket.isSOS);

    // Find matches
    console.log('\nFinding NGO combinations...');
    const combinations = await findNGOCombinations(createdTicket.toObject());

    if (combinations.length === 0) {
        console.log('❌ No valid combinations found');
        return;
    }

    console.log(`\n✅ Found ${combinations.length} possible combination(s):`);
    combinations.forEach((combo, i) => {
        console.log(`\nCombination ${i + 1} (score: ${combo.totalScore.toFixed(1)}):`);
        combo.assignments.forEach(assignment => {
            console.log(`- ${assignment.ngo.organizationName}:`);
            console.log('  Will provide:', JSON.stringify(assignment.assignedCapacities));
        });
    });

    // Cleanup
    const ngoIds = createdNGOs.map(n => n._id);
    await RegisteredNGO.deleteMany({ _id: { $in: ngoIds } });
    await Ticket.deleteMany({ _id: createdTicket._id });
}

async function main() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disasteraid_auth';
    console.log('Connecting to', mongoUri);

    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB\n');

        // Test Case 1: Large Food Request (should split between multiple NGOs)
        await runTestCase(
            "Large Food Request (300 people)",
            {
                ticketId: 'TEST_LARGE_FOOD',
                name: 'Community Center',
                helpTypes: ['food'],
                requestedQuantities: {
                    food: 300,
                    medical: 0,
                    transport: 0,
                    shelter: 0
                },
                isSOS: false,
                locationGeo: { type: 'Point', coordinates: [72.8777, 19.0760] }
            },
            [
                {
                    user: new mongoose.Types.ObjectId(),
                    organizationName: 'Food NGO A',
                    areasOfWork: ['food'],
                    availability: 'full-time',
                    foodCapacity: 200,
                    medicalTeamCount: 0,
                    vehiclesAvailable: 1,
                    coverageRadius: 10,
                    locationGeo: { type: 'Point', coordinates: [72.8777, 19.0760] }
                },
                {
                    user: new mongoose.Types.ObjectId(),
                    organizationName: 'Food NGO B',
                    areasOfWork: ['food'],
                    availability: 'full-time',
                    foodCapacity: 150,
                    medicalTeamCount: 0,
                    vehiclesAvailable: 1,
                    coverageRadius: 15,
                    locationGeo: { type: 'Point', coordinates: [72.8877, 19.0860] }
                }
            ]
        );

        // Test Case 2: Medical Emergency (should prioritize medical NGOs)
        await runTestCase(
            "Medical Emergency (SOS)",
            {
                ticketId: 'TEST_MEDICAL_SOS',
                name: 'Hospital Overflow',
                helpTypes: ['medical'],
                requestedQuantities: {
                    food: 0,
                    medical: 30,
                    transport: 0,
                    shelter: 0
                },
                isSOS: true,
                locationGeo: { type: 'Point', coordinates: [72.8777, 19.0760] }
            },
            [
                {
                    user: new mongoose.Types.ObjectId(),
                    organizationName: 'Medical Team A',
                    areasOfWork: ['medical'],
                    availability: 'on-call',
                    foodCapacity: 0,
                    medicalTeamCount: 2,
                    vehiclesAvailable: 1,
                    coverageRadius: 20,
                    locationGeo: { type: 'Point', coordinates: [72.8787, 19.0770] }
                },
                {
                    user: new mongoose.Types.ObjectId(),
                    organizationName: 'Medical Team B',
                    areasOfWork: ['medical'],
                    availability: 'on-call',
                    foodCapacity: 0,
                    medicalTeamCount: 1,
                    vehiclesAvailable: 1,
                    coverageRadius: 15,
                    locationGeo: { type: 'Point', coordinates: [72.8987, 19.0960] }
                }
            ]
        );

        // Test Case 3: Mixed Needs (food + medical + transport)
        await runTestCase(
            "Mixed Needs (Food + Medical + Transport)",
            {
                ticketId: 'TEST_MIXED_NEEDS',
                name: 'Evacuation Center',
                helpTypes: ['food', 'medical', 'transport'],
                requestedQuantities: {
                    food: 100,
                    medical: 15,
                    transport: 40,
                    shelter: 0
                },
                isSOS: true,
                locationGeo: { type: 'Point', coordinates: [72.8777, 19.0760] }
            },
            [
                {
                    user: new mongoose.Types.ObjectId(),
                    organizationName: 'Relief Center A',
                    areasOfWork: ['food', 'medical'],
                    availability: 'full-time',
                    foodCapacity: 150,
                    medicalTeamCount: 1,
                    vehiclesAvailable: 0,
                    coverageRadius: 10,
                    locationGeo: { type: 'Point', coordinates: [72.8787, 19.0770] }
                },
                {
                    user: new mongoose.Types.ObjectId(),
                    organizationName: 'Transport Team',
                    areasOfWork: ['transport'],
                    availability: 'on-call',
                    foodCapacity: 0,
                    medicalTeamCount: 0,
                    vehiclesAvailable: 6,
                    coverageRadius: 25,
                    locationGeo: { type: 'Point', coordinates: [72.8987, 19.0960] }
                },
                {
                    user: new mongoose.Types.ObjectId(),
                    organizationName: 'Medical Specialists',
                    areasOfWork: ['medical'],
                    availability: 'on-call',
                    foodCapacity: 0,
                    medicalTeamCount: 2,
                    vehiclesAvailable: 1,
                    coverageRadius: 20,
                    locationGeo: { type: 'Point', coordinates: [72.8687, 19.0660] }
                }
            ]
        );

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();