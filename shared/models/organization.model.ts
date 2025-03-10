import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface OrganizationMember {
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface OrganizationDocument extends Document {
  organizationId: string;
  organizationName: string;
  organizationDescription: string;
  members: OrganizationMember[];
  createdAt: Date;
}

const OrganizationMemberSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    required: true
  }
});

const OrganizationSchema = new Schema<OrganizationDocument>({
  organizationId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
  organizationName: {
    type: String,
    required: true,
  },
  organizationDescription: {
    type: String,
    required: true,
  },
  members: [OrganizationMemberSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);