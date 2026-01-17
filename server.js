import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ====== Configuration ======
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== 1. Authentication (Find or Create) ======
app.post("/api/auth/authenticate", async (req, res) => {
  const { email, password } = req.body;
  if (!email?.includes('@') || password?.length < 6) {
    return res.status(400).json({ error: "Valid email and 6-char password required." });
  }

  try {
    const userEmail = email.toLowerCase().trim();
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [userEmail]);
    let user = result.rows[0];

    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      const insert = await pool.query(
        "INSERT INTO users (email, password_hash, username, credit_points) VALUES ($1, $2, $3, 100) RETURNING *",
        [userEmail, hash, userEmail.split('@')[0]]
      );
      user = insert.rows[0];
    } else {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: "Invalid password." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database connection failed." });
  }
});

// ====== 2. Fantasy Team Builder Logic ======
app.post("/api/fantasy-teams", async (req, res) => {
  const { userId, matchId, teamName, players, captainId, viceCaptainId } = req.body;

  // Dream11 Rules Validation
  if (players.length !== 11) return res.status(400).json({ error: "Team must have exactly 11 players." });
  if (!captainId || !viceCaptainId) return res.status(400).json({ error: "Captain and Vice-Captain are required." });

  try {
    const result = await pool.query(
      "INSERT INTO fantasy_teams (user_id, match_id, team_name, players, captain_id, vice_captain_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, matchId, teamName, JSON.stringify(players), captainId, viceCaptainId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to save team." });
  }
});

// ====== 3. Match Simulation Engine ======
app.post("/api/simulate/:matchId", async (req, res) => {
  const { matchId } = req.params;
  try {
    // Get all teams for this match
    const teams = await pool.query("SELECT * FROM fantasy_teams WHERE match_id = $1", [matchId]);
    
    for (let team of teams.rows) {
      let totalPoints = 0;
      const players = JSON.parse(team.players);
      
      players.forEach(p => {
        // Weighted random scoring (0 to 100 points per player)
        let pPoints = Math.floor(Math.random() * 50) + 10;
        
        // Captain Multipliers
        if (p.id == team.captain_id) pPoints *= 2;
        if (p.id == team.vice_captain_id) pPoints *= 1.5;
        
        totalPoints += pPoints;
      });

      // Update team points and global leaderboard
      await pool.query("UPDATE fantasy_teams SET total_points = $1 WHERE id = $2", [totalPoints, team.id]);
      await pool.query("UPDATE users SET total_points = total_points + $1 WHERE id = $2", [totalPoints, team.user_id]);
    }
    
    res.json({ message: "Simulation successful! Points updated." });
  } catch (err) {
    res.status(500).json({ error: "Simulation failed." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`🚀 Fantasy Engine Live on port ${PORT}`));
