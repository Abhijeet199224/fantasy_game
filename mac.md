# ðŸŽ COMPLETE MAC SETUP GUIDE - Fantasy Cricket Pro

Everything you need to get your Fantasy Cricket app running on Mac!

---

## âœ… YOU HAVE ALL 5 FILES

Great! You have:
- âœ… server.js
- âœ… package.json
- âœ… .env.example
- âœ… .gitignore
- âœ… public/index.html

Now let's get it running on your Mac!

---

## ðŸš€ STEP 1: CREATE FOLDER STRUCTURE (2 minutes)

### **Open Terminal on Mac**

1. Press: `Command + Space`
2. Type: `Terminal`
3. Press: `Enter`

You'll see a terminal window open.

### **Create Project Folder**

In Terminal, copy-paste these commands one by one:

```bash
# Create the project folder
mkdir -p ~/Documents/fantasy_game/public

# Navigate into it
cd ~/Documents/fantasy_game

# Verify you're in the right place
pwd
```

**You should see:** `/Users/YourName/Documents/fantasy_game`

### **Copy Your Files Into This Folder**

1. **Using Finder:**
   - Open Finder
   - Press `Command + Shift + G`
   - Type: `/Users/YourName/Documents/fantasy_game`
   - Press Enter
   - Drag your files here

2. **Using Terminal (Copy-Paste):**
   - Copy each file content
   - In Terminal:
   ```bash
   # Create server.js
   cat > server.js << 'EOF'
   [Paste server.js content here]
   EOF
   
   # Create package.json
   cat > package.json << 'EOF'
   [Paste package.json content here]
   EOF
   
   # Create .env.example
   cat > .env.example << 'EOF'
   [Paste .env.example content here]
   EOF
   
   # Create .gitignore
   cat > .gitignore << 'EOF'
   [Paste .gitignore content here]
   EOF
   
   # Create public/index.html
   cat > public/index.html << 'EOF'
   [Paste public/index.html content here]
   EOF
   ```

### **Verify Files Are In Place**

In Terminal, type:

```bash
ls -la
```

You should see:
```
server.js
package.json
.env.example
.gitignore
public/
```

---

## ðŸŽ STEP 2: INSTALL NODE.JS (5 minutes)

### **Check If You Already Have Node.js**

In Terminal, type:

```bash
node --version
```

If you see `v18.x.x` or higher, skip to Step 3!

### **Install Node.js with Homebrew (Recommended)**

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**:
   ```bash
   brew install node
   ```

3. **Verify Installation**:
   ```bash
   node --version    # Should show v18+
   npm --version     # Should show 9+
   ```

### **Alternative: Download from Website**

If Homebrew doesn't work:
1. Go to: https://nodejs.org
2. Click "LTS" (Long Term Support)
3. Download for Mac
4. Run the installer
5. Follow the steps

---

## ðŸ”§ STEP 3: CREATE .ENV FILE (1 minute)

In Terminal (in your fantasy_game folder):

```bash
# Copy the template
cp .env.example .env

# Verify it was created
ls -la .env
```

**You should see:** `.env` file listed

### **View Your .env File**

```bash
cat .env
```

You'll see:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://user:password@host:port/fantasy_cricket_db?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CRICKET_API_KEY=demo
```

---

## ðŸ“¦ STEP 4: INSTALL DEPENDENCIES (2 minutes)

In Terminal (in your fantasy_game folder):

```bash
npm install
```

**Wait for completion...** You'll see lots of messages ending with:

```
added 50+ packages
in 2.5s
```

---

## ðŸš€ STEP 5: START THE APPLICATION (1 minute)

In Terminal (in your fantasy_game folder):

```bash
npm start
```

**You should see:**

```
âœ… Database tables initialized
ðŸš€ Server running on http://localhost:5000
ðŸ“Š API Base: http://localhost:5000/api
```

---

## ðŸŒ STEP 6: OPEN IN BROWSER (1 minute)

1. **Open your browser** (Chrome, Safari, Firefox, etc.)
2. Go to: `http://localhost:5000`
3. You should see: **Fantasy Cricket Pro login screen**

---

## ðŸ§ª STEP 7: TEST THE APP (5 minutes)

### **Register New Account**

1. Click "Register"
2. Enter:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Register"

You'll see:
- Login page (you got 100 credit points!)
- Click "Login" with your credentials
- See "Available Matches" page

### **Create Fantasy Team**

1. Click any match card
2. Click "Create Team"
3. Enter team name: `My First Team`
4. Select 11 players (click to select)
5. Click "Create Team"

