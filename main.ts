import { db } from "./database.ts";
import { http } from "./deps.ts";
import { handler } from "./server.ts";

await db.init();
const port = parseInt(Deno.env.get("PORT") || "8000");
http.serve(handler, { port });
