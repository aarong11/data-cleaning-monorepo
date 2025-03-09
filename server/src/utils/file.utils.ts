import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { parse } from 'csv-parse';
import { S3 } from 'aws-sdk';

// Configure S3 client for R2
const s3 = new S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: config.S3_REGION,
});

// Ensure upload directory exists
export const ensureUploadDir = (): void => {
  if (!fs.existsSync(config.UPLOAD_DIR)) {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  }
};

// Generate a unique filename for uploaded files
export const generateUniqueFilename = (originalFilename: string): string => {
  const fileExtension = path.extname(originalFilename);
  const fileName = path.basename(originalFilename, fileExtension);
  return `${fileName}-${uuidv4()}${fileExtension}`;
};

// Save a file to S3 and return the link
export const uploadToS3 = async (
  fileBuffer: Buffer,
  filename: string
): Promise<string> => {
  const params = {
    Bucket: config.S3_BUCKET,
    Key: filename,
    Body: fileBuffer
  };

  console.log(params);

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
};

// Parse CSV file and return records
export const parseCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (record) => {
        records.push(record);
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        resolve(records);
      });
  });
};

// Process records with AI cleaning (mock implementation)
export const processRecordsWithAI = async (
  records: any[]
): Promise<{ original: any, changes: any }[]> => {
  // This would be replaced with actual AI processing logic
  return records.map(record => {
    // Simulate AI changes - in a real system, this would be your AI model
    const changes: { [key: string]: any } = {};
    
    // Mock: Process name field if it exists (example)
    if (record.name && typeof record.name === 'string') {
      if (record.name.toLowerCase() === record.name || record.name.toUpperCase() === record.name) {
        changes.name = record.name.charAt(0).toUpperCase() + record.name.slice(1).toLowerCase();
      }
    }
    
    // Mock: Process email field if it exists (example)
    if (record.email && typeof record.email === 'string' && !record.email.includes('@')) {
      changes.email = `${record.email}@example.com`;
    }
    
    return {
      original: record,
      changes
    };
  });
};