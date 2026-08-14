# Travel Planning & Booking System

A full-stack travel planning and booking application built with React.js, Vite, Express.js, and MySQL.

## Project Overview

This system allows users to:

- Search and compare travel destinations
- Plan trips with day-by-day itineraries
- Book packages, hotels, flights, and activities
- Manage bookings, reservations, and wishlist favorites
- View travel details in a modern responsive interface

## Tech Stack

- **Frontend**: React.js + Vite + React Router + CSS3
- **Backend**: Node.js + Express.js
- **Database**: MySQL (InnoDB, UTF-8 MB4)
- **Security**: BCrypt password hashing, CORS, environment isolation
- **Version Control**: Git + GitHub

## Project Structure

```text
travel-planning-booking-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── environment.js
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── healthController.js
│   │   │   ├── authController.js
│   │   │   ├── destinationController.js
│   │   │   ├── packageController.js
│   │   │   ├── tripController.js
│   │   │   └── bookingController.js
│   │   ├── middleware/
│   │   │   ├── logger.js
│   │   │   ├── notFoundHandler.js
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── userModel.js
│   │   │   ├── destinationModel.js
│   │   │   ├── packageModel.js
│   │   │   ├── tripModel.js
│   │   │   └── bookingModel.js
│   │   ├── routes/
│   │   │   ├── healthRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── destinationRoutes.js
│   │   │   ├── packageRoutes.js
│   │   │   ├── tripRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── destinationService.js
│   │   │   ├── packageService.js
│   │   │   ├── tripService.js
│   │   │   └── bookingService.js
│   │   ├── utils/
│   │   │   ├── apiResponse.js
│   │   │   └── asyncHandler.js
│   │   └── server.js
│   ├── scripts/
│   │   ├── setupDatabase.js
│   │   ├── verifyDatabase.js
│   │   └── validateSqlFiles.js
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
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

- Node.js (v18 or newer recommended)
- npm
- Git
- MySQL (v8.0+ or MariaDB)

## Backend Setup (Phase 4)

From the project root:

```bash
cd backend
npm install
npm start
```

Backend API will start on: `http://localhost:5000/`

### Health Check API
- **Endpoint**: `GET http://localhost:5000/api/health`
- **Response**:
```json
{
  "status": "success",
  "message": "Travel Booking API is running"
}
```

## Database Setup (Phase 3)

The system uses a relational MySQL database named `travel_booking_db` with 10 tables:
`users`, `destinations`, `packages`, `trips`, `trip_itineraries`, `bookings`, `payments`, `reviews`, `favorites`, and `notifications`.

```bash
# Automated setup (creates schema and seeds records)
cd backend
npm run db:setup

# Verify tables & relations
npm run db:verify

# Offline SQL syntax & schema validation
npm run db:validate
```

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Frontend runs on: `http://localhost:5173/`

## Git Commands

Stage and commit changes:

```bash
git add .
git commit -m "Setup Node Express backend"
```
