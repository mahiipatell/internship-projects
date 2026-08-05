const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();

    console.log("Connected to PostgreSQL");

    const schema = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8"
    );

    await client.query(schema);

    console.log("Database migrated successfully");
  } catch (err) {
    console.error("Migration failed");
    console.error(err);
  } finally {
    await client.end();
  }
}

migrate();