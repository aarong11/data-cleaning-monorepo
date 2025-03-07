import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { parse } from 'csv-parse';
import AWS from 'aws-sdk';

// Configure the AWS SDK
const s3 = new AWS.S3({
  region: config.S3_REGION
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
export const saveToS3 = async (
  localFilePath: string,
  filename: string
): Promise<string> => {
  const fileContent = fs.readFileSync(localFilePath);
  
  const params = {
    Bucket: config.S3_BUCKET,
    Key: filename,
    Body: fileContent,
  };
  
  const uploadResult = await s3.upload(params).promise();
  
  // Clean up the local file after upload
  fs.unlinkSync(localFilePath);
  
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