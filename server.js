import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const JWT_SECRET = process.env.JWT_SECRET;

// ---------- AUTH ----------
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const r = await pool.query(
      `INSERT INTO users (username,email,password_hash)
       VALUES ($1,$2,$3) RETURNING id`,
      [username, email, hash]
    );

    const token = jwt.sign({ id: r.rows[0].id }, JWT_SECRET);
    res.json({ token });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  // 1️⃣ Validate input
  if (!username || !password) {
    return res.status(400).json({ error: "Username/email and password required" });
  }

  // 2️⃣ Allow login via username OR email
  const r = await pool.query(
    `SELECT * FROM users 
     WHERE username=$1 OR email=$1`,
    [username]
  );

  if (!r.rows.length) {
    return res.status(401).json({ error: "Invalid username/email or password" });
  }

  const user = r.rows[0];

  // 3️⃣ Compare password
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid username/email or password" });
  }

  // 4️⃣ Generate token
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

  // 5️⃣ Send response
  res.json({ token });
});


app.get("/api/auth/profile", auth, async (req, res) => {
  const r = await pool.query(
    "SELECT username,email,credit_points,total_points FROM users WHERE id=$1",
    [req.user.id]
  );
  res.json(r.rows[0]);
});

// ---------- MATCHES ----------
app.get("/api/matches", async (_, res) => {
  const r = await pool.query("SELECT * FROM matches");
  res.json(r.rows);
});

app.get("/api/matches/:id/players", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM players WHERE match_id=$1",
    [req.params.id]
  );
  res.json(r.rows);
});

// ---------- TEAMS ----------
app.post("/api/fantasy-teams", auth, async (req, res) => {
  const { matchId, teamName, selectedPlayers } = req.body;

  if (selectedPlayers.length !== 11) {
    return res.status(400).json({ error: "Select 11 players" });
  }

  await pool.query(
    `INSERT INTO fantasy_teams (user_id, match_id, team_name, players)
     VALUES ($1,$2,$3,$4)`,
    [req.user.id, matchId, teamName, JSON.stringify(selectedPlayers)]
  );

  res.json({ ok: true });
});

app.get("/api/fantasy-teams", auth, async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM fantasy_teams WHERE user_id=$1",
    [req.user.id]
  );
  res.json(r.rows);
});

// ---------- LEADERBOARD ----------
app.get("/api/global-leaderboard", async (_, res) => {
  const r = await pool.query(`
    SELECT username,total_points,
    (SELECT COUNT(*) FROM fantasy_teams WHERE user_id=users.id) AS teams_count
    FROM users
    ORDER BY total_points DESC
  `);

  res.json(r.rows.map((u, i) => ({ ...u, rank: i + 1 })));
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(process.env.PORT || 5000);
