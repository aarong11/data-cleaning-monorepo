# Server Service

The server service is a REST API that handles dataset uploads, management, and processing requests. It's built with Express.js and TypeScript.

## Features

- File upload handling (supports files up to 10GB)
- Dataset management (CRUD operations)
- Authentication middleware
- Message queue integration with RabbitMQ
- MongoDB database integration
- AWS S3 integration for file storage

## Tech Stack

- Node.js + TypeScript
- Express.js
- MongoDB (via Mongoose)
- RabbitMQ (via amqplib)
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

3. Initialize the database:
```bash
npm run init-db
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm run build
npm start

# Docker
npm run docker-start
```

## API Documentation

The API documentation is available in the root directory's `spec.md` file. The service implements:

- Dataset upload and management
- Processing triggers
- Review and validation endpoints
- Progress tracking

## Project Structure

```
server/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Express middleware
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── scripts/          # Database initialization scripts
└── tests/           # Test files
```