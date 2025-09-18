import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import User from '../models/user.model.js';

const usersToSeed = [
  { email: 'd1@gmail.com', password: '12345678', role: 'DRIVER', fullName: 'Driver One' },
  { email: 'b3@gmail.com', password: '12345678', role: 'BUYER', fullName: 'Buyer Three' },
  { email: 'saman@gmail.com', password: '12345678', role: 'FARMER', fullName: 'Saman' },
  { email: 'a1@gmail.com', password: '12345678', role: 'ADMIN', fullName: 'Admin One' },
];

const seed = async () => {
  try {
    await connectDB();

    for (const u of usersToSeed) {
      const exists = await User.findOne({ email: u.email.toLowerCase().trim() });
      if (exists) {
        console.log(`Skipping existing: ${u.email}`);
        continue;
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(u.password, salt);
      const displayName = u.fullName || u.email.split('@')[0];
      const profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&rounded=true&size=128`;
      await User.create({
        email: u.email.toLowerCase().trim(),
        passwordHash,
        role: u.role,
        fullName: displayName,
        profilePic,
      });
      console.log(`Created ${u.role}: ${u.email}`);
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.connection.close();
  }
};

seed();


