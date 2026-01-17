# ðŸŽ‰ Fantasy Cricket Pro - Complete Setup Guide

Welcome! This comprehensive guide covers everything you need to get your Fantasy Cricket application running.

---

## ðŸ“¦ What You're Getting

A **complete, production-ready Fantasy Cricket Gaming Platform** with:

- âœ… **Backend**: Express.js REST API (20+ endpoints)
- âœ… **Frontend**: Vanilla JavaScript SPA with responsive dark UI
- âœ… **Database**: PostgreSQL integration
- âœ… **Authentication**: JWT + bcryptjs
- âœ… **Features**: Team creation, leaderboards, real-time scoring, credit system
- âœ… **Documentation**: 9 comprehensive guides
- âœ… **Ready to Deploy**: Render.com one-click deployment

---

## ðŸš€ Quick Start (15 minutes)

### **Step 1: Prerequisites**

You need:
- **Node.js** v18+ (Download from https://nodejs.org)
- **Git** (Download from https://git-scm.com)
- **GitHub Account** (Create at https://github.com)

Verify installation:
```bash
node --version    # Should be v18+
npm --version     # Should be 9+
git --version     # Any version is fine
```

### **Step 2: Clone Repository**

```bash
git clone https://github.com/Abhijeet199224/fantasy_game.git
cd fantasy_game
```

### **Step 3: Install Dependencies**

```bash
npm install
```

This installs: express, pg, cors, dotenv, bcryptjs, jsonwebtoken, axios, body-parser

### **Step 4: Setup Environment**

```bash
# Copy template
cp .env.example .env

# Edit .env file with your configuration
# For now, defaults work for local development
```

### **Step 5: Start Application**

```bash
npm start
```

You should see:
```
âœ… Database tables initialized
ðŸš€ Server running on http://localhost:5000
ðŸ“Š API Base: http://localhost:5000/api
```

### **Step 6: Open in Browser**

Go to: **http://localhost:5000**

You'll see the Fantasy Cricket Pro login screen!

---

## ðŸ“‹ File Structure

```
fantasy_game/
â”œâ”€â”€ server.js                      # Backend API (473 lines)
â”œâ”€â”€ package.json                   # Dependencies
â”œâ”€â”€ .env.example                   # Configuration template
â”œâ”€â”€ .gitignore                     # Git ignore rules
â”œâ”€â”€ public/
â”‚   â””â”€â”€ index.html                # Frontend SPA (1,245 lines)
â”œâ”€â”€ README.md                      # This file
â”œâ”€â”€ START_HERE.md                  # 30-minute quick start
â”œâ”€â”€ DEPLOYMENT.md                  # Deployment guide
â”œâ”€â”€ API_DOCUMENTATION.md           # API reference
â”œâ”€â”€ ARCHITECTURE.md                # System design
â”œâ”€â”€ PROJECT_SUMMARY.md             # Complete overview
â”œâ”€â”€ COMPLETE_MANIFEST.md           # File manifest
â”œâ”€â”€ GIT_SETUP.md                   # Git guide
â””â”€â”€ DOWNLOAD_INSTRUCTIONS.md       # Download guide
```

---

## ðŸ”§ Backend Architecture (server.js)

### **Database Tables**

1. **users** - User accounts & authentication
   - username, email, password_hash
   - credit_points (100 on signup)
   - total_points (lifetime score)

2. **matches** - Cricket matches
   - team1, team2, status
   - start_date, api_data

3. **players** - Players in matches
   - name, team, role (Batsman/Bowler/All-rounder)
   - base_points, current_points

4. **fantasy_teams** - User's fantasy teams
   - user_id, match_id
   - players (JSON), total_points
   - rank, created_at

### **API Endpoints**

**Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (protected)

**Matches**
- `GET /api/matches` - List all matches
- `GET /api/matches/:matchId` - Match details
- `GET /api/matches/:matchId/players` - Players in match

**Fantasy Teams**
- `POST /api/fantasy-teams` - Create team
- `GET /api/fantasy-teams` - User's teams (protected)
- `GET /api/fantasy-teams/:teamId` - Team details (protected)

**Leaderboards**
- `GET /api/leaderboard/:matchId` - Match leaderboard
- `GET /api/global-leaderboard` - Global top 50

**Admin**
- `POST /api/admin/update-scores` - Update player scores

---

## ðŸŽ¨ Frontend Features (public/index.html)

### **Pages**

1. **Authentication**
   - Login form with validation
   - Registration form
   - JWT token storage

2. **Browse Matches**
   - View all cricket matches
   - Match status (upcoming/live/completed)
   - Quick team creation

3. **Create Fantasy Team**
   - Select 11 players
   - View player stats
   - Calculate team points
   - Costs 10 credit points

4. **My Teams**
   - View all your teams
   - See team rankings
   - Track team points
   - Browse player details

5. **Leaderboards**
   - Match-specific rankings
   - Global top 50 players
   - Real-time score updates

6. **Profile**
   - View your stats
   - Credit points balance
   - Total lifetime points
   - Team history

### **Dark Theme Design**

- Modern teal/slate color scheme
- Responsive layout (mobile/tablet/desktop)
- Smooth animations
- Accessible UI

---

## ðŸ” Authentication Flow

1. **Register**
   ```
   User enters: username, email, password
   â†’ Password hashed with bcryptjs
   â†’ User created with 100 credit points
   â†’ JWT token returned (30-day expiry)
   ```

2. **Login**
   ```
   User enters: username, password
   â†’ Password compared with hash
   â†’ JWT token returned if valid
   â†’ Token stored in localStorage
   ```

3. **Protected Endpoints**
   ```
   Client sends: Authorization: Bearer <token>
   â†’ Token verified
   â†’ User ID extracted from token
   â†’ Request processed
   ```

---

## ðŸ’³ Credit Points System

**How it works:**
- New users get **100 credit points**
- Each fantasy team costs **10 credit points**
- Points replenish over time (configurable)
- Shows in profile/header

**Example:**
```
User gets 100 credits
Creates 5 teams â†’ 100 - (5Ã—10) = 50 credits remaining
```

---

## ðŸ† Leaderboard System

**Match Leaderboards:**
- Shows all fantasy teams in a match
- Ranked by total_points (descending)
- Displays: username, team_name, total_points, rank

**Global Leaderboards:**
- Top 50 users by lifetime points
- Shows: username, total_points, teams_count, rank

---

## ðŸ“± Testing the App

### **Test Account 1 (Already Works)**
- Create new account in the app
- Fill in: username, email, password
- Automatic 100 credit points
- Ready to create teams!

### **Test Workflow**
1. Register â†’ See login screen
2. Login â†’ See matches
3. Click match â†’ See players
4. Create team â†’ Select 11 players
5. View team â†’ See in "My Teams"
6. Check leaderboard â†’ See your rank

---

## ðŸŒ Deployment (Render.com)

### **One-Click Deployment**

1. **Commit to GitHub**
   ```bash
   git add .
   git commit -m "Add Fantasy Cricket App"
   git push origin main
   ```

2. **Go to Render.com**
   - Sign up/login with GitHub
   - Click "New +"
   - Select "Web Service"
   - Connect your repository
   - Select `fantasy_game` repo

3. **Configure**
   - Name: fantasy-cricket-app
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm start`
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=5000
     DATABASE_URL=[Render PostgreSQL URL]
     JWT_SECRET=[Random string]
     CRICKET_API_KEY=demo
     ```

4. **Deploy Database**
   - Create Render PostgreSQL
   - Copy connection string
   - Paste as DATABASE_URL
   - Deploy!

5. **Done!** ðŸŽ‰
   - App accessible at: `https://fantasy-cricket-app.onrender.com`

---

## ðŸ› ï¸ Development

### **Available Scripts**

```bash
npm start       # Start production server
npm run dev     # Start with nodemon (auto-reload)
```

### **Project Dependencies**

| Package | Purpose |
|---------|---------|
| express | Web framework |
| pg | PostgreSQL client |
| cors | Cross-origin requests |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT tokens |
| axios | HTTP requests |
| dotenv | Environment variables |

---

## ðŸ› Troubleshooting

### **"Port 5000 already in use"**
```bash
# Change port in .env
PORT=3000

# Or kill the process using port 5000
# Windows: taskkill /PID [pid] /F
# Mac/Linux: lsof -ti:5000 | xargs kill -9
```

### **"Cannot find module 'express'"**
```bash
npm install
```

### **"Database connection error"**
- Check .env file has DATABASE_URL
- Verify PostgreSQL is running (for local dev)
- For Render: Database should be auto-created

### **"Invalid token" on protected endpoints**
- Login again to get new token
- Check localStorage has auth_token
- Token expires after 30 days

---

## ðŸ“š Documentation Files

This repo includes 9 comprehensive guides:

1. **START_HERE.md** - 30-minute quick start guide
2. **DEPLOYMENT.md** - Complete deployment walkthrough
3. **API_DOCUMENTATION.md** - All API endpoints with examples
4. **ARCHITECTURE.md** - System design & diagrams
5. **PROJECT_SUMMARY.md** - Complete project overview
6. **GIT_SETUP.md** - Git & GitHub instructions
7. **DOWNLOAD_INSTRUCTIONS.md** - How to download the project
8. **GITHUB_PUSH_GUIDE.md** - Push to GitHub guide
9. **COMPLETE_MANIFEST.md** - File manifest & description

Read **START_HERE.md** next!

---

## ðŸŽ¯ Next Steps

### **To Run Locally**
1. âœ… You have the code
2. Run: `npm install`
3. Run: `npm start`
4. Go to: http://localhost:5000

### **To Deploy Live**
1. Push code to GitHub
2. Go to Render.com
3. Connect GitHub
4. Configure environment
5. Deploy!

### **To Customize**
- Edit `public/index.html` for UI changes
- Edit `server.js` for backend changes
- Edit `.env` for configuration
- Restart: `npm start`

---

## ðŸ¤ Support

**Issues?**
- Check error messages carefully
- Read the relevant documentation
- Try restarting: `npm start`
- Delete `node_modules` and `npm install` again

**Deployment issues?**
- Check Render logs
- Verify environment variables
- Check database connection
- Read DEPLOYMENT.md

---

## ðŸ“ž Features & Capabilities

### âœ… Currently Implemented
- User authentication (register/login)
- Fantasy team creation
- Real-time leaderboards
- Credit point system
- Player selection
- Team ranking
- Dark theme UI
- Responsive design
- Mock player data (demo mode)

### ðŸš€ Ready to Add
- Real cricket API integration
- Payment system
- Email notifications
- Chat/messaging
- More game modes
- Mobile app
- User profiles
- Social features

---

## ðŸ“„ License

Open source - use freely for personal/commercial projects

---

## ðŸŽ‰ Summary

You now have a **complete, production-ready Fantasy Cricket application** that you can:

âœ… Run locally in 5 minutes
âœ… Deploy to Render in 15 minutes
âœ… Customize for your needs
âœ… Share with friends
âœ… Monetize if desired

**Get started with**: `npm install && npm start`

**Deploy with**: Push to GitHub + Render.com connect

**Questions?** Read the documentation files!

---

**Happy coding! ðŸš€**
