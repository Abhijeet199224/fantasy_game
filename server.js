import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== Enhanced Mock Database ======
const db = {
  users: [],
  teams: [], // User-created fantasy teams
  matches: [
    { id: 101, team1: "India", team2: "Australia", status: "Upcoming", date: "2026-01-20" },
    { id: 102, team1: "England", team2: "South Africa", status: "Upcoming", date: "2026-01-22" }
  ],
  players: [
    { id: 1, name: "Virat Kohli", role: "BAT", team: "India", base_points: 95 },
    { id: 2, name: "Jasprit Bumrah", role: "BOWL", team: "India", base_points: 90 },
    { id: 3, name: "KL Rahul", role: "WK", team: "India", base_points: 85 },
    { id: 4, name: "Hardik Pandya", role: "AR", team: "India", base_points: 88 },
    { id: 5, name: "Pat Cummins", role: "BOWL", team: "Australia", base_points: 92 },
    { id: 6, name: "Glenn Maxwell", role: "AR", team: "Australia", base_points: 87 },
    { id: 7, name: "Steve Smith", role: "BAT", team: "Australia", base_points: 89 },
    { id: 8, name: "Travis Head", role: "BAT", team: "Australia", base_points: 84 },
    { id: 9, name: "Rishabh Pant", role: "WK", team: "India", base_points: 82 },
    { id: 10, name: "Mohammed Siraj", role: "BOWL", team: "India", base_points: 80 },
    { id: 11, name: "Mitchell Starc", role: "BOWL", team: "Australia", base_points: 91 },
    { id: 12, name: "Adam Zampa", role: "BOWL", team: "Australia", base_points: 83 },
    { id: 13, name: "Ravindra Jadeja", role: "AR", team: "India", base_points: 90 },
    { id: 14, name: "David Warner", role: "BAT", team: "Australia", base_points: 86 }
  ]
};

// ====== Middleware & Helpers ======
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(403).json({ error: "Invalid Token" }); }
};

// ====== API Routes ======
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), username, email, passwordHash, credit_points: 500, total_points: 0 };
  db.users.push(user);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  res.json({ token, user });
});

app.post("/api/auth/login", async (req, res) => {
  const user = db.users.find(u => u.username === req.body.username);
  if (user && await bcrypt.compare(req.body.password, user.passwordHash)) {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user });
  } else res.status(401).json({ error: "Invalid credentials" });
});

app.get("/api/matches", (req, res) => res.json(db.matches));
app.get("/api/players", (req, res) => res.json(db.players));

// Save Fantasy Team with Captain/VC logic
app.post("/api/fantasy-teams", auth, (req, res) => {
  const { teamName, matchId, players, captainId, viceCaptainId } = req.body;
  const newTeam = {
    id: Date.now(),
    userId: req.user.id,
    teamName,
    matchId,
    players, // Array of player objects
    captainId,
    viceCaptainId,
    total_points: 0,
    created_at: new Date()
  };
  db.teams.push(newTeam);
  res.status(201).json(newTeam);
});

// Match Simulation Engine (Weighted Random)
app.post("/api/simulate/:matchId", auth, (req, res) => {
  const matchTeams = db.teams.filter(t => t.matchId === parseInt(req.params.matchId));
  matchTeams.forEach(team => {
    let score = 0;
    team.players.forEach(p => {
      // Weighted random: base_points + random swing
      let pPoints = (p.base_points / 10) + (Math.random() * 20);
      if (p.id === team.captainId) pPoints *= 2;
      if (p.id === team.viceCaptainId) pPoints *= 1.5;
      score += pPoints;
    });
    team.total_points = Math.round(score);
    // Update user's global points
    const user = db.users.find(u => u.id === team.userId);
    if (user) user.total_points += team.total_points;
  });
  res.json({ message: "Simulation complete!", teams: matchTeams });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
