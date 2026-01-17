import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const { Pool } = pg;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/fantasy_cricket_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        credit_points INTEGER DEFAULT 100,
        total_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        team1 VARCHAR(255) NOT NULL,
        team2 VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Upcoming',
        start_date TIMESTAMP NOT NULL,
        format VARCHAR(50) DEFAULT 'T20',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        team VARCHAR(255) NOT NULL,
        base_points INTEGER NOT NULL,
        match_id INTEGER REFERENCES matches(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fantasy_teams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        team_name VARCHAR(255) NOT NULL,
        match_id INTEGER REFERENCES matches(id),
        players JSONB NOT NULL,
        total_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('âœ… Database tables initialized');
  } catch (error) {
    console.error('âŒ Database initialization error:', error.message);
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password, credit_points) VALUES ($1, $2, $3, 100) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.json({
      message: 'Registration successful',
      token,
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, credit_points, total_points FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Matches Routes
app.get('/api/matches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM matches ORDER BY start_date DESC LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matches/:id/players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players WHERE match_id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      // Return mock players if none exist
      const mockPlayers = [
        { id: 1, name: 'Virat Kohli', role: 'Batsman', team: 'India', base_points: 85 },
        { id: 2, name: 'Jasprit Bumrah', role: 'Bowler', team: 'India', base_points: 80 },
        { id: 3, name: 'Rohit Sharma', role: 'Batsman', team: 'India', base_points: 82 },
        { id: 4, name: 'KL Rahul', role: 'Batsman', team: 'India', base_points: 78 },
        { id: 5, name: 'Hardik Pandya', role: 'All-rounder', team: 'India', base_points: 75 },
        { id: 6, name: 'Babar Azam', role: 'Batsman', team: 'Pakistan', base_points: 88 },
        { id: 7, name: 'Shaheen Afridi', role: 'Bowler', team: 'Pakistan', base_points: 83 },
        { id: 8, name: 'Imam-ul-Haq', role: 'Batsman', team: 'Pakistan', base_points: 77 },
        { id: 9, name: 'Shadab Khan', role: 'All-rounder', team: 'Pakistan', base_points: 72 },
        { id: 10, name: 'Naseem Shah', role: 'Bowler', team: 'Pakistan', base_points: 74 },
        { id: 11, name: 'Suryakumar Yadav', role: 'Batsman', team: 'India', base_points: 79 },
      ];
      return res.json(mockPlayers);
    }
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fantasy Teams Routes
app.post('/api/fantasy-teams', authenticateToken, async (req, res) => {
  try {
    const { matchId, teamName, selectedPlayers } = req.body;

    const result = await pool.query(
      'INSERT INTO fantasy_teams (user_id, team_name, match_id, players, total_points) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, teamName, matchId, JSON.stringify(selectedPlayers), selectedPlayers.reduce((sum, p) => sum + p.base_points, 0)]
    );

    // Deduct credit points
    await pool.query('UPDATE users SET credit_points = credit_points - 10 WHERE id = $1', [req.user.id]);

    res.json({ message: 'Team created successfully', team: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fantasy-teams', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fantasy_teams WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard Route
app.get('/api/global-leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.total_points,
        COUNT(ft.id) as teams_count,
        ROW_NUMBER() OVER (ORDER BY u.total_points DESC) as rank
      FROM users u
      LEFT JOIN fantasy_teams ft ON u.id = ft.user_id
      GROUP BY u.id, u.username, u.total_points
      ORDER BY u.total_points DESC
      LIMIT 50
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`ðŸš€ Server running on http://localhost:${PORT}`);
  console.log(`ðŸ“Š API Base: http://localhost:${PORT}/api`);
});
