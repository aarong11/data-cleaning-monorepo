# Dataset Cleaning Service

A scalable microservices-based solution for uploading, processing, and reviewing datasets using AI models for data cleaning. The service supports large CSV file uploads, asynchronous processing, and a structured review workflow.

## Architecture Overview

The service consists of three main components:

1. **API Server**: Handles HTTP requests, file uploads, and user interactions
2. **Worker Service**: Processes datasets using AI models
3. **Shared Library**: Common types and utilities used across services

### Technology Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: MongoDB
- **Message Queue**: RabbitMQ
- **File Storage**: AWS S3
- **Containerization**: Docker + Docker Compose

## Services

### API Server

The API server provides RESTful endpoints for:
- File uploads (up to 10GB)
- Dataset management
- Processing triggers
- Review workflow
- Progress tracking

[API Server Documentation](./server/README.md)

### Worker Service

The worker service handles:
- Asynchronous dataset processing
- AI model integration
- File transformations
- Status updates

[Worker Service Documentation](./worker/README.md)

### Shared Library

Common code shared between services:
- TypeScript interfaces
- Data models
- Utility functions
- Configuration types

[Shared Library Documentation](./shared/README.md)

## Getting Started

### Prerequisites

- Node.js 18 or later
- Docker and Docker Compose
- MongoDB
- RabbitMQ
- AWS S3 access (or compatible storage service)

### Environment Setup

1. Clone the repository
2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables:
```bash
# Create .env files in server and worker directories
cp server/.env.example server/.env
cp worker/.env.example worker/.env
```

4. Start services using Docker Compose:
```bash
docker-compose up
```

### Development

Each service can be run independently in development mode:

```bash
# API Server
cd server
npm run dev

# Worker Service
cd worker
npm run dev
```

## Data Flow

1. **Upload**: User uploads a CSV file through the API
2. **Storage**: File is temporarily stored and then uploaded to S3
3. **Processing**: Worker receives processing job via RabbitMQ
4. **AI Cleaning**: Data is processed and cleaned by AI models
5. **Review**: User reviews and approves/rejects changes
6. **Finalization**: Approved changes are saved to final dataset

## API Documentation

The API provides endpoints for:

- Dataset Management
  - Upload
  - List
  - Delete
  - Process
- Review Process
  - List Records
  - Submit Reviews
  - Track Progress
  - Complete Review

Detailed API documentation is available in [API Documentation](../server/API_DOCUMENTATION.md)

## Project Structure

```
├── docs/              # Documentation
│   ├── server/       # API server docs
│   ├── worker/       # Worker service docs
│   └── shared/       # Shared library docs
├── server/           # API Server
│   ├── src/         # Source code
│   ├── scripts/     # Utilities
│   └── tests/       # Test files
├── worker/           # Processing Worker
│   ├── src/         # Source code
│   └── tests/       # Test files
├── shared/           # Shared Library
│   └── types/       # TypeScript types
└── docker-compose.yml # Service configuration
```

## Deployment

The service is containerized and can be deployed using Docker Compose or Kubernetes:

### Docker Compose Deployment

```bash
# Production deployment
docker-compose up -d --build
```

### Scaling Workers

```bash
# Scale worker instances
docker-compose up -d --scale worker=3
```

## Security

- JWT-based authentication
- File upload validation
- S3 secure storage
- Rate limiting
- Input sanitization

## Monitoring

The service includes:
- RabbitMQ management interface
- MongoDB monitoring
- Application logs
- Error tracking

## License

Commercial - All Rights Reserved

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

For detailed contribution guidelines, see CONTRIBUTING.md