// filepath: /Users/a/projects/data-cleaning-monorepo/worker/src/models/user.model.ts
import mongoose, { Schema } from 'mongoose';
import { User } from 'shared/types';

// Define the user schema
const userSchema = new Schema<User>({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

// Create and export the user model
export default mongoose.model<User>('User', userSchema);