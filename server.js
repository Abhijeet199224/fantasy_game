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
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-render-settings";

// Database Connection (Render uses SSL for external connections)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== Unified Login & Register Logic ======
app.post("/api/auth/authenticate", async (req, res) => {
  const { email, password } = req.body;

  // Basic Validation for Newbies
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const userEmail = email.toLowerCase().trim();
    
    // 1. Check if user already exists in the Database
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [userEmail]);
    let user = result.rows[0];

    if (!user) {
      // 2. REGISTER: If not found, create them (This populates your empty table)
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      
      const insertResult = await pool.query(
        "INSERT INTO users (email, password_hash, username, credit_points) VALUES ($1, $2, $3, 100) RETURNING *",
        [userEmail, hash, userEmail.split('@')[0]]
      );
      user = insertResult.rows[0];
      console.log(`[AUTH] New user registered: ${userEmail}`);
    } else {
      // 3. LOGIN: If found, verify the password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password for this email." });
      }
      console.log(`[AUTH] User logged in: ${userEmail}`);
    }

    // 4. Create a "Hall Pass" (JWT Token)
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        credit_points: user.credit_points
      }
    });

  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Could not connect to database. Check Render settings." });
  }
});

// Protected route example
app.get("/api/auth/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query("SELECT id, email, username, credit_points FROM users WHERE id = $1", [decoded.id]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(403).json({ error: "Session expired" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
