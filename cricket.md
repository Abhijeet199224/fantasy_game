# ðŸ CRICKET DATA INTEGRATION GUIDE

Complete guide to adding real cricket data to your Fantasy Cricket app

---

## ðŸ“Š WHAT YOU NEED TO KNOW

Your app has **3 data options:**

1. âœ… **Demo Data** (Built-in, no setup needed)
2. âœ… **Real Cricket API** (Free tier available)
3. âœ… **Manual Data Entry** (Full control)

---

## ðŸŽ¯ OPTION 1: USE DEMO DATA (Easiest)

### **No Setup Needed!**

By default, your app uses demo cricket data:
- 6 sample matches
- 22 sample players
- Mock leaderboard data

Just keep in .env:
```
CRICKET_API_KEY=demo
```

**Perfect for testing!**

---

## ðŸ”„ OPTION 2: USE REAL CRICKET API (Recommended)

### **Best Free APIs for Cricket Data**

#### **1. Cricket Data (Recommended)**

**Website:** https://cricketdata.org

**Steps:**
1. Go to website
2. Click "Sign Up"
3. Create free account
4. Go to "API Keys" section
5. Copy your API key
6. Update .env:
   ```bash
   CRICKET_API_KEY=your_api_key_here
   ```

**Data Available:**
- Live matches
- Upcoming matches
- Player statistics
- Leaderboards
- Ball-by-ball commentary

**Free Tier:**
- âœ… Up to 1000 API calls/month
- âœ… Real-time data
- âœ… Perfect for small apps

---

#### **2. CricketAPI (Alternative)**

**Website:** https://cricketapi.com

**Steps:**
1. Go to website
2. Click "Get Started"
3. Create account
4. Copy API key from dashboard
5. Update your server.js to use this API
6. Update .env:
   ```bash
   CRICKET_API_KEY=your_cricketapi_key
   ```

**Data Available:**
- Live scores
- Match schedules
- Player info
- Rankings

---

#### **3. ESPN Cricinfo Data (Advanced)**

**Website:** https://www.espncricinfo.com/api

**Steps:**
1. No API key needed
2. Use free endpoints directly
3. Update server.js to call ESPN API
4. No .env change needed

---

## ðŸ“‹ HOW TO ADD API KEY TO YOUR APP

### **Step 1: Get Your API Key**

Sign up at one of the cricket API websites above.

### **Step 2: Update .env File**

```bash
# Open .env
nano .env
```

Change:
```
CRICKET_API_KEY=demo
```

To:
```
CRICKET_API_KEY=your_actual_key_from_cricketdata_org
```

Press: `Control + O` â†’ `Enter` â†’ `Control + X`

### **Step 3: Restart App**

```bash
npm start
```

Your app will now fetch real cricket data! âœ…

---

## ðŸ”§ HOW THE API INTEGRATION WORKS

### **In Your server.js**

The code looks for API key:

```javascript
const CRICKET_API_KEY = process.env.CRICKET_API_KEY;

// If demo: uses mock data
// If real key: fetches from cricket API
```

When you restart with real key, it automatically switches to real data!

---

## ðŸ“± WHAT CRICKET DATA YOU'LL GET

### **Matches Data:**
- âœ… Team 1 name
- âœ… Team 2 name
- âœ… Match status (Upcoming, Live, Completed)
- âœ… Start date and time
- âœ… Match format (T20, ODI, Test)
- âœ… Venue/Ground

### **Player Data:**
- âœ… Player name
- âœ… Role (Batsman, Bowler, All-rounder)
- âœ… Team
- âœ… Base points
- âœ… Recent form
- âœ… Statistics

### **Leaderboard Data:**
- âœ… User ranking
- âœ… Total points
- âœ… Number of teams
- âœ… Win/loss record

---

## ðŸŽ® FANTASY POINTS SYSTEM

Your app calculates fantasy points from:

| Event | Points |
|-------|--------|
| Each run scored | +1 |
| Each wicket taken | +25 |
| Each catch | +8 |
| Each stumping | +12 |
| Each 50 | +10 |
| Each 100 | +20 |
| Economy rate bonus | +5 |

This is auto-calculated from real cricket data!

---

## ðŸš€ DEPLOYMENT WITH REAL DATA

### **Step 1: Update .env in Render**

1. Go to Render dashboard
2. Select your Web Service
3. Go to "Environment"
4. Update:
   ```
   CRICKET_API_KEY = your_real_key
   ```
5. Save and redeploy

App will restart automatically with real data! âœ…

---

## ðŸ“Š TESTING CRICKET API

### **Check If API Works**

In Terminal:

```bash
# Check your API key validity
curl "https://api.cricketdata.org/matches?apikey=YOUR_KEY"
```

If you get JSON back, API is working!

---

## ðŸ†˜ TROUBLESHOOTING CRICKET DATA

