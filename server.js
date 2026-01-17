const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const CRICKET_API_KEY = process.env.CRICKET_API_KEY || 'demo';
const CRICKET_API_BASE = 'https://cricketdata.org/api/v1';

// ==================== DATABASE INITIALIZATION ====================

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        credit_points INT DEFAULT 100,
        total_points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        match_id_external VARCHAR(100) UNIQUE,
        team1 VARCHAR(100),
        team2 VARCHAR(100),
        status VARCHAR(20),
        start_date TIMESTAMP,
        api_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        player_id_external VARCHAR(100),
        name VARCHAR(100),
        team VARCHAR(100),
        role VARCHAR(50),
        match_id INT REFERENCES matches(id),
        base_points INT DEFAULT 0,
        current_points INT DEFAULT 0,
        api_data JSONB,
        UNIQUE(player_id_external, match_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fantasy_teams (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        match_id INT REFERENCES matches(id) ON DELETE CASCADE,
        team_name VARCHAR(100),
        players JSONB,
        total_points INT DEFAULT 0,
        rank INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('âœ… Database tables initialized');
  } catch (error) {
    console.error('âŒ Database initialization error:', error);
  }
}

// ==================== AUTHENTICATION ====================

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, credit_points) VALUES ($1, $2, $3, 100) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.rows[0].id, username: result.rows[0].username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token, 
      user: result.rows[0],
      creditPoints: 100
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, email, password_hash, credit_points FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      creditPoints: user.credit_points
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, credit_points, total_points FROM users WHERE id = $1',
      [req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MATCHES ROUTES ====================

app.get('/api/matches', async (req, res) => {
  try {
    // First try to fetch from API
    try {
      const apiResponse = await axios.get(`${CRICKET_API_BASE}/currentMatches`, {
        params: { apikey: CRICKET_API_KEY }
      });

      if (apiResponse.data?.data?.length > 0) {
        // Save to database
        for (const match of apiResponse.data.data) {
          await pool.query(
            `INSERT INTO matches (match_id_external, team1, team2, status, start_date, api_data)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (match_id_external) DO UPDATE SET status = $4, api_data = $6`,
            [
              match.id,
              match.team1?.name || 'Team 1',
              match.team2?.name || 'Team 2',
              match.status,
              new Date(match.date),
              JSON.stringify(match)
            ]
          );
        }
      }
    } catch (apiError) {
      console.log('âš ï¸ Cricket API unavailable, using cached data');
    }

    // Return matches from database
    const result = await pool.query(
      'SELECT * FROM matches ORDER BY start_date DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await pool.query(
      'SELECT * FROM matches WHERE id = $1',
      [matchId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PLAYERS ROUTES ====================

app.get('/api/matches/:matchId/players', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM players WHERE match_id = $1 ORDER BY base_points DESC',
      [matchId]
    );

    // If no players in DB, return mock data (demo mode)
    if (result.rows.length === 0) {
      const mockPlayers = [
        { id: 1, name: 'Virat Kohli', team: 'India', role: 'Batsman', base_points: 10 },
        { id: 2, name: 'Rohit Sharma', team: 'India', role: 'Batsman', base_points: 9 },
        { id: 3, name: 'Steve Smith', team: 'Australia', role: 'Batsman', base_points: 9 },
        { id: 4, name: 'Pat Cummins', team: 'Australia', role: 'Bowler', base_points: 8 },
        { id: 5, name: 'Jasprit Bumrah', team: 'India', role: 'Bowler', base_points: 8 },
        { id: 6, name: 'Hardik Pandya', team: 'India', role: 'All-rounder', base_points: 7 },
      ];
      return res.json(mockPlayers);
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FANTASY TEAMS ROUTES ====================

app.post('/api/fantasy-teams', verifyToken, async (req, res) => {
  const { matchId, teamName, selectedPlayers } = req.body;

  if (!matchId || !teamName || !selectedPlayers || selectedPlayers.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Calculate total points from selected players
    const totalPoints = selectedPlayers.reduce((sum, p) => sum + (p.base_points || 0), 0);

    // Get user's credit points
    const userResult = await pool.query(
      'SELECT credit_points FROM users WHERE id = $1',
      [req.userId]
    );

    // Team creation costs 10 credit points
    const costToBuild = 10;
    if (userResult.rows[0].credit_points < costToBuild) {
      return res.status(400).json({ error: 'Insufficient credit points' });
    }

    // Create team
    const result = await pool.query(
      `INSERT INTO fantasy_teams (user_id, match_id, team_name, players, total_points)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, matchId, teamName, JSON.stringify(selectedPlayers), totalPoints]
    );

    // Deduct credit points
    await pool.query(
      'UPDATE users SET credit_points = credit_points - $1 WHERE id = $2',
      [costToBuild, req.userId]
    );

    res.json({ success: true, team: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fantasy-teams', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fantasy_teams WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fantasy-teams/:teamId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fantasy_teams WHERE id = $1 AND user_id = $2',
      [req.params.teamId, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEADERBOARD ROUTES ====================

app.get('/api/leaderboard/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username,
        ft.team_name,
        ft.total_points,
        ROW_NUMBER() OVER (ORDER BY ft.total_points DESC) as rank
       FROM fantasy_teams ft
       JOIN users u ON ft.user_id = u.id
       WHERE ft.match_id = $1
       ORDER BY ft.total_points DESC`,
      [matchId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/global-leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.total_points,
        COUNT(ft.id) as teams_count,
        ROW_NUMBER() OVER (ORDER BY u.total_points DESC) as rank
       FROM users u
       LEFT JOIN fantasy_teams ft ON u.id = ft.user_id
       GROUP BY u.id, u.username, u.total_points
       ORDER BY u.total_points DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCORING ROUTES ====================

app.post('/api/admin/update-scores', async (req, res) => {
  // Admin endpoint to manually update player scores
  const { matchId, playerId, newPoints } = req.body;
  
  if (!matchId || !playerId || newPoints === undefined) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Update player points
    await pool.query(
      'UPDATE players SET current_points = $1 WHERE id = $2 AND match_id = $3',
      [newPoints, playerId, matchId]
    );

    // Recalculate all teams for this match
    const teamsResult = await pool.query(
      'SELECT * FROM fantasy_teams WHERE match_id = $1',
      [matchId]
    );

    for (const team of teamsResult.rows) {
      const players = JSON.parse(team.players);
      let totalPoints = 0;

      for (const player of players) {
        const playerResult = await pool.query(
          'SELECT current_points FROM players WHERE id = $1',
          [player.id]
        );
        if (playerResult.rows.length > 0) {
          totalPoints += playerResult.rows[0].current_points || 0;
        }
      }

      await pool.query(
        'UPDATE fantasy_teams SET total_points = $1 WHERE id = $2',
        [totalPoints, team.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================

async function start() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`ðŸš€ Server running on http://localhost:${PORT}`);
      console.log(`ðŸ“Š API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('âŒ Server startup error:', error);
    process.exit(1);
  }
}

start();

module.exports = app;