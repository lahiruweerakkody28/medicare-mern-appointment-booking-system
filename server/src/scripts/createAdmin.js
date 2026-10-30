import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicare');
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
  process.exit(1);
}
const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
  console.log('An account with that email already exists.');
} else {
  await User.create({ name: process.env.ADMIN_NAME || 'System Admin', email, password, role: 'admin', approved: true });
  console.log(`Admin account created: ${email}`);
}
await mongoose.disconnect();
