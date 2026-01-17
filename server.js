import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ====== Config ======
const PORT = process.env.PORT || 5000; // Render provides PORT
const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-render-env";

// ====== Middleware ======
app.use(express.json());

// Serve frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// ====== In-memory DB (demo) ======
// NOTE: On Render free tier, memory resets on deploy/restart.
// This is just to make login/register work reliably.
const db = {
  users: [], // { id, username, email, passwordHash, credit_points, total_points }
  nextUserId: 1
};

// ====== Helpers ======
function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Access token required" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// ====== API Routes ======
app.get("/api/health", (req, res) => {
  res.json({ ok: true, users: db.users.length });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    const exists = db.users.find(u => u.username === username || u.email === email);
    if (exists) return res.status(400).json({ error: "Username or email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      id: db.nextUserId++,
      username,
      email,
      passwordHash,
      credit_points: 100,
      total_points: 0
    };

    db.users.push(user);

    const token = signToken(user);

    res.status(201).json({
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
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const user = db.users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: "Invalid username or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid username or password" });

    const token = signToken(user);

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
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/auth/profile", auth, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    credit_points: user.credit_points,
    total_points: user.total_points
  });
});

// ====== SPA fallback ======
// Important: keep this AFTER /api routes.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== Start server ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
