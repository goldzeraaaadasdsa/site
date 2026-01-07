# Brasil Sim Racing - Admin Management Platform

Professional sim racing event management platform built with React, Node.js, and WebSocket.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Bun (optional, for faster builds)
- Steam API Key (for authentication)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd site

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Server runs on `http://localhost:8080` | Frontend on same port with Vite dev server proxy

## 🏗️ Project Structure

```
site/
├── src/
│   ├── pages/          # Page components (Login, Profile, Races, News, etc)
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context (AuthContext)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (API, router, validation)
│   ├── types/          # TypeScript types (centralized)
│   └── App.tsx         # Root component
├── data/               # JSON data storage (chats, races, news, standings, etc)
├── public/            # Static assets
├── server.js          # Express backend server
├── vite.config.ts     # Vite configuration
└── tailwind.config.ts # Tailwind CSS configuration
```

## 🔐 Environment Variables

```bash
# Required
NODE_ENV=development              # development or production
SESSION_SECRET=your-secret-here   # Min 32 chars for production
STEAM_API_KEY=your-steam-key      # Get from https://steamcommunity.com/dev/apikey

# Optional
FRONTEND_URL=http://localhost:8080
STEAM_RETURN_URL=http://localhost:8080/auth/steam/return
STEAM_REALM=http://localhost:8080
PORT=8080
TRUST_PROXY=0
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start dev server with Vite + Express
npm run build    # Build for production
npm run start    # Run production build
npm run lint     # Run ESLint
```

### Project Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 18.x |
| Build | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Library | shadcn/ui | - |
| Backend | Express.js | 4.x |
| Auth | Passport.js + Steam | - |
| Real-time | WebSocket (ws) | 8.x |
| Database | JSON files (demo) | - |

## 📡 API Endpoints

### Authentication
- `GET /api/session` - Get current user session
- `GET /auth/steam` - Initiate Steam login
- `GET /auth/steam/return` - Steam callback
- `POST /api/logout` - Logout

### Public Endpoints
- `GET /api/races` - List all races
- `GET /api/races/:id/enriched` - Get race with full pilot details
- `GET /api/news` - List all news
- `GET /api/standings` - List all championships
- `GET /api/achievements` - List achievements
- `GET /api/public/stats` - Platform statistics

### User Endpoints (Requires Authentication)
- `GET /api/my/account` - Get current user profile
- `GET /api/my/races` - Get user's registered races
- `POST /api/races/:id/register` - Register for a race
- `POST /api/races/:id/unregister` - Unregister from race
- `POST /api/chats` - Create new chat
- `POST /api/chats/:id/message` - Send chat message

### Admin Endpoints (Requires Admin Role)
- `POST /api/races` - Create race
- `PUT /api/races/:id` - Update race
- `DELETE /api/races/:id` - Delete race
- `POST /api/news` - Create news article
- `PUT /api/news/:id` - Update article
- `DELETE /api/news/:id` - Delete article
- `POST /api/standings` - Create championship
- `PUT /api/standings/:category` - Update championship
- `DELETE /api/standings/:category` - Delete championship
- `POST /api/achievements` - Create achievement
- `PUT /api/achievements/:id` - Update achievement
- `DELETE /api/achievements/:id` - Delete achievement
- `PUT /api/settings` - Update platform settings
- `GET /api/admin/chats` - List all chats
- `POST /api/admin/chats/:id/assign` - Assign chat to admin
- `POST /api/admin/chats/:id/close` - Close chat

### Rate Limiting
- General: 200 requests per 15 minutes
- Steam Auth: 5 login attempts per 5 minutes

## 🔒 Security Features

- ✅ Helmet.js for XSS/clickjacking protection
- ✅ CORS protection with credential handling
- ✅ Session-based authentication via Passport.js
- ✅ Admin role verification on protected endpoints
- ✅ Rate limiting on sensitive endpoints
- ✅ Safe error handling (no stack traces in production)
- ✅ Input validation with Zod schemas
- ✅ Environment variable validation at startup

## 📊 Features

### Admin Panel
- **Dashboard**: Real-time statistics and quick actions
- **Race Management**: Create, edit, delete races with full details
- **News Management**: Article CRUD with filtering and statistics
- **Standing Management**: Championship/category management
- **Achievement Management**: Badge system
- **Chat Management**: Real-time chat with users
- **User Management**: Account administration
- **Settings**: Platform-wide configuration

### User Features
- Steam authentication
- Race registration/unregistration
- Profile with statistics and achievements
- Real-time chat with admins
- Race history and standings tracking

### Technical Features
- Real-time updates via WebSocket
- Message persistence (localStorage + server)
- Lazy route loading for performance
- Dark mode support
- Responsive design (mobile-first)
- Error boundaries for crash prevention
- Comprehensive logging

## 🚀 Deployment

### DisCloud Deployment
```bash
# Build the project
npm run build

# Push to DisCloud
git push discloud main
```

**Configuration** (`discloud.config`):
- Main file: `server.js`
- Node version: Specified in config
- Memory: 512MB+ recommended

### Environment Setup for Production
```bash
# .env.production
NODE_ENV=production
SESSION_SECRET=<generate-random-string>
STEAM_API_KEY=<your-api-key>
FRONTEND_URL=https://brasilsimracing.discloud.app
STEAM_RETURN_URL=https://brasilsimracing.discloud.app/auth/steam/return
STEAM_REALM=https://brasilsimracing.discloud.app
PORT=8080
TRUST_PROXY=1
```

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Increase memory for build
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Session Not Persisting
- Verify `SESSION_SECRET` is set
- Check browser cookie settings (HttpOnly, SameSite)
- Ensure same domain for frontend/backend

### Steam Login Fails
- Verify `STEAM_API_KEY` is valid
- Check `STEAM_RETURN_URL` matches Steam configuration
- Rate limiting: Wait 5 minutes if hitting limit

### WebSocket Errors
- Ensure WebSocket port is not blocked by firewall
- Check browser console for CORS errors
- Verify frontend/backend URLs match

## 📝 Validation Schemas

All API endpoints validate input using Zod schemas. See `src/lib/validation.ts` for schema definitions.

### Example: Creating a Race

```typescript
// Must match RaceSchema
const race = {
  title: "F1 2026 Season Finale",     // Required
  track: "Monaco",                      // Required
  date: "2026-12-15T19:00:00Z",         // Required (ISO format)
  description: "Final race of season",  // Required
  // Optional fields...
};

const response = await fetch('/api/races', {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify(race)
});
```

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## 📄 License

Proprietary - Brasil Sim Racing

## 📞 Support

For issues and questions:
- Email: contato@simracingboost.com
- Issues: GitHub Issues
- Documentation: See `docs/` folder