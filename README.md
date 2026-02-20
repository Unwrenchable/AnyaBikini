# AnyaBikini
Website for a beautiful bikini company

Local development (backend + frontend)

1. Copy the server env example and set real keys:

```bash
cp server/.env.example server/.env
# edit server/.env and fill JWT_SECRET, INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID, STRIPE_SECRET_KEY
```

2. Install server dependencies and start the server:

```bash
cd server
npm install
npm run dev
```

3. Open the site in your browser (frontend served from the project root):

```
http://localhost:3000/
```

Notes
- Instagram integration uses the Instagram Basic Display API and requires an access token + user id.
- Stripe Checkout requires `STRIPE_SECRET_KEY` on the server; the publishable key should be set in `server/.env` as `STRIPE_PUBLISHABLE_KEY` (the frontend reads it from `/api/config`).
- Authentication is a simple email/password + JWT cookie stored HTTP-only by the server.

Admin
- Set `ADMIN_TOKEN` in `server/.env` to a secure value. Use `admin.html` to view users and orders by providing the token.

Example `server/.env` additions:

```env
ADMIN_TOKEN=really_long_random_string_here
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

