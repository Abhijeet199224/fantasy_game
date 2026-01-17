# ðŸ“¦ COMPLETE INSTALLATION & SETUP GUIDE

Everything you need to get Fantasy Cricket Pro running!

---

## âœ… WHAT YOU NEED RIGHT NOW

### **Files in This Package:**

```
fantasy_game/
â”œâ”€â”€ server.js                    âœ… Backend code
â”œâ”€â”€ package.json                 âœ… Dependencies  
â”œâ”€â”€ .env.example                 âœ… Config template
â”œâ”€â”€ .gitignore                   âœ… Git rules
â”œâ”€â”€ public/index.html            âœ… Frontend code
â”œâ”€â”€ README.md                    âœ… This guide
â””â”€â”€ [More documentation files]
```

### **Software to Install:**
- Node.js v18+ â†’ https://nodejs.org
- Git â†’ https://git-scm.com
- (Optional) VS Code â†’ https://code.visualstudio.com

---

## ðŸš€ STEP 1: SETUP ON YOUR COMPUTER

### **Windows:**

1. **Download Node.js**
   - Go to https://nodejs.org
   - Click "LTS" (recommended)
   - Run installer
   - Click "Next" multiple times
   - Restart computer

2. **Verify Installation**
   - Press Windows Key
   - Type "Command Prompt"
   - Click to open
   - Type: `node --version`
   - Should show: `v18.x.x` or higher

3. **Download Git**
   - Go to https://git-scm.com/download/win
   - Run installer
   - Click "Next" multiple times

---

### **Mac:**

1. **Install Homebrew** (if not already)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**
   ```bash
   brew install node
   ```

3. **Verify**
   ```bash
   node --version   # Should be v18+
   ```

---

### **Linux:**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nodejs npm git
```

**Fedora/RHEL:**
```bash
sudo dnf install nodejs npm git
```

**Verify:**
```bash
node --version
npm --version
```

---

## ðŸŽ¯ STEP 2: EXTRACT PROJECT FILES

### **If you have a ZIP file:**

1. **Windows**: Right-click â†’ "Extract All"
2. **Mac**: Double-click (auto-extracts)
3. **Linux**: `unzip fantasy_game.zip`

Remember the folder location!

### **If you're cloning from GitHub:**

```bash
git clone https://github.com/Abhijeet199224/fantasy_game.git
cd fantasy_game
```

---

## ðŸ’» STEP 3: OPEN TERMINAL IN PROJECT FOLDER

### **Windows:**

1. Open File Explorer
2. Navigate to `fantasy_game` folder
3. Hold SHIFT + Right-click in empty space
4. Click "Open PowerShell window here" OR "Open Command Prompt here"

### **Mac:**

1. Open Terminal (Applications â†’ Utilities â†’ Terminal)
2. Type: `cd ` (with space)
3. Drag `fantasy_game` folder into Terminal
4. Press Enter

### **Linux:**

1. Open Terminal
2. Type: `cd ~/path/to/fantasy_game`
3. Press Enter

**You should see the folder path in terminal** âœ…

---

## ðŸ“¦ STEP 4: INSTALL DEPENDENCIES

In the terminal (make sure you're in fantasy_game folder):

```bash
npm install
```

**Wait for it to complete** (takes 1-2 minutes)

You should see:
```
added 50+ packages
up to date in 2.5s
```

---

## âš™ï¸ STEP 5: CONFIGURE ENVIRONMENT

### **Create .env file:**

**Windows (PowerShell):**
```bash
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### **Edit .env file:**

