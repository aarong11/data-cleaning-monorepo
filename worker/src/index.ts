import amqp from 'amqplib';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import AWS from 'aws-sdk';
import { DatasetProcessingJob, QUEUES } from 'shared/types';
import { parseCSV, processRecordsWithAI } from './utils/file.utils';
import DatasetModel from './models/dataset.model';
import RecordModel from './models/record.model';

// Load environment variables
dotenv.config();

// Configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/upload-service';

// Configure AWS S3
const s3 = new AWS.S3({
  region: process.env.S3_REGION || 'us-east-1'
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Worker connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Download file from S3
async function downloadFromS3(fileUrl: string, localPath: string): Promise<void> {
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

  try {
    const { Body } = await s3.getObject(params).promise();
    require('fs').writeFileSync(localPath, Body);
    console.log(`File downloaded to ${localPath}`);
  } catch (error) {
    console.error('Error downloading from S3:', error);
    throw error;
  }
}

// Process a dataset job
async function processDataset(job: DatasetProcessingJob) {
  console.log(`Processing dataset: ${job.datasetId}`);
  
  // Get dataset from database
  const dataset = await DatasetModel.findOne({ datasetId: job.datasetId });
  if (!dataset) {
    console.error(`Dataset ${job.datasetId} not found`);
    return;
  }

  try {
    // Download file from S3
    const localFilePath = path.join('/tmp', path.basename(dataset.link));
    await downloadFromS3(dataset.link, localFilePath);
    
    // Parse CSV file
    const records = await parseCSV(localFilePath);
    
    // Process records with AI
    const processedRecords = await processRecordsWithAI(records);
    
    // Save results to database
    const recordDocuments = processedRecords.map((record, index) => ({
      datasetId: job.datasetId,
      index,
      data: record.original,
      changes: record.changes,
      reviewed: false
    }));
    
    await RecordModel.insertMany(recordDocuments);
    
    // Update dataset status
    dataset.status = 'processed';
    await dataset.save();
    
    console.log(`Dataset ${job.datasetId} processed successfully with ${records.length} records`);
  } catch (error) {
    console.error(`Error processing dataset ${job.datasetId}:`, error);
    
    // Update dataset status to error
    dataset.status = 'error';
    await dataset.save();
  }
}

// Main worker function
async function startWorker() {
  // Connect to MongoDB
  await connectToMongoDB();
  
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    // Make sure queue exists
    await channel.assertQueue(QUEUES.DATASET_PROCESSING, {
      durable: true // Queue survives broker restart
    });
    
    // Set prefetch to 1 to process one message at a time
    await channel.prefetch(1);
    
    console.log(`Worker waiting for messages in queue: ${QUEUES.DATASET_PROCESSING}`);
    
    // Consume messages
    channel.consume(QUEUES.DATASET_PROCESSING, async (msg) => {
      if (msg) {
        try {
          const job: DatasetProcessingJob = JSON.parse(msg.content.toString());
          console.log(`Received job for dataset: ${job.datasetId}`);
          
          // Process the dataset
          await processDataset(job);
          
          // Acknowledge the message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          
          // Negative acknowledge the message to requeue it
          channel.nack(msg, false, true);
        }
      }
    });
    
    // Handle connection closure
    connection.on('close', () => {
      console.error('RabbitMQ connection closed');
      process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Worker shutting down...');
      await channel.close();
      await connection.close();
      await mongoose.disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Worker shutting down...');
      await channel.close();
      await connection.close();
      await mongoose.disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker().catch((error) => {
  console.error('Worker startup failed:', error);
  process.exit(1);
});