# 🌊 Anya Bikini

**A modern, full-stack e-commerce platform for handcrafted swimwear**

Anya Bikini is a production-ready e-commerce web application built for boutique swimwear brands. It combines elegant design with powerful features including secure user authentication, Stripe payment processing, Instagram integration, and a comprehensive admin panel—all built with vanilla JavaScript, Node.js, and Express.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

---

## ✨ Features

### 🛍️ **E-Commerce Core**
- **Product Catalog** - Dynamic product management with categories (Sets, Tops, Bottoms, One Pieces, Cover Ups)
- **Shopping Cart** - Client-side cart with localStorage persistence and real-time updates
- **Secure Checkout** - Dual payment flows via Stripe (hosted checkout and in-page card payments)
- **Order Management** - Complete order tracking and persistence
- **Product Filtering** - Real-time category filtering on the storefront

### 👤 **User Management**
- **JWT Authentication** - Secure registration and login with HTTP-only cookies
- **Email Verification** - Optional email verification with token-based links
- **User Profiles** - Authenticated user profile management
- **Password Security** - Bcrypt hashing with salt rounds, minimum 6-character enforcement
- **Session Management** - 30-day token expiration with automatic refresh

### 💳 **Payment Processing**
- **Stripe Integration** - Full Stripe payment processing with PCI compliance
- **Multiple Payment Methods** - Cards, Apple Pay, Google Pay, and more
- **Hosted Checkout** - Redirect to Stripe's hosted payment page
- **In-Page Payments** - Stripe Elements for seamless card entry
- **Payment Intents** - Modern payment flow with automatic payment method detection

### 📱 **Social & Marketing**
- **Instagram Feed** - Live Instagram post integration with automatic syncing
- **Wishlist System** - Per-user wishlist with add/remove functionality
- **Newsletter Signup** - Email capture for marketing campaigns
- **SEO Optimization** - Dynamic sitemap, robots.txt, and JSON-LD structured data
- **Social Sharing** - Open Graph meta tags for rich social previews

### 🔧 **Admin Dashboard**
- **Product Management** - Full CRUD operations with drag-to-reorder
- **User Management** - View all registered users and account details
- **Order Dashboard** - Complete order history and tracking
- **Instagram Sync** - One-click sync of Instagram posts to product catalog
- **Undo History** - Multi-level undo for product changes (up to 5 levels)
- **Token Authentication** - Secure admin access with environment-based tokens

### 🎨 **Design & UX**
- **Responsive Design** - Mobile-first, fully responsive across all devices
- **Modern UI** - Clean, elegant interface with smooth animations
- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation
- **Interactive Elements** - Modals, drawers, toasts, and smooth scrolling
- **Color Swatches** - Interactive product color selection
- **Scroll Animations** - IntersectionObserver-based reveal effects

### 🔒 **Security & Performance**
- **Content Security Policy** - Strict CSP headers preventing XSS and code injection
- **Security Headers** - Complete security header suite (HSTS, X-Frame-Options, etc.)
- **Password Hashing** - Bcrypt with 10 salt rounds
- **HTTP-Only Cookies** - XSS-resistant authentication
- **CSRF Protection** - SameSite cookie policy
- **Input Validation** - Server-side email and password validation
- **Image Optimization** - Lazy loading for all product images

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Vanilla JavaScript (no framework dependencies)
- HTML5 with semantic markup
- CSS3 with CSS Variables for theming
- Google Fonts (Cormorant Garamond, Montserrat)
- Stripe.js for payment handling

**Backend:**
- Node.js 18+
- Express.js web framework
- JSON file-based database (upgradable to PostgreSQL/MongoDB)
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for transactional emails

**Payment & Integrations:**
- Stripe API for payment processing
- Instagram Graph API for feed integration
- SMTP for email delivery (optional)

**Deployment:**
- Vercel-ready configuration
- Serverless API functions support
- Environment-based configuration
- Static file serving

### Project Structure

