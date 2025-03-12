# Dataset Cleaning API

A TypeScript/Node.js/Express API for uploading, processing, reviewing, and cleaning datasets using MongoDB as the database.

## Features

- Upload datasets (CSV files)
- AI-powered dataset cleaning and processing
- Record-by-record review system
- Track review progress
- JWT authentication for API security

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas cloud instance)
- AWS S3 account for file storage (or modify to use local storage)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (create a `.env` file):

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dataset-cleaning
JWT_SECRET=your-secret-key
UPLOAD_DIR=/tmp/uploads
S3_BUCKET=your-dataset-bucket
S3_REGION=us-east-1
```

## Development

Run the development server:

```bash
npm run dev
```

## Build for Production

```bash
npm run build
```

## Start Production Server

```bash
npm start
```

## API Documentation

See the [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) file for detailed information about all endpoints.

## Project Structure

```
src/
  ├── config/          # Application configuration
  ├── controllers/     # Route controllers
  ├── middleware/      # Express middleware
  ├── models/          # MongoDB models
  ├── routes/          # Express routes
  ├── services/        # Business logic
  ├── types/           # TypeScript types and interfaces
  ├── utils/           # Utility functions
  └── index.ts         # Application entry point
```

## Authentication

The API uses JWT token authentication. All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Dataset Processing Flow

1. User uploads a dataset (CSV file) → Status: `uploaded`
2. User initiates processing → Status: `processing`
3. System processes the dataset with AI cleaning → Status: `processed`
4. User reviews suggested changes record by record → Status: `reviewing`
5. User marks review as complete → Status: `completed`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## License

MIT