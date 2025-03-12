import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export default {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dataset-cleaning',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '/tmp/uploads',
  S3_BUCKET: process.env.S3_BUCKET || 'your-dataset-bucket',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID as string,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID as string,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY as string,
};