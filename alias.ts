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
    return respond(err, 400);
  }

  if (!bloom(json)) {
    return respond(new Error("Invalid challenge"), 400);
  }

  try {
    await verifyChallenge(json);
  } catch {
    return respond(new Error("Invalid code"), 403);
  }

  try {
    await db.set(json.name, hex.decode(json.public_key));
  } catch (err) {
    return respond(err, 400);
  }

  return respond(null, 201);
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
    return respond(err, 400);
  }

  const pubKey = await db.get(json.name);
  if (!pubKey) return respond(null, 404);

  const skey = hex.decode(Deno.env.get("SERVER_KEY")!);
  const code = await totk(skey, pubKey);
  if (code !== json.code) {
    return respond(new Error("Forbidden"), 403);
  }

  await db.del(json.name);
  return respond(null, 204);
}

function respond(result: unknown, status = 200) {
  if (result instanceof Error) {
    return new Response(result.message, {
      status,
      headers: {
        "access-control-allow-origin": "*",
      },
    });
  } else if (result === null) {
    return new Response(result, {
      status,
      headers: { "access-control-allow-origin": "*" },
    });
  } else {
    return new Response(JSON.stringify(result), {
      status,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
    });
  }
}
