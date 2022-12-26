import { handleAlias } from "./alias.ts";
import { db } from "./database.ts";
import { ed25519, hex } from "./deps.ts";

const Difficult = parseInt(Deno.env.get("CHALLENGE_DIFFICULT") || "20");

export async function handler(req: Request) {
  const uri = new URL(req.url);
  console.log(uri.pathname);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: { "access-control-allow-origin": "*" },
    });
  }

  if (req.method === "GET" && uri.pathname === "/.well-known/webfinger") {
    // Handle webfinger
    const name = uri.searchParams.get("name");
    if (!name) return new Response("Invalid name parameter", { status: 400 });

    const key = await db.get(name);
    if (key === null) return new Response(null, { status: 404 });

    return new Response(JSON.stringify({ name, public_key: hex.encode(key) }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "GET" && uri.pathname === "/.well-known/totk") {
    // Handle totk
    const key = hex.decode(Deno.env.get("SERVER_KEY")!);
    const pub = await ed25519.getPublicKey(key);
    return new Response(
      JSON.stringify({ public_key: hex.encode(pub) }),
      { headers: { "content-type": "application/json" } },
    );
  }

  if (req.method === "GET" && uri.pathname === "/challenge") {
    return getChallenge();
  }

  if (uri.pathname === "/alias") {
    return handleAlias(req);
  }

  return new Response(null, { status: 404 });
}

async function getChallenge() {
  const rand = crypto.getRandomValues(new Uint8Array(16));
  const now = ~~(Date.now() / 1000);
  const challenge = `${now}:${hex.encode(rand)}:${Difficult}`;
  const key = await crypto.subtle.importKey(
    "raw",
    hex.decode(Deno.env.get("SERVER_KEY")!),
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "HMAC", hash: "SHA-256" },
    key,
    new TextEncoder().encode(challenge),
  );
  const signature = new Uint8Array(sig);
  return new Response(
    JSON.stringify({
      challenge,
      difficult: Difficult,
      sig: hex.encode(signature),
    }),
    { headers: { "content-type": "application/json" } },
  );
}
