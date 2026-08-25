const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../frontend/backend/.env') });

const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');

const clearAllData = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://prashanthireddy0220_db_user:Koti0220@cluster0.ngoftht.mongodb.net/?appName=Cluster0';

  console.log('[Clear Script] Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('[Clear Script] Connected to MongoDB.');

  const rRes = await Registration.deleteMany({});
  const pRes = await Payment.deleteMany({});
  const tRes = await Ticket.deleteMany({});
  const aRes = await Attendance.deleteMany({});
  const cRes = await Certificate.deleteMany({});

  console.log(`[Clear Script] Deleted ${rRes.deletedCount} Registrations`);
  console.log(`[Clear Script] Deleted ${pRes.deletedCount} Payments`);
  console.log(`[Clear Script] Deleted ${tRes.deletedCount} Tickets`);
  console.log(`[Clear Script] Deleted ${aRes.deletedCount} Attendances`);
  console.log(`[Clear Script] Deleted ${cRes.deletedCount} Certificates`);

  console.log('[Clear Script] All previous registrations deleted successfully!');
  process.exit(0);
};

clearAllData().catch(err => {
  console.error('[Clear Script Error]', err);
  process.exit(1);
});
