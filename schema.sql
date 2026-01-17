-- Fantasy Cricket Database Schema

-- Drop existing tables
DROP TABLE IF EXISTS api_call_log CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  match_date DATE NOT NULL,
  api_match_id VARCHAR(100) UNIQUE,
  is_live BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('WK', 'BAT', 'AR', 'BOWL')),
  team VARCHAR(100) NOT NULL,
  credits DECIMAL(4,1) NOT NULL,
  api_player_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  players_json JSONB NOT NULL,
  captain_id INTEGER,
  vice_captain_id INTEGER,
  total_score INTEGER,
  rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  simulated_at TIMESTAMP
);

-- API call log table
CREATE TABLE api_call_log (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  response_status VARCHAR(50)
);

-- Indexes for performance
CREATE INDEX idx_matches_live ON matches(is_live);
CREATE INDEX idx_players_match ON players(match_id);
CREATE INDEX idx_teams_user ON teams(user_id);
CREATE INDEX idx_teams_match ON teams(match_id);
CREATE INDEX idx_api_log_timestamp ON api_call_log(timestamp);

-- Sample seed data (fallback)
-- This will be inserted by server.js on first run
