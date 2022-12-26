import { DetaDataBase } from "./deta.ts";
import { PgDatabase } from "./pg.ts";

export interface Database {
  init(): Promise<unknown>;
  get(name: string): Promise<Uint8Array | null>;
  set(name: string, key: Uint8Array): Promise<unknown>;
  del(name: string): Promise<unknown>;
}

function getDatabase(conf: string) {
  if (conf.startsWith("postgresql://")) {
    return new PgDatabase(conf);
  }
  if (conf.startsWith("postgres://")) {
    return new PgDatabase(conf);
  }
  if (conf.startsWith("deta://")) {
    return new DetaDataBase(conf);
  }

  throw new Error("Unknown database provider");
}

export const db = getDatabase(Deno.env.get("DB_URL")!);
