const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_BASE = 'https://api.cricketdata.org';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API call logging
let apiCallCount = 0;
const logApiCall = async (endpoint) => {
  apiCallCount++;
  console.log(`API Call #${apiCallCount}: ${endpoint} at ${new Date().toISOString()}`);
  try {
    await pool.query(
      'INSERT INTO api_call_log (endpoint, timestamp) VALUES ($1, NOW())',
      [endpoint]
    );
  } catch (err) {
    console.error('Error logging API call:', err);
  }
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// CricketData.org API Helper with retry logic and improved error handling
const fetchCricketData = async (endpoint, params = {}, retries = 3) => {
  if (!CRICKET_API_KEY) {
    console.log('No API key, using fallback data');
    return null;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const url = `${CRICKET_API_BASE}/${endpoint}`;
      params.apikey = CRICKET_API_KEY;

      await logApiCall(endpoint);

      const response = await axios.get(url, { 
        params,
        timeout: 30000, // Increased timeout to 30 seconds
        headers: {
          'Connection': 'keep-alive',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Cricket API Error (${endpoint}), attempt ${i + 1}/${retries}:`, error.message);

      // If this is the last retry, return null
      if (i === retries - 1) {
        console.log('All retry attempts failed, using fallback');
        return null;
      }

      // Exponential backoff: wait 1s, 2s, 4s between retries
      const backoffDelay = 1000 * Math.pow(2, i);
      console.log(`Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  return null;
};

// Seed hardcoded fallback data
const seedFallbackData = async () => {
  try {
    const matchCheck = await pool.query('SELECT COUNT(*) FROM matches');
    if (parseInt(matchCheck.rows[0].count) > 0) {
      console.log('Matches already exist, skipping seed');
      return;
    }

    // Insert hardcoded matches
    const matches = [
      { name: 'India vs Australia - 1st T20I', date: '2026-01-20', api_match_id: 'fallback_1' },
      { name: 'England vs South Africa - 2nd ODI', date: '2026-01-22', api_match_id: 'fallback_2' }
    ];

    for (const match of matches) {
      const result = await pool.query(
        'INSERT INTO matches (name, match_date, api_match_id, is_live) VALUES ($1, $2, $3, true) RETURNING id',
        [match.name, match.date, match.api_match_id]
      );

      const matchId = result.rows[0].id;

      // Insert players for India vs Australia
      if (match.api_match_id === 'fallback_1') {
        const players = [
          // Wicketkeepers
          { name: 'Rishabh Pant', role: 'WK', team: 'India', credits: 10 },
          { name: 'Alex Carey', role: 'WK', team: 'Australia', credits: 8.5 },
          // Batsmen
          { name: 'Virat Kohli', role: 'BAT', team: 'India', credits: 11 },
          { name: 'Rohit Sharma', role: 'BAT', team: 'India', credits: 10.5 },
          { name: 'Steve Smith', role: 'BAT', team: 'Australia', credits: 10 },
          { name: 'David Warner', role: 'BAT', team: 'Australia', credits: 9.5 },
          { name: 'Marnus Labuschagne', role: 'BAT', team: 'Australia', credits: 9 },
          { name: 'Shubman Gill', role: 'BAT', team: 'India', credits: 9 },
          // All-rounders
          { name: 'Hardik Pandya', role: 'AR', team: 'India', credits: 10 },
          { name: 'Ravindra Jadeja', role: 'AR', team: 'India', credits: 9.5 },
          { name: 'Glenn Maxwell', role: 'AR', team: 'Australia', credits: 9.5 },
          { name: 'Marcus Stoinis', role: 'AR', team: 'Australia', credits: 8.5 },
          // Bowlers
          { name: 'Jasprit Bumrah', role: 'BOWL', team: 'India', credits: 10.5 },
          { name: 'Mohammed Shami', role: 'BOWL', team: 'India', credits: 9.5 },
          { name: 'Kuldeep Yadav', role: 'BOWL', team: 'India', credits: 8.5 },
          { name: 'Pat Cummins', role: 'BOWL', team: 'Australia', credits: 10 },
          { name: 'Mitchell Starc', role: 'BOWL', team: 'Australia', credits: 9.5 },
          { name: 'Adam Zampa', role: 'BOWL', team: 'Australia', credits: 8.5 },
          { name: 'Nathan Lyon', role: 'BOWL', team: 'Australia', credits: 8 },
          { name: 'Yuzvendra Chahal', role: 'BOWL', team: 'India', credits: 8.5 }
        ];

        for (const player of players) {
          await pool.query(
            'INSERT INTO players (match_id, name, role, team, credits) VALUES ($1, $2, $3, $4, $5)',
            [matchId, player.name, player.role, player.team, player.credits]
          );
        }
      }

      // Insert players for England vs South Africa
      if (match.api_match_id === 'fallback_2') {
        const players = [
          { name: 'Jos Buttler', role: 'WK', team: 'England', credits: 10 },
          { name: 'Quinton de Kock', role: 'WK', team: 'South Africa', credits: 9.5 },
          { name: 'Joe Root', role: 'BAT', team: 'England', credits: 10.5 },
          { name: 'Ben Duckett', role: 'BAT', team: 'England', credits: 8.5 },
          { name: 'Aiden Markram', role: 'BAT', team: 'South Africa', credits: 9 },
          { name: 'Rassie van der Dussen', role: 'BAT', team: 'South Africa', credits: 8.5 },
          { name: 'Ben Stokes', role: 'AR', team: 'England', credits: 10.5 },
          { name: 'Moeen Ali', role: 'AR', team: 'England', credits: 8.5 },
          { name: 'Andile Phehlukwayo', role: 'AR', team: 'South Africa', credits: 8 },
          { name: 'Keshav Maharaj', role: 'AR', team: 'South Africa', credits: 8 },
          { name: 'James Anderson', role: 'BOWL', team: 'England', credits: 9 },
          { name: 'Stuart Broad', role: 'BOWL', team: 'England', credits: 9 },
          { name: 'Kagiso Rabada', role: 'BOWL', team: 'South Africa', credits: 10 },
          { name: 'Anrich Nortje', role: 'BOWL', team: 'South Africa', credits: 9 },
          { name: 'Lungi Ngidi', role: 'BOWL', team: 'South Africa', credits: 8.5 },
          { name: 'Reece Topley', role: 'BOWL', team: 'England', credits: 8 }
        ];

        for (const player of players) {
          await pool.query(
            'INSERT INTO players (match_id, name, role, team, credits) VALUES ($1, $2, $3, $4, $5)',
            [matchId, player.name, player.role, player.team, player.credits]
          );
        }
      }
    }

    console.log('Fallback data seeded successfully');
  } catch (error) {
    console.error('Error seeding fallback data:', error);
  }
};

// Fetch and update matches from API
const refreshMatchesFromAPI = async () => {
  console.log('Refreshing matches from Cricket API...');

  const data = await fetchCricketData('currentMatches');

  if (!data || !data.data) {
    console.log('No API data, using fallback');
    return;
  }

  try {
    const matches = data.data.slice(0, 2); // Limit to 2 matches

    for (const match of matches) {
      const matchName = `${match.team1} vs ${match.team2}`;
      const matchDate = match.dateTimeGMT ? new Date(match.dateTimeGMT) : new Date();

      const existing = await pool.query(
        'SELECT id FROM matches WHERE api_match_id = $1',
        [match.id]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO matches (name, match_date, api_match_id, is_live) VALUES ($1, $2, $3, true)',
          [matchName, matchDate, match.id]
        );
        console.log(`Added new match: ${matchName}`);
      }
    }
  } catch (error) {
    console.error('Error refreshing matches:', error);
  }
};

// Daily refresh job (runs every 24 hours)
const startDailyRefresh = () => {
  refreshMatchesFromAPI();
  setInterval(refreshMatchesFromAPI, 24 * 60 * 60 * 1000);
};

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, hashedPassword, username || email.split('@')[0]]
    );

    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        id: result.rows[0].id, 
        email: result.rows[0].email,
        username: result.rows[0].username 
      } 
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email,
        username: user.username 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// MATCH ROUTES
app.get('/api/matches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM matches WHERE is_live = true ORDER BY match_date ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// PLAYER ROUTES
app.get('/api/players/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await pool.query(
      'SELECT * FROM players WHERE match_id = $1 ORDER BY role, credits DESC',
      [matchId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// TEAM ROUTES
app.post('/api/teams', authenticateToken, async (req, res) => {
  try {
    const { matchId, players, captainId, viceCaptainId } = req.body;

    // Validation
    if (!players || players.length !== 11) {
      return res.status(400).json({ error: 'Must select exactly 11 players' });
    }

    // Validate credits
    const playerIds = players.map(p => p.id);
    const playerData = await pool.query(
      'SELECT * FROM players WHERE id = ANY($1)',
      [playerIds]
    );

    const totalCredits = playerData.rows.reduce((sum, p) => sum + parseFloat(p.credits), 0);
    if (totalCredits > 100) {
      return res.status(400).json({ error: 'Total credits exceed 100' });
    }

    // Validate role counts
    const roleCounts = {};
    playerData.rows.forEach(p => {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
    });

    if (roleCounts.WK < 1 || roleCounts.WK > 4) {
      return res.status(400).json({ error: 'Select 1-4 Wicketkeepers' });
    }
    if (roleCounts.BAT < 3 || roleCounts.BAT > 6) {
      return res.status(400).json({ error: 'Select 3-6 Batsmen' });
    }
    if (roleCounts.AR < 1 || roleCounts.AR > 4) {
      return res.status(400).json({ error: 'Select 1-4 All-rounders' });
    }
    if (roleCounts.BOWL < 3 || roleCounts.BOWL > 6) {
      return res.status(400).json({ error: 'Select 3-6 Bowlers' });
    }

    // Save team
    const result = await pool.query(
      `INSERT INTO teams (user_id, match_id, players_json, captain_id, vice_captain_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
      [req.user.id, matchId, JSON.stringify(players), captainId, viceCaptainId]
    );

    res.json({ teamId: result.rows[0].id, message: 'Team created successfully' });
  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

app.get('/api/teams/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, m.name as match_name, m.match_date 
       FROM teams t 
       JOIN matches m ON t.match_id = m.id 
       WHERE t.user_id = $1 
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// SIMULATION ROUTE - FIXED JSON PARSING ERROR
app.post('/api/simulate/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;

    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamResult.rows[0];

    // FIX: Check if players_json is already an object or needs parsing
    const players = typeof team.players_json === 'string' 
      ? JSON.parse(team.players_json) 
      : team.players_json;

    // Validate that players is an array
    if (!Array.isArray(players)) {
      console.error('Players data is not an array:', players);
      return res.status(500).json({ error: 'Invalid team data format' });
    }

    // Simulate player scores
    const playerScores = players.map(player => {
      let points = 0;

      // Batting points (random realistic simulation)
      const runs = Math.floor(Math.random() * 80);
      points += runs; // 1 point per run

      if (runs >= 150) points += 16;
      else if (runs >= 100) points += 8;
      else if (runs >= 50) points += 4;

      const fours = Math.floor(runs / 6);
      const sixes = Math.floor(runs / 12);
      points += fours * 1 + sixes * 2;

      const strikeRate = 100 + Math.random() * 80;
      if (strikeRate > 150) points += 6;

      // Bowling points (for bowlers and all-rounders)
      if (player.role === 'BOWL' || player.role === 'AR') {
        const wickets = Math.floor(Math.random() * 5);
        points += wickets * 25;

        if (wickets >= 5) points += 50;
        else if (wickets >= 4) points += 8;

        const economy = 4 + Math.random() * 6;
        if (economy < 5) points += 6;
      }

      // Captain and Vice-Captain multipliers
      let multiplier = 1;
      if (player.id === team.captain_id) multiplier = 2;
      else if (player.id === team.vice_captain_id) multiplier = 1.5;

      return {
        playerId: player.id,
        playerName: player.name,
        points: Math.round(points * multiplier),
        runs,
        wickets: (player.role === 'BOWL' || player.role === 'AR') ? Math.floor(Math.random() * 5) : 0
      };
    });

    const totalScore = playerScores.reduce((sum, p) => sum + p.points, 0);

    // Update team score
    await pool.query(
      'UPDATE teams SET total_score = $1, simulated_at = NOW() WHERE id = $2',
      [totalScore, teamId]
    );

    res.json({ totalScore, playerScores });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Simulation failed', details: error.message });
  }
});

// LEADERBOARD ROUTE
app.get('/api/leaderboard/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    const result = await pool.query(
      `SELECT t.id, t.total_score, u.username, u.email, t.created_at,
              ROW_NUMBER() OVER (ORDER BY t.total_score DESC) as rank
       FROM teams t
       JOIN users u ON t.user_id = u.id
       WHERE t.match_id = $1 AND t.total_score IS NOT NULL
       ORDER BY t.total_score DESC`,
      [matchId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('âœ… Database connected');

    // Seed fallback data
    await seedFallbackData();

    // Start daily API refresh
    if (CRICKET_API_KEY) {
      console.log('âœ… Cricket API key found, starting refresh job');
      startDailyRefresh();
    } else {
      console.log('âš ï¸  No Cricket API key, using fallback data only');
    }

    const server = app.listen(PORT, () => {
      console.log(`ðŸš€ Server running on port ${PORT}`);
      console.log(`==> Your service is live ðŸŽ‰`);
      console.log(`==> `);
      console.log(`==> ///////////////////////////////////////////////////////////`);
      console.log(`==> `);
      console.log(`==> Available at your primary URL`);
      console.log(`==> `);
      console.log(`==> ///////////////////////////////////////////////////////////`);
    });

    // FIX: Configure server timeouts for Render deployment
    server.keepAliveTimeout = 120000; // 120 seconds
    server.headersTimeout = 120000;   // 120 seconds

  } catch (error) {
    console.error('âŒ Failed to initialize app:', error);
    process.exit(1);
  }
};

initializeApp();
