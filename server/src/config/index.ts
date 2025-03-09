import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Throw error if required environment variables are missing
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
if (!process.env.UPLOAD_DIR) throw new Error('UPLOAD_DIR is required');
if (!process.env.S3_BUCKET) throw new Error('S3_BUCKET is required');
if (!process.env.S3_REGION) throw new Error('S3_REGION is required');
if (!process.env.R2_ACCOUNT_ID) throw new Error('R2_ACCOUNT_ID is required');
if (!process.env.R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID is required');
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY is required');

export default {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  UPLOAD_DIR: process.env.UPLOAD_DIR as string,
  S3_BUCKET: process.env.S3_BUCKET as string,
  S3_REGION: process.env.S3_REGION as string,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID as string,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID as string,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY as string,
  REGISTRATION_ENABLED: process.env.REGISTRATION_ENABLED === 'true',
};