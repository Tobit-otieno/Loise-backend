# Loise Adventures — Admin Dashboard Backend

Node.js + Express + MongoDB REST API powering the Loise Adventures admin dashboard:
trips (Kenyan Safaris & International Tours), destinations, gallery, inquiries, journal,
and admin/super admin account management.

## Tech stack
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication, bcrypt password hashing
- Cloudinary for image storage (via multer-storage-cloudinary)

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

You need:
- A **MongoDB Atlas** connection string (free tier is fine) → `MONGO_URI`
- A **Cloudinary** account (free tier) → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  (sign up at cloudinary.com, the three values are on your dashboard homepage)
- A long random string for `JWT_SECRET`
- Your frontend URL(s) in `CLIENT_URLS` (comma-separated, no trailing slash)

## 3. Create the first Super Admin

There's no public signup — the first Super Admin is created via a one-time seed script,
using the `SUPERADMIN_*` values in your `.env`:

```bash
npm run seed:superadmin
```

Log in with that email/password, then change the password from the dashboard's
Settings page. Once logged in as Super Admin, use **Manage Admins** in the dashboard
to invite additional Admins or Super Admins — nobody else needs the seed script.

## 4. Run the server

```bash
npm run dev     # with nodemon, auto-restarts on change
# or
npm start
```

Server runs on `http://localhost:5000` by default. Visit `/` for a health check.

## Roles

| Action | Admin | Super Admin |
|---|---|---|
| View trips/destinations/gallery/journal/inquiries | ✅ | ✅ |
| Create/edit trips, destinations, gallery, journal | ✅ | ✅ |
| Update inquiry status/notes | ✅ | ✅ |
| **Delete** trips, destinations, gallery images, journal entries, inquiries | ❌ | ✅ |
| **Add/edit/delete admin accounts** | ❌ | ✅ |

Enforced server-side in `src/middleware/auth.js` (`protect` + `authorize(...roles)`),
not just hidden in the UI — don't rely on the frontend alone to block these actions.

## API Overview

All protected routes require `Authorization: Bearer <token>` (token returned from login).
Endpoints that accept an image use `multipart/form-data`; array/object fields
(`category`, `duration`, `groupSize`, `price`, `itinerary`, `included`, `excluded`,
`sections`, `faqs`, `wildlife`, `descriptions`) are sent as **JSON strings** inside that
same form data, e.g. `formData.append("duration", JSON.stringify({ days: 10, nights: 9 }))`.

### Auth — `/api/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | `{ email, password }` → `{ token, user }` |
| GET | `/me` | Private | Current logged-in admin |
| PUT | `/me` | Private | Update own name/password |

### Admins — `/api/admins` (Super Admin only)
| Method | Route | Description |
|---|---|---|
| GET | `/` | List all admins |
| POST | `/` | Create admin `{ name, email, password, role }` |
| PUT | `/:id` | Update role/status/name |
| DELETE | `/:id` | Remove an admin account |

### Trips — `/api/trips`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/?type=&status=&search=` | Public | List trips, filterable by `kenyan-safari` / `international-tour` |
| GET | `/:idOrSlug` | Public | Single trip |
| POST | `/` | Admin+ | Create (multipart, field `image`) |
| PUT | `/:id` | Admin+ | Update (multipart, `image` optional) |
| DELETE | `/:id` | Super Admin | Delete |

**Trip body shape** (matches the sample data you sent, plus `tripType`/`groupSize`):
```json
{
  "tripType": "kenyan-safari",
  "name": "10-Day Kenyan Classics Safari",
  "slug": "10-day-kenyan-classics",
  "category": ["long", "wildlife"],
  "highlights": ["Samburu", "Ol Pejeta", "Nakuru"],
  "destinations": ["Samburu", "Ol Pejeta Conservancy", "Lake Nakuru"],
  "duration": { "days": 10, "nights": 9 },
  "groupSize": { "noLimit": false, "min": 2, "max": 7 },
  "price": { "amount": 2555, "currency": "USD" },
  "description": "Six parks, the Big Five in every one...",
  "overview": "You'll embark on a thrilling 10-day safari...",
  "itinerary": [
    { "day": 1, "title": "Nairobi to Samburu", "description": "...", "meals": "Lunch, Dinner" }
  ],
  "included": ["A professional driver/guide", "Park fees"],
  "excluded": ["Tips", "Visa fees"],
  "note": "Based on 4 adults sharing a private 4x4 Land Cruiser.",
  "status": "published"
}
```
- `tripType: "kenyan-safari"` → priced in USD automatically (for foreign clients visiting Kenya).
- `tripType: "international-tour"` → for Kenyan clients travelling abroad; `price.currency` can be `KES` or `USD`.
- `groupSize.noLimit: true` → `min`/`max` are ignored/stored as `null`; the dashboard should show "No limit" instead of numbers.

### Destinations — `/api/destinations`
Same pattern as Trips (`GET /`, `GET /:idOrSlug`, `POST /`, `PUT /:id` Admin+, `DELETE /:id` Super Admin).
Body: `name, slug, tagline, region, bestTime, wildlife[], drive, altitude, description`, image field `image`.

### Gallery — `/api/gallery`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/?category=` | Public | List images |
| POST | `/` | Admin+ | Upload — multipart field `images` (array, up to 20) + `descriptions` (JSON array, same order) + optional `category` |
| PUT | `/:id` | Admin+ | Edit description/category |
| DELETE | `/:id` | Super Admin | Delete |

### Inquiries — `/api/inquiries`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Public | From the main site's contact/booking form: `{ name, email, phone, tripId, message }` |
| GET | `/?status=` | Admin+ | List all (filter: `new`/`contacted`/`closed`) |
| GET | `/:id` | Admin+ | Single inquiry |
| PUT | `/:id` | Admin+ | Update `{ status, notes }` |
| DELETE | `/:id` | Super Admin | Delete |

### Journal — `/api/journal`
Same pattern as Trips. Body: `title, slug, category, readTime, excerpt, author, sections[{heading, body, bullets[]}], faqs[{q,a}], metaTitle, metaDescription, status`, image field `image`.

### Dashboard — `/api/dashboard`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/summary` | Admin+ | Counts (trips, destinations, gallery images, journal entries, new inquiries this week) + 5 most recent inquiries |

## Project structure
```
server.js
src/
  config/       # MongoDB + Cloudinary setup
  models/       # Mongoose schemas
  middleware/   # auth (JWT + role guard), upload (Cloudinary), error handler
  controllers/  # route logic
  routes/       # Express routers
  utils/        # token/slug helpers + one-time super admin seed script
```

## Deploying
- Works well on **Render** or **Railway** for the API (set the same env vars there).
- Use **MongoDB Atlas** (already cloud-hosted, no server-side DB to manage).
- Images go straight to Cloudinary, so the API server itself can stay stateless/ephemeral.
- Update `CLIENT_URLS` to your deployed dashboard's real domain once it's live.