### **Issue: "No matches loading"**

**Check 1: API Key**
```bash
cat .env
# Verify CRICKET_API_KEY is set
```

**Check 2: API Status**
- Go to cricket API website
- Check if service is up
- Check API quota usage

**Check 3: Restart App**
```bash
npm start
```

### **Issue: "Wrong match data"**

This can happen if:
- API source changed data format
- You're using old API endpoint
- API key expired

**Solution:**
- Get new API key
- Update .env
- Restart app

### **Issue: "Players data missing"**

Some APIs don't provide player data:
- Use different API provider
- Manually add players to database
- Mix multiple APIs

---

## ðŸ’¾ OPTION 3: MANUAL DATA ENTRY

If you don't want to use API, manually add data:

### **Add Matches Directly**

Using a database tool like DBeaver:

```sql
-- Add India vs Pakistan match
INSERT INTO matches (team1, team2, status, start_date, format) 
VALUES (
  'India', 
  'Pakistan', 
  'Upcoming', 
  NOW() + INTERVAL '1 day',
  'T20'
);

-- Add more matches
INSERT INTO matches (team1, team2, status, start_date) 
VALUES ('Australia', 'England', 'Upcoming', NOW() + INTERVAL '2 days');

INSERT INTO matches (team1, team2, status, start_date) 
VALUES ('New Zealand', 'South Africa', 'Upcoming', NOW() + INTERVAL '3 days');
```

### **Add Players**

```sql
-- Add Virat Kohli
INSERT INTO players (name, role, team, base_points, match_id)
VALUES ('Virat Kohli', 'Batsman', 'India', 80, 1);

-- Add Jasprit Bumrah
INSERT INTO players (name, role, team, base_points, match_id)
VALUES ('Jasprit Bumrah', 'Bowler', 'India', 75, 1);

-- Continue for other players...
```

---

## ðŸŽ¯ RECOMMENDED SETUP

### **Development (Testing)**

```
CRICKET_API_KEY=demo
```

Use demo data while testing and developing.

### **Production (Live)**

```
CRICKET_API_KEY=your_real_api_key
```

Use real cricket data for actual users.

---

## ðŸ“ˆ SCALING UP

When your app grows:

### **Add More Data Sources**

Combine multiple APIs:
```javascript
// Fetch matches from API A
// Fetch players from API B
// Fetch leaderboards from API C
```

### **Cache Data**

Store API responses locally:
```javascript
// Fetch data every 30 minutes instead of every request
// Reduces API quota usage
// Faster app response
```

### **Use Webhooks**

Get real-time updates instead of polling:
```javascript
// Cricket API sends data when matches start
// Your app updates automatically
// No need to constantly check API
```

---

## ðŸ”— CRICKET API COMPARISON

| Feature | Cricket Data | CricketAPI | ESPN Cricinfo |
|---------|--------------|-----------|---------------|
| Free Tier | âœ… 1000/month | âœ… 100/day | âœ… Unlimited |
| Real-time | âœ… Yes | âœ… Yes | âš ï¸ Delayed |
| Setup | âœ… Easy | âœ… Easy | âš ï¸ Complex |
| Player Data | âœ… Complete | âš ï¸ Limited | âœ… Detailed |
| Documentation | âœ… Good | âœ… Good | âš ï¸ Sparse |

**Recommendation:** Start with Cricket Data API (best balance)

---

## âœ… CHECKLIST

Cricket Data Setup:
- [ ] Account created on cricketdata.org
- [ ] API key copied
- [ ] .env updated with API key
- [ ] App restarted
- [ ] Real matches visible in app
- [ ] Player data loading correctly

Deployment:
- [ ] API key added to Render environment
- [ ] Web Service restarted
- [ ] Live app showing real matches
- [ ] Leaderboard updating

---

## ðŸ“ž API KEY SECURITY

âš ï¸ **IMPORTANT:**

Never share your API key!

âœ… **Safe places:**
- .env file (not shared)
- Render environment variables (encrypted)
- Server-side only

âŒ **Unsafe places:**
- Frontend code (visible in browser)
- GitHub commits (public)
- Chat messages (save locally)

---

## ðŸš€ NEXT STEPS

1. **Get API key** from cricketdata.org
2. **Update .env** with your key
3. **Restart app** locally (`npm start`)
4. **Test real data** loads
5. **Redeploy** to Render with API key
6. **Celebrate!** Your app now has real cricket data! ðŸŽ‰

---

## ðŸ“š RESOURCES

- Cricket Data: https://cricketdata.org
- CricketAPI: https://cricketapi.com
- ESPN Cricinfo: https://www.espncricinfo.com/api
- Your App Docs: Check README.md

---

**Your fantasy cricket app is ready for real data! Add API key and go live! ðŸðŸš€**
