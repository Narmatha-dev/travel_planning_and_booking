# Travel Planning & Booking System

A full-stack travel planning and booking application built with React.js, Vite, Express.js, and MySQL. This repository contains the frontend client and backend API for the Phase 1 project setup.

## Project Overview

This system allows users to:

- Search and compare travel destinations
- Plan trips with itineraries
- Book flights, hotels, and activities
- Manage bookings and reservations
- View travel details in a modern web interface

## Tech Stack

- Frontend: React.js + Vite + JavaScript
- Backend: Node.js + Express.js
- Database: MySQL
- Version Control: Git + GitHub

## Project Structure

```text
travel-planning-booking-system/
├── frontend/
│   ├── src/
│   └── package.json
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── scripts/
│   │   ├── setupDatabase.js
│   │   ├── verifyDatabase.js
│   │   └── validateSqlFiles.js
│   ├── server.js
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── verify.sql
│   └── README.md
├── .gitignore
├── README.md
└── .git/
```

## Prerequisites

Before starting, make sure you have the following installed:

- Node.js (v18 or newer recommended)
- npm
- Git
- MySQL (v8.0+ or MariaDB)
- VS Code

## Database Setup (Phase 3)

The system uses a relational MySQL database named `travel_booking_db` with 10 tables:
`users`, `destinations`, `packages`, `trips`, `trip_itineraries`, `bookings`, `payments`, `reviews`, `favorites`, and `notifications`.

### 1. Automated Setup via Node.js
Ensure your MySQL server is running, then run:

```bash
cd backend
npm run db:setup
```

### 2. Verification
To verify table records and relational integrity:

```bash
cd backend
npm run db:verify
```

To validate SQL syntax and table definitions offline:

```bash
cd backend
npm run db:validate
```

### 3. Direct SQL Execution
You can also execute the scripts directly using MySQL CLI or MySQL Workbench:
- `database/schema.sql` (Creates database and 10 tables)
- `database/seed.sql` (Loads sample records with bcrypt hashed passwords)
- `database/verify.sql` (Runs verification and integrity checks)

## Open in VS Code

Open the project root folder:

```text
c:\Users\priya\Downloads\travel_planning_and_booking
```

## Frontend Setup

From the project root, run:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open the local URL shown in the terminal, typically:

```text
http://localhost:5173/
```

## Backend Setup

From the project root, run:

```bash
cd backend
npm install
npm start
```

The API should run on:

```text
http://localhost:5000/
```

## Health Check & DB Status

- Backend health endpoint: `http://localhost:5000/api/health`
- Database schema status: `http://localhost:5000/api/db-status`

## Git Commands

Initialize the repository (if needed):

```bash
git init
git checkout -b main
```

Add and commit:

```bash
git add .
git commit -m "Create MySQL database schema"
```

Create a GitHub repository and push:

```bash
git remote add origin https://github.com/<your-username>/travel-planning-booking-system.git
git branch -M main
git push -u origin main
```

If you use GitHub CLI:

```bash
gh repo create travel-planning-booking-system --public --source=. --remote=origin --push
```

## Notes

- Powershell may block npm scripts on some Windows machines. If that happens, run commands through Command Prompt:

```bash
cmd /c "cd /d c:\Users\priya\Downloads\travel_planning_and_booking\frontend && npm run dev -- --host 0.0.0.0"
```

- Phase 3 implements the complete MySQL relational database schema with 10 tables, bcrypt security, foreign key constraints, and automation scripts.
- Do not proceed to Phase 4 until confirmation.
