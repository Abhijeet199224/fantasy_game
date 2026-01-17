import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database
const db = {
  users: [],
  matches: [
    { id: 1, team1: 'India', team2: 'Pakistan', status: 'Upcoming', start_date: new Date(Date.now() + 86400000).toISOString(), format: 'T20' },
    { id: 2, team1: 'Australia', team2: 'England', status: 'Upcoming', start_date: new Date(Date.now() + 172800000).toISOString(), format: 'T20' },
    { id: 3, team1: 'New Zealand', team2: 'South Africa', status: 'Upcoming', start_date: new Date(Date.now() + 259200000).toISOString(), format: 'ODI' },
    { id: 4, team1: 'West Indies', team2: 'Bangladesh', status: 'Upcoming', start_date: new Date(Date.now() + 345600000).toISOString(), format: 'T20' },
    { id: 5, team1: 'Sri Lanka', team2: 'Afghanistan', status: 'Upcoming', start_date: new Date(Date.now() + 432000000).toISOString(), format: 'T20' },
    { id: 6, team1: 'Ireland', team2: 'Netherlands', status: 'Upcoming', start_date: new Date(Date.now() + 518400000).toISOString(), format: 'ODI' }
  ],
  players: {
    1: [
      { id: 1, name: 'Virat Kohli', role: 'Batsman', team: 'India', base_points: 85 },
      { id: 2, name: 'Jasprit Bumrah', role: 'Bowler', team: 'India', base_points: 80 },
      { id: 3, name: 'Rohit Sharma', role: 'Batsman', team: 'India', base_points: 82 },
      { id: 4, name: 'KL Rahul', role: 'Batsman', team: 'India', base_points: 78 },
      { id: 5, name: 'Hardik Pandya', role: 'All-rounder', team: 'India', base_points: 75 },
      { id: 6, name: 'Suryakumar Yadav', role: 'Batsman', team: 'India', base_points: 79 },
      { id: 7, name: 'Axar Patel', role: 'All-rounder', team: 'India', base_points: 72 },
      { id: 8, name: 'Rishabh Pant', role: 'Batsman', team: 'India', base_points: 81 },
      { id: 9, name: 'Arjun Tendulkar', role: 'Bowler', team: 'India', base_points: 74 },
      { id: 10, name: 'Mohammed Shami', role: 'Bowler', team: 'India', base_points: 77 },
      { id: 11, name: 'Ishan Kishan', role: 'Batsman', team: 'India', base_points: 76 }
    ],
    2: [
      { id: 12, name: 'Babar Azam', role: 'Batsman', team: 'Pakistan', base_points: 88 },
      { id: 13, name: 'Shaheen Afridi', role: 'Bowler', team: 'Pakistan', base_points: 83 },
      { id: 14, name: 'Imam-ul-Haq', role: 'Batsman', team: 'Pakistan', base_points: 77 },
      { id: 15, name: 'Shadab Khan', role: 'All-rounder', team: 'Pakistan', base_points: 72 },
      { id: 16, name: 'Naseem Shah', role: 'Bowler', team: 'Pakistan', base_points: 74 },
      { id: 17, name: 'Mohammad Rizwan', role: 'Batsman', team: 'Pakistan', base_points: 80 },
      { id: 18, name: 'Hasan Ali', role: 'Bowler', team: 'Pakistan', base_points: 76 },
      { id: 19, name: 'Fakhar Zaman', role: 'Batsman', team: 'Pakistan', base_points: 75 },
      { id: 20, name: 'Iftikhar Ahmed', role: 'All-rounder', team: 'Pakistan', base_points: 71 },
      { id: 21, name: 'Amir Malik', role: 'Bowler', team: 'Pakistan', base_points: 73 },
      { id: 22, name: 'Abdullah Shafique', role: 'Batsman', team: 'Pakistan', base_points: 78 }
    ]
  },
  fantasy_teams: [],
  nextUserId: 1,
  nextTeamId: 1
};

const JWT_SECRET = process.env.JWT_SECRET || 'fantasy-cricket-secret-key-2024';

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const existingUser = db.users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: ++db.nextUserId,
      username,
      email,
      password: hashedPassword,
      credit_points: 100,
      total_points: 0,
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful! You got 100 credit points!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        credit_points: newUser.credit_points
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        credit_points: user.credit_points
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// Profile Route
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      credit_points: user.credit_points,
      total_points: user.total_points
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Matches Route
app.get('/api/matches', (req, res) => {
  try {
    res.json(db.matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Players for Match
app.get('/api/matches/:id/players', (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const players = db.players[matchId] || [];
    
    if (players.length === 0) {
      return res.json([
        { id: 1, name: 'Sample Player 1', role: 'Batsman', team: 'Team A', base_points: 75 },
        { id: 2, name: 'Sample Player 2', role: 'Bowler', team: 'Team A', base_points: 70 },
        { id: 3, name: 'Sample Player 3', role: 'All-rounder', team: 'Team A', base_points: 72 }
      ]);
    }
    
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Fantasy Team
app.post('/api/fantasy-teams', authenticateToken, (req, res) => {
  try {
    const { matchId, teamName, selectedPlayers } = req.body;

    if (!matchId || !teamName || !selectedPlayers || selectedPlayers.length === 0) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (selectedPlayers.length !== 11) {
      return res.status(400).json({ error: 'Must select exactly 11 players' });
    }

    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalPoints = selectedPlayers.reduce((sum, p) => sum + (p.base_points || 0), 0);

    const newTeam = {
      id: ++db.nextTeamId,
      user_id: req.user.id,
      team_name: teamName,
      match_id: matchId,
      players: selectedPlayers,
      total_points: totalPoints,
      created_at: new Date().toISOString()
    };

    db.fantasy_teams.push(newTeam);

    user.credit_points = Math.max(0, user.credit_points - 10);
    user.total_points += Math.floor(totalPoints / 10);

    res.status(201).json({
      message: 'Fantasy team created successfully!',
      team: newTeam,
      user_credits: user.credit_points
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Fantasy Teams
app.get('/api/fantasy-teams', authenticateToken, (req, res) => {
  try {
    const userTeams = db.fantasy_teams.filter(t => t.user_id === req.user.id);
    res.json(userTeams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard Route
app.get('/api/global-leaderboard', (req, res) => {
  try {
    const leaderboard = db.users
      .map((user, index) => ({
        rank: index + 1,
        id: user.id,
        username: user.username,
        total_points: user.total_points,
        teams_count: db.fantasy_teams.filter(t => t.user_id === user.id).length
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    users: db.users.length,
    teams: db.fantasy_teams.length
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\nðŸš€ Fantasy Cricket Pro Server Running!\n`);
  console.log(`ðŸ“± App URL: http://localhost:${PORT}`);
  console.log(`ðŸ“Š API Base: http://localhost:${PORT}/api`);
  console.log(`âœ… Ready to play!\n`);
});
