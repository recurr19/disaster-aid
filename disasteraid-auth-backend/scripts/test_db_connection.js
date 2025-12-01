require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        // Mask password for logging
        const uri = process.env.MONGO_URI || '';
        const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
        console.log('Testing connection to:', maskedUri);

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Successfully connected to MongoDB Atlas!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
