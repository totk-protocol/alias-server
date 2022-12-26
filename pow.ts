import { hex } from "./deps.ts";

type ChallengeInput = {
  challenge: string;
  difficult: number;
  nonce: number;
  sig: string;
};
export async function verifyChallenge(input: ChallengeInput) {
  const arr = input.challenge.split(":");
  if (arr.length !== 3) throw new Error("Invalid challenge");

  const ts = parseInt(arr[0]);
  if (~~(Date.now() / 1000) - ts > 600) {
    throw new Error("Expired challenge");
  }

  if (parseInt(arr[2]) !== input.difficult) {
    throw new Error("Invalid difficult");
  }
  const rawKey = hex.decode(Deno.env.get("SERVER_KEY")!);
  const seckey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["verify"],
  );

  const sig = await crypto.subtle.verify(
    { name: "HMAC", hash: "SHA-256" },
    seckey,
    hex.decode(input.sig),
    new TextEncoder().encode(input.challenge),
  );

  if (!sig) throw new Error("Signature not matched");

  const result = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${input.challenge}:${input.nonce}`),
  );

  verifyDifficult(new Uint8Array(result), input.difficult);
}

export function verifyDifficult(buf: Uint8Array, difficult: number) {
  const len = Math.floor(difficult / 8);
  const arr = [...buf.slice(0, len)];
  if (!arr.every((i) => i === 0)) {
    throw new Error("No matched");
  }

  if (difficult % 8 !== 0) {
    if (buf[len] >> (8 - difficult % 8) !== 0) {
      throw new Error("No matched");
    }
  }
}
