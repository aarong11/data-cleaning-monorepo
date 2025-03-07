import mongoose, { Schema } from 'mongoose';
import { UserModel } from 'shared/models';

// Define the user schema
const userSchema = new Schema<typeof UserModel>({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

// Create and export the user model
export default UserModel;