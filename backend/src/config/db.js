const mongoose = require('mongoose');

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (isConnecting) return;
  isConnecting = true;

  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kare_ieee_workshop';

  // Auto fallback to local MongoDB if URI contains unreplaced placeholder <db_password>
  if (mongoURI.includes('<db_password>')) {
    console.warn('[Database Notice] MONGODB_URI contains unreplaced <db_password>. Falling back to local MongoDB (mongodb://127.0.0.1:27017/kare_ieee_workshop)');
    mongoURI = 'mongodb://127.0.0.1:27017/kare_ieee_workshop';
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    console.log(`[Database] MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed (${error.message}). Retrying in 5 seconds...`);
    setTimeout(connectDB, 5000);
  } finally {
    isConnecting = false;
  }
};

// Handle Mongoose disconnection events automatically
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB connection lost! Retrying connection...');
  setTimeout(connectDB, 3000);
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Connection Error]', err.message);
});

module.exports = connectDB;

