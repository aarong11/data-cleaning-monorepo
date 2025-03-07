export default {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dataset-cleaning',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '/tmp/uploads',
  S3_BUCKET: process.env.S3_BUCKET || 'your-dataset-bucket',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
};