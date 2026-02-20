# AnyaBikini

>AnyaBikini is a modern e-commerce web app for a handcrafted swimwear brand. It features a Node.js/Express backend, a static HTML/CSS/JS frontend, Stripe payments, Instagram integration, and a simple admin panel.

---

## Features

- Beautiful, responsive storefront (HTML/CSS/JS)
- Product catalog (dynamic from server or static fallback)
- User authentication (email/password, JWT cookies)
- Shopping cart and checkout (Stripe integration)
- Instagram gallery (server fetches latest posts)
- Admin panel for orders, users, and product management
- Newsletter signup (front-end only)

---

## Local Development

### 1. Clone the repo and set up environment variables

```bash
git clone <your-repo-url>
cd AnyaBikini
cp server/.env.example server/.env
# Edit server/.env and fill in:
#   JWT_SECRET, ADMIN_TOKEN, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Start the server

```bash
# For development (auto-restart):
npm run dev
# Or for production:
npm start
```

### 4. Open the site

Go to [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## Environment Variables

See `server/.env.example` for all options. **Never commit your real `.env` file!**

Key variables:

- `JWT_SECRET` — Secret for signing JWTs (required)
- `ADMIN_TOKEN` — Token for admin endpoints (required for admin.html)
- `STRIPE_SECRET_KEY` — Stripe secret key (required for payments)
- `STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (frontend)
- `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_USER_ID` — For Instagram gallery (optional)
- `DATABASE_PATH` — Path to JSON DB (default: `./data/db.json`)
- `PORT` — Server port (default: 3000)

---

## Admin Panel

Open `admin.html` in your browser. Enter your `ADMIN_TOKEN` to view/manage users, orders, and products.

---

## Deployment Guide

### 1. Prepare your environment

- Provision a VPS, cloud instance, or use a platform like Heroku, Render, or Railway.
- Install Node.js (v18+ recommended) and npm.
- Set up a reverse proxy (e.g., Nginx) for HTTPS (recommended for production).

### 2. Set environment variables

- Copy `server/.env.example` to `server/.env` and fill in all secrets and keys.
- **Never commit `.env` to your repo.**

### 3. Install dependencies and build (if needed)

```bash
cd server
npm install
# (No build step needed for static frontend)
```

### 4. Start the server

```bash
# For production (use a process manager like pm2 or systemd):
npm start
# Example with pm2:
npm install -g pm2
pm2 start index.js --name anyabikini
```

### 5. Serve static files

- The server will serve the frontend from the project root by default.
- Ensure your reverse proxy (if used) points to the correct port (default: 3000).

### 6. Set up HTTPS (strongly recommended)

- Use Let's Encrypt or your provider's SSL tools.
- Redirect HTTP to HTTPS in your proxy config.

### 7. Monitor and update

- Use pm2, systemd, or your platform's tools to keep the server running and restart on failure.
- Pull updates and restart as needed.

---

## Example Nginx Reverse Proxy Config

This config will:
- Forward HTTPS traffic from your domain to the Node.js server (running on localhost:3000)
- Redirect all HTTP traffic to HTTPS
- Serve static files efficiently

```
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Example pm2 Setup

pm2 is a process manager for Node.js. It will:
- Keep your server running in the background
- Restart it if it crashes
- Make it easy to view logs and manage deployments

Install pm2 globally:
```bash
npm install -g pm2
```

Start your server:
```bash
cd server
pm2 start index.js --name anyabikini
```

To auto-start on reboot:
```bash
pm2 startup
pm2 save
```

View logs:
```bash
pm2 logs anyabikini
```

---

## Example Cloud Deployment (Render.com)

Render.com is a simple cloud platform for Node.js apps. This will:
- Deploy your app from GitHub
- Handle environment variables securely
- Provide HTTPS automatically

**Steps:**
1. Push your repo to GitHub (do not include .env)
2. Create a new Web Service on Render
3. Set the root directory to `/server`
4. Set the start command to `npm start`
5. Add all required environment variables in the Render dashboard
6. Deploy!

You can use similar steps for Railway, Heroku, or other platforms.

---

## Advanced Features for High-End Fashion & Merch Sites

A premium e-commerce experience often includes:

### Shopping & Merchandising
- Product bundles and curated collections
- Limited edition drops and countdown timers
- Pre-orders and back-in-stock notifications
- Virtual fitting rooms or AI-powered size prediction
- User-generated content galleries (customer photos, Instagram feeds)

### Personalization & Engagement
- Personalized homepages and product feeds
- Dynamic pricing and targeted offers
- Customer profiles with order history and preferences
- Birthday/anniversary rewards

### Checkout & Payments
- Express checkout (Apple Pay, Google Pay, Shop Pay, PayPal, etc.)
- Buy Now, Pay Later (Afterpay, Klarna, Affirm)
- Saved payment methods and addresses
- One-click reordering

### Operations & Integrations
- Integration with POS systems for omnichannel retail
- Dropshipping or print-on-demand support
- Automated fraud detection
- Multi-warehouse inventory and fulfillment

### Marketing & Growth
- Affiliate and influencer management platforms
- Advanced segmentation for email/SMS campaigns
- On-site popups and exit-intent offers
- A/B testing for landing pages and product detail pages

### Technology & Performance
- Headless commerce architecture (API-driven frontend)
- JAMstack or SPA frameworks (Next.js, Nuxt, Gatsby, etc.)
- Real-time search and filtering (Algolia, Elasticsearch)
- Image optimization and lazy loading

### Accessibility & Trust
- Accessibility (WCAG 2.1+) compliance
- Trust badges and verified reviews
- Transparent sustainability and sourcing info

---

**Implementing these features can significantly boost conversion rates, customer loyalty, and brand reputation.**

If you want to prioritize or explore any of these, I can help you plan or prototype them for your project.

---

## Security Notes

- Never commit `.env` or secrets to git.
- Use strong, unique values for all secrets.
- Keep dependencies up to date (`npm audit` regularly).
- Use HTTPS in production.

---

## Longevity & Upgradability Features

To ensure your site is easy to maintain, extend, and upgrade over time, implement these foundational practices:

### 1. Modular Code Structure
- Separate backend (API), frontend (UI), and admin logic into clear folders/modules
- Use environment variables for all secrets and config
- Keep business logic (orders, users, products) in dedicated service files

### 2. API-First Design
- Expose all business logic via RESTful APIs
- Document endpoints (OpenAPI/Swagger or markdown)
- Make the frontend consume only the API (enables headless upgrades)

### 3. Dependency Management
- Use a package manager (npm) and keep dependencies up to date
- Document all required packages and versions
- Use .nvmrc or engines in package.json to specify Node.js version

### 4. Environment & Secrets Management
- Use .env files (never commit real secrets)
- Document all required environment variables
- Support staging/production environments

### 5. Testing & CI
- Add basic automated tests (Jest, Mocha, etc.) for API endpoints and business logic
- Set up CI (GitHub Actions, etc.) for linting and tests on every push

### 6. Documentation
- Keep README and code comments up to date
- Add a /docs folder for API, architecture, and upgrade notes

### 7. Upgrade Path
- Use semantic versioning for releases
- Document breaking changes and migration steps
- Keep a CHANGELOG.md

---

**Next Steps:**
- Refactor code for modularity (split large files, use services/controllers)
- Add API documentation and upgrade notes
- Set up basic tests and CI

Let me know if you want to start with code refactoring, documentation, or CI setup!