1. Open `.env` file with any text editor (Notepad, VS Code, etc.)
2. You'll see:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=...
   JWT_SECRET=...
   CRICKET_API_KEY=demo
   ```

3. For **local testing**, leave as-is (defaults work fine)
4. Save the file

---

## ðŸŽ® STEP 6: START THE APPLICATION

In terminal:

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

## ðŸŒ STEP 7: OPEN IN BROWSER

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Go to: **http://localhost:5000**
3. You should see: **Fantasy Cricket Pro** login screen

---

## ðŸ§ª STEP 8: TEST THE APP

### **Create Account:**
1. Click "Register"
2. Enter:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Register"
4. You get 100 credit points! ðŸŽ‰

### **Login:**
1. Enter username and password
2. Click "Login"
3. See matches and available players

### **Create Team:**
1. Click a match
2. Select 11 players
3. Click "Create Team"
4. Costs 10 credit points
5. Team appears in "My Teams"

---

## ðŸ›‘ STEP 9: STOP THE APPLICATION

When done testing:

```bash
Press CTRL + C
```

The app will stop.

---

## ðŸ“Š FILE REFERENCE

### **Key Files & What They Do:**

| File | Purpose |
|------|---------|
| `server.js` | Backend API & database |
| `public/index.html` | Frontend web interface |
| `package.json` | Dependencies & scripts |
| `.env` | Configuration (passwords, API keys) |
| `.gitignore` | Files to ignore in Git |

---

## ðŸ”§ COMMON ISSUES & FIXES

### **Issue: "npm: command not found"**

**Cause**: Node.js not installed properly

**Fix**:
1. Download Node.js: https://nodejs.org
2. Run installer completely
3. Restart your computer
4. Try again: `npm --version`

---

### **Issue: "Port 5000 already in use"**

**Cause**: Another application using port 5000

**Fix**:
1. Open `.env` file
2. Change: `PORT=5000` â†’ `PORT=3000`
3. Save
4. Run: `npm start`
5. Go to: http://localhost:3000

---

### **Issue: "Cannot find module 'express'"**

**Cause**: Dependencies not installed

**Fix**:
```bash
npm install
```

---

### **Issue: "ENOENT: no such file or directory, open '.env'"**

**Cause**: `.env` file not created

**Fix**:
```bash
# Copy the template
cp .env.example .env

# Or manually:
# 1. Open text editor
# 2. Copy content from .env.example
# 3. Save as .env
# 4. Save in fantasy_game folder
```

---

### **Issue: App won't start / Database error**

**Fix**:
1. Check error message carefully
2. Delete `node_modules` folder:
   ```bash
   rm -rf node_modules
   ```
3. Install again:
   ```bash
   npm install
   ```
4. Try starting:
   ```bash
   npm start
   ```

---

## âœ¨ WHAT YOU CAN DO NOW

âœ… **Run locally** - `npm start`
âœ… **Create accounts** - Full registration
âœ… **Create teams** - Select players, costs credit points
âœ… **See leaderboards** - Real-time rankings
âœ… **Test all features** - Dark theme, responsive design
âœ… **View player stats** - Mock data included

---

## ðŸš€ NEXT STEPS

### **To Keep Developing:**
1. Edit files in text editor
2. Save changes
3. Press CTRL+C to stop server
4. Run `npm start` again
5. Refresh browser to see changes

### **To Deploy Live:**
Follow **DEPLOYMENT.md** for Render.com setup

### **To Commit to GitHub:**
Follow **GIT_SETUP.md** for GitHub instructions

---

## ðŸ“š MORE DOCUMENTATION

Inside this folder you'll find:

- **README.md** - Complete project overview
- **DEPLOYMENT.md** - How to deploy live
- **API_DOCUMENTATION.md** - All API endpoints
- **START_HERE.md** - Quick 30-minute guide
- **ARCHITECTURE.md** - System design
- **GIT_SETUP.md** - GitHub instructions

---

## âœ… COMPLETE CHECKLIST

- [ ] Downloaded Node.js
- [ ] Verified: `node --version` shows v18+
- [ ] Extracted project files
- [ ] Opened terminal in project folder
- [ ] Ran: `npm install`
- [ ] Created `.env` file
- [ ] Started: `npm start`
- [ ] Opened: http://localhost:5000
- [ ] Registered test account
- [ ] Logged in successfully
- [ ] Created fantasy team
- [ ] Viewed leaderboard

**If all checked:** You're ready! ðŸŽ‰

---

## ðŸ’¡ TIPS

1. **Keep terminal open** while developing
2. **Auto-reload code** with: `npm run dev`
3. **Check console** for error messages
4. **Clear browser cache** if things look weird
5. **Restart often** - usually fixes issues

---

## ðŸ“ž QUICK REFERENCE

```bash
# Start application
npm start

# Install dependencies
npm install

# Create .env file (copy from template)
cp .env.example .env

# Check Node version
node --version

# Check npm version
npm --version

# Stop server
CTRL + C

# Delete dependencies & reinstall
rm -rf node_modules
npm install

# Start with auto-reload
npm run dev
```

---

## ðŸŽ¯ YOU'RE ALL SET!

You now have:
âœ… Complete Fantasy Cricket application
âœ… Running locally
âœ… Full documentation
âœ… Ready to customize
âœ… Ready to deploy

**Start with**: `npm install && npm start`

**Questions?** Check the documentation files!

**Ready to deploy?** Read DEPLOYMENT.md

---

**Happy coding! ðŸš€ðŸ**
