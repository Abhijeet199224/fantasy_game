import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const PORT = process.env.PORT || 5000;

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

// ====== AUTHENTICATION ROUTES ======

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, credit_points, total_points) 
       VALUES ($1, $2, $3, 100, 0) 
       RETURNING id, username, email, credit_points, total_points`,
      [username.toLowerCase().trim(), email.toLowerCase().trim(), hash]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    
    console.log(`✅ New user registered: ${user.username}`);
    res.status(201).json({ 
      success: true,
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        credit_points: user.credit_points,
        total_points: user.total_points
      }
    });
  } catch (e) {
    console.error('Registration error:', e);
    if (e.code === "23505") {
      return res.status(400).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1",
      [username.toLowerCase().trim()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    
    console.log(`✅ User logged in: ${user.username}`);
    res.json({ 
      success: true,
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        credit_points: user.credit_points,
        total_points: user.total_points
      }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, credit_points, total_points, 
       (SELECT COUNT(*) FROM fantasy_teams WHERE user_id = users.id) as teams_count
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Profile fetch error:', e);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ====== MATCHES ROUTES ======

app.get("/api/matches", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, 
       (SELECT COUNT(*) FROM fantasy_teams WHERE match_id = m.id) as teams_count
       FROM matches m 
       ORDER BY m.start_date ASC 
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Matches fetch error:', e);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

app.get("/api/matches/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, 
       (SELECT COUNT(*) FROM fantasy_teams WHERE match_id = m.id) as teams_count
       FROM matches m WHERE m.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Match fetch error:', e);
    res.status(500).json({ error: "Failed to fetch match details" });
  }
});

app.get("/api/matches/:id/players", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM players 
       WHERE match_id = $1 
       ORDER BY 
         CASE role 
           WHEN 'WK' THEN 1 
           WHEN 'BAT' THEN 2 
           WHEN 'AR' THEN 3 
           WHEN 'BOWL' THEN 4 
         END,
         credits DESC`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No players found for this match" });
    }
    
    res.json(result.rows);
  } catch (e) {
    console.error('Players fetch error:', e);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// ====== FANTASY TEAMS ROUTES ======

app.post("/api/fantasy-teams", auth, async (req, res) => {
  const { matchId, teamName, players, captainId, viceCaptainId } = req.body;

  // Validation
  if (!matchId || !players || !captainId || !viceCaptainId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (players.length !== 11) {
    return res.status(400).json({ error: "Team must have exactly 11 players" });
  }

  if (captainId === viceCaptainId) {
    return res.status(400).json({ error: "Captain and Vice-Captain must be different players" });
  }

  // Verify captain and VC are in the team
  const captainInTeam = players.find(p => p.id === captainId);
  const vcInTeam = players.find(p => p.id === viceCaptainId);
  
  if (!captainInTeam || !vcInTeam) {
    return res.status(400).json({ error: "Captain and Vice-Captain must be from selected players" });
  }

  // Role validation
  const roleCount = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };
  const teamCount = {};
  let totalCredits = 0;

  players.forEach(player => {
    roleCount[player.role] = (roleCount[player.role] || 0) + 1;
    teamCount[player.team] = (teamCount[player.team] || 0) + 1;
    totalCredits += parseFloat(player.credits || 0);
  });

  // Dream11 rules validation
  if (roleCount.WK < 1 || roleCount.WK > 4) {
    return res.status(400).json({ error: "Select 1-4 Wicket Keepers" });
  }
  if (roleCount.BAT < 3 || roleCount.BAT > 6) {
    return res.status(400).json({ error: "Select 3-6 Batters" });
  }
  if (roleCount.AR < 1 || roleCount.AR > 4) {
    return res.status(400).json({ error: "Select 1-4 All-Rounders" });
  }
  if (roleCount.BOWL < 3 || roleCount.BOWL > 6) {
    return res.status(400).json({ error: "Select 3-6 Bowlers" });
  }

  if (totalCredits > 100) {
    return res.status(400).json({ 
      error: `Credit limit exceeded: ${totalCredits.toFixed(1)}/100` 
    });
  }

  const maxFromOneTeam = Math.max(...Object.values(teamCount));
  if (maxFromOneTeam > 7) {
    return res.status(400).json({ 
      error: "Maximum 7 players allowed from one team" 
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO fantasy_teams 
       (user_id, match_id, team_name, players, captain_id, vice_captain_id, total_points, credits_used) 
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7) 
       RETURNING id, team_name, created_at`,
      [
        req.user.id, 
        matchId, 
        teamName || `Team ${Date.now()}`, 
        JSON.stringify(players), 
        captainId, 
        viceCaptainId,
        totalCredits
      ]
    );
    
    console.log(`✅ Team created: ${result.rows[0].team_name} by user ${req.user.username}`);
    res.status(201).json({ 
      success: true, 
      message: "Team created successfully!", 
      team: result.rows[0] 
    });
  } catch (e) {
    console.error('Team creation error:', e);
    res.status(500).json({ error: "Failed to save team. Please try again." });
  }
});

app.get("/api/my-teams", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ft.*, m.team1, m.team2, m.status, m.start_date
       FROM fantasy_teams ft 
       JOIN matches m ON ft.match_id = m.id 
       WHERE ft.user_id = $1 
       ORDER BY ft.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('My teams fetch error:', e);
    res.status(500).json({ error: "Failed to fetch your teams" });
  }
});

app.get("/api/fantasy-teams/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ft.*, m.team1, m.team2 
       FROM fantasy_teams ft 
       JOIN matches m ON ft.match_id = m.id 
       WHERE ft.id = $1 AND ft.user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Team fetch error:', e);
    res.status(500).json({ error: "Failed to fetch team details" });
  }
});

// ====== SIMULATION ENGINE ======

app.post("/api/simulate/:matchId", auth, async (req, res) => {
  const { matchId } = req.params;
  
  try {
    // Get all teams for this match
    const teamsResult = await pool.query(
      "SELECT * FROM fantasy_teams WHERE match_id = $1",
      [matchId]
    );

    if (teamsResult.rows.length === 0) {
      return res.status(404).json({ error: "No teams found for this match" });
    }

    let updatedCount = 0;

    for (const team of teamsResult.rows) {
      const players = JSON.parse(team.players);
      let matchScore = 0;

      players.forEach(player => {
        // Role-based scoring simulation
        let basePoints = 0;
        
        switch(player.role) {
          case 'BAT':
            // Batsmen: 10-80 points
            basePoints = Math.floor(Math.random() * 70) + 10;
            break;
          case 'BOWL':
            // Bowlers: 15-75 points
            basePoints = Math.floor(Math.random() * 60) + 15;
            break;
          case 'AR':
            // All-rounders: 20-85 points
            basePoints = Math.floor(Math.random() * 65) + 20;
            break;
          case 'WK':
            // Wicket-keepers: 8-60 points
            basePoints = Math.floor(Math.random() * 52) + 8;
            break;
        }

        // Apply captain/VC multipliers
        if (player.id === team.captain_id) {
          basePoints = basePoints * 2; // Captain gets 2x
        } else if (player.id === team.vice_captain_id) {
          basePoints = basePoints * 1.5; // VC gets 1.5x
        }

        matchScore += basePoints;
      });

      const finalScore = Math.round(matchScore);

      // Update team score
      await pool.query(
        "UPDATE fantasy_teams SET total_points = $1 WHERE id = $2",
        [finalScore, team.id]
      );

      // Update user's total points
      await pool.query(
        "UPDATE users SET total_points = total_points + $1 WHERE id = $2",
        [finalScore, team.user_id]
      );

      updatedCount++;
    }

    // Update match status
    await pool.query(
      "UPDATE matches SET status = 'Completed' WHERE id = $1",
      [matchId]
    );

    console.log(`✅ Match ${matchId} simulated: ${updatedCount} teams updated`);
    res.json({ 
      success: true, 
      message: `Simulation complete! ${updatedCount} teams updated.`,
      teamsUpdated: updatedCount
    });
  } catch (e) {
    console.error('Simulation error:', e);
    res.status(500).json({ error: "Simulation failed. Please try again." });
  }
});

// ====== LEADERBOARD ======

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username, 
        u.total_points,
        (SELECT COUNT(*) FROM fantasy_teams WHERE user_id = u.id) as teams_count,
        RANK() OVER (ORDER BY u.total_points DESC) as rank
       FROM users u 
       WHERE u.total_points > 0
       ORDER BY u.total_points DESC 
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Leaderboard fetch error:', e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

app.get("/api/leaderboard/match/:matchId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ft.id,
        ft.team_name,
        ft.total_points,
        u.username,
        RANK() OVER (ORDER BY ft.total_points DESC) as rank
       FROM fantasy_teams ft
       JOIN users u ON ft.user_id = u.id
       WHERE ft.match_id = $1 AND ft.total_points > 0
       ORDER BY ft.total_points DESC 
       LIMIT 50`,
      [req.params.matchId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Match leaderboard fetch error:', e);
    res.status(500).json({ error: "Failed to fetch match leaderboard" });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🏏 Fantasy Cricket Pro running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
