# Project Setup Algorithm

## Prerequisites

- Node.js (v18+ recommended)
- Docker & Docker Compose
- AWS Credentials (for S3 uploads)

## 1. Backend Setup

The backend handles file processing, database interactions, and background workers.

### Steps:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` directory with the following content:

    ```env
    DATABASE_URL=postgres://postgres:password@localhost:5433/backend_db
    REDIS_HOST=localhost
    REDIS_PORT=6380
    PORT=5000

    # AWS Configuration
    AWS_REGION=ap-south-1
    AWS_ACCESS_KEY_ID=AKIAWV7SKEBJSSWCS6OC
    AWS_SECRET_ACCESS_KEY=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
    # The user can fill this in with their actual bucket name
    AWS_BUCKET_NAME=flatirons-bhavesh

    MAX_CONCURRENCY=4
    ```

4.  **Start Infrastructure (Postgres & Redis):**
    ```bash
    docker compose up
    ```
    *Note: You may want to run this in a separate terminal or use `docker compose up -d` to run in detached mode.*

5.  **Start the API Server:**
    In a new terminal (inside `backend` directory):
    ```bash
    npm run start:api
    ```

6.  **Start the Background Worker:**
    In another new terminal (inside `backend` directory):
    ```bash
    npm run start:worker
    ```

---

## 2. Frontend Setup

The frontend provides the user interface for uploading files and viewing products.

### Steps:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Development Server:**
    ```bash
    npm run dev
    ```

4.  **Access the Application:**
    Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).
