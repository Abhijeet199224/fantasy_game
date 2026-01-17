# ðŸš€ MAC QUICK START - 30 MINUTES TO LIVE APP

Ultra-condensed version. Copy-paste commands exactly!

---

## â±ï¸ PART 1: GET IT RUNNING LOCALLY (15 minutes)

### **Step 1: Create Folder & Copy Files**

```bash
# Open Terminal (Command + Space, type "Terminal")
mkdir -p ~/Documents/fantasy_game/public
cd ~/Documents/fantasy_game
```

Copy your 5 files into this folder using Finder.

### **Step 2: Install Node.js (Skip if you have v18+)**

Check:
```bash
node --version
```

If not installed:
```bash
brew install node
```

Or download: https://nodejs.org

### **Step 3: Create .env**

```bash
cp .env.example .env
```

### **Step 4: Install & Start**

```bash
npm install
npm start
```

### **Step 5: Test**

1. Open browser: `http://localhost:5000`
2. Register new account
3. Login
4. Create fantasy team

âœ… **APP IS RUNNING!**

---

## â±ï¸ PART 2: DEPLOY TO INTERNET (15 minutes)

### **Step 1: Push to GitHub**

```bash
# Configure Git (one time)
git config --global user.name "Your Name"
git config --global user.email "your.email@gmail.com"

# Initialize & push
git init
git add .
git commit -m "Initial commit: Fantasy Cricket Pro"
git branch -M main

# Add your GitHub repo URL
git remote add origin https://github.com/YOUR_USERNAME/fantasy-cricket-app.git
git push -u origin main
```

### **Step 2: Create Database on Render**

1. Go: https://render.com
2. Sign up with GitHub
3. Click "New +"
4. Select "PostgreSQL"
5. Name: `fantasy-cricket-db`
6. Create
7. **Copy the External Database URL** (save it!)

### **Step 3: Create Web Service on Render**

1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repo
4. Fill in:
   ```
   Name: fantasy-cricket-app
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```
5. Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 5000
   DATABASE_URL = [paste the URL from Step 2]
   JWT_SECRET = change-me-to-random-string
   CRICKET_API_KEY = demo
   ```
6. Click "Create Web Service"
7. Wait for deploy (3-5 min)

âœ… **APP IS LIVE!**

Your URL will be shown (like `https://fantasy-cricket-app-xxxxx.onrender.com`)

---

## ðŸ PART 3: GET CRICKET DATA

### **Option 1: Real Data (Recommended)**

1. Go: https://cricketdata.org
2. Sign up (free)
3. Copy your API key
4. Update .env:
   ```bash
   nano .env
   # Change: CRICKET_API_KEY=demo
   # To: CRICKET_API_KEY=your_key_here
   ```
5. Restart: `npm start`

### **Option 2: Use Demo Data**

Keep `CRICKET_API_KEY=demo` in .env

App has mock cricket data built-in.

---

## ðŸ›‘ STOP & RESTART

```bash
# Stop app
Control + C

# Start app again
npm start
```

---

## ðŸ”§ TROUBLESHOOTING

**App won't start?**
```bash
npm install
npm start
```

**Port 5000 in use?**
Edit .env, change PORT to 3000

**Can't push to GitHub?**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@gmail.com"
git push origin main
```

**Database error on Render?**
- Check DATABASE_URL in Render dashboard
- Restart Web Service

---

## âœ… CHECKLIST

Local:
- [ ] Files in ~/Documents/fantasy_game
- [ ] Node v18+ installed
- [ ] npm install done
- [ ] npm start works
- [ ] http://localhost:5000 loads

Live:
- [ ] Code on GitHub
- [ ] PostgreSQL created on Render
- [ ] Web Service deployed
- [ ] App accessible at Render URL

Cricket Data:
- [ ] API key in .env (optional)
- [ ] App running with data

---

## ðŸ“± COMMANDS COPY-PASTE

```bash
# Navigation
cd ~/Documents/fantasy_game

# Install & Start
npm install
npm start

# Stop
Control + C

# Git Setup (once)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Git Push
git init
git add .
git commit -m "Fantasy Cricket Pro"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fantasy-cricket-app.git
git push -u origin main

# Env Setup
cp .env.example .env
nano .env
```

---

## ðŸŽ¯ TIMELINE

1. Create folders: 2 min
2. Install Node: 5 min
3. npm install: 2 min
4. Test locally: 5 min
5. Push GitHub: 2 min
6. Render setup: 5 min
7. Deploy: 5 min

**Total: ~30 minutes â±ï¸**

---

## ðŸŽ‰ DONE!

You now have a live fantasy cricket app!

**Local:** http://localhost:5000
**Live:** Your Render URL

Share the live link with friends! ðŸš€

---

**Everything you need is above. Start with Part 1! ðŸ**
