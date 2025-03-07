import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export default {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dataset-cleaning',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '/tmp/uploads',
  S3_BUCKET: process.env.S3_BUCKET || 'your-dataset-bucket',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
};