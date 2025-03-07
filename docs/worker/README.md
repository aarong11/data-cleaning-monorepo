# Worker Service

The worker service is responsible for processing uploaded datasets using AI models. It consumes messages from RabbitMQ queues and performs dataset cleaning operations.

## Features

- Asynchronous dataset processing
- RabbitMQ message consumption
- AWS S3 integration for file access
- MongoDB integration for status updates
- Dataset cleaning and transformation

## Tech Stack

- Node.js + TypeScript
- RabbitMQ (via amqplib)
- MongoDB (via Mongoose)
- AWS SDK for S3 operations

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the worker:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Project Structure

```
worker/
├── src/
│   ├── config/       # Configuration files
│   ├── models/       # MongoDB models
│   └── utils/        # Utility functions
└── tests/           # Test files
```

## Message Queue Integration

The worker listens for the following events:
- Dataset upload notifications
- Processing requests
- Cleanup requests

Each event triggers specific processing pipelines for dataset cleaning and transformation.