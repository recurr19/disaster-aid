/**
 * Seed sample NGOs and a Ticket for testing the matching logic.
 * Usage:
 *   MONGO_URI="mongodb://localhost:27017/disasteraid" node scripts/seedAndTestMatching.js
 *
 * The script will:
 *  - remove any test NGOs/tickets with registrationId/ticketId starting with TEST_
 *  - insert 3 sample NGOs with different capacities and coverageRadius
 *  - insert 1 sample ticket near NGO #1
 *  - call utils/matching.matchTicket(ticket) and print results
 */

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const RegisteredNGO = require('../models/RegisteredNGO');
const Ticket = require('../models/Ticket');
const { matchTicket } = require('../utils/matching');
const { findOptimalMatches } = require('../utils/optimalMatching');

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disasteraid_auth';
  console.log('Connecting to', mongoUri);

  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Cleanup previous test data
    await RegisteredNGO.deleteMany({ registrationId: /^TEST_/ });
    await Ticket.deleteMany({ ticketId: /^TEST_/ });

    // Reference point: central location (example: an index point)
    // We'll use coordinates [72.8777, 19.0760] (Mumbai approx) as lng,lat
    const base = [72.8777, 19.0760];

    const ngos = [
      {
        user: new mongoose.Types.ObjectId(),
        organizationName: 'TEST Rapid Rescuers',
        contactPerson: 'Raghav',
        phone: '+919000000001',
        location: 'Locality A',
        areasOfWork: ['rescue', 'medical', 'transport'],
        availability: 'on-call',
        resources: 'boats, ambulances',
        registrationId: 'TEST_NGO_1',
        foodCapacity: 50,
        medicalTeamCount: 2,
        vehiclesAvailable: 3,
        coverageRadius: 5, // km
        locationGeo: { type: 'Point', coordinates: [base[0] + 0.005, base[1] + 0.002] } // ~0.5km offset
      },
      {
        user: new mongoose.Types.ObjectId(),
        organizationName: 'TEST Food Relief Org',
        contactPerson: 'Anita',
        phone: '+919000000002',
        location: 'Locality B',
        areasOfWork: ['food', 'shelter'],
        availability: 'full-time',
        resources: '200 food packets/day',
        registrationId: 'TEST_NGO_2',
        foodCapacity: 200,
        medicalTeamCount: 0,
        vehiclesAvailable: 1,
        coverageRadius: 20, // km
        locationGeo: { type: 'Point', coordinates: [base[0] + 0.1, base[1] + 0.05] } // ~10km offset
      },
      {
        user: new mongoose.Types.ObjectId(),
        organizationName: 'TEST Distant Helpers',
        contactPerson: 'Kumar',
        phone: '+919000000003',
        location: 'Locality C',
        areasOfWork: ['medical', 'food', 'transport'],
        availability: 'part-time',
        resources: 'mobile clinic once/day',
        registrationId: 'TEST_NGO_3',
        foodCapacity: 20,
        medicalTeamCount: 1,
        vehiclesAvailable: 0,
        coverageRadius: 100, // km
        locationGeo: { type: 'Point', coordinates: [base[0] + 0.5, base[1] + 0.3] } // ~50km offset
      }
    ];

    // Insert NGOs
    const created = await RegisteredNGO.insertMany(ngos);
    console.log('Inserted NGOs:', created.map(n => ({ name: n.organizationName, id: n._id })));

    // Ensure indexes (2dsphere) exist before running geo queries
    try {
      await RegisteredNGO.createIndexes();
      console.log('RegisteredNGO indexes ensured');
    } catch (ixErr) {
      console.warn('Could not create RegisteredNGO indexes:', ixErr.message || ixErr);
    }

    // Create a sample ticket close to TEST_NGO_1
    const sampleTicket = new Ticket({
      ticketId: 'TEST_TICKET_1',
      name: 'Sulochana',
      phone: '+919999999999',
      address: '3rd floor, Building X, Locality A',
      landmark: 'Near Temple',
      adults: 20,
      children: 10,
      elderly: 2,
      helpTypes: ['food', 'medical'],
      medicalNeeds: ['insulin'],
      description: 'Multiple people trapped, urgent medical and food required',
      isSOS: true,
      status: 'active',
      locationGeo: { type: 'Point', coordinates: [base[0] + 0.006, base[1] + 0.0025] } // very close to NGO 1
    });

    await sampleTicket.save();
    console.log('Inserted ticket:', sampleTicket.ticketId);

    // Run matching
    console.log('\nRunning matching for ticket:', sampleTicket.ticketId);
    const matches = await matchTicket(sampleTicket.toObject(), { avgSpeedKmph: 25, maxResults: 10 });

    console.log('\nAll potential matches:');
    console.log(JSON.stringify(matches, null, 2));

    // Find optimal matches
    const optimalMatches = findOptimalMatches(sampleTicket, matches);
    
    console.log('\nOPTIMAL MATCHING SOLUTION:');
    console.log('Primary NGO:');
    console.log(JSON.stringify(optimalMatches.primary, null, 2));
    
    if (optimalMatches.secondary.length > 0) {
        console.log('\nSecondary NGOs needed:');
        optimalMatches.secondary.forEach((ngo, index) => {
            console.log(`\nSecondary NGO #${index + 1}:`);
            console.log(JSON.stringify(ngo, null, 2));
        });
    }

    console.log('\nCoverage Summary:');
    console.log(`Total Food Capacity: ${optimalMatches.totalFoodCapacity} people`);
    console.log(`Total Medical Teams: ${optimalMatches.totalMedicalTeams}`);
    console.log(`Food needs covered: ${optimalMatches.coverageDetails.foodCovered ? 'Yes' : 'No'}`);
    console.log(`Medical needs covered: ${optimalMatches.coverageDetails.medicalCovered ? 'Yes' : 'No'}`);
    console.log(`Total people that can be served: ${optimalMatches.coverageDetails.peopleCapacity}`);

    console.log('\nDone. If you want to re-run the script, it will clean up previous TEST_* entries first.');

    process.exit(0);
  } catch (err) {
    console.error('Error in seed/test script:', err);
    process.exit(1);
  }
}

main();
