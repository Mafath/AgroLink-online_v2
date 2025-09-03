# AgroLink-online version 2

Minimal Auth (email/password + roles) implemented.

Backend
- Base URL: `http://localhost:5001`
- Env required:
  - `PORT=5001`
  - `MONGODB_URI=mongodb://...`
  - `JWT_SECRET=your-strong-secret`
  - `JWT_EXPIRES_IN=1h` (optional)

Auth API
- POST `/api/auth/signup`
  - Body: `{ email, password, role? }` where role is `FARMER` or `BUYER` (default `BUYER`).
  - 201: `{ id, email, role }`
  - 409 on duplicate email; 400 on validation errors.

- POST `/api/auth/signin`
  - Body: `{ email, password }`
  - 200: `{ accessToken, user: { id, email, role } }`
  - Use header `Authorization: Bearer <accessToken>` for protected routes.

- GET `/api/auth/me`
  - Requires bearer token
  - 200: `{ id, email, role }`

- POST `/api/auth/logout`
  - 200: `{ message: "Logged out" }` (client discards token)

- Example ADMIN-only route: GET `/api/auth/admin/ping` (requires `ADMIN` role)

Frontend
- Minimal pages: `/signup`, `/login`, `/profile`
- Token stored in memory via axios default header; no long-term storage.

Run
- Backend: `cd backend && npm i && npm run dev`
- Frontend: `cd frontend && npm i && npm run dev`