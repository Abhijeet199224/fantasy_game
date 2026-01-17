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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const PORT = process.env.PORT || 5000;

// ====== Auth Middleware ======
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

// ====== Auth Routes ======
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }
  
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, credit_points, total_points) VALUES ($1, $2, $3, 100, 0) RETURNING id, username, email",
      [username.toLowerCase(), email.toLowerCase(), hash]
    );
    
    const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: result.rows[0] });
  } catch (e) {
    if (e.code === "23505") return res.status(400).json({ error: "User already exists" });
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const r = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1",
      [username.toLowerCase()]
    );
    
    if (!r.rows.length) return res.status(401).json({ error: "User not found" });
    
    const user = r.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) return res.status(401).json({ error: "Incorrect password" });
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
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
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, username, email, credit_points, total_points FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ====== Match Routes ======
app.get("/api/matches", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM matches ORDER BY start_date ASC LIMIT 20");
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not fetch matches" });
  }
});

app.get("/api/matches/:id/players", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM players WHERE match_id = $1 ORDER BY role, credits DESC",
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not fetch players" });
  }
});

// ====== Dream11 Team Builder with Full Validation ======
app.post("/api/fantasy-teams", auth, async (req, res) => {
  const { matchId, teamName, players, captainId, viceCaptainId } = req.body;

  // Rule 1: Exactly 11 players
  if (!players || players.length !== 11) {
    return res.status(400).json({ error: "Team must have exactly 11 players" });
  }

  // Rule 2: Captain and Vice-Captain must be different
  if (captainId === viceCaptainId) {
    return res.status(400).json({ error: "Captain and Vice-Captain must be different" });
  }

  // Rule 3: Validate C and VC are in the team
  const captainExists = players.find(p => p.id === captainId);
  const vcExists = players.find(p => p.id === viceCaptainId);
  if (!captainExists || !vcExists) {
    return res.status(400).json({ error: "C and VC must be from selected players" });
  }

  // Rule 4: Role Distribution (Dream11 Rules)
  const roles = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };
  let totalCredits = 0;
  const teamCount = {};

  players.forEach(p => {
    roles[p.role] = (roles[p.role] || 0) + 1;
    totalCredits += Number(p.credits || 0);
    teamCount[p.team] = (teamCount[p.team] || 0) + 1;
  });

  // Validate role constraints
  if (roles.WK < 1 || roles.WK > 4) {
    return res.status(400).json({ error: "Select 1-4 Wicket Keepers" });
  }
  if (roles.BAT < 3 || roles.BAT > 6) {
    return res.status(400).json({ error: "Select 3-6 Batters" });
  }
  if (roles.AR < 1 || roles.AR > 4) {
    return res.status(400).json({ error: "Select 1-4 All-Rounders" });
  }
  if (roles.BOWL < 3 || roles.BOWL > 6) {
    return res.status(400).json({ error: "Select 3-6 Bowlers" });
  }

  // Rule 5: Credit Budget
  if (totalCredits > 100) {
    return res.status(400).json({ error: `Credit limit exceeded (${totalCredits}/100)` });
  }

  // Rule 6: Max 7 players from one team
  const maxFromOneTeam = Math.max(...Object.values(teamCount));
  if (maxFromOneTeam > 7) {
    return res.status(400).json({ error: "Maximum 7 players allowed from one team" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO fantasy_teams 
       (user_id, match_id, team_name, players, captain_id, vice_captain_id, total_points) 
       VALUES ($1, $2, $3, $4, $5, $6, 0) 
       RETURNING *`,
      [req.user.id, matchId, teamName || "My Team", JSON.stringify(players), captainId, viceCaptainId]
    );
    
    res.json({ ok: true, message: "Team created successfully!", team: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save team" });
  }
});

// ====== Get User's Teams ======
app.get("/api/my-teams", auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ft.*, m.team1, m.team2 
       FROM fantasy_teams ft 
       JOIN matches m ON ft.match_id = m.id 
       WHERE ft.user_id = $1 
       ORDER BY ft.created_at DESC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// ====== Match Simulation Engine (Dream11 Points System) ======
app.post("/api/simulate/:matchId", auth, async (req, res) => {
  const { matchId } = req.params;
  
  try {
    const teamsResult = await pool.query(
      "SELECT * FROM fantasy_teams WHERE match_id = $1",
      [matchId]
    );

    if (!teamsResult.rows.length) {
      return res.status(404).json({ error: "No teams found for this match" });
    }

    for (const team of teamsResult.rows) {
      let matchScore = 0;
      const players = JSON.parse(team.players);

      players.forEach(player => {
        // Base score: Weighted random based on role
        let basePoints = 0;
        
        switch(player.role) {
          case 'BAT': basePoints = Math.floor(Math.random() * 60) + 20; break;
          case 'BOWL': basePoints = Math.floor(Math.random() * 50) + 15; break;
          case 'AR': basePoints = Math.floor(Math.random() * 55) + 25; break;
          case 'WK': basePoints = Math.floor(Math.random() * 45) + 10; break;
        }

        // Apply multipliers
        if (player.id === team.captain_id) basePoints *= 2;
        if (player.id === team.vice_captain_id) basePoints *= 1.5;

        matchScore += basePoints;
      });

      const finalScore = Math.round(matchScore);

      // Update team and user points
      await pool.query(
        "UPDATE fantasy_teams SET total_points = $1 WHERE id = $2",
        [finalScore, team.id]
      );

      await pool.query(
        "UPDATE users SET total_points = total_points + $1 WHERE id = $2",
        [finalScore, team.user_id]
      );
    }

    res.json({ 
      ok: true, 
      message: "Match simulated successfully!", 
      teamsUpdated: teamsResult.rows.length 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Simulation failed" });
  }
});

// ====== Global Leaderboard ======
app.get("/api/leaderboard", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT username, total_points, 
       (SELECT COUNT(*) FROM fantasy_teams WHERE user_id = users.id) as teams_count 
       FROM users 
       ORDER BY total_points DESC 
       LIMIT 50`
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ====== Fallback to SPA ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🏏 Fantasy Cricket Engine running on port ${PORT}`);
});
