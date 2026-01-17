import { pool } from "./db.js";

async function seed() {
  await pool.query(`
    INSERT INTO matches (team1, team2, start_date)
    VALUES ('India', 'Australia', NOW() + INTERVAL '1 day')
  `);

  const players = [
    ["Virat Kohli", "Batsman", "India", 50],
    ["Rohit Sharma", "Batsman", "India", 48],
    ["Jasprit Bumrah", "Bowler", "India", 52],
    ["KL Rahul", "WK", "India", 45],
    ["Hardik Pandya", "All-Rounder", "India", 47],
    ["Steve Smith", "Batsman", "Australia", 49],
    ["David Warner", "Batsman", "Australia", 46],
    ["Glenn Maxwell", "All-Rounder", "Australia", 51],
    ["Pat Cummins", "Bowler", "Australia", 50],
    ["Mitchell Starc", "Bowler", "Australia", 53],
    ["Alex Carey", "WK", "Australia", 44]
  ];

  for (const p of players) {
    await pool.query(
      `INSERT INTO players (name, role, team, base_points, match_id)
       VALUES ($1,$2,$3,$4,1)`,
      p
    );
  }

  console.log("✅ Seed complete");
  process.exit();
}

seed();

