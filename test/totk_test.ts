import { ed25519 } from "../deps.ts";
import { totk } from "../totk.ts";

Deno.test(async function testTotk() {
  const p1 = crypto.getRandomValues(new Uint8Array(32));
  const p3 = await ed25519.getPublicKey(p1);

  const p2 = crypto.getRandomValues(new Uint8Array(32));
  const p4 = await ed25519.getPublicKey(p2);

  const s1 = await totk(p1, p4);
  const s2 = await totk(p2, p3);
  console.log(s1, s2);

  if (s1 !== s2) throw new Error("Fail");
});
