## **1. Core Entities**

### **1.1 Dataset**
- **Description:** A dataset represents a CSV file uploaded by the user that contains tabular data to be cleaned by the AI model.
- **Usage:**  
  - Created when a user uploads a file.
  - Processed by the AI pipeline to clean data.
  - Reviewed by the user before finalization.
- **Developer Perspective:**  
  - Think of a dataset as a **versioned data object** that moves through different states (`uploaded → processing → processed → reviewed → finalized`).
  - Stored in a **database** with metadata (file size, status, timestamps).
  - Large datasets should be **stream-processed** rather than loaded fully into memory.

**Example Representation:**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "products.csv",
  "status": "processed",
  "size": 2048576,
  "uploadedAt": "2025-03-06T12:00:00Z",
  "createdAt": ""
}
```

---

### **1.2 Record**
- **Description:** A record is a **single row** from the dataset that contains multiple fields.
- **Usage:**  
  - Each record is independently processed by the AI model.
  - Users review records individually to validate AI-generated changes.
- **Developer Perspective:**  
  - Think of a record as a **document** in a database or a **row** in a table.
  - Records should be **indexed numerically** for efficient pagination and sequential navigation.
  - Unlike datasets, records do not have persistent UUIDs, as they are **ephemeral** in the review process.

**Example Representation:**
```json
{
  "index": 0,
  "name": "John Doe",
  "name_changed": true,
  "name_new": "Johnathan Doe",
  "email": "john@example.com",
  "email_changed": false
}
```

---

### **1.3 Field**
- **Description:** A field is an **individual data point** (column) within a record.
- **Usage:**  
  - The AI model evaluates each field and determines if it needs cleaning.
  - If a field is changed, additional metadata (`_changed` and `_new`) is added.
- **Developer Perspective:**  
  - Think of fields as **key-value pairs** in a structured data format (like JSON).
  - The AI system needs **custom rules** for each type of field (e.g., parsing dates, correcting names, normalizing addresses).
  - Fields must be **consistently named** across datasets.

**Example Representation:**
```json
{
  "name": "John Doe",
  "name_changed": true,
  "name_new": "Johnathan Doe"
}
```

---

## **2. Processing Entities**

### **2.1 Processing Job**
- **Description:** A processing job represents an asynchronous task that runs the AI model on a dataset.
- **Usage:**  
  - Created when a dataset is submitted for cleaning.
  - Runs in the background and updates status (`queued`, `processing`, `completed`).
- **Developer Perspective:**  
  - Think of a processing job as a **long-running background task**.
  - Uses a **message queue (e.g., RabbitMQ, Kafka)** to distribute workload.
  - Should support **idempotency** to handle re-runs safely.

**Example Representation:**
```json
{
  "jobId": "ae4fce08-df4b-4321-9d78-5d8b39eb302a",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "startedAt": "2025-03-06T12:05:00Z",
  "finishedAt": "",
  "errors": []
}
```

---

### **2.2 Review Decision**
- **Description:** A review decision represents a user’s validation of an AI-generated change.
- **Usage:**  
  - Users either accept or reject changes made to a record.
  - Can include optional comments explaining the decision.
- **Developer Perspective:**  
  - Think of a review decision as a **user-generated event** that updates the record state.
  - Should be stored separately from the dataset for **auditability**.
  - Requires **transactional consistency** to ensure no partial reviews are committed.

**Example Representation:**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "recordIndex": 0,
  "approved": true,
  "comments": "Looks good."
}
```

---

### **2.3 Review Progress**
- **Description:** Tracks how much of a dataset has been reviewed.
- **Usage:**  
  - Helps users know how much work remains.
  - Enables system features like progress bars.
- **Developer Perspective:**  
  - Think of review progress as a **computed property** rather than a static database entry.
  - Should be updated **incrementally** to avoid performance overhead.

**Example Representation:**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "totalRecords": 1000,
  "reviewedRecords": 500,
  "progress": 50
}
```

---

## **3. Supporting Entities**

### **3.1 User**
- **Description:** Represents an authenticated user interacting with the system.
- **Usage:**  
  - Required for accessing datasets and submitting reviews.
- **Developer Perspective:**  
  - Think of a user as an **actor** within the system with access permissions.
  - Uses **JWT authentication** for session management.

**Example Representation:**
```json
{
  "userId": "98b6a978-d26b-4db6-a392-d2739a24b41e",
  "email": "user@example.com",
  "role": "admin"
}
```

---

### **3.2 Organization**
- **Description:** Represents a collection of users working on datasets together.
- **Usage:**  
  - Users can share datasets within an organization.
  - Determines access control and permissions.
- **Developer Perspective:**  
  - Think of an organization as a **tenant** in a multi-tenant SaaS model.
  - Should support **role-based access control (RBAC)**.

**Example Representation:**
```json
{
  "orgId": "c4d5e1a6-bb2b-4428-8a4d-1b9f9f97a2d3",
  "name": "AI Data Corp",
  "members": ["98b6a978-d26b-4db6-a392-d2739a24b41e"]
}
```

---

## **Final Summary**
| Entity | Description | Used For | How Developers Should Think About It |
|--------|------------|----------|-------------------------------------|
| **Dataset** | A CSV file uploaded for cleaning | File storage & processing | A versioned object with different states |
| **Record** | A single row in the dataset | AI processing & user review | An ephemeral data object indexed numerically |
| **Field** | A single value in a record | AI cleaning & change tracking | A structured key-value pair with metadata |
| **Processing Job** | AI pipeline execution | Asynchronous data transformation | A background task with queue management |
| **Review Decision** | User feedback on AI changes | Validation workflow | A user-generated event with audit tracking |
| **Review Progress** | Tracks review completion | UI progress tracking | A computed property updated incrementally |
| **User** | An authenticated system user | Access control & security | An actor with specific permissions |
| **Organization** | A group of users sharing datasets | Multi-user collaboration | A tenant in a multi-tenant system |

---

### **Developer Takeaways**
- **Datasets** are permanent objects, while **records** are temporary.
- **UUIDs** are used for persistent entities (**datasets, users, organizations**), while **indices** are used for ephemeral ones (**records**).
- The **processing pipeline** is event-driven and should be designed for **asynchronous execution**.
- The **review process** is a sequential workflow and benefits from **index-based navigation**.