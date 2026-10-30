# MediCare — MERN Appointment Booking

A full-stack starter for patient, doctor, and admin workflows using MongoDB, Express, React, and Node.js.

## Features
- Role-based registration/login (patient, doctor, admin)
- JWT authentication and protected routes
- Doctor directory with name/specialty/location filters
- Appointment requests with server-side double-booking checks
- Patient dashboard: upcoming/past appointments, cancellation
- Doctor dashboard: appointment requests, accept/decline, patient notes
- Admin dashboard: approve doctors and remove users
- Email confirmations on booking/cancellation when SMTP is configured
- Responsive layout

> This is a development starter, not a certified clinical system. Before real patient use, add security review, audit logging, consent/privacy controls, backups, rate limiting, monitoring, and applicable legal/compliance checks. Do not store sensitive clinical records in an unreviewed deployment.

## Requirements
- Node.js 20+
- MongoDB local instance or MongoDB Atlas
- Optional SMTP account for email

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
# Edit MONGO_URI, JWT_SECRET, and optional SMTP values
npm install
npm run dev
```
Server defaults to `http://localhost:5000`.

### 2. Create the first admin
```bash
cd server
npm run create-admin
```
Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env` first.

### 3. Frontend
In another terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## Important environment variables
See `server/.env.example`. `VITE_API_URL` can be set for a deployed API. Never commit `.env`.

## API overview
- `POST /api/auth/register` — patient or doctor registration
- `POST /api/auth/login`
- `GET /api/doctors?search=&specialty=&location=`
- `GET /api/doctors/:id/slots?date=YYYY-MM-DD`
- `POST /api/appointments` — authenticated patient requests a slot
- `GET /api/appointments/mine`
- `PATCH /api/appointments/:id/cancel`
- `GET /api/doctor/appointments`
- `PATCH /api/doctor/appointments/:id/status`
- `PATCH /api/doctor/appointments/:id/notes`
- `GET /api/admin/users`
- `PATCH /api/admin/doctors/:id/approve`
- `DELETE /api/admin/users/:id`

Appointments use a simple 30-minute slot model. The server rejects conflicting active appointments for the same doctor and start time. Configure the UI's slot list and business rules to match your real clinic.
