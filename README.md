# TraceLattice – Graph-Based Financial Fraud Detection System

A full-stack web application that detects suspicious financial transaction patterns by modeling transactions as a graph network.

## Prerequisites
- **Node.js**: Ensure Node.js is installed.
- **MongoDB**: Ensure MongoDB is installed and running locally on the default port `27017`.

## How to Run the Application

The application consists of two parts: the backend server and the frontend React application. You need to run both concurrently.

### 1. Start the Backend Server
Open a terminal, navigate to the `backend` directory, and run the server:
```bash
cd backend
npm install   # Install dependencies (only needed the first time)
node server.js
```
The backend server will start on `http://localhost:5000`.

### 2. Start the Frontend Application
Open a new, separate terminal, navigate to the `frontend` directory, and start the Vite development server:
```bash
cd frontend
npm install   # Install dependencies (only needed the first time)
npm run dev
```
The frontend application will be accessible at `http://localhost:5173`.

### 3. Usage
- Open your browser and navigate to `http://localhost:5173/`.
- Go to the **Upload Data** page to upload a CSV dataset of transactions. A sample `test.csv` is provided in the `backend` folder for convenience.
- Go to the **Dashboard** page to view the graph visualization and see any detected fraudulent patterns.
