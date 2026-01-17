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
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id",
      [username, email, hash]
    );

    const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET);
    res.json({ token });
  } catch (e) {
    res.status(400).json({ error: "User already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE username=$1",
    [username]
  );

  if (!result.rows.length) return res.sendStatus(401);
  const user = result.rows[0];

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.sendStatus(401);

  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token });
});

app.get("/api/auth/profile", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT username,email,credit_points,total_points FROM users WHERE id=$1",
    [req.user.id]
  );
  res.json(result.rows[0]);
});

// ---------- MATCHES ----------
app.get("/api/matches", async (_, res) => {
  const result = await pool.query("SELECT * FROM matches ORDER BY start_date");
  res.json(result.rows);
});

app.get("/api/matches/:id/players", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM players WHERE match_id=$1",
    [req.params.id]
  );
  res.json(result.rows);
});

// ---------- FANTASY TEAMS ----------
app.post("/api/fantasy-teams", auth, async (req, res) => {
  const { matchId, teamName, selectedPlayers } = req.body;

  await pool.query(
    `INSERT INTO fantasy_teams (user_id, match_id, team_name, players)
     VALUES ($1,$2,$3,$4)`,
    [req.user.id, matchId, teamName, JSON.stringify(selectedPlayers)]
  );

  res.json({ ok: true });
});

app.get("/api/fantasy-teams", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM fantasy_teams WHERE user_id=$1",
    [req.user.id]
  );
  res.json(result.rows);
});

// ---------- LEADERBOARD ----------
app.get("/api/global-leaderboard", async (_, res) => {
  const result = await pool.query(`
    SELECT username, total_points,
    (SELECT COUNT(*) FROM fantasy_teams ft WHERE ft.user_id=u.id) AS teams_count
    FROM users u
    ORDER BY total_points DESC
  `);

  res.json(
    result.rows.map((u, i) => ({ ...u, rank: i + 1 }))
  );
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 5000);
