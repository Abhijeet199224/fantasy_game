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

// ====== Middleware ======
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
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, credit_points) VALUES ($1, $2, $3, 100) RETURNING id, username",
      [username, email, hash]
    );
    const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET);
    res.json({ token, user: result.rows[0] });
  } catch (e) {
    if (e.code === "23505") return res.status(400).json({ error: "User already exists" });
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const r = await pool.query("SELECT * FROM users WHERE username=$1 OR email=$1", [username]);
  if (!r.rows.length) return res.status(401).json({ error: "User not found" });
  
  const ok = await bcrypt.compare(password, r.rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect password" });
  
  const token = jwt.sign({ id: r.rows[0].id }, JWT_SECRET);
  res.json({ token, user: { id: r.rows[0].id, username: r.rows[0].username } });
});

// ====== Match & Player Routes ======
app.get("/api/matches", async (_, res) => {
  try {
    const r = await pool.query("SELECT * FROM matches ORDER BY start_date ASC");
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: "Could not fetch matches" }); }
});

app.get("/api/matches/:id/players", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM players WHERE match_id = $1", [req.params.id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: "Could not fetch players" }); }
});

// ====== Dream11 Team Builder Logic ======
app.post("/api/fantasy-teams", auth, async (req, res) => {
  const { matchId, teamName, players, captainId, viceCaptainId } = req.body;

  // 1. Dream11 Rule Validations
  if (players.length !== 11) return res.status(400).json({ error: "Team must have exactly 11 players" });
  if (captainId === viceCaptainId) return res.status(400).json({ error: "C and VC must be different" });

  const roles = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };
  let totalCredits = 0;
  players.forEach(p => {
    roles[p.role] = (roles[p.role] || 0) + 1;
    totalCredits += Number(p.credits || 0);
  });

  if (roles.WK < 1 || roles.WK > 4) return res.status(400).json({ error: "Select 1-4 Wicket Keepers" });
  if (roles.BAT < 3 || roles.BAT > 6) return res.status(400).json({ error: "Select 3-6 Batters" });
  if (roles.AR < 1 || roles.AR > 4) return res.status(400).json({ error: "Select 1-4 All-Rounders" });
  if (roles.BOWL < 3 || roles.BOWL > 6) return res.status(400).json({ error: "Select 3-6 Bowlers" });
  if (totalCredits > 100) return res.status(400).json({ error: "Credit limit (100) exceeded" });

  try {
    await pool.query(
      "INSERT INTO fantasy_teams (user_id, match_id, team_name, players, captain_id, vice_captain_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [req.user.id, matchId, teamName, JSON.stringify(players), captainId, viceCaptainId]
    );
    res.json({ ok: true, message: "Team created successfully!" });
  } catch (e) {
    res.status(500).json({ error: "Failed to save team" });
  }
});

// ====== Match Simulation Engine ======
app.post("/api/simulate/:matchId", auth, async (req, res) => {
  const { matchId } = req.params;
  try {
    // Get all user teams for this match
    const teamsResult = await pool.query("SELECT * FROM fantasy_teams WHERE match_id = $1", [matchId]);
    
    for (const team of teamsResult.rows) {
      let matchScore = 0;
      const players = JSON.parse(team.players);

      players.forEach(p => {
        // Weighted random points based on player base skill
        let pPoints = Math.floor(Math.random() * 60) + 10;
        
        // Captain Multipliers
        if (p.id == team.captain_id) pPoints *= 2;        // 2x for Captain
        if (p.id == team.vice_captain_id) pPoints *= 1.5; // 1.5x for VC
        
        matchScore += pPoints;
      });

      // Update team score and user's global total
      await pool.query("UPDATE fantasy_teams SET total_points = $1 WHERE id = $2", [Math.round(matchScore), team.id]);
      await pool.query("UPDATE users SET total_points = total_points + $1 WHERE id = $2", [Math.round(matchScore), team.user_id]);
    }

    res.json({ ok: true, message: "Simulation complete! Check the leaderboard." });
  } catch (e) {
    res.status(500).json({ error: "Simulation failed" });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log("🚀 Fantasy Cricket Engine Running")
);