```
AnyaBikini/
├── 📄 index.html              # Main storefront (47KB)
├── 📄 admin.html              # Admin dashboard (22KB)
├── 📁 scripts/
│   └── main.js                # Frontend logic (588 lines)
├── 📁 styles/
│   └── main.css               # Styling (32KB, 1,642 lines)
├── 📁 server/
│   ├── index.js               # Express server (504 lines)
│   ├── 📁 controllers/
│   │   └── advanced/
│   │       └── wishlistController.js
│   └── 📁 services/
│       ├── userService.js
│       ├── stripeService.js
│       ├── emailService.js
│       ├── instagramService.js
│       ├── orderService.js
│       ├── productService.js
│       └── advanced/
│           ├── wishlistService.js
│           ├── discountService.js    # Ready for extension
│           ├── inventoryService.js   # Ready for extension
│           ├── reviewService.js      # Ready for extension
│           └── variantService.js     # Ready for extension
├── 📁 api/                    # Vercel serverless functions
├── 📁 data/                   # JSON database storage
├── 📄 products.json           # Product catalog
├── 📄 vercel.json             # Deployment configuration
└── 📄 package.json            # Dependencies and scripts
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Stripe account (for payment processing)
- Instagram Business account (optional, for feed integration)
- SMTP credentials (optional, for email verification)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AnyaBikini.git
   cd AnyaBikini
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   The `.env` file is used by the backend/serverless functions—not by the static
   front-end code. Front-end settings (Stripe publishable key, API base path,
   etc.) are provided via meta tags or served by an API endpoint.
   Copy `server/.env.example` to a top-level `.env` file and fill in values:
   ```bash
   cp server/.env.example .env
   # then edit .env with your secrets
   ```

   These same variable names should be set in your Vercel project as
   Environment Variables when you deploy. Be aware that Vercel's filesystem is
   read-only/ephemeral once deployed, so any `DATABASE_PATH` (or
   `NEWSLETTER_PATH`) pointing at a local JSON file will not persist across cold
   starts. In such cases you can set `DATABASE_PATH=/tmp/db.json` and
   `NEWSLETTER_PATH=/tmp/newsletter.json` to allow the functions to write to the
   temporary directory, but the data will vanish when the instance shuts down.
   For real production, switch to a managed database service like PostgreSQL or
   MongoDB, and send newsletters via a proper mailing list provider.

4. **Start the local development server**
   - If you want to run the **Express** server locally (mimics previous setup):
     ```bash
     npm run dev            # starts server/index.js on PORT (defaults to 3000)
     ```
   - To run the **serverless environment** exactly as Vercel will:
     ```bash
     npx vercel dev         # you'll need the Vercel CLI installed and logged in
     ```
     `vercel dev` serves the static `public/` folder and spins up the `/api`
     functions, which are what Vercel uses in production.

5. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000) (same URL works for
   both modes).

### Build for Production

```bash
npm run build
```

This creates a `public/` directory with optimized static assets ready for deployment.

---

## 📚 API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/register` | Create new user account | No |
| `POST` | `/api/login` | Sign in with credentials | No |
| `POST` | `/api/logout` | Clear authentication session | No |
| `GET` | `/api/profile` | Get current user profile | Yes |

**Example: User Registration**
```javascript
POST /api/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "securepass123",
  "name": "Jane Doe"
}
```

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/products` | List all published products | No |
| `GET` | `/product/:id` | SEO-optimized product page | No |
| `GET` | `/api/config` | Get public configuration | No |

### Shopping Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/create-order` | Create order record | Yes |
| `POST` | `/api/create-checkout-session` | Create Stripe hosted checkout | No |
| `POST` | `/api/create-payment-intent` | Create in-page payment | No |

**Example: Create Checkout Session**
```javascript
POST /api/create-checkout-session
Content-Type: application/json

{
  "items": [
    {
      "name": "Sunset Stripe Bikini Set",
      "price": 98.00,
      "quantity": 1
    }
  ]
}
```

### Wishlist Endpoints (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wishlist` | Get user's wishlist |
| `POST` | `/api/wishlist/add` | Add product to wishlist |
| `POST` | `/api/wishlist/remove` | Remove product from wishlist |
| `POST` | `/api/wishlist/clear` | Clear entire wishlist |

### Admin Endpoints (Token Required)

