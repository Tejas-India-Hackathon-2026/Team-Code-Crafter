# WorkerConnect

WorkerConnect is a local-services platform that connects customers with verified skilled workers for home services, bookings, location-based discovery, and realtime chat.

## Features

- Customer and worker registration/login
- Admin password-only login from the footer
- Worker search by skill, name, and location
- GPS-based worker discovery with distance filtering
- Default location: Patna, Bihar
- Location presets for Patna, Jamui, and Lakhisarai, Bihar
- Worker profiles, ratings, reviews, and availability status
- Customer booking requests and worker approval workflow
- Chat between customer and worker before booking
- Booking chat after a booking is created
- Admin dashboard for worker verification, bookings, and email logs
- Socket.IO realtime notifications and chat
- JSON file persistence in `server/data/database.json`

## Tech Stack

- React 18
- Vite
- Express
- Socket.IO
- Tailwind CSS
- Leaflet and React Leaflet
- bcryptjs and JSON Web Tokens
- Node.js 20 or newer recommended

## Project Structure

```text
src/                    React frontend
src/components/         Reusable UI components
src/context/            Auth, location, and notification state
src/pages/              Main application pages
server/                 Express and Socket.IO backend
server/routes/          API route modules
server/config/          Storage and seed data
server/data/             Local JSON database
server/test/             End-to-end test script
```

## Installation

```bash
npm install
```

Create a local environment file from `.env.example`:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Set a strong value for `JWT_SECRET` in `.env` before using the app outside local development.

## Run The Application

Start frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run server
npm run client
```

The frontend normally runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Demo Accounts

### Admin

- Login: click **Admin Login** in the footer
- Password: `skillconect12@`
- Registered admin email: `admin@workerconnect.com`

The admin email is stored on the server and is not requested on the admin login page.

### Customer

- Email: `priya.customer@example.com`
- Password: `customer123`

### Approved Worker

- Email: `rahul.electrician@example.com`
- Password: `worker123`

### Pending Worker

- Email: `vikram.painter@example.com`
- Password: `worker123`

## Location And Workers

The default location is Patna, Bihar. Use the location selector to choose:

- Patna, Bihar
- Jamui, Bihar
- Lakhisarai, Bihar

The seeded Bihar workers are:

- Ravi Kumar, Electrician, Jamui
- Pankaj Sharma, Plumber, Lakhisarai

Both workers are approved and available in the home page search.

## Chat Flow

1. Open a worker profile as a customer.
2. Select **Chat Before Booking**.
3. The app creates a separate inquiry conversation without creating a booking.
4. The worker can reply from the **Customer Messages** section in the worker dashboard.
5. Booking chat remains available after a booking is created.

## Useful Commands

```bash
npm run build    # Build the frontend for production
npm run preview  # Preview the production build
npm test         # Run the backend end-to-end test
```

## Local Data Reset

The application stores local data in `server/data/database.json`. The admin dashboard includes a **Reset Demo Seeds** action for restoring the seeded demo state.

Do not commit real passwords, SMTP credentials, JWT secrets, or production database credentials.

## Troubleshooting

### Port 5000 is already in use

Stop the existing Node process or run the server with another port:

```powershell
$env:PORT=5001; npm run server
```

### MongoDB/DNS connection errors

Check the database connection settings and network access. For local demo usage, verify that the configured persistence mode and `.env` values match your environment.

### GPS does not work

Allow location access in the browser. If permission is unavailable, select Patna, Jamui, or Lakhisarai manually from the location selector.
