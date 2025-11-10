/**
 * Test multi-NGO matching with a large group request
 * Usage: MONGO_URI="mongodb://localhost:27017/disasteraid" node scripts/testMultiAssign.js
 */

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const RegisteredNGO = require('../models/RegisteredNGO');
const Ticket = require('../models/Ticket');
const { findNGOCombinations } = require('../utils/multiAssignMatching');

async function main() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disasteraid_auth';
    console.log('Connecting to', mongoUri);

    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        // Cleanup previous test data
        await RegisteredNGO.deleteMany({ registrationId: /^MULTI_TEST_/ });
        await Ticket.deleteMany({ ticketId: /^MULTI_TEST_/ });

        // Create test NGOs with different capacities
        const ngos = [
            {
                user: new mongoose.Types.ObjectId(),
                organizationName: 'MULTI_TEST Food Bank A',
                contactPerson: 'Amit',
                phone: '+919000000010',
                location: 'District 1',
                areasOfWork: ['food'],
                availability: 'full-time',
                registrationId: 'MULTI_TEST_NGO_1',
                foodCapacity: 100,        // Can feed 100 people
                medicalTeamCount: 0,
                vehiclesAvailable: 1,
                coverageRadius: 10,
                locationGeo: { type: 'Point', coordinates: [72.8777, 19.0760] }
            },
            {
                user: new mongoose.Types.ObjectId(),
                organizationName: 'MULTI_TEST Food Bank B',
                contactPerson: 'Priya',
                phone: '+919000000011',
                location: 'District 2',
                areasOfWork: ['food'],
                availability: 'full-time',
                registrationId: 'MULTI_TEST_NGO_2',
                foodCapacity: 150,        // Can feed 150 people
                medicalTeamCount: 0,
                vehiclesAvailable: 2,
                coverageRadius: 15,
                locationGeo: { type: 'Point', coordinates: [72.8877, 19.0860] }
            },
            {
                user: new mongoose.Types.ObjectId(),
                organizationName: 'MULTI_TEST Medical Team',
                contactPerson: 'Dr. Shah',
                phone: '+919000000012',
                location: 'District 1',
                areasOfWork: ['medical'],
                availability: 'on-call',
                registrationId: 'MULTI_TEST_NGO_3',
                foodCapacity: 0,
                medicalTeamCount: 3,      // 3 medical teams
                vehiclesAvailable: 2,
                coverageRadius: 20,
                locationGeo: { type: 'Point', coordinates: [72.8977, 19.0960] }
            }
        ];

        const created = await RegisteredNGO.insertMany(ngos);
        console.log('Inserted NGOs:', created.map(n => ({ name: n.organizationName, id: n._id })));

        // Create a large group request ticket
        const groupTicket = new Ticket({
            ticketId: 'MULTI_TEST_TICKET_1',
            name: 'Colony Secretary',
            phone: '+919999999990',
            address: 'Flood-affected Housing Colony, District 1',
            adults: 180,
            children: 70,
            elderly: 25,
            helpTypes: ['food', 'medical'],
            medicalNeeds: ['first-aid', 'chronic-care'],
            description: 'Large colony affected by flooding, need food and medical care',
            isSOS: true,
            requestedQuantities: {
                food: 275,      // Total people needing food
                medical: 20,    // Estimated medical cases
                transport: 0,
                shelter: 0
            },
            locationGeo: { 
                type: 'Point', 
                coordinates: [72.8827, 19.0810]  // Near both food banks
            }
        });

        await groupTicket.save();
        console.log('Created large group ticket:', groupTicket.ticketId);

        // Find NGO combinations that can fulfill the request
        console.log('\nFinding NGO combinations for the large group request...');
        const combinations = await findNGOCombinations(groupTicket.toObject());

        console.log('\nPossible NGO combinations (best first):');
        combinations.forEach((combo, i) => {
            console.log(`\nCombination ${i + 1} (total score: ${combo.totalScore.toFixed(1)}):`);
            combo.assignments.forEach(assignment => {
                console.log(`- ${assignment.ngo.organizationName}:`);
                console.log('  Assigned capacities:', assignment.assignedCapacities);
            });
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();