Success! You've created a team! ðŸŽ‰

---

## ðŸ›‘ STEP 8: STOP THE APP

When done testing:

```bash
# In Terminal where app is running
Press: Control + C

# You'll see: ^C (and app stops)
```

---

## ðŸŒ PART 2: CONNECT TO RENDER.COM (Deploy Live)

Ready to make your app live on the internet? Follow these steps!

---

## ðŸ“ STEP 1: CREATE RENDER ACCOUNT

1. Go to: https://render.com
2. Click "Sign Up"
3. Choose "GitHub"
4. Authorize Render to access GitHub
5. Verify your email

---

## ðŸ“¤ STEP 2: PUSH CODE TO GITHUB

### **Create GitHub Repository**

1. Go to: https://github.com/new
2. Repository name: `fantasy-cricket-app`
3. Description: `Fantasy Cricket Gaming Platform`
4. Make it **Public**
5. Click "Create repository"

### **Push Your Code**

In Terminal (in your fantasy_game folder):

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "feat: Add complete Fantasy Cricket Pro application"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/fantasy-cricket-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Your code is now on GitHub!** âœ…

---

## ðŸ—„ï¸ STEP 3: CREATE POSTGRESQL DATABASE ON RENDER

### **Create PostgreSQL Instance**

1. Go to: https://render.com/dashboard
2. Click "New +"
3. Select "PostgreSQL"
4. Name: `fantasy-cricket-db`
5. Region: Pick closest to you
6. Click "Create Database"

**Wait for it to create...** (2-3 minutes)

### **Get Connection String**

1. Go to your database page
2. Copy the "External Database URL"
3. It looks like: `postgresql://user:pass@host:port/dbname`
4. Save this somewhere safe!

---

## ðŸŒ STEP 4: CREATE WEB SERVICE ON RENDER

### **Create Service**

1. Go to: https://render.com/dashboard
2. Click "New +"
3. Select "Web Service"
4. Select "GitHub"
5. Find your `fantasy-cricket-app` repo
6. Click "Connect"

### **Configure Service**

Fill in these fields:

| Field | Value |
|-------|-------|
| Name | `fantasy-cricket-app` |
| Environment | `Node` |
| Region | Same as database |
| Branch | `main` |
| Build Command | `npm install` |
| Start Command | `npm start` |

### **Add Environment Variables**

Click "Advanced" â†’ "Add Environment Variable"

Add these (copy from your .env file):

```
NODE_ENV = production
PORT = 5000
DATABASE_URL = [Your PostgreSQL URL from Step 3]
JWT_SECRET = change-this-to-random-string-in-production
CRICKET_API_KEY = demo
```

### **Deploy**

Click "Create Web Service"

**Wait for deployment...** (3-5 minutes)

You'll see:
```
âœ… Build successful
âœ… Deployed
```

---

## ðŸŽ‰ YOUR APP IS LIVE!

Your app is now accessible at:

```
https://fantasy-cricket-app.onrender.com
```

(Render gives you a custom URL)

Share this link with anyone!

---

## ðŸ PART 3: GET CRICKET DATA

Your app currently uses **demo data**. Here's how to get real cricket data:

---

## ðŸ”„ OPTION 1: USE CRICKET API (Recommended)

### **Get Free API Key**

1. Go to: https://cricketdata.org
2. Click "Sign Up"
3. Create account
4. Get your free API key
5. Copy it

### **Update Your .env File**

In Terminal:

```bash
# Open .env in text editor
nano .env
```

Change:

```
CRICKET_API_KEY=demo
```

To:

```
CRICKET_API_KEY=your_api_key_here
```

Press: `Control + O` â†’ `Enter` â†’ `Control + X`

### **Restart App**

```bash
npm start
```

Your app now fetches real cricket matches! âœ…

---

## ðŸ“Š OPTION 2: MANUAL DATA ENTRY

If you don't want to use an API, manually add matches:

### **Add Match Manually**

In your database, insert data:

```sql
INSERT INTO matches (team1, team2, status, start_date) 
VALUES ('India', 'Pakistan', 'Upcoming', NOW() + INTERVAL '1 day');
```

---

## ðŸ”‘ OPTION 3: USE CRICKET LIVE API

Alternative free API:

1. Go to: https://cricketapi.com
2. Get free tier API key
3. Update `.env.example`
4. Restart app

---

## ðŸ“± COMPLETE WORKFLOW SUMMARY

### **For Local Testing**

