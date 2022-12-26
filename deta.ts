import { Database } from "./database.ts";
import { hex } from "./deps.ts";

export class DetaDataBase implements Database {
  endpoint: string;
  secret: string;

  constructor(conf: string) {
    const u = new URL(conf);
    this.secret = u.password;
    this.endpoint = `https://${u.hostname}/v1/${u.username}/${
      u.pathname.slice(1)
    }`;
  }

  async set(name: string, key: Uint8Array) {
    const res = await fetch(this.endpoint + "/items", {
      method: "POST",
      body: JSON.stringify({
        item: {
          key: await nameToKey(name),
          public_key: hex.encode(key),
        },
      }),
      headers: {
        "x-api-key": this.secret,
        "content-type": "application/json",
      },
    });
    if (res.status !== 201) throw new Error("Insert fail");
    await res.body?.cancel();
  }

  async del(name: string) {
    const key = await nameToKey(name);
    const res = await fetch(this.endpoint + "/items/" + key, {
      method: "DELETE",
      headers: {
        "x-api-key": this.secret,
        "content-type": "application/json",
      },
    });
    if (res.status !== 200) throw new Error("Insert fail");
    await res.body?.cancel();
  }

  async init() {}

  async get(name: string) {
    const res = await fetch(this.endpoint + "/query", {
      method: "POST",
      body: JSON.stringify({
        query: [{ key: await nameToKey(name) }],
        limit: 1,
      }),
      headers: {
        "x-api-key": this.secret,
        "content-type": "application/json",
      },
    });

    if (res.status !== 200) return null;
    const json = await res.json();

    if (json.items.length === 0) return null;
    return hex.decode(json.items[0].public_key);
  }
}

async function nameToKey(n: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(n),
  );
  return hex.encode(new Uint8Array(hash).slice(0, 16));
}
