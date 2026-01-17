# 🏏 Fantasy Cricket - Dream Team Builder

A complete, production-ready Dream11-style fantasy cricket web application with live API integration, built for 3-5 users with zero-cost deployment.

## 🌟 Features

- **Live Match Data**: Integrates with CricketData.org FREE API (100 calls/day)
- **Team Builder**: Select 11 players with role constraints (WK, BAT, AR, BOWL)
- **Captain/Vice-Captain**: 2x and 1.5x point multipliers
- **Real-time Scoring**: Automatic simulation with realistic cricket points
- **Leaderboard**: Competitive rankings for each match
- **Mobile-First UI**: Dark theme, responsive design like Dream11
- **Secure Auth**: JWT-based authentication with bcrypt password hashing

## 🚀 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (NO frameworks)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with pg driver
- **API**: CricketData.org (free tier)
- **Auth**: JWT + bcryptjs

## 📋 Prerequisites

- Node.js 14+ 
- PostgreSQL database
- CricketData.org API key (optional, has fallback)

## 🔧 Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/Abhijeet199224/fantasy_game.git
cd fantasy_game
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

Create a PostgreSQL database and run the schema:

```bash
psql -U postgres -d your_database < schema.sql
```

### 4. Environment Variables

Create a `.env` file:

```env
# Required
DATABASE_URL=postgresql://username:password@localhost:5432/fantasy_cricket
JWT_SECRET=your-super-secret-jwt-key-change-this

# Optional - Get from https://cricketdata.org
CRICKET_API_KEY=your-api-key-here

# Optional
PORT=3000
```

**Get API Key**: 
1. Visit https://cricketdata.org
2. Sign up for free account
3. Get API key from dashboard (100 free calls/day)

### 5. Run Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Visit: `http://localhost:3000`

## 🌐 Render Deployment

### 1. Prepare Repository

Ensure these files are committed:
- `server.js`
- `public/index.html`
- `schema.sql`
- `package.json`

### 2. Create Render PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **PostgreSQL**
3. Name: `fantasy-cricket-db`
4. Plan: **Free**
5. Create Database
6. Copy **Internal Database URL**

### 3. Run Schema

Connect to database and run schema:

```bash
# From Render dashboard, use "Shell" or connect locally
psql <INTERNAL_DATABASE_URL>
\i schema.sql
```

### 4. Create Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `fantasy-cricket-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 5. Environment Variables

Add in Render dashboard:

```
DATABASE_URL=<your-render-postgres-internal-url>
JWT_SECRET=<generate-random-secret>
CRICKET_API_KEY=<your-api-key-optional>
```

### 6. Deploy

Click **Create Web Service** - auto-deploys on push!

## 🎮 How to Play

### 1. Register/Login
- Create account with email/password
- Auto-login with JWT token

### 2. Select Match
- View live/upcoming matches
- Click to start building team

### 3. Build Team
- Select 11 players (max 100 credits)
- Role limits:
  - **Wicketkeepers**: 1-4
  - **Batsmen**: 3-6
  - **All-Rounders**: 1-4
  - **Bowlers**: 3-6
- First 2 players auto-selected as Captain (C) and Vice-Captain (VC)

### 4. Submit & Simulate
- Team automatically simulated on submit
- Points calculated:
  - **Batting**: 1pt/run, 4pts/50, 8pts/100, 1pt/4, 2pts/6, 6pts for SR>150
  - **Bowling**: 25pts/wicket, 8pts for 4W, 50pts for 5W, 6pts for econ<5
  - **Captain**: 2x points
  - **Vice-Captain**: 1.5x points

### 5. View Leaderboard
- See rankings for each match
- Compare scores with other users

## 🔌 API Integration

### CricketData.org Endpoints Used

```javascript
// Current matches (1-2 calls/day)
GET https://api.cricketdata.org/currentMatches?apikey={key}

// Match squad (2-4 calls per match)
GET https://api.cricketdata.org/squad?apikey={key}&matchid={id}

// Live scores (optional, for realistic simulation)
GET https://api.cricketdata.org/matchInfo?apikey={key}&matchid={id}
```

### Rate Limiting Strategy

- **Startup**: Fetch 1-2 matches + squads (~6 calls)
- **Daily Cron**: Refresh data every 24h (~10 calls)
- **Cache**: Store in DB for 24h
- **Fallback**: Hardcoded India vs Australia + England vs SA
- **Logging**: Track calls in `api_call_log` table

**Total**: ~20 calls/day (well under 100 limit)

## 📊 Database Schema

```
users (id, email, password, username)
  ↓
teams (id, user_id, match_id, players_json, captain_id, total_score)
  ↓
matches (id, name, match_date, api_match_id, is_live)
  ↓
players (id, match_id, name, role, team, credits)

api_call_log (id, endpoint, timestamp)
```

## 🎨 UI Features

- **Dark Theme**: Modern gradient backgrounds
- **Role Tabs**: Filter by WK/BAT/AR/BOWL
- **Live Credit Counter**: Real-time validation
- **Player Cards**: Name, role, team, credits
- **Captain Badges**: Visual C/VC indicators
- **Responsive**: Mobile-first design
- **Animations**: Hover effects, pulse badges

## 🔒 Security

- JWT token authentication
- Bcrypt password hashing (10 rounds)
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- CORS enabled
- API key hidden in env vars

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check DATABASE_URL format
postgresql://user:password@host:port/database

# For Render, use INTERNAL database URL
# Enable SSL: ssl: { rejectUnauthorized: false }
```

### API Not Working
```bash
# Check if API key is set
echo $CRICKET_API_KEY

# Verify API calls in logs
# App falls back to hardcoded data automatically
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues, open a GitHub issue or contact the maintainer.

---

**Built with ⚡ for cricket fans by cricket fans**