```bash
# Navigate to project
cd ~/Documents/fantasy_game

# Start app
npm start

# Open browser
# http://localhost:5000

# Stop app
# Press Control + C
```

### **For Live Deployment**

```bash
# 1. Push code to GitHub
git add .
git commit -m "Update: [your changes]"
git push origin main

# 2. Render auto-deploys
# Check: https://render.com/dashboard

# 3. Access your live app
# https://fantasy-cricket-app.onrender.com
```

---

## âœ… VERIFICATION CHECKLIST

### **Local Setup**
- [ ] Node.js v18+ installed
- [ ] 5 files in correct folder structure
- [ ] `.env` file created
- [ ] `npm install` completed
- [ ] `npm start` runs without errors
- [ ] App loads at `http://localhost:5000`
- [ ] Can register and login
- [ ] Can create fantasy team

### **Render Deployment**
- [ ] GitHub account created
- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Web Service created on Render
- [ ] Environment variables configured
- [ ] App deployed successfully
- [ ] App accessible at Render URL
- [ ] Database connected

### **Cricket Data**
- [ ] API key obtained (optional)
- [ ] `.env` updated with API key
- [ ] App fetching real cricket data (or using demo)

---

## ðŸ†˜ COMMON MAC ISSUES & FIXES

### **Issue: "npm: command not found"**

**Fix:**
```bash
# Install Node.js
brew install node

# Or download from: https://nodejs.org
```

### **Issue: "Port 5000 already in use"**

**Fix:**
```bash
# Change PORT in .env
nano .env
# Change: PORT=5000 to PORT=3000

# Or kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### **Issue: "Cannot find module 'express'"**

**Fix:**
```bash
npm install
```

### **Issue: ".env file not created"**

**Fix:**
```bash
cp .env.example .env

# Or manually create:
touch .env
nano .env
# Paste content from .env.example
```

### **Issue: Can't push to GitHub**

**Fix - Setup Git:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Then try push again
git push origin main
```

### **Issue: Database connection error on Render**

**Fix:**
1. Check DATABASE_URL in Render environment variables
2. Verify it matches PostgreSQL URL exactly
3. Restart Web Service in Render dashboard

---

## ðŸ“ž QUICK COMMAND REFERENCE

```bash
# Navigation
cd ~/Documents/fantasy_game              # Go to project
pwd                                      # Verify location

# Node & npm
node --version                           # Check Node version
npm --version                            # Check npm version
npm install                              # Install dependencies
npm start                                # Start app
npm run dev                              # Start with auto-reload (if nodemon installed)

# Files
ls -la                                   # List all files
cat .env                                 # View .env file
nano .env                                # Edit .env file

# Git
git init                                 # Initialize git
git add .                                # Stage all files
git commit -m "message"                  # Commit changes
git push origin main                     # Push to GitHub
git status                               # Check status

# Terminal
Control + C                              # Stop running process
Command + K                              # Clear terminal
Control + U                              # Clear current line
```

---

## ðŸŽ¯ TIMELINE

| Step | Action | Time |
|------|--------|------|
| 1 | Create folder structure | 2 min |
| 2 | Install Node.js | 5 min |
| 3 | Create .env | 1 min |
| 4 | npm install | 2 min |
| 5 | npm start | 1 min |
| 6 | Test in browser | 5 min |
| **Local Total** | **~16 minutes** |
| 7 | Create GitHub account | 5 min |
| 8 | Push to GitHub | 2 min |
| 9 | Create Render database | 3 min |
| 10 | Deploy to Render | 5 min |
| **Deployment Total** | **~15 minutes** |
| **Grand Total** | **~30 minutes** â±ï¸ |

---

## ðŸŽ‰ YOU'RE READY!

You now have:
âœ… Complete setup instructions for Mac
âœ… Step-by-step deployment guide
âœ… Cricket data integration options
âœ… Troubleshooting help
âœ… Everything needed to succeed

**Start with Step 1 and you'll have a live app in 30 minutes!** ðŸš€

---

## ðŸ† FINAL NOTES

### **For Development**

Use local testing to develop and test:
```bash
npm start
# http://localhost:5000
```

### **For Production**

Use Render for live deployment:
```
https://fantasy-cricket-app.onrender.com
```

### **For Cricket Data**

Start with demo, then add real API key:
1. Get from cricketdata.org
2. Update .env
3. Restart app

---

**Build â€¢ Deploy â€¢ Play! ðŸâœ¨**

Everything is ready. You have all the code. You have all the instructions.

**Go build your Fantasy Cricket app!** ðŸš€
