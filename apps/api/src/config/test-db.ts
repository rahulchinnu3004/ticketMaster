import { pool } from "./db.js";

async function testPool() {
  console.log("Pool configuration:", {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });

  const client = await pool.connect();

  console.log("Connection acquired!");

  try {
    const result = await client.query("SELECT NOW()");
    console.log(result.rows[0]);
  } finally {
    client.release();
  }

  console.log("Connection released!");

  console.log("Pool configuration:", {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });

  await pool.end();
}

testPool();