| Method | Endpoint | Description | Header |
|--------|----------|-------------|--------|
| `GET` | `/api/admin/users` | List all users | `X-Admin-Token` |
| `GET` | `/api/admin/orders` | List all orders | `X-Admin-Token` |
| `POST` | `/api/admin/save-products` | Update product catalog | `X-Admin-Token` |
| `POST` | `/api/admin/sync-instagram` | Sync Instagram posts | `X-Admin-Token` |

### Social & SEO Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/instagram` | Fetch latest Instagram posts |
| `GET` | `/sitemap.xml` | XML sitemap for SEO |
| `GET` | `/robots.txt` | Robots.txt for crawlers |

---

## 🎨 Customization

### Branding & Colors

Edit the CSS variables in `styles/main.css`:

```css
:root {
  --color-primary: #c9785c;        /* Coral/Warm Brown */
  --color-primary-light: #e8a98a;  /* Sand */
  --color-accent: #4a8fa8;         /* Ocean Blue */
  --color-dark: #2c2420;           /* Noir */
  --color-light: #9e8d82;          /* Light Gray */
}
```

### Typography

Modify the Google Fonts import in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap" rel="stylesheet" />
```

### Product Categories

Update filter buttons in `index.html` and adjust the `data-category` attributes on product cards.

---

## 🔐 Security

### Best Practices Implemented

✅ **Password Security**
- Minimum 6-character requirement
- Bcrypt hashing with 10 salt rounds
- Never stored or transmitted in plain text

✅ **Session Security**
- JWT tokens in HTTP-only cookies
- SameSite=Lax for CSRF protection
- 30-day expiration with automatic refresh

✅ **Content Security Policy**
- Strict CSP headers blocking unsafe scripts
- No eval() or inline script execution
- Whitelisted external sources (Stripe, Google Fonts)

✅ **Security Headers**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` with HSTS

✅ **Payment Security**
- Stripe handles PCI compliance
- No card data stored locally
- Secure Payment Intent API

✅ **Input Validation**
- Server-side email format validation
- Password strength enforcement
- Sanitized database queries

### Security Checklist

- [ ] Generate strong `JWT_SECRET` (32+ characters)
- [ ] Set secure `ADMIN_TOKEN`
- [ ] Use HTTPS in production (required for secure cookies)
- [ ] Never commit `.env` file to git
- [ ] Regularly update dependencies (`npm audit`)
- [ ] Enable SMTP for email verification
- [ ] Configure firewall rules for production server

---

## 📊 Database Schema

The application uses a JSON-based file database (`data/db.json`) with the following structure:

```javascript
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "password": "$2a$10$...",  // bcrypt hash
      "name": "User Name",
      "created_at": "2024-01-01T00:00:00.000Z",
      "verifyToken": "abc123...",
      "verifyExpires": 1234567890
    }
  ],
  "orders": [
    {
      "id": 1,
      "user_id": 1,
      "items": [...],
      "amount_cents": 4999,
      "currency": "usd",
      "status": "created",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "wishlists": {
    "1": ["product_id_1", "product_id_2"]
  },
  "nextUserId": 2,
  "nextOrderId": 2
}
```

### Migration Path

For high-traffic production use, migrate to:
- **PostgreSQL** - Relational data with ACID compliance
- **MongoDB** - Document-based NoSQL for flexibility
- **Redis** - Session storage and caching layer

---

## 🎯 Use Cases

### Perfect For:

- 🩱 **Boutique Swimwear Brands** - Showcase handcrafted collections
- 👗 **Fashion E-Commerce** - Clothing, accessories, and lifestyle products
- 🎨 **Artist Merchandise** - Sell art prints, apparel, and custom goods
- 📸 **Instagram-First Brands** - Integrate social commerce seamlessly
- 🚀 **Startup MVPs** - Launch quickly with production-ready features
- 🏪 **Small Business Online Stores** - Professional e-commerce without complexity

### Key Benefits:

✅ No monthly platform fees (just payment processing)
✅ Full control over design and functionality
✅ Own your customer data and relationships
✅ Easy customization and white-labeling
✅ Production-ready security and payments
✅ Mobile-responsive out of the box

