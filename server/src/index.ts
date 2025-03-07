// Register module aliases
import 'module-alias/register';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes';
import config from './config';
import { ensureUploadDir } from './utils/file.utils';
import { initRabbitMQ, closeRabbitMQ } from './config/rabbitmq';

// Initialize Express app
const app = express();

// Ensure upload directory exists
ensureUploadDir();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register all routes
app.use(routes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Connect to MongoDB and RabbitMQ
mongoose.connect(config.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Initialize RabbitMQ connection
    await initRabbitMQ();
    
    // Start server
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  
  // Close RabbitMQ connection
  await closeRabbitMQ();
  
  // Close MongoDB connection
  await mongoose.disconnect();
  
  console.log('Server shutdown complete');
  process.exit(0);
};

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;