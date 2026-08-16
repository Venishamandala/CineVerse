# 🎬 CineVerse - Premium Full-Stack Movie Recommendation Platform

CineVerse is a production-quality, full-stack movie recommendation web application built with the MERN stack. Designed with a futuristic dark glassmorphic UI, CineVerse integrates real-time TMDB movie APIs, JWT-based user authentication, personalized recommendation scoring algorithms, Mongo analytics logs, interactive watchlist managers, and Recharts profile statistics.

---

## 🚀 Features

- **🔐 Secure Authentication**: JWT authorizations with persistent sessions, password hashing (bcrypt), and input validations.
- **✨ Questionnaire Onboarding**: Custom onboarding flow configuring preferred languages, favorite genres, and initial star ratings.
- **🧠 Recommendation Matrix**: Algorithmic movie ranking scoring movies using:
  - Genre overlap (30%)
  - Language matching (20%)
  - Previous high-star ratings (25%)
  - Watchlist similarities (15%)
  - Popularity metrics (10%)
- **🔎 Advanced Discovery**: Live debounce searches with suggestions, and criteria filters (year, genre, language, and sorting rules).
- **⭐ Interactive Ratings**: 1-5 star sliders with mouse-hover animation, letting users submit, edit, or purge ratings.
- **🔖 Watchlist Planner**: Save unwatched movies, mark watched items, filter, and sort lists.
- **🎥 Official Trailers**: Centered overlay modals launching responsive official YouTube embeds.
- **📊 Profile Analytics**: Visual chart summaries (Recharts) plotting ratings distribution, favorite genres share, and activity logs over time.
- **🎨 Responsive UI**: Dark/Light mode theme configurations optimized from 320px screens up to 1440px+ desktop resolutions.

---

## 🛠️ Technology Stack

### Frontend
- **Core**: React, Vite
- **Routing**: React Router DOM (v6)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Analytics**: Recharts
- **Networking**: Axios

### Backend
- **Core**: Node.js, Express.js
- **Database**: MongoDB (Atlas) via Mongoose
- **Security**: Helmet (header protection), CORS configuration, Express Rate Limit
- **Auth**: JWT, bcryptjs

---

## 📁 Architecture Directory Structure

```text
CineVerse/
├── client/                 # React frontend
│   ├── src/
│   │   ├── assets/         # Images & vectors
│   │   ├── components/     # Navbar, Sidebar, MovieCard, TrailerModal, etc.
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── layouts/        # Layout.jsx (Shell)
│   │   ├── pages/          # Dashboard, Discover, ForYou, Profile, Onboarding, etc.
│   │   ├── services/       # axios api.js client config
│   │   ├── App.jsx         # App router configuration
│   │   └── index.css       # Tailwind base styles
│   └── index.html
│
├── server/                 # Express backend
│   ├── config/             # DB connectivity (db.js)
│   ├── controllers/        # Auth, Movie, Rating, Watchlist, User controllers
│   ├── middleware/         # Auth verify, inputs validate, error handlers
│   ├── models/             # Mongoose Schemas (User, Rating, Watchlist, etc.)
│   ├── routes/             # REST API routes declarations
│   ├── services/           # tmdbService, recommendationService
│   └── server.js           # Server startup file
│
├── .env.example            # Environment templates
└── package.json            # Parent concurrency scripts
```

---

## 🔑 Database Collections Schema

- **User**: Name, unique email, hashed password, preferredLanguages, favoriteGenres, and avatar sticker.
- **Rating**: Link to `User`, TMDB movieId, movie title, poster path, and rating value (1–5). Structured with a compound index `{ userId: 1, movieId: 1 }` to prevent duplicate logs.
- **Watchlist**: Link to `User`, TMDB movieId, title, poster, addedAt, and a `watched` boolean flag. Compound indexed.
- **UserInteraction**: Track user analytics actions (`view`, `click_trailer`, `search`, `watchlist_add`, `rate`).
- **UserPreference**: Separate preferences matrix syncing genre lists and languages.
- **SearchHistory**: Expiring queries log history for search bar feedback.

---

## ⚡ Setup & Local Execution

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local server or MongoDB Atlas URI)
- TMDB API Key (Create developer credentials at [themoviedb.org](https://www.themoviedb.org/))

### 2. Configuration
Create a `.env` file in the root folder (or copy `.env.example`):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_jwt_secret_token
TMDB_API_KEY=your_tmdb_api_key
```

### 3. Installation
Install all parent, server, and client package modules concurrently:
```bash
npm run install-all
```

### 4. Running Backend Diagnostics
Verify that database connections, API configurations, and recommendation calculations are operational:
```bash
node server/utils/testApi.js
```

### 5. Running the Application
Launch both the Express backend and the Vite frontend dev server in parallel:
```bash
npm run dev
```
The React client will open at `http://localhost:5173`. The Node server runs at `http://localhost:5000`.

---

## 🌐 Credits & TMDB Attribution
Movie details, posters, backdrops, trailers, cast lists, and popular recommendations are queried from the TMDB database. This product uses the TMDB API but is not endorsed or certified by TMDB.

---
