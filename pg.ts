import { Database } from "./database.ts";
import { pg } from "./deps.ts";

export class PgDatabase implements Database {
  db: pg.Pool;
  constructor(conf: string) {
    this.db = new pg.Pool(conf, 10);
  }

  async init() {
    const db = await this.db.connect();

    await db.queryArray`CREATE TABLE IF NOT EXISTS keypairs (
  id BYTEA PRIMARY KEY,
  public_key BYTEA NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
)`;

    db.release();
  }

  async get(name: string) {
    const key = await nameToKey(name);
    const db = await this.db.connect();

    const res = await db.queryArray`SELECT public_key FROM keypairs
WHERE id=${key}`;
    db.release();

    if (res.rows.length === 0) return null;

    return res.rows[0][0] as Uint8Array;
  }

  async set(name: string, key: Uint8Array) {
    const id = await nameToKey(name);
    const db = await this.db.connect();

    await db.queryArray`INSERT INTO keypairs (id,public_key) VALUES 
(${id},${key}) ON CONFLICT DO NOTHING`;
    db.release();
  }

  async del(name: string) {
    const id = await nameToKey(name);
    const db = await this.db.connect();

    await db.queryArray`DELETE FROM keypairs WHERE id=${id}`;
    db.release();
  }
}

async function nameToKey(n: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(n),
  );
  return new Uint8Array(hash).slice(0, 16);
}
