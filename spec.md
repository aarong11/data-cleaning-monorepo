# **Dataset Cleaning API Documentation**

## **1. File Upload & Dataset Management**

### **Upload Dataset**
**Endpoint:** `POST /api/datasets/upload`  
**Description:** Uploads a CSV file for processing. Supports resumable uploads.  

#### **Request:**
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`

- **Body (Form Data):**
  | Field     | Type    | Required | Description                   |
  |----------|--------|----------|-------------------------------|
  | `file`   | File   | ✅        | CSV file (≤ 10GB)             |

#### **Response (200 OK):**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "uploaded",
  "filename": "products.csv",
  "size": 2048576
}
```

---

### **List User Datasets**
**Endpoint:** `GET /api/datasets`  
**Description:** Retrieves a list of datasets uploaded by the authenticated user.  

#### **Request:**
- **Headers:**
  - `Authorization: Bearer <token>`

- **Query Parameters (optional):**
  | Parameter | Type   | Required | Description                        |
  |-----------|--------|----------|------------------------------------|
  | `limit`   | Number | ❌        | Number of datasets to return (default: 10) |
  | `offset`  | Number | ❌        | Pagination offset |

#### **Response (200 OK):**
```json
{
  "datasets": [
    {
      "datasetId": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "products.csv",
      "status": "processed",
      "link": "s3://org-name/bucketname/a.csv",
      "uploadedAt": "2025-03-06T12:00:00Z"
    },
    {
      "datasetId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "filename": "users.csv",
      "link": "s3://org-name/bucketname/a.csv",
      "status": "processing",
      "uploadedAt": "2025-03-05T10:30:00Z"
    }
  ]
}
```

---

### **Get Dataset Details**
**Endpoint:** `GET /api/datasets/:datasetId`  
**Description:** Retrieves metadata and status for a specific dataset.  

#### **Path Parameters:**
  | Parameter   | Type   | Required | Description          |
  |------------|--------|----------|----------------------|
  | `datasetId` | UUID  | ✅        | Unique dataset ID |

#### **Response (200 OK):**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "products.csv",
  "link": "s3://org-name/bucketname/a.csv",
  "status": "processed",
  "size": 2048576,
  "uploadedAt": "2025-03-06T12:00:00Z"
}
```

---

### **Delete Dataset**
**Endpoint:** `DELETE /api/datasets/:datasetId`  
**Description:** Deletes a dataset if it hasn’t been processed yet.  

#### **Path Parameters:**
  | Parameter   | Type   | Required | Description |
  |------------|--------|----------|-------------|
  | `datasetId` | UUID  | ✅        | Unique dataset ID |

#### **Response (200 OK):**
```json
{
  "message": "Dataset deleted successfully."
}
```

---

## **2. Data Processing**

### **Trigger Data Cleaning**
**Endpoint:** `POST /api/datasets/:datasetId/process`  
**Description:** Starts dataset cleaning using the AI model.  

#### **Path Parameters:**
  | Parameter   | Type   | Required | Description |
  |------------|--------|----------|-------------|
  | `datasetId` | UUID  | ✅        | Unique dataset ID |

#### **Response (200 OK):**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Dataset cleaning has started."
}
```

---


# **Revised API Documentation (Using Record Indices)**

## **3. Review & Validation (Index-Based)**

### **List Records for Review**
**Endpoint:** `GET /api/review/:datasetId/records`  
**Description:** Retrieves paginated records for review, referencing each record by its index.  

#### **Path Parameters:**
| Parameter   | Type   | Required | Description |
|------------|--------|----------|-------------|
| `datasetId` | UUID  | ✅        | Unique dataset ID |

#### **Response (200 OK):**
```json
{
  "records": [
    {
      "index": 0,
      "name": "John Doe",
      "name_changed": true,
      "name_new": "Johnathan Doe",
      "email": "john@example.com",
      "email_changed": false
    },
    {
      "index": 1,
      "name": "Jane Smith",
      "name_changed": false,
      "email": "jane.smith@example.com",
      "email_changed": true,
      "email_new": "jsmith@example.com"
    }
  ]
}
```

---

### **Submit Review Decision**
**Endpoint:** `POST /api/review/:datasetId/records/:index`  
**Description:** User approves/rejects AI-modified values with optional comments.  

#### **Path Parameters:**
| Parameter   | Type    | Required | Description |
|------------|--------|----------|-------------|
| `datasetId` | UUID   | ✅        | Unique dataset ID |
| `index`     | Number | ✅        | Index of the record (starting at 0) |

#### **Request Body:**
```json
{
  "approved": true,
  "comments": "Looks good."
}
```

#### **Response (200 OK):**
```json
{
  "message": "Review submitted successfully."
}
```

---

### **Check Review Progress**
**Endpoint:** `GET /api/review/:datasetId/progress`  
**Description:** Retrieves the percentage of records reviewed.  

#### **Path Parameters:**
| Parameter   | Type   | Required | Description |
|------------|--------|----------|-------------|
| `datasetId` | UUID  | ✅        | Unique dataset ID |

#### **Response (200 OK):**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "totalRecords": 1000,
  "reviewedRecords": 500,
  "progress": 50
}
```

---

### **Finalize Review**
**Endpoint:** `POST /api/review/:datasetId/complete`  
**Description:** Marks dataset review as complete.  

#### **Path Parameters:**
| Parameter   | Type   | Required | Description |
|------------|--------|----------|-------------|
| `datasetId` | UUID  | ✅        | Unique dataset ID |

#### **Response (200 OK):**
```json
{
  "message": "Review process completed successfully."
}
```

---

### **Advantages of Index-Based Record Access in Review**
- **Natural ordering** makes sense for datasets where review occurs sequentially.
- **Efficient storage and retrieval** since datasets are processed in batches.
- **Better user experience** since users navigate records linearly.
- **Lower complexity** compared to storing UUIDs for individual records.

This update ensures **reviewing datasets is intuitive and performant** while still maintaining **UUID-based dataset tracking**. Let me know if you'd like any tweaks! 🚀