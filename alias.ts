import { bloom } from "./bloom.ts";
import { db } from "./database.ts";
import { hex, jsonschema } from "./deps.ts";
import { verifyChallenge } from "./pow.ts";
import { totk } from "./totk.ts";

export function handleAlias(req: Request) {
  if (req.method === "POST") return handleCreate(req);

  if (req.method === "DELETE") return handleDelete(req);

  return new Response(null, { status: 404 });
}

async function handleCreate(req: Request) {
  let json;
  try {
    json = await req.json();
    jsonschema.validate(json, {
      type: "object",
      properties: {
        challenge: { type: "string", pattern: "\\d+\\:[a-z0-9]+\\:\\d+" },
        difficult: { type: "integer" },
        nonce: { type: "integer" },
        sig: { type: "string", pattern: "[0-9a-f]+" },
        name: { type: "string", pattern: "[a-z][a-z0-9_]+" },
        public_key: { type: "string", pattern: "[a-f0-9]{64}" },
      },
    }, { throwError: true });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!bloom(json)) {
    return new Response("Invalid challenge", { status: 400 });
  }

  try {
    await verifyChallenge(json);
  } catch {
    return new Response("Invalid code", { status: 403 });
  }

  try {
    await db.set(json.name, hex.decode(json.public_key));
  } catch (err) {
    return new Response(`Create fail: ${err.message}`, { status: 400 });
  }

  return new Response(null, { status: 201 });
}

async function handleDelete(req: Request) {
  let json;
  try {
    json = await req.json();
    jsonschema.validate(json, {
      type: "object",
      required: ["name", "code"],
      properties: {
        name: { type: "string" },
        code: { type: "string", pattern: "\\d{6}" },
      },
    }, { throwError: true });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const pubKey = await db.get(json.name);
  if (!pubKey) return new Response(null, { status: 404 });

  const skey = hex.decode(Deno.env.get("SERVER_KEY")!);
  const code = await totk(skey, pubKey);
  if (code !== json.code) {
    return new Response("Forbidden", { status: 403 });
  }

  await db.del(json.name);
  return new Response(null, { status: 204 });
}
