import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { parse } from 'csv-parse';
import { S3 } from 'aws-sdk';

/**
 * S3 client configured for Cloudflare R2 storage
 */
const s3 = new S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: config.S3_REGION,
});

/**
 * Ensures the upload directory exists, creating it if needed
 */
export const ensureUploadDir = (): void => {
  if (!fs.existsSync(config.UPLOAD_DIR)) {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  }
};

/**
 * Generates a unique filename for an uploaded file
 * 
 * @param originalFilename - The original name of the uploaded file
 * @returns A unique filename with the original extension preserved
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const fileExtension = path.extname(originalFilename);
  const fileName = path.basename(originalFilename, fileExtension);
  return `${fileName}-${uuidv4()}${fileExtension}`;
};

/**
 * Uploads a file buffer to S3/R2 storage
 * 
 * @param fileBuffer - The buffer containing file data
 * @param filename - The name to use for the stored file
 * @returns Promise resolving to the URL of the uploaded file
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  filename: string
): Promise<string> => {
  const params = {
    Bucket: config.S3_BUCKET,
    Key: filename,
    Body: fileBuffer
  };
  
  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
};

/**
 * Parses a CSV file into an array of record objects
 * 
 * @param filePath - Path to the CSV file on the local filesystem
 * @returns Promise resolving to an array of parsed records
 */
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

/**
 * Processes records with AI to clean and transform data
 * Note: This is currently a mock implementation
 * 
 * @param records - Array of record objects to process
 * @returns Promise resolving to an array of objects containing original records and suggested changes
 */
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

/**
 * Creates a readable stream for downloading a file from S3/R2 storage
 * 
 * @param fileUrl - The URL of the file in S3/R2 storage
 * @returns Promise resolving to a readable stream of the file data
 */
export const getFileStreamFromS3 = async (fileUrl: string): Promise<NodeJS.ReadableStream> => {
  // Extract bucket and key from URL
  const url = new URL(fileUrl);
  const pathname = url.pathname.substring(1); // remove leading slash
  const parts = pathname.split('/');
  const bucketName = parts[0];
  const objectKey = parts.slice(1).join('/');
  
  const params = {
    Bucket: bucketName,
    Key: objectKey
  };
  
  const stream = s3.getObject(params).createReadStream();
  return stream;
};