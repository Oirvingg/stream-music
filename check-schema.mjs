import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

try {
  const result = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log('✅ Users table schema:');
  result.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
} catch (error) {
  console.error('❌ Error:', error.message);
}
await pool.end();
