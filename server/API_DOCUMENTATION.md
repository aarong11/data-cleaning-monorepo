# Dataset Cleaning API Documentation

This API provides endpoints for uploading, processing, reviewing, and cleaning datasets.

## Authentication

All API endpoints require JWT authentication. Include the JWT token in the Authorization header as follows:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Upload Dataset

Upload a new dataset file for processing.

- **URL**: `/datasets/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: The dataset file to upload (CSV format recommended)

**Response**:
```json
{
  "datasetId": "string",
  "status": "uploaded",
  "filename": "string",
  "size": 12345,
  "link": "string",
  "uploadedAt": "2023-01-01T00:00:00.000Z"
}
```

### List Datasets

Get a list of all datasets uploaded by the authenticated user.

- **URL**: `/datasets`
- **Method**: `GET`
- **Query Parameters**:
  - `limit` (optional): Maximum number of datasets to return (default: 10)
  - `offset` (optional): Number of datasets to skip for pagination (default: 0)

**Response**:
```json
{
  "datasets": [
    {
      "datasetId": "string",
      "status": "uploaded",
      "filename": "string",
      "size": 12345,
      "link": "string",
      "uploadedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Dataset Details

Get detailed information about a specific dataset.

- **URL**: `/datasets/{datasetId}`
- **Method**: `GET`
- **Path Parameters**:
  - `datasetId`: The ID of the dataset

**Response**:
```json
{
  "datasetId": "string",
  "status": "uploaded",
  "filename": "string",
  "size": 12345,
  "link": "string",
  "uploadedAt": "2023-01-01T00:00:00.000Z"
}
```

### Delete Dataset

Delete a dataset that hasn't been processed yet.

- **URL**: `/datasets/{datasetId}`
- **Method**: `DELETE`
- **Path Parameters**:
  - `datasetId`: The ID of the dataset

**Response**:
```json
{
  "message": "Dataset deleted successfully."
}
```

### Start Processing

Initiate AI-based processing on an uploaded dataset.

- **URL**: `/datasets/{datasetId}/process`
- **Method**: `POST`
- **Path Parameters**:
  - `datasetId`: The ID of the dataset to process

**Response**:
```json
{
  "datasetId": "string",
  "status": "processing",
  "message": "Dataset cleaning has started."
}
```

### List Records

Retrieve records from a processed dataset for review.

- **URL**: `/datasets/{datasetId}/records`
- **Method**: `GET`
- **Path Parameters**:
  - `datasetId`: The ID of the dataset
- **Query Parameters**:
  - `limit` (optional): Maximum number of records to return (default: 10)
  - `offset` (optional): Number of records to skip for pagination (default: 0)

**Response**:
```json
{
  "records": [
    {
      "index": 0,
      "field1": "original value",
      "field1_changed": true,
      "field1_new": "suggested value"
      // Additional fields from the dataset
    }
  ]
}
```

### Submit Review Decision

Submit a review decision for a specific record.

- **URL**: `/datasets/{datasetId}/records/{index}/review`
- **Method**: `POST`
- **Path Parameters**:
  - `datasetId`: The ID of the dataset
  - `index`: The index of the record
- **Request Body**:
```json
{
  "approved": true,
  "comments": "Optional comments about the decision"
}
```

**Response**:
```json
{
  "message": "Review submitted successfully."
}
```

### Get Review Progress

Check the progress of the review for a dataset.

- **URL**: `/datasets/{datasetId}/progress`
- **Method**: `GET`
- **Path Parameters**:
  - `datasetId`: The ID of the dataset

**Response**:
```json
{
  "datasetId": "string",
  "totalRecords": 1000,
  "reviewedRecords": 250,
  "progress": 25
}
```

### Complete Review

Mark a dataset review as complete when all records have been reviewed.

- **URL**: `/datasets/{datasetId}/complete`
- **Method**: `POST`
- **Path Parameters**:
  - `datasetId`: The ID of the dataset

**Response**:
```json
{
  "message": "Review process completed successfully."
}
```

## Status Values

Datasets can have the following status values:

- `uploaded`: Dataset has been uploaded but not processed
- `processing`: Dataset is currently being processed by AI
- `processed`: Dataset processing is complete and ready for review
- `reviewing`: Dataset is being reviewed
- `completed`: Review process has been finalized

## Error Responses

The API may return the following error responses:

- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## Examples

### Upload a dataset

```bash
curl -X POST \
  http://localhost:3000/api/datasets/upload \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/your/dataset.csv'
```

### Get list of datasets

```bash
curl -X GET \
  http://localhost:3000/api/datasets \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```