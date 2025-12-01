require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RegisteredNGO = require('../models/RegisteredNGO');
const Ticket = require('../models/Ticket');
const Dispatcher = require('../models/Dispatcher');

async function seedDB() {
    try {
        console.log('🌱 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected!');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await RegisteredNGO.deleteMany({});
        await Ticket.deleteMany({});
        await Dispatcher.deleteMany({});

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        // 1. Create Citizen
        console.log('👤 Creating Citizen...');
        const citizen = await User.create({
            name: 'John Citizen',
            email: 'citizen@test.com',
            password: password,
            role: 'citizen'
        });

        // 2. Create Authority
        console.log('👮 Creating Authority...');
        await User.create({
            name: 'City Authority',
            email: 'authority@test.com',
            password: password,
            role: 'authority'
        });

        // 3. Create NGO User & Profile
        console.log('🏥 Creating NGO...');
        const ngoUser = await User.create({
            name: 'Helping Hands',
            email: 'ngo@test.com',
            password: password,
            role: 'ngo'
        });

        const ngoProfile = await RegisteredNGO.create({
            user: ngoUser._id,
            organizationName: 'Helping Hands Foundation',
            contactPerson: 'Sarah Connor',
            phone: '+91 98765 43210',
            location: 'Mumbai, Maharashtra',
            locationGeo: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
            areasOfWork: ['food', 'medical', 'rescue'],
            availability: 'full-time',
            resources: '2 Ambulances, 1 Food Truck',
            registrationId: 'NGO/2024/001',
            foodCapacity: 500,
            medicalTeamCount: 2,
            vehiclesAvailable: 3,
            trucks: 1,
            ambulances: 2,
            coverageRadius: 20,
            dispatcherCount: 0
        });

        // 4. Create Dispatcher
        console.log('🚚 Creating Dispatcher...');
        const dispatcherUser = await User.create({
            name: 'Field Unit Alpha',
            email: 'dispatcher@test.com',
            password: password,
            role: 'dispatcher',
            parentNGO: ngoProfile._id
        });

        await Dispatcher.create({
            user: dispatcherUser._id,
            ngo: ngoProfile._id,
            dispatcherId: 'DISP-001',
            name: 'Field Unit Alpha',
            email: 'dispatcher@test.com',
            generatedPassword: 'password123', // Storing plain for reference in this seed
            isActive: true
        });

        // 5. Create Tickets
        console.log('🎫 Creating Tickets...');
        await Ticket.create([
            {
                ticketId: 'TKT-1001',
                name: 'Alice Smith',
                phone: '9988776655',
                location: { type: 'Point', coordinates: [72.8800, 19.0800] }, // Near NGO
                address: '123 Main St, Mumbai',
                helpTypes: ['medical'],
                status: 'active',
                priorityScore: 80,
                isSOS: true,
                createdBy: citizen._id
            },
            {
                ticketId: 'TKT-1002',
                name: 'Bob Jones',
                phone: '9988776644',
                location: { type: 'Point', coordinates: [72.9000, 19.1000] }, // Slightly further
                address: '456 Park Ave, Mumbai',
                helpTypes: ['food', 'water'],
                status: 'active',
                priorityScore: 50,
                isSOS: false,
                createdBy: citizen._id
            }
        ]);

        console.log('✨ Database seeded successfully!');
        console.log('-----------------------------------');
        console.log('🔑 Test Credentials (Password: password123)');
        console.log('Citizen:   citizen@test.com');
        console.log('NGO:       ngo@test.com');
        console.log('Authority: authority@test.com');
        console.log('Dispatcher: dispatcher@test.com');
        console.log('-----------------------------------');

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedDB();
