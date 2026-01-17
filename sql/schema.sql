CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  credit_points INT DEFAULT 100,
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  team1 TEXT,
  team2 TEXT,
  start_date TIMESTAMP,
  status TEXT DEFAULT 'Upcoming'
);

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT,
  role TEXT,
  team TEXT,
  base_points INT,
  match_id INT REFERENCES matches(id)
);

CREATE TABLE IF NOT EXISTS fantasy_teams (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  match_id INT REFERENCES matches(id),
  team_name TEXT,
  players JSONB,
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