---

## 🛠️ Advanced Features

### Planned Enhancements

The codebase includes stubs and services ready for extension:

- **Discount Codes** - `discountService.js` stub for coupon functionality
- **Inventory Tracking** - `inventoryService.js` for stock management
- **Product Reviews** - `reviewService.js` for customer ratings
- **Product Variants** - `variantService.js` for size/color options
- **Email Notifications** - Order confirmations and shipping updates
- **Subscription Payments** - Recurring billing integration
- **Multi-Currency Support** - International sales
- **Analytics Integration** - Google Analytics, Facebook Pixel
- **A/B Testing** - Conversion rate optimization

### Extensibility

The modular architecture makes it easy to add:
- Third-party integrations (Mailchimp, Klaviyo, etc.)
- Advanced search and filtering (Algolia, Elasticsearch)
- Recommendation engines
- Live chat support (Intercom, Drift)
- Multi-warehouse fulfillment
- Dropshipping integration

---

## 📈 Performance

### Optimizations Included

- **Lazy Loading** - Images load on scroll for faster initial page load
- **CSS Variables** - Dynamic theming without JavaScript overhead
- **LocalStorage Cart** - Instant cart operations without server requests
- **Intersection Observer** - Efficient scroll-based animations
- **Minimal Dependencies** - Vanilla JS reduces bundle size
- **CDN-Ready** - Static assets can be served from CDN

### Scalability Notes

The current JSON database is suitable for:
- ✅ Development and testing
- ✅ Low to moderate traffic (< 100 concurrent users)
- ✅ Prototypes and MVPs

For production scale:
- Migrate to PostgreSQL/MongoDB for concurrent access
- Add Redis for session storage and caching
- Implement CDN for static assets (images, CSS, JS)
- Use load balancer for horizontal scaling
- Add monitoring (New Relic, DataDog, etc.)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Use meaningful variable and function names
- Comment complex logic
- Follow existing code style
- Test your changes thoroughly
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Stripe** - Payment processing infrastructure
- **Vercel** - Deployment platform and serverless functions
- **Google Fonts** - Typography (Cormorant Garamond, Montserrat)
- **Unsplash** - Sample product imagery
- **Instagram Graph API** - Social media integration

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/AnyaBikini/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/AnyaBikini/discussions)
- **Email**: support@anyabikini.com

---

## 🗺️ Roadmap

### Version 2.0 (Planned)

- [ ] Customer dashboard with order history
- [ ] Advanced product search and filters
- [ ] Product review system
- [ ] Discount code engine
- [ ] Inventory management
- [ ] Email notification system
- [ ] Multi-language support
- [ ] Admin analytics dashboard

### Version 3.0 (Future)

- [ ] Mobile app (React Native)
- [ ] Subscription box service
- [ ] Loyalty program
- [ ] Advanced SEO tools
- [ ] Multi-vendor marketplace
- [ ] AR try-on integration

---

## 💡 Getting Help

**Quick Links:**
- [API Documentation](docs/README.md)
- [Deployment Guide](docs/deployment.md)
- [Security Best Practices](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

**Common Questions:**

**Q: How do I get Stripe test keys?**
A: Sign up at [stripe.com](https://stripe.com), navigate to Developers → API Keys, and use the test mode keys.

**Q: Can I use this for products other than swimwear?**
A: Absolutely! The platform is fully customizable for any e-commerce use case.

**Q: Is this production-ready?**
A: Yes, with proper environment configuration and HTTPS setup. Consider migrating to a production database for high traffic.

**Q: How do I add more payment methods?**
A: Enable additional payment methods in your Stripe Dashboard. The app supports all Stripe payment methods.

**Q: Can I white-label this?**
A: Yes, the MIT license allows full customization and white-labeling.

---

<p align="center">
  Made with ❤️ by the Anya Bikini Team
</p>

<p align="center">
  <a href="https://www.anyabikini.com">Website</a> •
  <a href="https://www.instagram.com/anyabikini">Instagram</a> •
  <a href="https://github.com/yourusername/AnyaBikini">GitHub</a>
</p>
