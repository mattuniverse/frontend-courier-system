# CourierPro — Frontend

React 18 + Vite + TailwindCSS frontend for the Courier & Parcel Management System.

## Setup

```bash
cp .env.example .env
# Edit VITE_API_BASE_URL if your backend isn't on localhost:8000

npm install
npm run dev
```

Open: http://localhost:5173

## Features

- Staff login with JWT auth
- Dashboard with live stats
- Parcel booking with full form
- Parcel list with search & status filter
- Parcel detail with tracking history & status updates
- Customer management (admin-only add/delete)
- Courier management with toggle status
- Branch management
- User management (admin-only)
- Public tracking page (no auth)

## Tech Stack

- React 18
- Vite
- TailwindCSS
- Axios
- Recharts
