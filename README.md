# Project Setup

This document provides instructions for setting up and running the frontend and backend services for this project.

## Backend Setup

To get the backend server running, follow these steps:

### 1. Navigate to the Backend Directory
```bash
cd backend-template
```

### 2. Install Dependencies
Install the necessary Node.js dependencies using either npm or yarn:
```bash
npm install
```
or
```bash
yarn install
```

### 3. Create Environment File
Create a `.env` file in the `backend-template` directory. This file will store your environment-specific configurations.

```bash
touch .env
```

Add the following environment variables to the `.env` file. Replace the placeholder values with your actual configuration.

```env
# Server Configuration
PORT=3001

# Database Configuration (choose one)
DB_CLIENT=sqlite # or mysql, postgres, mssql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=database_name

# For SQLite, you can simply use:
DB_STORAGE=database.sqlite

# JWT Secret for Token-Based Authentication
JWT_SECRET=your_jwt_secret_key
```

### 4. Run the Server
Once the dependencies are installed and the `.env` file is configured, you can start the backend server:

```bash
npm start
```
or
```bash
yarn start
```

The backend server should now be running on the port specified in your `.env` file (e.g., `http://localhost:3001`).

## Frontend Setup

To get the frontend application running, follow these steps:

### 1. Navigate to the Frontend Directory
```bash
cd frontend-template
```

### 2. Install Dependencies
Install the necessary Node.js dependencies using either npm or yarn:
```bash
npm install
```
or
```bash
yarn install
```

### 3. Create Environment File
Create a `.env` file in the `frontend-template` directory.

```bash
touch .env
```

Add the following environment variable to the `.env` file. This variable should point to the URL of your running backend server.

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Run the Development Server
Once the dependencies are installed and the `.env` file is configured, you can start the frontend development server:

```bash
npm run dev
```
or
```bash
yarn dev
```

The frontend application should now be accessible in your web browser, typically at `http://localhost:5173`.