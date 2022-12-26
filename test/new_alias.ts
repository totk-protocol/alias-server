import { ed25519, hex } from "../deps.ts";
import { verifyDifficult } from "../pow.ts";

type ChallengeInput = {
  challenge: string;
  difficult: number;
};
async function solveChallenge(input: ChallengeInput) {
  let n = 0;
  const encoder = new TextEncoder();
  while (true) {
    const buf = encoder.encode(`${input.challenge}:${n}`);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    try {
      verifyDifficult(new Uint8Array(hash), input.difficult);
      break;
    } catch {
      n++;
      continue;
    }
  }
  return n;
}

async function start() {
  const res1 = await fetch("http://localhost:8000/challenge");
  const json1 = await res1.json();
  console.log(json1);
  const n = await solveChallenge(json1);
  console.log(n);
  // cd418c82b30b56d0b7bcd488b0647c638f8cbbefeadb34ce23e7425d27cc2127
  // e20a2fa9278fa27748f5dd00ce267c9c133f963919cde94c20764ccd5431bc15
  // const priv = hex.decode(
  //   "cd418c82b30b56d0b7bcd488b0647c638f8cbbefeadb34ce23e7425d27cc2127",
  // );
  // const pub = hex.decode(
  //   "e20a2fa9278fa27748f5dd00ce267c9c133f963919cde94c20764ccd5431bc15",
  // );
  const priv = crypto.getRandomValues(new Uint8Array(32));
  const pub = await ed25519.getPublicKey(priv);
  console.log("priv", hex.encode(priv));
  console.log("pub", hex.encode(pub));
  const res2 = await fetch("http://localhost:8000/alias", {
    method: "POST",
    body: JSON.stringify({
      ...json1,
      nonce: n,
      name: "hello2",
      public_key: hex.encode(pub),
    }),
  });
  console.log(res2.status, await res2.text());
}

start();
