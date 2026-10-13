# Backend Setup

The backend requires Node.js 22.13 or newer and uses SQLite for persistent accounts and bookings.

1. Copy `.env.example` to `.env`.
2. Set `JWT_SECRET` to at least 32 random bytes. On macOS, generate one with `openssl rand -base64 48`.
3. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters. Registration only creates regular user accounts.
4. Start the project from the workspace root with `npm run dev`.

The SQLite database defaults to `backend/data/bookky.sqlite`; override it with `DATABASE_PATH`. Keep `.env` and the database file private. In production, serve the frontend and API from the same site over HTTPS so the HttpOnly, Secure, SameSite=Strict session cookie is sent correctly.

Roles are enforced by the API: users can create, view, and cancel their own bookings; admins can list all bookings and update booking statuses. The JWT expires after eight hours. The admin account is provisioned from the environment on backend startup.