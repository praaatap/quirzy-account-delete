// lib/db.ts
import { Pool } from 'pg';

// Initialize the Pool with your Neon Database URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon connection security
  }
});

// Helper for standard queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return res;
};

// Helper for Transactions (Required for the delete endpoint)
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};