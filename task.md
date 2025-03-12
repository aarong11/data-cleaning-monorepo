# Task Definition

Implement a **new user journey** for a data-focused SaaS AI company. The primary focus is to allow users to upload a CSV file that is processed by one or more AI models operating in a pipeline workflow. For this task, we will focus on a single pipeline step where the AI model cleans and sanitizes the input data, producing a new output file. The output file should contain:

- **Original values:** Retain the original field names (e.g., `name`, `address`).
- **Change metadata:** For each field, add a corresponding field (e.g., `name_changed`, `address_changed`) that indicates, as a boolean, whether the value was modified. For best compatibility, accept truthy values such as `True`, `False`, `true`, `false`, `0`, `1`.
  - A falsey value for `X_changed` indicates that the value of field X was not changed.
- **Updated values:** For each original field, if the model cleaned or parsed the field, provide an updated value. This field should have the same name as the original field with a `_new` suffix (e.g., `name_new`, `address_new`).

---

# CSV Assumptions

The CSV files are assumed to follow standard conventions, in particular [RFC 4180](https://datatracker.ietf.org/doc/html/rfc4180):

- **Delimiter:** Uses a comma (`,`) as the default delimiter.
- **Quoting:** Double quotes (`"`) enclose fields that contain special characters (commas, newlines, or quotes).
- **Escaping:** Double quotes within a field must be escaped by doubling them (i.e., `""`).
- **Uniformity:** Each row should have the same number of fields.
- **Newlines:** Records are terminated by newline characters (typically `\r\n`).

---

# User Journeys

## Dataset Cleaning

**Purpose:**  
Allow the user to upload a product dataset, triggering a back-end process that runs one or more AI models on the CSV file and produces a cleaned version.

**Steps:**

1. **Access and Initiation:**
   - After logging in and authenticating, users navigate to the "Dataset Cleaning" page.
   - The user initiates the process by clicking the **"NEW"** button.

2. **File Upload:**
   - The user is presented with an upload form that supports drag-and-drop functionality.
   - Only CSV files are accepted, and files must be **10GB or less**.
   - The uploaded CSV file will be referred to as the **ORIGINAL DATASET**.
   - The system should enforce file type filtering and file size limitations.

3. **Asynchronous Processing:**
   - Upon upload, one or more back-end worker processes will asynchronously process and clean the data.
   - The cleaning process involves running the data through a pipeline of AI models (for this task, focus on a single pipeline step).

4. **Output:**
   - The processed output is a **CLEANED DATASET** that includes:
     - Original values.
     - Change metadata (e.g., `X_changed`).
     - Updated values (e.g., `X_new`).

5. **Transition to Review:**
   - Once processing is complete, the initiating user and any other users in the same organization can access the review process for the dataset.

---

## Review Process

**Purpose:**  
Allow users to validate the changes made by the AI models by reviewing each record in the cleaned dataset.

**Steps:**

1. **Record Listing:**
   - After entering the review process, the user sees a list of records from the CLEANED DATASET.
   - Each record displays all fields, including both original and updated values.

2. **Field Validation:**
   - For every field that has been updated (i.e., where the corresponding `X_changed` is truthy), the user is prompted to verify whether the new value is correct.
   - Both the original and new values should be presented for clarity.

3. **User Feedback:**
   - If the user finds that an updated value is incorrect, they have the option to add a comment explaining why the change is not acceptable.
   - This feedback could be used for further refinement of the AI models or to adjust the cleaning process.

4. **Final Output:**
   - Once all records have been reviewed and validated, the user can download a results file.
   - This results file retains the same structure as the original file but replaces values with the AI-generated outputs that were confirmed during the review process.

---

# Technical Components

## Frontend

- **Technologies:**  
  - **Language:** TypeScript  
  - **Frameworks/Libraries:** React, Tailwind CSS, Docker

- **Key Packages:**
  - **File Upload Handling:**  
    - Use libraries like `resumable.js` to support error handling during file upload and to allow resumption of interrupted uploads.

---

## Databases

- **MongoDB:**  
  - Used to store and represent jobs that need to be processed by the data cleaning workers.
  - MySQL or Postgre for storing the users, organizational information etc

---

## Data Cleaning Worker

- **Technologies:**
  - **Language:** TypeScript
  - **Packages:**  
    - **amqplib:** For job queue interactions.
  - **Deployment:**  
    - Runs inside a Docker container.

- **Description:**  
  A worker service that:
  - Listens for jobs on the queue.
  - Processes the data cleaning task using the AI models.
  - Returns the processed results back to the system.

---

## Backend / API Components

- **Technologies:**
  - **Language:** TypeScript
  - **Frameworks:** Express (for the API)
  - **Deployment:** Docker container

- **Key Packages:**
  - **Express:** For creating the API endpoints.
  - **MongoDB:** For data persistence.
  - **amqplib:**  
    - Interacts with RabbitMQ for dispatching and processing jobs.
  - **csv-parser:**  
    - Efficiently handles CSV processing in a streaming manner.

---

## Authentication and User Management

- **Authentication:**  
  - Likely implemented using a relational (PostgreSQL, MySQL) or NoSQL (MongoDB) database.
- **Manage Organizations:**  
  - Functionality for associating users with organizations.
- **Manage Users:**  
  - Capabilities for adding, removing, and assigning users to organizations.

---

## File Upload & Storage

- **Upload Handling:**  
  - Use **resumable.js** to manage large file uploads, handle errors, and enable resumable uploads using the HTML5 File API.
- **Storage:**  
  - Utilize S3 or a similar cloud-backed storage solution to store the uploaded CSV files.

---

# Additional Considerations

- **Error Handling & Monitoring:**  
  - Implement robust error handling at each stage (upload, processing, review).
  - Log errors and provide user-friendly messages using Kibana / LAMP stack
- **Scalability:**  
  - The asynchronous processing pipeline (using RabbitMQ) should be designed to scale with increased workload.
- **User Experience:**  
  - Ensure progress indicators during long-running processes (e.g., file upload, processing, review).
  - Provide clear navigation and feedback during the review process.
- **Security:**  
  - Secure file uploads and data processing to protect sensitive information.
  - Implement proper authentication and authorization mechanisms.

---

This Markdown document now captures the detailed task definition, user journeys, and technical components with added context and clarifications.