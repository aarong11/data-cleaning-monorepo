/**
 * Database Initialization Script
 * 
 * This script initializes the MongoDB database for the dataset cleaning service.
 * It creates the required collections and indexes.
 * 
 * Usage: ts-node init-database.ts [mongodb-uri]
 */

import mongoose from 'mongoose';
import readline from 'readline';

// Default connection URI (can be overridden via command line argument)
const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/dataset-cleaning';

// Create readline interface for user prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Initialize database collections and indexes
 */
async function initializeDatabase(uri: string): Promise<boolean> {
  try {
    console.log(`Connecting to MongoDB at ${uri}...`);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Create Dataset schema and model (for reference only, Mongoose will create this automatically)
    const DatasetSchema = new mongoose.Schema({
      datasetId: {
        type: String,
        required: true,
        unique: true,
      },
      status: {
        type: String,
        enum: ['uploaded', 'processing', 'processed', 'reviewing', 'completed'],
        default: 'uploaded',
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      link: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },
      userId: {
        type: String,
        required: true,
      },
    });
    
    // Create Record schema and model (for reference only, Mongoose will create this automatically)
    const RecordSchema = new mongoose.Schema({
      datasetId: {
        type: String,
        required: true,
        index: true
      },
      index: {
        type: Number,
        required: true
      },
      data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      changes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      reviewed: {
        type: Boolean,
        default: false
      },
      approved: {
        type: Boolean,
        default: undefined
      },
      comments: {
        type: String
      }
    });

    // Create collections manually (even though Mongoose would create them on first use)
    console.log('Creating collections...');
    await mongoose.connection.createCollection('datasets');
    await mongoose.connection.createCollection('records');
    console.log('Collections created.');

    // Create indexes manually (even though they are defined in the Mongoose schemas)
    console.log('Creating indexes...');
    
    // Indexes for datasets collection
    await mongoose.connection.collection('datasets').createIndex(
      { datasetId: 1 }, 
      { unique: true }
    );
    await mongoose.connection.collection('datasets').createIndex(
      { userId: 1 }
    );

    // Indexes for records collection
    await mongoose.connection.collection('records').createIndex(
      { datasetId: 1, index: 1 }, 
      { unique: true }
    );
    await mongoose.connection.collection('records').createIndex(
      { datasetId: 1 }
    );
    
    console.log('Indexes created successfully.');
    console.log('\nDatabase initialization completed successfully.');
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Get MongoDB URI from command line, environment variable, or use default
const mongoUri = process.argv[2] || process.env.MONGODB_URI || DEFAULT_MONGO_URI;

// Check if running in Docker/CI environment or with --no-prompt flag
const isRunningInDocker = process.env.DOCKER_ENV === 'true';
const isNoPrompt = process.argv.includes('--no-prompt');

if (isRunningInDocker || isNoPrompt) {
  // Run without prompting in Docker/CI environments
  console.log(`Automatically initializing database at ${mongoUri} (non-interactive mode)`);
  initializeDatabase(mongoUri).then((success) => {
    if (success) {
      console.log(`
======================================================
Database initialized successfully at: ${mongoUri}
======================================================
The following collections were created:
- datasets: For storing dataset metadata
- records: For storing individual records from datasets

The following indexes were created:
- datasets.datasetId (unique)
- datasets.userId
- records.datasetId_index (unique compound)
- records.datasetId
======================================================
`);
    }
    // Process exits automatically when script completes
  });
} else {
  // Interactive mode with user confirmation
  rl.question(`Initialize database at ${mongoUri}? (y/n) `, async (answer) => {
    if (answer.toLowerCase() === 'y') {
      const success = await initializeDatabase(mongoUri);
      if (success) {
        console.log(`
======================================================
Database initialized successfully at: ${mongoUri}
======================================================
The following collections were created:
- datasets: For storing dataset metadata
- records: For storing individual records from datasets

The following indexes were created:
- datasets.datasetId (unique)
- datasets.userId
- records.datasetId_index (unique compound)
- records.datasetId
======================================================
`);
      }
    } else {
      console.log('Database initialization cancelled.');
    }
    rl.close();
  });
}