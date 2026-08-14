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
├── backend/
├── .gitignore
├── README.md
└── .git/
```

## Prerequisites

Before starting, make sure you have the following installed:

- Node.js (v18 or newer recommended)
- npm
- Git
- MySQL (for future phases)
- VS Code

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

## Health Check

Backend health endpoint:

```text
http://localhost:5000/api/health
```

## Git Commands

Initialize the repository (if needed):

```bash
git init
git checkout -b main
```

Add and commit:

```bash
git add .
git commit -m "Initial project setup"
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

- Phase 1 focuses on project structure, frontend/backend initialization, Git setup, and successful verification.
- Phase 2 will begin only after confirmation.
