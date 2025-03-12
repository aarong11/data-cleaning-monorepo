import * as amqp from 'amqplib';
import { QUEUES } from 'shared';

// RabbitMQ connection URL - can be loaded from environment variables
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Connection singleton
let connection: any | null = null;
let channel: amqp.Channel | null = null;

/**
 * Initialize RabbitMQ connection
 */
export const initRabbitMQ = async (): Promise<void> => {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    connection = conn;
    
    const ch = await conn.createChannel();
    channel = ch;
    
    // Ensure queues exist
    await ch.assertQueue(QUEUES.DATASET_PROCESSING, {
      durable: true // Queue survives broker restart
    });
    
    console.log('RabbitMQ connection established successfully');
    
    // Handle connection close
    conn.on('close', () => {
      console.log('RabbitMQ connection closed');
      channel = null;
      connection = null;
      // Attempt to reconnect after a delay
      setTimeout(initRabbitMQ, 5000);
    });
    
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Attempt to reconnect after a delay
    setTimeout(initRabbitMQ, 5000);
  }
};

/**
 * Send a message to a queue
 */
export const sendToQueue = async <T>(queueName: string, data: T): Promise<boolean> => {
  try {
    if (!channel) {
      console.error('RabbitMQ channel not available');
      return false;
    }
    
    const result = channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(data)),
      {
        persistent: true // Message survives broker restart
      }
    );
    
    return result;
  } catch (error) {
    console.error(`Error sending to queue ${queueName}:`, error);
    return false;
  }
};

/**
 * Close RabbitMQ connection
 */
export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await (connection as any).close();
    }
    
    channel = null;
    connection = null;
    
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};

// Export types for job messages
export interface DatasetProcessingJob {
  datasetId: string;
  userId: string;
  filePath: string;
}